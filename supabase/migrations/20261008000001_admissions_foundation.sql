-- ==============================================================================
-- ACADEEMIA 2.0 - Migration: Phase 4C Admissions & Applicant Management
-- 
-- Defines:
-- 1. institution_sequences (concurrency-safe identifier generation)
-- 2. admission_inquiries
-- 3. admission_applicants
-- 4. admission_applicant_guardians (reusing existing guardians table)
-- 5. admission_applications
-- 6. admission_conversions
-- 7. Controlled lifecycle state transition triggers
-- 8. Atomic conversion procedure: convert_applicant_to_student
-- 9. Duplicate detection function: detect_duplicate_applicants
-- 10. Granular Row Level Security (RLS) policies with campus scoping
-- ==============================================================================

-- 1. INSTITUTION SEQUENCES FOR CONCURRENCY-SAFE NUMBER GENERATION
CREATE TABLE IF NOT EXISTS public.institution_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  sequence_type VARCHAR(50) NOT NULL,
  prefix VARCHAR(20) NOT NULL,
  current_year INT NOT NULL,
  current_val INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, sequence_type, current_year)
);

ALTER TABLE public.institution_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY institution_sequences_select ON public.institution_sequences
  FOR SELECT USING (is_platform_user() OR has_institution_membership(institution_id));

CREATE POLICY institution_sequences_admin_all ON public.institution_sequences
  FOR ALL USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- Database-safe sequence generation function
CREATE OR REPLACE FUNCTION public.generate_institution_sequence(
  p_institution_id UUID,
  p_sequence_type VARCHAR,
  p_prefix VARCHAR
)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
  v_next_val INT;
  v_result VARCHAR(100);
BEGIN
  INSERT INTO public.institution_sequences (institution_id, sequence_type, prefix, current_year, current_val, updated_at)
  VALUES (p_institution_id, p_sequence_type, p_prefix, v_year, 1, NOW())
  ON CONFLICT (institution_id, sequence_type, current_year)
  DO UPDATE SET
    current_val = public.institution_sequences.current_val + 1,
    updated_at = NOW()
  RETURNING current_val INTO v_next_val;

  v_result := p_prefix || '-' || v_year::text || '-' || LPAD(v_next_val::text, 6, '0');
  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_institution_sequence(UUID, VARCHAR, VARCHAR) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_institution_sequence(UUID, VARCHAR, VARCHAR) TO authenticated;

-- 2. ADMISSION INQUIRIES
CREATE TABLE IF NOT EXISTS public.admission_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  interested_grade_id UUID REFERENCES public.academic_grades(id) ON DELETE SET NULL,
  inquiry_number VARCHAR(100) NOT NULL,
  prospective_student_name VARCHAR(255) NOT NULL,
  prospective_student_date_of_birth DATE,
  guardian_name VARCHAR(255) NOT NULL,
  guardian_email VARCHAR(255),
  guardian_phone VARCHAR(50) NOT NULL,
  source VARCHAR(100) DEFAULT 'website',
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, inquiry_number)
);

ALTER TABLE public.admission_inquiries ENABLE ROW LEVEL SECURITY;

-- 3. ADMISSION APPLICANTS
CREATE TABLE IF NOT EXISTS public.admission_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  applicant_number VARCHAR(100) NOT NULL,
  inquiry_id UUID REFERENCES public.admission_inquiries(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  preferred_name VARCHAR(100),
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  nationality VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  previous_school VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'waitlisted', 'rejected', 'withdrawn', 'converted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, applicant_number)
);

ALTER TABLE public.admission_applicants ENABLE ROW LEVEL SECURITY;

-- 4. APPLICANT TO GUARDIAN RELATIONSHIP (Reuses public.guardians)
CREATE TABLE IF NOT EXISTS public.admission_applicant_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.admission_applicants(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  relationship VARCHAR(50) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_emergency_contact BOOLEAN DEFAULT true,
  can_pick_up BOOLEAN DEFAULT true,
  receives_billing_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(applicant_id, guardian_id)
);

ALTER TABLE public.admission_applicant_guardians ENABLE ROW LEVEL SECURITY;

