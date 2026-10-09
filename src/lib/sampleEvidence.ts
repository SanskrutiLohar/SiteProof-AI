import { EvidenceItem } from '../types/index.ts';

/**
 * Authentic Construction Sample Evidence Library
 * Contains real-world construction site photos, RMC delivery challans, and commercial tax invoices
 * mapped to the pre-seeded hackathon projects and milestones.
 */

export const INITIAL_EVIDENCE: EvidenceItem[] = [
  // ----------------------------------------------------
  // Milestone 1: Pier 12 - Reinforcement & Shuttering (m-proj-metro-4-1)
  // ----------------------------------------------------
  {
    id: 'ev-metro-rebar-01',
    milestone_id: 'm-proj-metro-4-1',
    project_id: 'proj-metro-4',
    uploaded_by: 'cont-001',
    uploaded_by_name: 'L&T Heavy Civil Infrastructure',
    type: 'photo',
    file_name: 'Pier12_RebarCage_Stirrups_EastFace.jpg',
    file_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80',
    file_size: 4120000,
    latitude: 19.169345,
    longitude: 72.951520,
    location_name: 'Pier 12 - Grid C2, East Face Rebar Elevation',
    captured_at: '2026-10-04T09:30:00Z',
    uploaded_at: '2026-10-04T10:15:00Z',
    ai_analyzed: false,
    tags: ['Rebar Reinforcement', 'Fe550D', 'Pier Column', 'Ties & Stirrups'],
  },
  {
    id: 'ev-metro-shuttering-02',
    milestone_id: 'm-proj-metro-4-1',
    project_id: 'proj-metro-4',
    uploaded_by: 'cont-001',
    uploaded_by_name: 'L&T Heavy Civil Infrastructure',
    type: 'photo',
    file_name: 'Pier12_SteelShuttering_Alignment_Level.jpg',
    file_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    file_size: 3850000,
    latitude: 19.169380,
    longitude: 72.951560,
    location_name: 'Pier 12 - Steel Shuttering Collar Section',
    captured_at: '2026-10-05T14:20:00Z',
    uploaded_at: '2026-10-05T15:00:00Z',
    ai_analyzed: false,
    tags: ['Formwork', 'Shuttering', 'Level Survey', 'Staging'],
  },
  {
    id: 'ev-metro-challan-03',
    milestone_id: 'm-proj-metro-4-1',
    project_id: 'proj-metro-4',
    uploaded_by: 'cont-001',
    uploaded_by_name: 'L&T Heavy Civil Infrastructure',
    type: 'challan',
    file_name: 'Ultratech_RMC_Challan_M40_50Cum_DC8892.pdf',
    file_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80',
    file_size: 1450000,
    latitude: 19.169100,
    longitude: 72.951200,
    location_name: 'Site Batching Unloading Bay #2',
    captured_at: '2026-10-06T11:00:00Z',
    uploaded_at: '2026-10-06T11:45:00Z',
    ai_analyzed: false,
    tags: ['RMC Delivery', 'Ultratech', 'M40 Concrete', '50 m3 Batch'],
  },
  {
    id: 'ev-metro-invoice-04',
    milestone_id: 'm-proj-metro-4-1',
    project_id: 'proj-metro-4',
    uploaded_by: 'cont-001',
    uploaded_by_name: 'L&T Heavy Civil Infrastructure',
    type: 'invoice',
    file_name: 'TataTiscon_TaxInvoice_Fe550D_45MT_INV4412.pdf',
    file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
    file_size: 890000,
    location_name: 'Commercial Invoicing Division',
    captured_at: '2026-10-07T08:00:00Z',
    uploaded_at: '2026-10-07T09:10:00Z',
    ai_analyzed: false,
    tags: ['Tata Tiscon', 'GST Invoice', '45 MT Steel', 'BOQ Match'],
  },
  {
    id: 'ev-metro-test-05',
    milestone_id: 'm-proj-metro-4-1',
    project_id: 'proj-metro-4',
    uploaded_by: 'cont-001',
    uploaded_by_name: 'L&T Heavy Civil Infrastructure',
    type: 'inspection_report',
    file_name: 'NABL_Lab_TensileYield_Rebar_TR550.pdf',
    file_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
    file_size: 1920000,
    location_name: 'NABL Certified Testing Laboratory',
    captured_at: '2026-10-03T16:00:00Z',
    uploaded_at: '2026-10-04T08:30:00Z',
    ai_analyzed: false,
    tags: ['NABL Lab', 'Tensile Test', 'Yield Strength 585 N/mm2'],
  },

  // ----------------------------------------------------
  // Milestone 3: Skyline Business Park - Foundation Raft Casting (m-proj-skyline-1)
  // ----------------------------------------------------
  {
    id: 'ev-skyline-raft-01',
    milestone_id: 'm-proj-skyline-1',
    project_id: 'proj-skyline',
    uploaded_by: 'cont-002',
    uploaded_by_name: 'Shapoorji Pallonji EPC',
    type: 'photo',
    file_name: 'TowerA_Raft_ConcretePour_SensorLog.jpg',
    file_url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    file_size: 5100000,
    latitude: 12.935240,
    longitude: 77.694600,
    location_name: 'Tower A Core Foundation Raft, Outer Ring',
    captured_at: '2026-09-28T07:15:00Z',
    uploaded_at: '2026-09-28T08:00:00Z',
    ai_analyzed: false,
    tags: ['Mass Concrete', 'Raft Foundation', 'Vibratory Compaction'],
  },
  {
    id: 'ev-skyline-challan-02',
    milestone_id: 'm-proj-skyline-1',
    project_id: 'proj-skyline',
    uploaded_by: 'cont-002',
    uploaded_by_name: 'Shapoorji Pallonji EPC',
    type: 'challan',
    file_name: 'ACC_Concrete_BatchTicket_700Cum_DC9021.pdf',
    file_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80',
    file_size: 1650000,
    latitude: 12.935100,
    longitude: 77.694300,
    location_name: 'Batching Plant Weighbridge Unit',
    captured_at: '2026-09-29T10:30:00Z',
    uploaded_at: '2026-09-29T11:15:00Z',
    ai_analyzed: false,
    tags: ['ACC Limited', 'M35 Concrete', '700 m3 Continuous Pour'],
  }
];

