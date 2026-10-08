-- ==============================================================================
-- ACADEEMIA 2.0 - Migration: Reconcile Canonical Module Catalog (Phase 4B)
-- 
-- Reconciles discrepancies between initial seed and canonical architecture:
-- 1. Adds missing canonical modules: `multi_class`, `analytics`, `reports`.
-- 2. Deprecates/reconciles `multi_branch` -> `multi_class` (multi-campus is a core
--    architectural capability via `campuses`, not a commercial module).
-- 3. Updates package inclusions across Essential, Professional, and Enterprise tiers.
-- 4. Updates `institution_has_module_entitlement` with alias support.
-- 5. Adds `toggle_institution_module_activation` RPC for atomic entitlement-enforced toggling.
-- ==============================================================================

-- 1. UPSERT MISSING CANONICAL MODULES
INSERT INTO public.modules (code, name, description, category, is_core, default_enabled, icon, permissions_provided)
VALUES
  (
    'multi_class',
    'Multi-Class & Cross-Section Groups',
    'Cross-class instructional streams, elective cohort groups, joint-section lessons, and synchronized multi-class timetabling.',
    'academic',
    false,
    false,
    'Layers',
    ARRAY['classes.manage', 'classes.stream']
  ),
  (
    'analytics',
    'Institutional Analytics & Trends',
    'Longitudinal enrollment trends, retention metrics, financial yield analytics, and multi-year academic progression graphs.',
    'intelligence',
    false,
    false,
    'BarChart3',
    ARRAY['analytics.view', 'analytics.export']
  ),
  (
    'reports',
    'Reports & Regulatory Exports',
    'Ministry and regulatory compliance reporting, statistical census generators, custom tabular exports, and PDF digests.',
    'administrative',
    false,
    true,
    'FileSpreadsheet',
    ARRAY['reports.generate', 'reports.export']
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_core = EXCLUDED.is_core,
  default_enabled = EXCLUDED.default_enabled,
  icon = EXCLUDED.icon,
  permissions_provided = EXCLUDED.permissions_provided;

-- 2. MIGRATE ANY EXISTING INSTITUTION ENTITLEMENTS / MODULES FROM multi_branch TO multi_class
UPDATE public.institution_modules
SET module_code = 'multi_class'
WHERE module_code = 'multi_branch'
  AND NOT EXISTS (
    SELECT 1 FROM public.institution_modules im2
    WHERE im2.institution_id = institution_modules.institution_id
      AND im2.module_code = 'multi_class'
  );

DELETE FROM public.institution_modules
WHERE module_code = 'multi_branch';

-- Remove legacy multi_branch module entry if present
DELETE FROM public.modules
WHERE code = 'multi_branch';

-- 3. UPDATE CANONICAL PACKAGE INCLUSIONS
UPDATE public.packages
SET included_modules = ARRAY[
  'student_management',
  'academics',
  'attendance',
  'calendar',
  'communication',
  'institution_website',
  'reports'
]
WHERE slug = 'essential-academy';

UPDATE public.packages
SET included_modules = ARRAY[
  'student_management',
  'academics',
  'attendance',
  'calendar',
  'communication',
  'institution_website',
  'reports',
  'admissions',
  'exams',
  'homework',
  'lesson_plans',
  'library',
  'finance',
  'documents',
  'certificates',
  'multi_class',
  'analytics'
]
WHERE slug = 'professional-school';

UPDATE public.packages
SET included_modules = ARRAY[
  'student_management',
  'academics',
  'attendance',
  'calendar',
  'communication',
  'institution_website',
  'reports',
  'admissions',
  'exams',
  'homework',
  'lesson_plans',
  'library',
  'finance',
  'documents',
  'certificates',
  'fees_collection',
  'human_resources',
  'inventory',
  'transport',
  'hostel',
  'bulk_messaging',
  'live_classes',
  'student_cv',
  'card_management',
  'alumni',
  'events',
  'multi_class',
  'analytics',
  'ai_intelligence'
]
WHERE slug = 'omni-campus-enterprise';

-- 4. UPDATE ENTITLEMENT FUNCTION WITH FULL ALIAS RESOLUTION
CREATE OR REPLACE FUNCTION public.institution_has_module_entitlement(
  target_institution_id UUID,
  target_module_code VARCHAR
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH normalized_target AS (
    SELECT CASE target_module_code
      WHEN 'multi_branch' THEN 'multi_class'
      WHEN 'examinations' THEN 'exams'
      WHEN 'online_exam' THEN 'exams'
      WHEN 'office_accounting' THEN 'finance'
      WHEN 'student_accounting' THEN 'fees_collection'
      WHEN 'events_calendar' THEN 'calendar'
      WHEN 'website_cms' THEN 'institution_website'
      WHEN 'ai_analytics' THEN 'ai_intelligence'
      WHEN 'certificates_cards' THEN 'certificates'
      ELSE target_module_code
    END AS code
  )
  -- 1. Core modules are unconditionally entitled to every institution
  SELECT EXISTS (
    SELECT 1 FROM public.modules m, normalized_target nt
    WHERE m.code = nt.code
      AND m.is_core = true
  )
  OR
  -- 2. Modules included in the institution's active subscription package
  EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN public.packages p ON s.package_id = p.id
    CROSS JOIN normalized_target nt
    WHERE s.institution_id = target_institution_id
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end >= NOW())
      AND (
        nt.code = ANY(p.included_modules)
        OR (nt.code = 'multi_class' AND 'multi_branch' = ANY(p.included_modules))
        OR (nt.code = 'exams' AND 'examinations' = ANY(p.included_modules))
        OR (nt.code = 'finance' AND 'office_accounting' = ANY(p.included_modules))
        OR (nt.code = 'institution_website' AND 'website_cms' = ANY(p.included_modules))
        OR (nt.code = 'ai_intelligence' AND 'ai_analytics' = ANY(p.included_modules))
      )
  )
  OR
  -- 3. Purchased & active add-ons for the subscription
  EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN public.subscription_addons sa ON s.id = sa.subscription_id
    CROSS JOIN normalized_target nt
    WHERE s.institution_id = target_institution_id
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end >= NOW())
      AND (
        nt.code = sa.module_code
        OR (nt.code = 'multi_class' AND sa.module_code = 'multi_branch')
        OR (nt.code = 'exams' AND sa.module_code = 'examinations')
        OR (nt.code = 'finance' AND sa.module_code = 'office_accounting')
        OR (nt.code = 'institution_website' AND sa.module_code = 'website_cms')
        OR (nt.code = 'ai_intelligence' AND sa.module_code = 'ai_analytics')
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.institution_has_module_entitlement(UUID, VARCHAR) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.institution_has_module_entitlement(UUID, VARCHAR) TO authenticated;

-- 5. DEDICATED ATOMIC RPC TO TOGGLE MODULE STATUS
CREATE OR REPLACE FUNCTION public.toggle_institution_module_activation(
  p_institution_id UUID,
  p_module_code VARCHAR,
  p_is_enabled BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_auth_id UUID;
  v_caller_role institution_role;
  v_is_platform_admin BOOLEAN;
  v_entitled BOOLEAN;
  v_result RECORD;
BEGIN
  v_caller_auth_id := auth.uid();
  IF v_caller_auth_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.platform_memberships
    WHERE user_id = v_caller_auth_id AND status = 'active'
      AND role IN ('platform_super_admin', 'platform_admin')
  ) INTO v_is_platform_admin;

  SELECT role INTO v_caller_role
  FROM public.institution_users
  WHERE institution_id = p_institution_id
    AND user_id = v_caller_auth_id
    AND is_active = true;

  IF NOT v_is_platform_admin AND (v_caller_role IS NULL OR v_caller_role NOT IN ('institution_owner', 'institution_admin')) THEN
    RAISE EXCEPTION 'Authorization denied: Only institution owners, administrators, or platform authorities can toggle module states.'
      USING ERRCODE = '42501';
  END IF;

  -- Entitlement check if enabling
  IF p_is_enabled = true THEN
    v_entitled := public.institution_has_module_entitlement(p_institution_id, p_module_code);
    IF NOT v_entitled THEN
      RAISE EXCEPTION 'Entitlement violation: Institution is not licensed to enable module "%". Subscription tier upgrade or add-on purchase required.', p_module_code
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  INSERT INTO public.institution_modules (institution_id, module_code, is_enabled, enabled_at, updated_at)
  VALUES (p_institution_id, p_module_code, p_is_enabled, NOW(), NOW())
  ON CONFLICT (institution_id, module_code)
  DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    updated_at = NOW()
  RETURNING * INTO v_result;

  -- Audit Log
  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, details)
  VALUES (
    p_institution_id,
    v_caller_auth_id,
    CASE WHEN p_is_enabled THEN 'module.enabled' ELSE 'module.disabled' END,
    'institution_module',
    v_result.id::text,
    jsonb_build_object('module_code', p_module_code, 'is_enabled', p_is_enabled)
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', v_result.id,
    'module_code', v_result.module_code,
    'is_enabled', v_result.is_enabled
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.toggle_institution_module_activation(UUID, VARCHAR, BOOLEAN) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_institution_module_activation(UUID, VARCHAR, BOOLEAN) TO authenticated;