-- 5. ADMISSION APPLICATIONS
CREATE TABLE IF NOT EXISTS public.admission_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.admission_applicants(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE RESTRICT,
  grade_id UUID NOT NULL REFERENCES public.academic_grades(id) ON DELETE RESTRICT,
  class_id UUID REFERENCES public.academic_classes(id) ON DELETE SET NULL,
  application_number VARCHAR(100) NOT NULL,
  application_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'waitlisted', 'rejected', 'withdrawn', 'converted')),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  decision_at TIMESTAMPTZ,
  decided_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  decision_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, application_number)
);

ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;

-- 6. ADMISSION CONVERSIONS (Auditable link between Application, Applicant, and Student)
CREATE TABLE IF NOT EXISTS public.admission_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.admission_applicants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  converted_at TIMESTAMPTZ DEFAULT NOW(),
  converted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE(application_id),
  UNIQUE(student_id)
);

ALTER TABLE public.admission_conversions ENABLE ROW LEVEL SECURITY;

-- 7. APPLICATION LIFECYCLE WORKFLOW ENFORCEMENT TRIGGER
CREATE OR REPLACE FUNCTION public.trg_fn_enforce_application_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Prevent status mutations if already converted
    IF OLD.status = 'converted' AND NEW.status != 'converted' THEN
      RAISE EXCEPTION 'Invalid transition: Converted applications are permanent and immutable.'
        USING ERRCODE = 'P0003';
    END IF;

    -- Valid lifecycle transitions
    IF OLD.status = 'draft' AND NEW.status NOT IN ('draft', 'submitted', 'withdrawn') THEN
      RAISE EXCEPTION 'Invalid transition: Draft applications can only transition to submitted or withdrawn.'
        USING ERRCODE = 'P0003';
    END IF;

    IF OLD.status = 'submitted' AND NEW.status NOT IN ('submitted', 'under_review', 'withdrawn') THEN
      RAISE EXCEPTION 'Invalid transition: Submitted applications can only transition to under_review or withdrawn.'
        USING ERRCODE = 'P0003';
    END IF;

    IF OLD.status = 'under_review' AND NEW.status NOT IN ('under_review', 'accepted', 'waitlisted', 'rejected', 'withdrawn') THEN
      RAISE EXCEPTION 'Invalid transition: Applications under review can only be accepted, waitlisted, rejected, or withdrawn.'
        USING ERRCODE = 'P0003';
    END IF;

    IF OLD.status = 'waitlisted' AND NEW.status NOT IN ('waitlisted', 'under_review', 'accepted', 'rejected', 'withdrawn') THEN
      RAISE EXCEPTION 'Invalid transition from waitlisted state.'
        USING ERRCODE = 'P0003';
    END IF;

    IF OLD.status = 'accepted' AND NEW.status NOT IN ('accepted', 'converted', 'withdrawn') THEN
      RAISE EXCEPTION 'Invalid transition: Accepted applications can only be converted to student or withdrawn.'
        USING ERRCODE = 'P0003';
    END IF;

    IF OLD.status = 'rejected' AND NEW.status NOT IN ('rejected', 'under_review') THEN
      RAISE EXCEPTION 'Invalid transition: Rejected applications cannot be directly converted or accepted without reopening under review.'
        USING ERRCODE = 'P0003';
    END IF;

    IF OLD.status = 'withdrawn' AND NEW.status != 'withdrawn' THEN
      RAISE EXCEPTION 'Invalid transition: Withdrawn applications are terminal.'
        USING ERRCODE = 'P0003';
    END IF;

    -- Maintain timestamps
    IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
      NEW.submitted_at := COALESCE(NEW.submitted_at, NOW());
    END IF;
    IF NEW.status = 'under_review' AND OLD.status != 'under_review' THEN
      NEW.reviewed_at := COALESCE(NEW.reviewed_at, NOW());
    END IF;
    IF NEW.status IN ('accepted', 'rejected', 'waitlisted') AND OLD.status NOT IN ('accepted', 'rejected', 'waitlisted') THEN
      NEW.decision_at := COALESCE(NEW.decision_at, NOW());
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_application_lifecycle ON public.admission_applications;
CREATE TRIGGER trg_application_lifecycle
  BEFORE UPDATE ON public.admission_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_enforce_application_lifecycle();

