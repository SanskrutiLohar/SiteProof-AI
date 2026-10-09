-- ====================================================================
-- SiteProof AI: Seed Reference & Baseline Data
-- ====================================================================

-- Seed Projects and Milestones can be inserted here for Supabase environment initialization.
-- Note: Profiles are created on first sign-in / registration via Auth hooks or seed script.

-- Create a helper function to bootstrap sample project data once inspector signs up
CREATE OR REPLACE FUNCTION public.seed_initial_project_data(p_inspector_id UUID, p_contractor_id UUID)
RETURNS VOID AS $$
DECLARE
    v_project_id UUID;
    v_milestone_id UUID;
BEGIN
    -- Project 1: Metro Line 4 Elevated Viaduct
    INSERT INTO public.projects (id, code, title, description, location, client_name, total_budget, assigned_contractor_id, assigned_contractor_name, created_by)
    VALUES (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'METRO-L4-PKG2',
        'Metro Line 4 - Elevated Viaduct & Pier Caps (Pkg 2)',
        'Construction of 4.2 km elevated metro corridor comprising 140 piers, pre-cast segment launching, and bearing pedestal installation.',
        'Sector 62 to Cyber City Junction, Metro Corridor West',
        'Delhi Metro Rail Corporation (DMRC)',
        42500000.00,
        p_contractor_id,
        'BuildCorp Infrastructure Ltd',
        p_inspector_id
    ) ON CONFLICT (id) DO NOTHING;

    -- Milestone 1: Pier 12
    INSERT INTO public.milestones (id, project_id, title, description, sequence_order, weight_percentage, target_date, status, version)
    VALUES (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Milestone 3: Pier 12 Rebar Cage & M45 Concrete Pouring',
        'Reinforcement binding of 18.5 MT Fe500D TMT steel rebar, shuttering inspection, and pouring of 120 cu.m M45 grade self-compacting concrete.',
        1,
        25.00,
        '2026-10-15',
        'in_progress',
        1
    ) ON CONFLICT (id) DO NOTHING;

    -- BOQ Items for Milestone 1
    INSERT INTO public.boq_items (milestone_id, project_id, item_code, description, unit, quantity_ordered, quantity_delivered, quantity_billed, quantity_paid, quantity_consumed, unit_rate)
    VALUES 
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'BOQ-RBR-01', 'Fe500D High Yield Corrosion Resistant TMT Rebar (16mm-32mm)', 'MT', 18.500, 18.500, 18.500, 18.500, 18.200, 72000.00),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'BOQ-CON-02', 'M45 Grade Ready Mix Concrete with Fly-ash Pozzolana & Plasticizer', 'Cu.m', 120.000, 120.000, 120.000, 120.000, 118.500, 6850.00),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'BOQ-SHT-03', 'Heavy Modular Steel Formwork & Staging Shuttering', 'Sq.m', 480.000, 480.000, 480.000, 480.000, 480.000, 450.00),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'BOQ-BGR-04', 'Elastomeric Bridge Bearing Pads (500x500x120mm)', 'Units', 4.000, 4.000, 4.000, 0.000, 0.000, 34000.00)
    ON CONFLICT (id) DO NOTHING;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
