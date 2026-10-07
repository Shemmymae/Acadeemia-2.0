-- ==============================================================================
-- ACADEEMIA 2.0 - Migration: Create public.subjects Table & RLS Policies
-- Execute in Supabase SQL Editor or via: supabase db push / supabase migration
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  education_level VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, code)
);

-- Index for high-performance multi-tenant filtering
CREATE INDEX IF NOT EXISTS idx_subjects_institution ON public.subjects(institution_id);

-- Enforce Row Level Security
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy: Members of the institution or platform users can read subjects
DROP POLICY IF EXISTS subjects_select ON public.subjects;
CREATE POLICY subjects_select ON public.subjects FOR SELECT
  USING (
    public.has_institution_membership(institution_id) 
    OR public.is_platform_user()
  );

-- 2. ALL / MANAGE Policy: Only authorized academic/administrative roles can modify subjects
DROP POLICY IF EXISTS subjects_manage ON public.subjects;
CREATE POLICY subjects_manage ON public.subjects FOR ALL
  USING (
    public.has_institution_role(
      institution_id, 
      ARRAY['institution_owner', 'institution_admin', 'principal', 'school_admin']::public.institution_role[]
    )
  )
  WITH CHECK (
    public.has_institution_role(
      institution_id, 
      ARRAY['institution_owner', 'institution_admin', 'principal', 'school_admin']::public.institution_role[]
    )
  );

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT SELECT ON public.subjects TO anon;
