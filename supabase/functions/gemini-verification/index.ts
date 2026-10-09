// ====================================================================
// Supabase Edge Function: gemini-verification
// Secure server-side execution of Gemini Multimodal Vision & OCR
// ====================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'GEMINI_API_KEY secret is not configured on the Supabase backend.',
          fallback_available: true
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const payload: AnalysisRequest = await req.json();
    const { evidenceType, fileBase64, fileMimeType, milestoneTitle, boqBaseline } = payload;

    // Use official Gemini 1.5 Flash endpoint
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    let prompt = '';
    const parts: unknown[] = [];

    if (evidenceType === 'photo') {
      prompt = `You are a certified senior civil & structural engineering auditor analyzing construction site evidence.
Milestone: "${milestoneTitle || 'Construction Milestone'}"
BOQ Baseline Items: ${JSON.stringify(boqBaseline || [])}

Analyze this photograph and return a structured JSON response matching this schema:
{
  "detected_materials": ["string array of materials"],
  "construction_stage": "string",
  "estimated_completion_percent": number (0-100),
  "structural_observations": ["bullet points"],
  "anomalies_detected": ["any quality, safety, or rebar binding issues"],
  "confidence_score": number (0.0 to 1.0),
  "is_consistent_with_baseline": boolean,
  "summary": "2 sentence summary"
}
Return ONLY pure JSON.`;
    } else {
      prompt = `You are an expert document OCR engine for construction supplier delivery challans and tax invoices.
Milestone: "${milestoneTitle || 'Milestone'}"
BOQ Baseline: ${JSON.stringify(boqBaseline || [])}

Extract all structured fields from this document and return pure JSON:
{
  "supplier_name": "string",
  "document_number": "string",
  "document_date": "YYYY-MM-DD",
  "po_reference": "string",
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
  "discrepancies_detected": ["any quantity or rate mismatches against BOQ"]
}
Return ONLY pure JSON.`;
    }

    if (fileBase64 && fileMimeType) {
      parts.push({
        inline_data: {
          mime_type: fileMimeType,
          data: fileBase64.replace(/^data:[^;]+;base64,/, '')
        }
      });
    }

    parts.push({ text: prompt });

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
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${response.statusText}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedResult = candidateText ? JSON.parse(candidateText) : data;

    return new Response(
      JSON.stringify({ success: true, result: parsedResult }),
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
