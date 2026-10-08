-- ==============================================================================
-- ACADEEMIA 2.0 - Migration: Comprehensive Module Catalog, Packages,
-- Subscriptions & Entitlement Framework (Phase 4B)
-- ==============================================================================

-- 1. SEED / UPSERT COMPREHENSIVE PLATFORM MODULE CATALOG (27 Modules)
INSERT INTO public.modules (code, name, description, category, is_core, default_enabled, icon, permissions_provided)
VALUES
  -- Core Modules
  (
    'student_management',
    'Student Information System',
    'Comprehensive student lifecycle, longitudinal profiles, academic records, unique institutional identifiers, and cohort progression.',
    'core',
    true,
    true,
    'GraduationCap',
    ARRAY['students.read', 'students.write', 'students.export', 'students.delete']
  ),
  (
    'academics',
    'Academic Structure & Curriculum',
    'Multi-term academic sessions, grading scales, educational levels, classes, subject offerings, and timetable curriculum mapping.',
    'core',
    true,
    true,
    'BookOpen',
    ARRAY['academics.manage', 'academics.view']
  ),

  -- Academic Operations
  (
    'admissions',
    'Online Admissions & Inquiries',
    'Prospective applicant portal, inquiry intake pipeline, document screening workflows, and automated enrollment conversion.',
    'academic',
    false,
    true,
    'UserPlus',
    ARRAY['admissions.manage', 'admissions.review', 'admissions.convert']
  ),
  (
    'attendance',
    'Attendance & Truancy Monitoring',
    'Daily and period-level roll calls, biometric scanner synchronization, automated absent SMS triggers, and attendance audits.',
    'academic',
    false,
    true,
    'CalendarCheck',
    ARRAY['attendance.mark', 'attendance.view', 'attendance.reports']
  ),
  (
    'exams',
    'Examinations & Grading',
    'Examination session scheduling, grading scales, mark entry sheets, consolidated report card generation, and student rankings.',
    'academic',
    false,
    true,
    'Award',
    ARRAY['exams.create', 'exams.grade', 'exams.publish']
  ),
  (
    'homework',
    'Homework & Assignments',
    'Digital assignment distribution, student submission portals, teacher grading feedback, rubric evaluation, and due date trackers.',
    'academic',
    false,
    true,
    'FileText',
    ARRAY['homework.create', 'homework.submit', 'homework.grade']
  ),
  (
    'lesson_plans',
    'Lesson Planning & Syllabus',
    'Curriculum mapping, instructional lesson plans, departmental syllabus review, and topic completion tracking.',
    'academic',
    false,
    false,
    'BookOpen',
    ARRAY['lesson_plans.create', 'lesson_plans.review', 'lesson_plans.view']
  ),
  (
    'live_classes',
    'Virtual Classrooms & Live Streaming',
    'Remote teaching integration, virtual class links (Meet, Zoom), live session attendee logging, and recorded lecture archives.',
    'academic',
    false,
    false,
    'Laptop',
    ARRAY['live_classes.host', 'live_classes.join', 'live_classes.record']
  ),
  (
    'student_cv',
    'Student Portfolio & Extracurricular CV',
    'Co-curricular achievements, sports leadership, awards portfolio, community service logs, and graduation transcripts.',
    'academic',
    false,
    false,
    'UserCheck',
    ARRAY['student_cv.edit', 'student_cv.view', 'student_cv.endorse']
  ),

  -- Finance Operations
  (
    'fees_collection',
    'Tuition & Fees Billing',
    'Multi-term fee schedules, customizable fee categories, student invoices, offline receipts, discounts, and payment reconciliation.',
    'finance',
    false,
    true,
    'Receipt',
    ARRAY['finance.fee_structures', 'finance.invoices', 'finance.collect_payment', 'finance.waivers']
  ),
  (
    'finance',
    'Finance & Office Accounting',
    'Campus operational ledgers, income vouchers, expense approvals, petty cash tracking, balance sheets, and audit trails.',
    'finance',
    false,
    false,
    'DollarSign',
    ARRAY['finance.ledgers', 'finance.refunds', 'accounting.expenses', 'accounting.income', 'accounting.reports']
  ),

  -- Administration & Operations
  (
    'human_resources',
    'Human Resources & Faculty',
    'Faculty directory, academic qualifications, employment contracts, leave management, attendance tracking, and payroll slips.',
    'administrative',
    false,
    true,
    'Users',
    ARRAY['hr.manage', 'hr.payroll', 'hr.leave']
  ),
  (
    'library',
    'Library Management',
    'Book cataloging with ISBN and barcodes, circulation issue/return logs, overdue fine calculations, and digital e-book access.',
    'administrative',
    false,
    false,
    'Library',
    ARRAY['library.catalog', 'library.issue']
  ),
  (
    'inventory',
    'Inventory & Asset Management',
    'Institutional asset registry, school consumables, supplier purchase orders, stock depreciation, and room inventories.',
    'administrative',
    false,
    false,
    'Package',
    ARRAY['inventory.manage', 'inventory.audit']
  ),
  (
    'transport',
    'Transport & Fleet Logistics',
    'School bus fleet management, driver rosters, vehicle route scheduling, pickup stops, and passenger manifests.',
    'administrative',
    false,
    false,
    'Bus',
    ARRAY['transport.routes', 'transport.manifest']
  ),
  (
    'hostel',
    'Hostel & Residential Boarding',
    'Dormitory building structures, room and bed assignments, residential warden duties, and boarding student records.',
    'administrative',
    false,
    false,
    'Home',
    ARRAY['hostel.rooms', 'hostel.residents']
  ),
  (
    'documents',
    'Document Vault & Transcripts',
    'Encrypted institutional document repository, student identification archives, birth certificates, and immunization records.',
    'administrative',
    false,
    true,
    'FolderLock',
    ARRAY['documents.upload', 'documents.view', 'documents.verify']
  ),
  (
    'certificates',
    'Certificates & Diploma Generator',
    'Customizable diploma designer, school leaving certificates, merit credentials, and tamper-evident QR verification codes.',
    'administrative',
    false,
    false,
    'Award',
    ARRAY['certificates.design', 'certificates.issue']
  ),
  (
    'card_management',
    'ID Cards & Smart Badges',
    'Student ID card generation, faculty smart badge printing, RFID/NFC tag association, and barcode gate passes.',
    'administrative',
    false,
    false,
    'CreditCard',
    ARRAY['cards.design', 'cards.print', 'cards.scan']
  ),
  (
    'multi_branch',
    'Multi-Branch & Campus Sync',
    'Consolidated governance over branch campuses, inter-campus student transfers, centralized curriculum, and unified rollups.',
    'administrative',
    false,
    false,
    'Building2',
    ARRAY['multicampus.manage', 'multicampus.transfer', 'multicampus.rollup']
  ),

  -- Communication & Public Presence
  (
    'communication',
    'Internal Messaging & Circulars',
    'School circulars, teacher-parent direct communication, department chat channels, and emergency notifications.',
    'communication',
    false,
    true,
    'MessageSquare',
    ARRAY['comms.broadcast', 'comms.chat']
  ),
  (
    'bulk_messaging',
    'Bulk SMS & Email Campaigns',
    'Institutional mass SMS gateway, transactional email broadcasting, announcement templates, and delivery reports.',
    'communication',
    false,
    false,
    'Send',
    ARRAY['comms.broadcast', 'bulk_messaging.send', 'bulk_messaging.templates']
  ),
  (
    'calendar',
    'Institutional Calendar & Schedules',
    'Multi-term institution schedule, exam windows, faculty meetings, public holidays, and academic calendar sync.',
    'communication',
    false,
    true,
    'Calendar',
    ARRAY['events.manage', 'events.view']
  ),
  (
    'events',
    'Campus Events & Ticketing',
    'Annual sports day, graduation ceremonies, parent-teacher conferences, ticket reservations, and guest registration.',
    'communication',
    false,
    true,
    'Calendar',
    ARRAY['events.manage', 'events.view', 'events.ticket']
  ),
  (
    'alumni',
    'Alumni Network & Graduate Registry',
    'Alumni registry, graduate employment tracking, mentorship networks, alumni reunions, and donor engagement.',
    'communication',
    false,
    false,
    'Network',
    ARRAY['alumni.directory', 'alumni.events', 'alumni.outreach']
  ),
  (
    'institution_website',
    'School CMS & Public Website',
    'Custom-branded public institutional web presence directly linked to live admissions applications, events, and news.',
    'communication',
    false,
    true,
    'Globe',
    ARRAY['website.publish', 'website.design', 'website.admissions_link']
  ),

  -- Intelligence
  (
    'ai_intelligence',
    'ACADEEMIA AI Intelligence Hub',
    'Tenant-isolated machine learning analytics, early student risk alerts, automated financial insights, and executive summaries.',
    'intelligence',
    false,
    true,
    'Sparkles',
    ARRAY['ai.assistant', 'ai.predictive', 'ai.audit']
  )
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_core = EXCLUDED.is_core,
  icon = EXCLUDED.icon,
  permissions_provided = EXCLUDED.permissions_provided;

