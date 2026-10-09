// ====================================================================
// Supabase Edge Function: gemini-verification
// Secure server-side execution of Gemini Multimodal Vision & OCR
// ====================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf'
]);

// 20 MB base64 character limit (~15 MB raw file)
const MAX_BASE64_LENGTH = 20 * 1024 * 1024;

interface AnalysisRequest {
  evidenceType: 'photo' | 'challan' | 'invoice' | 'inspection_report';
  fileBase64?: string;
  fileMimeType?: string;
  extractedText?: string;
  milestoneTitle?: string;
  milestoneDescription?: string;
  boqBaseline?: Array<{
    item_code: string;
    description: string;
    unit: string;
    quantity_ordered: number;
    unit_rate: number;
  }>;
}

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Validate Authentication Header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optional Supabase user validation if project URL is provided in env
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid or expired session token.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. Validate Server Secret
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'GEMINI_API_KEY secret is not configured on the Supabase backend.',
          advisory_note: 'Please configure GEMINI_API_KEY in Supabase Edge Secrets.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 4. Validate Payload
    let payload: AnalysisRequest;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request payload.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { evidenceType, fileBase64, fileMimeType, milestoneTitle, boqBaseline } = payload;

    if (!evidenceType || !['photo', 'challan', 'invoice', 'inspection_report'].includes(evidenceType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing evidenceType.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (fileMimeType && !ALLOWED_MIME_TYPES.has(fileMimeType.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: `Unsupported file MIME type: ${fileMimeType}. Allowed: JPEG, PNG, WEBP, HEIC, PDF.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (fileBase64 && fileBase64.length > MAX_BASE64_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds maximum payload limit (20 MB base64).' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Select Model Identifier (defaults to stable multimodal flash model)
    const modelName = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

    let prompt = '';
    const parts: unknown[] = [];

    // 6. Define Structured Prompts with Explicit Advisory Disclaimers
    if (evidenceType === 'photo') {
      prompt = `You are a certified senior civil & structural engineering auditor analyzing construction site photographs.
IMPORTANT NOTICE: Photographic visual inspection is strictly advisory and observational. Visual analysis alone cannot verify subsurface soil compaction, chemical composition of cured concrete, tensile strength of embedded rebar, or internal material defects.

Milestone Target: "${milestoneTitle || 'Construction Milestone'}"
BOQ Baseline Items: ${JSON.stringify(boqBaseline || [])}

Analyze the visible features in this photograph and produce a structured JSON object strictly matching this schema:
{
  "detected_materials": ["visible materials, e.g., TMT rebars, shuttering ply, RMC slurry, formwork props"],
  "construction_stage": "string describing visual phase, e.g., rebar binding, formwork staging, pre-pour inspection",
  "estimated_completion_percent": number (0 to 100),
  "structural_observations": ["specific observable facts in the photo"],
  "anomalies_detected": ["observable workmanship anomalies, rebar cover block spacing, safety barriers"],
  "confidence_score": number (0.0 to 1.0),
  "is_consistent_with_baseline": boolean,
  "inspection_disclaimer": "Visual observation only; certified field testing required for structural sign-off.",
  "summary": "2-3 sentence observational summary for lead auditor review."
}
Return ONLY valid JSON.`;
    } else {
      prompt = `You are an expert OCR & financial auditor extracting commercial records from construction supplier tax invoices and delivery challans.
Milestone Reference: "${milestoneTitle || 'Milestone'}"
BOQ Baseline Items: ${JSON.stringify(boqBaseline || [])}

Extract all verified commercial fields from this document and return a structured JSON object strictly matching this schema:
{
  "supplier_name": "string (or null if unreadable)",
  "document_number": "string (invoice or challan number)",
  "document_date": "YYYY-MM-DD (or null)",
  "po_reference": "string (purchase order reference number)",
  "line_items": [
    {
      "item_code": "string",
      "description": "string",
      "quantity": number,
      "unit": "string",
      "unit_rate": number,
      "total_amount": number
    }
  ],
  "tax_amount": number,
  "total_amount": number,
  "confidence_score": number (0.0 to 1.0),
  "discrepancies_detected": ["any quantity, unit rate, or item code divergence against BOQ baseline"],
  "summary": "Short summary of extracted commercial document."
}
Return ONLY valid JSON.`;
    }

    // 7. Attach Image/Document Part
    if (fileBase64 && fileMimeType) {
      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '').trim();
      parts.push({
        inline_data: {
          mime_type: fileMimeType,
          data: cleanBase64
        }
      });
    }

    parts.push({ text: prompt });

    // 8. Invoke Google Gemini generateContent API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Redact any accidental secret reflection
      const sanitizedError = errorText.replace(new RegExp(geminiApiKey, 'g'), '[REDACTED_KEY]');
      return new Response(
        JSON.stringify({ 
          error: `Gemini API returned status ${response.status}`, 
          details: sanitizedError 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    let parsedResult: unknown = null;
    if (candidateText) {
      try {
        parsedResult = JSON.parse(candidateText);
      } catch {
        parsedResult = { raw_output: candidateText, parsing_warning: 'Model output was not valid JSON' };
      }
    } else {
      parsedResult = data;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        model_used: modelName,
        result: parsedResult 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