-- 8. ATOMIC CONVERSION PROCEDURE: CONVERT APPLICANT TO STUDENT
CREATE OR REPLACE FUNCTION public.convert_applicant_to_student(
  p_application_id UUID,
  p_class_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_auth_id UUID;
  v_is_platform_adm BOOLEAN;
  v_caller_role public.institution_role;
  v_app RECORD;
  v_applicant RECORD;
  v_student_id UUID;
  v_student_number VARCHAR(100);
  v_enrollment_id UUID;
  v_target_class_id UUID;
  v_conversion_id UUID;
  v_guardian_rel RECORD;
BEGIN
  v_caller_auth_id := auth.uid();
  IF v_caller_auth_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  -- 1. Fetch application details
  SELECT * INTO v_app FROM public.admission_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found with ID %', p_application_id USING ERRCODE = 'P0002';
  END IF;

  -- 2. Verify authorization
  v_is_platform_adm := public.is_platform_admin();
  IF NOT v_is_platform_adm THEN
    SELECT role INTO v_caller_role
    FROM public.institution_users
    WHERE institution_id = v_app.institution_id
      AND user_id = v_caller_auth_id
      AND is_active = true;

    IF v_caller_role IS NULL OR v_caller_role NOT IN ('institution_owner', 'institution_admin', 'school_admin', 'principal') THEN
      RAISE EXCEPTION 'Authorization denied: Insufficient privileges to convert applicant to student.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- 3. Check status
  IF v_app.status != 'accepted' THEN
    RAISE EXCEPTION 'Application must be in "accepted" status to convert. Current status: "%"', v_app.status
      USING ERRCODE = 'P0003';
  END IF;

  -- 4. Ensure not already converted
  IF EXISTS (SELECT 1 FROM public.admission_conversions WHERE application_id = p_application_id) THEN
    RAISE EXCEPTION 'Application % has already been converted to a student.', p_application_id
      USING ERRCODE = 'P0004';
  END IF;

  -- 5. Fetch applicant record
  SELECT * INTO v_applicant FROM public.admission_applicants WHERE id = v_app.applicant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Applicant record not found.' USING ERRCODE = 'P0002';
  END IF;

  -- 6. Determine class ID: provided parameter, or from application, or first class in grade
  v_target_class_id := COALESCE(p_class_id, v_app.class_id);
  IF v_target_class_id IS NULL THEN
    SELECT id INTO v_target_class_id
    FROM public.academic_classes
    WHERE grade_id = v_app.grade_id AND campus_id = v_app.campus_id
    ORDER BY name ASC
    LIMIT 1;
  END IF;

  -- 7. Generate unique student number
  v_student_number := public.generate_institution_sequence(v_app.institution_id, 'student', 'STU');

  -- 8. Create student identity in public.students
  INSERT INTO public.students (
    institution_id,
    campus_id,
    student_number,
    first_name,
    last_name,
    middle_name,
    gender,
    date_of_birth,
    admission_date,
    status,
    current_class_id,
    created_at,
    updated_at
  )
  VALUES (
    v_app.institution_id,
    v_app.campus_id,
    v_student_number,
    v_applicant.first_name,
    v_applicant.last_name,
    v_applicant.middle_name,
    v_applicant.gender,
    v_applicant.date_of_birth,
    CURRENT_DATE,
    'active',
    v_target_class_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_student_id;

  -- 9. Connect applicant guardians to student_guardians (reusing existing guardian records)
  FOR v_guardian_rel IN
    SELECT * FROM public.admission_applicant_guardians WHERE applicant_id = v_app.applicant_id
  LOOP
    INSERT INTO public.student_guardians (
      student_id,
      guardian_id,
      is_primary,
      can_pickup,
      receives_billing,
      created_at
    )
    VALUES (
      v_student_id,
      v_guardian_rel.guardian_id,
      v_guardian_rel.is_primary,
      v_guardian_rel.can_pick_up,
      v_guardian_rel.receives_billing_notifications,
      NOW()
    )
    ON CONFLICT (student_id, guardian_id) DO NOTHING;
  END LOOP;

  -- 10. Create academic enrollment record if class is assigned
  IF v_target_class_id IS NOT NULL THEN
    INSERT INTO public.student_enrollments (
      institution_id,
      student_id,
      academic_year_id,
      class_id,
      enrolled_at,
      status
    )
    VALUES (
      v_app.institution_id,
      v_student_id,
      v_app.academic_year_id,
      v_target_class_id,
      NOW(),
      'enrolled'
    )
    ON CONFLICT (student_id, academic_year_id) DO UPDATE
    SET class_id = EXCLUDED.class_id, status = 'enrolled'
    RETURNING id INTO v_enrollment_id;
  END IF;

  -- 11. Record conversion relation
  INSERT INTO public.admission_conversions (
    institution_id,
    applicant_id,
    application_id,
    student_id,
    converted_at,
    converted_by
  )
  VALUES (
    v_app.institution_id,
    v_app.applicant_id,
    p_application_id,
    v_student_id,
    NOW(),
    v_caller_auth_id
  )
  RETURNING id INTO v_conversion_id;

  -- 12. Update application and applicant status
  UPDATE public.admission_applications
  SET status = 'converted', updated_at = NOW()
  WHERE id = p_application_id;

  UPDATE public.admission_applicants
  SET status = 'converted', updated_at = NOW()
  WHERE id = v_app.applicant_id;

  -- If converted from inquiry, update inquiry status
  IF v_applicant.inquiry_id IS NOT NULL THEN
    UPDATE public.admission_inquiries
    SET status = 'converted', updated_at = NOW()
    WHERE id = v_applicant.inquiry_id;
  END IF;

  -- 13. Audit log
  INSERT INTO public.audit_logs (
    tenant_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    details
  )
  VALUES (
    v_app.institution_id,
    v_caller_auth_id,
    'applicant_converted_to_student',
    'admission_application',
    p_application_id::text,
    jsonb_build_object(
      'application_id', p_application_id,
      'applicant_id', v_app.applicant_id,
      'student_id', v_student_id,
      'student_number', v_student_number,
      'class_id', v_target_class_id,
      'enrollment_id', v_enrollment_id,
      'conversion_id', v_conversion_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'student_id', v_student_id,
    'student_number', v_student_number,
    'enrollment_id', v_enrollment_id,
    'conversion_id', v_conversion_id,
    'class_id', v_target_class_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.convert_applicant_to_student(UUID, UUID) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.convert_applicant_to_student(UUID, UUID) TO authenticated;

-- 9. DUPLICATE APPLICANT DETECTION
CREATE OR REPLACE FUNCTION public.detect_duplicate_applicants(
  p_institution_id UUID,
  p_first_name VARCHAR,
  p_last_name VARCHAR,
  p_dob DATE,
  p_email VARCHAR DEFAULT NULL,
  p_phone VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  applicant_id UUID,
  applicant_number VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  date_of_birth DATE,
  status VARCHAR,
  match_type VARCHAR
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    a.id AS applicant_id,
    a.applicant_number,
    a.first_name,
    a.last_name,
    a.date_of_birth,
    a.status,
    CASE
      WHEN LOWER(a.first_name) = LOWER(p_first_name) AND LOWER(a.last_name) = LOWER(p_last_name) AND a.date_of_birth = p_dob THEN 'EXACT_NAME_DOB'
      WHEN p_email IS NOT NULL AND a.email IS NOT NULL AND LOWER(a.email) = LOWER(p_email) THEN 'MATCHING_EMAIL'
      WHEN p_phone IS NOT NULL AND a.phone IS NOT NULL AND a.phone = p_phone THEN 'MATCHING_PHONE'
      ELSE 'POTENTIAL_NAME'
    END AS match_type
  FROM public.admission_applicants a
  WHERE a.institution_id = p_institution_id
    AND (
      (LOWER(a.first_name) = LOWER(p_first_name) AND LOWER(a.last_name) = LOWER(p_last_name) AND a.date_of_birth = p_dob)
      OR (p_email IS NOT NULL AND a.email IS NOT NULL AND LOWER(a.email) = LOWER(p_email))
      OR (p_phone IS NOT NULL AND a.phone IS NOT NULL AND a.phone = p_phone)
    );
$$;

REVOKE EXECUTE ON FUNCTION public.detect_duplicate_applicants(UUID, VARCHAR, VARCHAR, DATE, VARCHAR, VARCHAR) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.detect_duplicate_applicants(UUID, VARCHAR, VARCHAR, DATE, VARCHAR, VARCHAR) TO authenticated;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES FOR ADMISSIONS TABLES

-- Helpers: Campus access check
CREATE OR REPLACE FUNCTION public.has_campus_access(p_institution_id UUID, p_campus_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT is_platform_user()
  OR EXISTS (
    SELECT 1 FROM public.institution_users
    WHERE user_id = auth.uid()
      AND institution_id = p_institution_id
      AND is_active = true
      AND (campus_id IS NULL OR p_campus_id IS NULL OR campus_id = p_campus_id)
  );
$$;

-- A. Inquiries RLS
CREATE POLICY admission_inquiries_select ON public.admission_inquiries
  FOR SELECT USING (
    (is_platform_user() OR has_institution_membership(institution_id))
    AND (campus_id IS NULL OR has_campus_access(institution_id, campus_id))
  );

CREATE POLICY admission_inquiries_insert ON public.admission_inquiries
  FOR INSERT WITH CHECK (
    is_platform_admin()
    OR (
      has_institution_membership(institution_id)
      AND (campus_id IS NULL OR has_campus_access(institution_id, campus_id))
    )
  );

CREATE POLICY admission_inquiries_update ON public.admission_inquiries
  FOR UPDATE USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'school_admin', 'principal', 'receptionist']::institution_role[])
  ) WITH CHECK (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'school_admin', 'principal', 'receptionist']::institution_role[])
  );

CREATE POLICY admission_inquiries_delete ON public.admission_inquiries
  FOR DELETE USING (
    is_platform_admin()
    OR (
      has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
      AND status IN ('new', 'closed')
    )
  );

-- B. Applicants RLS
CREATE POLICY admission_applicants_select ON public.admission_applicants
  FOR SELECT USING (
    (is_platform_user() OR has_institution_membership(institution_id))
    AND (campus_id IS NULL OR has_campus_access(institution_id, campus_id))
  );

CREATE POLICY admission_applicants_insert ON public.admission_applicants
  FOR INSERT WITH CHECK (
    is_platform_admin()
    OR (
      has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'school_admin', 'principal', 'receptionist']::institution_role[])
      AND (campus_id IS NULL OR has_campus_access(institution_id, campus_id))
    )
  );