-- 2. SEED / UPDATE PLATFORM TIERS IN public.packages
INSERT INTO public.packages (id, name, slug, description, billing_cycle, price_cents, currency, included_modules, limits, is_active)
VALUES
  (
    'e69a1bf8-5dc5-4a07-948d-59d94eb74c58',
    'Essential Academy',
    'essential-academy',
    'Foundational Student Information System, Academic hierarchy, Attendance, Calendar, and School Website for modern schools.',
    'annual',
    29900,
    'USD',
    ARRAY[
      'student_management',
      'academics',
      'attendance',
      'calendar',
      'communication',
      'institution_website'
    ],
    '{"max_students": 500, "max_campuses": 1, "max_staff": 50, "storage_gb": 100}'::jsonb,
    true
  ),
  (
    'c5208b5f-9721-4d3e-8cb5-45a86d267980',
    'Professional School',
    'professional-school',
    'Expanded operational suite including Admissions, Examinations, Homework, Lesson Plans, Finance, and Document Vault.',
    'annual',
    54900,
    'USD',
    ARRAY[
      'student_management',
      'academics',
      'attendance',
      'calendar',
      'communication',
      'institution_website',
      'admissions',
      'exams',
      'homework',
      'lesson_plans',
      'library',
      'finance',
      'documents',
      'certificates'
    ],
    '{"max_students": 1500, "max_campuses": 3, "max_staff": 150, "storage_gb": 300}'::jsonb,
    true
  ),
  (
    'b911bdf6-3df4-40d0-adc3-380e29dd555a',
    'Omni-Campus Enterprise',
    'omni-campus-enterprise',
    'The ultimate enterprise solution with all 27 operational modules, Multi-Branch sync, Fleet Logistics, and AI Intelligence.',
    'annual',
    99900,
    'USD',
    ARRAY[
      'student_management',
      'academics',
      'attendance',
      'calendar',
      'communication',
      'institution_website',
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
      'multi_branch',
      'ai_intelligence'
    ],
    '{"max_students": 5000, "max_campuses": 10, "max_staff": 500, "storage_gb": 1000}'::jsonb,
    true
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  included_modules = EXCLUDED.included_modules,
  limits = EXCLUDED.limits,
  is_active = EXCLUDED.is_active;

-- 3. REINFORCE ENTITLEMENT FUNCTION (Supporting Canonical Normalization)
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
  -- 1. Core modules are unconditionally entitled to every institution
  SELECT EXISTS (
    SELECT 1 FROM public.modules
    WHERE code = target_module_code
      AND is_core = true
  )
  OR
  -- 2. Modules included in the institution's active subscription package
  EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN public.packages p ON s.package_id = p.id
    WHERE s.institution_id = target_institution_id
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end >= NOW())
      AND (
        target_module_code = ANY(p.included_modules)
        OR (target_module_code = 'exams' AND 'examinations' = ANY(p.included_modules))
        OR (target_module_code = 'finance' AND 'office_accounting' = ANY(p.included_modules))
        OR (target_module_code = 'institution_website' AND 'website_cms' = ANY(p.included_modules))
        OR (target_module_code = 'ai_intelligence' AND 'ai_analytics' = ANY(p.included_modules))
      )
  )
  OR
  -- 3. Modules active as subscription add-ons
  EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN public.subscription_addons sa ON sa.subscription_id = s.id
    WHERE s.institution_id = target_institution_id
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end >= NOW())
      AND (
        sa.module_code = target_module_code
        OR (target_module_code = 'exams' AND sa.module_code = 'examinations')
        OR (target_module_code = 'finance' AND sa.module_code = 'office_accounting')
        OR (target_module_code = 'institution_website' AND sa.module_code = 'website_cms')
        OR (target_module_code = 'ai_intelligence' AND sa.module_code = 'ai_analytics')
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.institution_has_module_entitlement(UUID, VARCHAR) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.institution_has_module_entitlement(UUID, VARCHAR) TO authenticated;

-- 4. RPC: CHANGE OR ACTIVATE INSTITUTION PACKAGE SUBSCRIPTION
CREATE OR REPLACE FUNCTION public.subscribe_institution_package(
  p_institution_id UUID,
  p_package_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_auth_id UUID;
  v_caller_role public.institution_role;
  v_is_platform_adm BOOLEAN;
  v_pkg_record public.packages%ROWTYPE;
  v_sub_record public.subscriptions%ROWTYPE;
BEGIN
  v_caller_auth_id := auth.uid();

  -- Verify Platform Admin or Institution Owner/Admin authority
  v_is_platform_adm := public.is_platform_admin();

  IF NOT v_is_platform_adm THEN
    SELECT role INTO v_caller_role
    FROM public.institution_users
    WHERE institution_id = p_institution_id
      AND user_id = v_caller_auth_id
      AND is_active = true;

    IF v_caller_role IS NULL OR v_caller_role NOT IN ('institution_owner', 'institution_admin') THEN
      RAISE EXCEPTION 'Authorization denied: Only institution owners, admins, or platform authorities can change subscription tiers.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Validate package exists
  SELECT * INTO v_pkg_record FROM public.packages WHERE id = p_package_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid package: Selected package ID % not found or inactive.', p_package_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Upsert Subscription record
  INSERT INTO public.subscriptions (
    institution_id,
    package_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    updated_at
  )
  VALUES (
    p_institution_id,
    p_package_id,
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    false,
    NOW()
  )
  ON CONFLICT (institution_id) DO UPDATE
  SET
    package_id = EXCLUDED.package_id,
    status = 'active',
    current_period_end = NOW() + INTERVAL '1 year',
    cancel_at_period_end = false,
    updated_at = NOW()
  RETURNING * INTO v_sub_record;

  -- Log Audit Trail
  INSERT INTO public.audit_logs (
    tenant_id,
    actor_user_id,
    actor_name,
    action,
    entity_type,
    entity_id,
    details
  )
  VALUES (
    p_institution_id,
    v_caller_auth_id,
    COALESCE((SELECT full_name FROM public.users WHERE id = v_caller_auth_id), 'System Authority'),
    'SUBSCRIPTION_PACKAGE_CHANGED',
    'subscriptions',
    v_sub_record.id,
    jsonb_build_object(
      'package_id', p_package_id,
      'package_name', v_pkg_record.name,
      'billing_cycle', v_pkg_record.billing_cycle,
      'price_cents', v_pkg_record.price_cents
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_sub_record.id,
    'package_name', v_pkg_record.name,
    'package_slug', v_pkg_record.slug,
    'status', v_sub_record.status
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.subscribe_institution_package(UUID, UUID) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_institution_package(UUID, UUID) TO authenticated;

-- 5. RPC: ADD SUBSCRIPTION ADD-ON FOR AN INSTITUTION
CREATE OR REPLACE FUNCTION public.add_institution_subscription_addon(
  p_institution_id UUID,
  p_module_code VARCHAR,
  p_price_cents INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_auth_id UUID;
  v_caller_role public.institution_role;
  v_is_platform_adm BOOLEAN;
  v_sub_id UUID;
  v_addon_id UUID;
BEGIN
  v_caller_auth_id := auth.uid();
  v_is_platform_adm := public.is_platform_admin();

  IF NOT v_is_platform_adm THEN
    SELECT role INTO v_caller_role
    FROM public.institution_users
    WHERE institution_id = p_institution_id
      AND user_id = v_caller_auth_id
      AND is_active = true;

    IF v_caller_role IS NULL OR v_caller_role NOT IN ('institution_owner', 'institution_admin') THEN
      RAISE EXCEPTION 'Authorization denied: Insufficient privileges to purchase add-ons.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Ensure institution has a subscription
  SELECT id INTO v_sub_id FROM public.subscriptions WHERE institution_id = p_institution_id;
  IF v_sub_id IS NULL THEN
    -- Auto-provision Essential Academy subscription if missing
    INSERT INTO public.subscriptions (institution_id, package_id, status)
    VALUES (p_institution_id, 'e69a1bf8-5dc5-4a07-948d-59d94eb74c58', 'active')
    RETURNING id INTO v_sub_id;
  END IF;

  -- Insert Addon
  INSERT INTO public.subscription_addons (subscription_id, module_code, price_cents, added_at)
  VALUES (v_sub_id, p_module_code, p_price_cents, NOW())
  ON CONFLICT (subscription_id, module_code) DO UPDATE
  SET price_cents = EXCLUDED.price_cents
  RETURNING id INTO v_addon_id;

  -- Log Audit Trail
  INSERT INTO public.audit_logs (
    tenant_id,
    actor_user_id,
    actor_name,
    action,
    entity_type,
    entity_id,
    details
  )
  VALUES (
    p_institution_id,
    v_caller_auth_id,
    COALESCE((SELECT full_name FROM public.users WHERE id = v_caller_auth_id), 'System Authority'),
    'SUBSCRIPTION_ADDON_PURCHASED',
    'subscription_addons',
    v_addon_id,
    jsonb_build_object('module_code', p_module_code, 'price_cents', p_price_cents)
  );

  RETURN jsonb_build_object(
    'success', true,
    'addon_id', v_addon_id,
    'module_code', p_module_code
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.add_institution_subscription_addon(UUID, VARCHAR, INT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_institution_subscription_addon(UUID, VARCHAR, INT) TO authenticated;

-- 6. RPC: REMOVE SUBSCRIPTION ADD-ON
CREATE OR REPLACE FUNCTION public.remove_institution_subscription_addon(
  p_institution_id UUID,
  p_module_code VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_auth_id UUID;
  v_sub_id UUID;
BEGIN
  v_caller_auth_id := auth.uid();

  IF NOT (
    public.is_platform_admin()
    OR public.has_institution_role(
      p_institution_id,
      ARRAY['institution_owner', 'institution_admin']::public.institution_role[]
    )
  ) THEN
    RAISE EXCEPTION 'Authorization denied to remove add-on.' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_sub_id FROM public.subscriptions WHERE institution_id = p_institution_id;
  IF v_sub_id IS NOT NULL THEN
    DELETE FROM public.subscription_addons
    WHERE subscription_id = v_sub_id AND module_code = p_module_code;

    -- Also disable the module in institution_modules if active
    UPDATE public.institution_modules
    SET is_enabled = false, updated_at = NOW()
    WHERE institution_id = p_institution_id AND module_code = p_module_code;
  END IF;

  RETURN jsonb_build_object('success', true, 'removed_module_code', p_module_code);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.remove_institution_subscription_addon(UUID, VARCHAR) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_institution_subscription_addon(UUID, VARCHAR) TO authenticated;
