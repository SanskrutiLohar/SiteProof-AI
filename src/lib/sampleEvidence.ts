import { EvidenceItem } from '../types/index.ts';
import { DEFAULT_SITE_PHOTO_URL } from './imageUtils.ts';

/**
 * Clean Evidence Storage for SiteProof AI
 * Initialized as an empty array so users can test with their own live camera photos,
 * recorded video clips, and uploaded demo documents.
 */
export const INITIAL_EVIDENCE: EvidenceItem[] = [];

/**
 * Helper to generate mock sample evidence if requested by user for demo tests
 */
export function generateSampleEvidenceForMilestone(
  milestoneId: string,
  projectId: string
): EvidenceItem[] {
  return [
    {
      id: `ev-demo-photo-${Date.now()}`,
      milestone_id: milestoneId,
      project_id: projectId,
      uploaded_by: 'demo-contractor-01',
      uploaded_by_name: 'Rajesh Kumar (BuildCorp Lead)',
      type: 'photo',
      file_name: 'Nashik_Viaduct_Pier14_Rebar_Inspection.jpg',
      file_url: DEFAULT_SITE_PHOTO_URL,
      file_size: 4120000,
      latitude: 19.9975,
      longitude: 73.7898,
      location_name: 'Nashik Sector 4 Elevated Viaduct • Pier 14',
      captured_at: new Date().toISOString(),
      uploaded_at: new Date().toISOString(),
      ai_analyzed: true,
      ai_confidence: 96,
      ai_summary: 'Multimodal Vision AI Analysis: Fe-500D rebar cage alignment verified. 150mm c/c stirrups spacing and 50mm cover blocks compliant with Nashik highway specifications.',
      tags: ['Fe-500D Rebar', 'Nashik Site', 'Pier 14', 'In-Zone'],
    }
  ];
}