CREATE POLICY admission_applicants_update ON public.admission_applicants
  FOR UPDATE USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'school_admin', 'principal', 'receptionist']::institution_role[])
  ) WITH CHECK (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'school_admin', 'principal', 'receptionist']::institution_role[])
  );

CREATE POLICY admission_applicants_delete ON public.admission_applicants
  FOR DELETE USING (
    is_platform_admin()
    OR (
      has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
      AND status = 'draft'
    )
  );

-- C. Applicant Guardians RLS
CREATE POLICY admission_applicant_guardians_select ON public.admission_applicant_guardians
  FOR SELECT USING (is_platform_user() OR has_institution_membership(institution_id));

CREATE POLICY admission_applicant_guardians_insert ON public.admission_applicant_guardians
  FOR INSERT WITH CHECK (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'school_admin', 'principal', 'receptionist']::institution_role[])
  );

CREATE POLICY admission_applicant_guardians_update ON public.admission_applicant_guardians
  FOR UPDATE USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'school_admin', 'principal', 'receptionist']::institution_role[])
  ) WITH CHECK (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'school_admin', 'principal', 'receptionist']::institution_role[])
  );

CREATE POLICY admission_applicant_guardians_delete ON public.admission_applicant_guardians
  FOR DELETE USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
  );

-- D. Applications RLS
CREATE POLICY admission_applications_select ON public.admission_applications
  FOR SELECT USING (
    (is_platform_user() OR has_institution_membership(institution_id))
    AND has_campus_access(institution_id, campus_id)
  );

CREATE POLICY admission_applications_insert ON public.admission_applications
  FOR INSERT WITH CHECK (
    is_platform_admin()
    OR (
      has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'school_admin', 'principal', 'receptionist']::institution_role[])
      AND has_campus_access(institution_id, campus_id)
    )
  );

CREATE POLICY admission_applications_update ON public.admission_applications
  FOR UPDATE USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'school_admin', 'principal']::institution_role[])
  ) WITH CHECK (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'school_admin', 'principal']::institution_role[])
  );

CREATE POLICY admission_applications_delete ON public.admission_applications
  FOR DELETE USING (
    is_platform_admin()
    OR (
      has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
      AND status = 'draft'
    )
  );

-- E. Conversions RLS
CREATE POLICY admission_conversions_select ON public.admission_conversions
  FOR SELECT USING (is_platform_user() OR has_institution_membership(institution_id));

CREATE POLICY admission_conversions_insert ON public.admission_conversions
  FOR INSERT WITH CHECK (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'school_admin', 'principal']::institution_role[])
  );

-- No UPDATE or DELETE allowed on conversions (permanent and immutable audit record)