/**
 * Generate additional sample evidence bundle for any newly created milestone
 */
export function generateSampleEvidenceForMilestone(
  milestoneId: string, 
  projectId: string,
  contractorId: string = 'cont-001',
  contractorName: string = 'Contractor EPC'
): EvidenceItem[] {
  const baseTime = new Date();
  
  return [
    {
      id: `ev-gen-photo-${Date.now()}-1`,
      milestone_id: milestoneId,
      project_id: projectId,
      uploaded_by: contractorId,
      uploaded_by_name: contractorName,
      type: 'photo',
      file_name: `Site_Inspection_Elevation_${milestoneId.slice(0, 6)}.jpg`,
      file_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80',
      file_size: 3600000,
      latitude: 19.169350,
      longitude: 72.951530,
      location_name: 'Primary Structure Zone - Station Grid 1',
      captured_at: new Date(baseTime.getTime() - 24 * 3600 * 1000).toISOString(),
      uploaded_at: baseTime.toISOString(),
      ai_analyzed: false,
      tags: ['Site Progress', 'Structural Verification', 'High Definition'],
    },
    {
      id: `ev-gen-challan-${Date.now()}-2`,
      milestone_id: milestoneId,
      project_id: projectId,
      uploaded_by: contractorId,
      uploaded_by_name: contractorName,
      type: 'challan',
      file_name: `Vendor_Material_Delivery_Challan_${Date.now().toString().slice(-4)}.pdf`,
      file_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80',
      file_size: 1250000,
      latitude: 19.169300,
      longitude: 72.951500,
      location_name: 'Material Receiving Gate A',
      captured_at: new Date(baseTime.getTime() - 12 * 3600 * 1000).toISOString(),
      uploaded_at: baseTime.toISOString(),
      ai_analyzed: false,
      tags: ['Delivery Challan', 'Material Receipt', 'Gate Entry Stamp'],
    },
    {
      id: `ev-gen-invoice-${Date.now()}-3`,
      milestone_id: milestoneId,
      project_id: projectId,
      uploaded_by: contractorId,
      uploaded_by_name: contractorName,
      type: 'invoice',
      file_name: `Supplier_Commercial_Tax_Invoice_${Date.now().toString().slice(-4)}.pdf`,
      file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
      file_size: 980000,
      location_name: 'Vendor Billing Office',
      captured_at: new Date(baseTime.getTime() - 6 * 3600 * 1000).toISOString(),
      uploaded_at: baseTime.toISOString(),
      ai_analyzed: false,
      tags: ['Tax Invoice', 'GST Record', 'BOQ Linked'],
    }
  ];
}
