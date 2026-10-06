-- ==============================================================================
-- ACADEEMIA 2.0 - Core Multi-Tenant Database Schema (PostgreSQL / Supabase)
-- ==============================================================================
-- Authoritative Root Identity: auth.uid() (Supabase Auth)
-- Security Model: Database-enforced Row Level Security (RLS) via membership lookups.
-- Zero unverified JWT claims. Zero client-controlled privilege escalation.
-- Idempotent: Can be safely executed multiple times in the Supabase SQL Editor.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS (Safely declared so re-running never throws duplicate_object)
DO $$ BEGIN
  CREATE TYPE platform_role AS ENUM (
    'platform_super_admin',
    'platform_admin',
    'platform_finance',
    'platform_sales',
    'platform_support',
    'platform_customer_success',
    'platform_marketing',
    'platform_hr',
    'platform_operations',
    'platform_staff'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Guarantee that platform_staff is present if the enum was previously initialized
ALTER TYPE platform_role ADD VALUE IF NOT EXISTS 'platform_staff';

DO $$ BEGIN
  CREATE TYPE institution_role AS ENUM (
    'institution_owner',
    'institution_admin',
    'principal',
    'school_admin',
    'teacher',
    'student',
    'parent_guardian',
    'accountant',
    'hr_manager',
    'librarian',
    'transport_manager',
    'hostel_manager',
    'receptionist',
    'custom_role'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'trialing',
    'active',
    'past_due',
    'canceled',
    'incomplete'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_cycle AS ENUM (
    'monthly',
    'quarterly',
    'annual'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE module_status AS ENUM (
    'active',
    'inactive',
    'beta',
    'deprecated'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE student_status AS ENUM (
    'active',
    'admitted',
    'graduated',
    'transferred',
    'suspended',
    'withdrawn'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM (
    'draft',
    'issued',
    'partially_paid',
    'paid',
    'void',
    'overdue'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. CORE IDENTITY & USER PROFILES
-- ==============================================================================

-- Application User Profiles (Directly mapped to auth.users.id)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACADEEMIA Platform Memberships (Isolated from normal user profile)
-- A user can only be a platform operator if an active record exists here.
CREATE TABLE IF NOT EXISTS platform_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role platform_role NOT NULL DEFAULT 'platform_staff',
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Institutions (Customer Educational Tenants)
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  custom_domain VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending_setup', 'suspended', 'archived')),
  timezone VARCHAR(100) DEFAULT 'UTC',
  currency VARCHAR(10) DEFAULT 'USD',
  terminology_config JSONB DEFAULT '{
    "grade_label": "Grade",
    "class_label": "Class",
    "term_label": "Term",
    "student_label": "Student",
    "teacher_label": "Teacher"
  }'::jsonb,
  branding_config JSONB DEFAULT '{
    "primary_color": "#4f46e5",
    "accent_color": "#06b6d4",
    "font_family": "Plus Jakarta Sans"
  }'::jsonb,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campuses (1-to-many with Institutions)
CREATE TABLE IF NOT EXISTS campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  is_main BOOLEAN DEFAULT false,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  capacity INT DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, code)
);

-- Institution Custom Roles & Permissions Templates
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE, -- NULL for system templates
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, slug)
);

-- Institution User Memberships (Many-to-Many: One user can belong to multiple institutions)
-- campus_id NULL means access across all campuses within that institution.
CREATE TABLE IF NOT EXISTS institution_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
  role institution_role NOT NULL,
  custom_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  custom_permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, user_id)
);

-- ==============================================================================
-- 4. MODULE REGISTRY & SUBSCRIPTIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  is_core BOOLEAN DEFAULT false,
  default_enabled BOOLEAN DEFAULT true,
  icon VARCHAR(100) DEFAULT 'Layers',
  permissions_provided TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  billing_cycle billing_cycle DEFAULT 'annual',
  price_cents INT NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  included_modules TEXT[] DEFAULT '{}',
  limits JSONB DEFAULT '{
    "max_students": 500,
    "max_campuses": 2,
    "max_staff": 50,
    "storage_gb": 100
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  status subscription_status DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id)
);

CREATE TABLE IF NOT EXISTS subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  module_code VARCHAR(100) NOT NULL REFERENCES modules(code) ON DELETE CASCADE,
  price_cents INT NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id, module_code)
);

CREATE TABLE IF NOT EXISTS institution_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  module_code VARCHAR(100) NOT NULL REFERENCES modules(code) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, module_code)
);

-- ==============================================================================
-- 5. ACADEMIC STRUCTURE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  sequence_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, code)
);

CREATE TABLE IF NOT EXISTS academic_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  grade_id UUID NOT NULL REFERENCES academic_grades(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  capacity INT DEFAULT 35,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, academic_year_id, code)
);

-- ==============================================================================
-- 6. STUDENT IDENTITY & GUARDIANS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE RESTRICT,
  student_number VARCHAR(100) NOT NULL, -- Unique strictly within this institution!
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  gender VARCHAR(20),
  date_of_birth DATE,
  admission_date DATE DEFAULT CURRENT_DATE,
  status student_status DEFAULT 'active',
  current_class_id UUID REFERENCES academic_classes(id) ON DELETE SET NULL,
  avatar_url TEXT,
  blood_group VARCHAR(10),
  allergies TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, student_number)
);

CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES academic_classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'enrolled',
  roll_number VARCHAR(50),
  UNIQUE(student_id, academic_year_id)
);

CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  relationship_type VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  occupation VARCHAR(100),
  is_emergency_contact BOOLEAN DEFAULT true,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-Many Student-to-Guardian
CREATE TABLE IF NOT EXISTS student_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  can_pickup BOOLEAN DEFAULT true,
  receives_billing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, guardian_id)
);

-- ==============================================================================
-- 7. HUMAN RESOURCES (MODULAR)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS hr_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  head_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, code)
);

CREATE TABLE IF NOT EXISTS hr_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_number VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES hr_departments(id) ON DELETE SET NULL,
  job_title VARCHAR(150) NOT NULL,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  employment_type VARCHAR(50) DEFAULT 'full_time',
  employment_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, employee_number),
  UNIQUE(institution_id, user_id)
);

-- ==============================================================================
-- 8. FINANCE (MODULAR)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS finance_fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  amount_cents INT NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  due_date DATE,
  applicable_grade_id UUID REFERENCES academic_grades(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  fee_structure_id UUID REFERENCES finance_fee_structures(id) ON DELETE SET NULL,
  invoice_number VARCHAR(100) NOT NULL,
  total_amount_cents INT NOT NULL,
  balance_cents INT NOT NULL,
  status invoice_status DEFAULT 'issued',
  due_date DATE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS finance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES finance_invoices(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  transaction_reference VARCHAR(150) NOT NULL,
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  received_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ==============================================================================
-- 9. DUAL WEBSITES (ACADEEMIA Public & Institution Sites)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS platform_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) UNIQUE NOT NULL DEFAULT 'acadeemia.com',
  hero_title VARCHAR(255) NOT NULL,
  hero_subtitle TEXT NOT NULL,
  featured_modules TEXT[] DEFAULT '{}',
  pricing_plans JSONB DEFAULT '[]'::jsonb,
  blog_articles JSONB DEFAULT '[]'::jsonb,
  is_live BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institution_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID UNIQUE NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  site_title VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  hero_heading VARCHAR(255),
  hero_subheading TEXT,
  banner_image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  custom_domain VARCHAR(255),
  theme_config JSONB DEFAULT '{
    "primary_color": "#1e293b",
    "accent_color": "#4f46e5",
    "layout": "modern_academy"
  }'::jsonb,
  nav_items JSONB DEFAULT '[
    {"label": "Home", "path": "/"},
    {"label": "Academics", "path": "/academics"},
    {"label": "Admissions", "path": "/admissions"},
    {"label": "Faculty", "path": "/faculty"},
    {"label": "Contact", "path": "/contact"}
  ]'::jsonb,
  pages JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. AUDIT LOGGING & AI TELEMETRY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES institutions(id) ON DELETE CASCADE, -- NULL for platform operations
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  capability VARCHAR(100) NOT NULL,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  context_scope JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. SECURE DATABASE SECURITY FUNCTIONS (Zero Untrusted JWT Claims)
-- ==============================================================================

-- Check whether authenticated user is an active ACADEEMIA platform administrator
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_memberships
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('platform_super_admin', 'platform_admin')
  );
$$;

-- Check whether authenticated user is any platform operator
CREATE OR REPLACE FUNCTION is_platform_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_memberships
    WHERE user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- Check whether authenticated user has active membership in a specific institution
CREATE OR REPLACE FUNCTION has_institution_membership(target_institution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM institution_users
    WHERE user_id = auth.uid()
      AND institution_id = target_institution_id
      AND is_active = true
  );
$$;

-- Check whether user holds specific roles in an institution
CREATE OR REPLACE FUNCTION has_institution_role(target_institution_id UUID, required_roles institution_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM institution_users
    WHERE user_id = auth.uid()
      AND institution_id = target_institution_id
      AND is_active = true
      AND role = ANY(required_roles)
  );
$$;

-- Check campus scope: user's campus_id is NULL (all campuses) OR equals target campus
CREATE OR REPLACE FUNCTION has_campus_access(target_institution_id UUID, target_campus_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM institution_users
    WHERE user_id = auth.uid()
      AND institution_id = target_institution_id
      AND is_active = true
      AND (campus_id IS NULL OR campus_id = target_campus_id)
  );
$$;

-- Return all legitimate institution IDs for the authenticated caller
CREATE OR REPLACE FUNCTION get_user_institution_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT institution_id FROM institution_users
  WHERE user_id = auth.uid() AND is_active = true;
$$;

-- Verify whether an institution has legitimate commercial entitlement to a module.
-- Checks: 1) Core modules, 2) Active subscription package inclusions, 3) Active add-ons.
CREATE OR REPLACE FUNCTION institution_has_module_entitlement(target_institution_id UUID, target_module_code VARCHAR)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- 1. Core modules are entitled to all institutions
  SELECT EXISTS (
    SELECT 1 FROM modules
    WHERE code = target_module_code
      AND is_core = true
  )
  OR
  -- 2. Modules included in the institution's active package subscription
  EXISTS (
    SELECT 1 FROM subscriptions s
    JOIN packages p ON s.package_id = p.id
    WHERE s.institution_id = target_institution_id
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end >= NOW())
      AND target_module_code = ANY(p.included_modules)
  )
  OR
  -- 3. Modules added as active subscription add-ons
  EXISTS (
    SELECT 1 FROM subscriptions s
    JOIN subscription_addons sa ON sa.subscription_id = s.id
    WHERE s.institution_id = target_institution_id
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end >= NOW())
      AND sa.module_code = target_module_code
  );
$$;

GRANT EXECUTE ON FUNCTION institution_has_module_entitlement(UUID, VARCHAR) TO authenticated, anon;

-- Database-Enforced Subscription & Module Entitlement Trigger
-- Strictly rejects any attempt to enable an unentitled module directly at the PostgreSQL engine level.
CREATE OR REPLACE FUNCTION trg_fn_enforce_institution_module_entitlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If enabling the module, verify legitimate commercial entitlement
  IF NEW.is_enabled = true THEN
    IF NOT institution_has_module_entitlement(NEW.institution_id, NEW.module_code) THEN
      RAISE EXCEPTION 'Entitlement violation: Institution % is not commercially entitled to enable module "%". Subscription package upgrade or add-on purchase required.',
        NEW.institution_id, NEW.module_code
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_institution_module_entitlement ON institution_modules;
CREATE TRIGGER trg_enforce_institution_module_entitlement
  BEFORE INSERT OR UPDATE ON institution_modules
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_enforce_institution_module_entitlement();

-- Note: Initial Platform Super Admin promotion must be performed by a trusted DBA
-- directly in the Supabase SQL Editor using standard DML:
--
-- INSERT INTO public.platform_memberships (user_id, role, status)
-- SELECT id, 'platform_super_admin'::platform_role, 'active'
-- FROM auth.users WHERE email = 'your_admin_email@domain.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'platform_super_admin', status = 'active';

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES — IDEMPOTENT & GRANULAR
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_events ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. USERS & PROFILES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS users_select_self_or_peers ON users;
CREATE POLICY users_select_self_or_peers ON users
  FOR SELECT
  USING (
    id = auth.uid()
    OR is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM institution_users iu1
      JOIN institution_users iu2 ON iu1.institution_id = iu2.institution_id
      WHERE iu1.user_id = auth.uid() AND iu2.user_id = users.id AND iu1.is_active = true
    )
  );

DROP POLICY IF EXISTS users_insert_self ON users;
CREATE POLICY users_insert_self ON users
  FOR INSERT
  WITH CHECK (id = auth.uid() OR is_platform_admin());

DROP POLICY IF EXISTS users_update_self ON users;
CREATE POLICY users_update_self ON users
  FOR UPDATE
  USING (id = auth.uid() OR is_platform_admin())
  WITH CHECK (id = auth.uid() OR is_platform_admin());

-- ------------------------------------------------------------------------------
-- B. PLATFORM MEMBERSHIPS (Protected ACADEEMIA Operator Layer)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS platform_memberships_select ON platform_memberships;
CREATE POLICY platform_memberships_select ON platform_memberships
  FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());

DROP POLICY IF EXISTS platform_memberships_admin_manage ON platform_memberships;
CREATE POLICY platform_memberships_admin_manage ON platform_memberships
  FOR ALL
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ------------------------------------------------------------------------------
-- C. INSTITUTIONS (Tenant Roots)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS institutions_select ON institutions;
CREATE POLICY institutions_select ON institutions
  FOR SELECT
  USING (is_platform_user() OR has_institution_membership(id));

DROP POLICY IF EXISTS institutions_insert ON institutions;
CREATE POLICY institutions_insert ON institutions
  FOR INSERT
  WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS institutions_update ON institutions;
CREATE POLICY institutions_update ON institutions
  FOR UPDATE
  USING (
    is_platform_admin()
    OR has_institution_role(id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
  )
  WITH CHECK (
    is_platform_admin()
    OR has_institution_role(id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
  );

DROP POLICY IF EXISTS institutions_delete ON institutions;
CREATE POLICY institutions_delete ON institutions
  FOR DELETE
  USING (is_platform_admin());

-- ------------------------------------------------------------------------------
-- D. CAMPUSES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS campuses_select ON campuses;
CREATE POLICY campuses_select ON campuses
  FOR SELECT
  USING (is_platform_user() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS campuses_insert ON campuses;
CREATE POLICY campuses_insert ON campuses
  FOR INSERT
  WITH CHECK (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
  );

DROP POLICY IF EXISTS campuses_update ON campuses;
CREATE POLICY campuses_update ON campuses
  FOR UPDATE
  USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
  )
  WITH CHECK (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
  );

DROP POLICY IF EXISTS campuses_delete ON campuses;
CREATE POLICY campuses_delete ON campuses
  FOR DELETE
  USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner']::institution_role[])
  );

-- ------------------------------------------------------------------------------
-- E. ROLES & PERMISSION TEMPLATES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS roles_select ON roles;
CREATE POLICY roles_select ON roles
  FOR SELECT
  USING (
    institution_id IS NULL
    OR is_platform_user()
    OR has_institution_membership(institution_id)
  );

DROP POLICY IF EXISTS roles_manage ON roles;
CREATE POLICY roles_manage ON roles
  FOR ALL
  USING (
    is_platform_admin()
    OR (
      institution_id IS NOT NULL
      AND has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
    )
  )
  WITH CHECK (
    is_platform_admin()
    OR (
      institution_id IS NOT NULL
      AND has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
    )
  );

-- ------------------------------------------------------------------------------
-- F. INSTITUTION USERS (Membership & Roles)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS institution_users_select ON institution_users;
CREATE POLICY institution_users_select ON institution_users
  FOR SELECT
  USING (
    is_platform_admin()
    OR user_id = auth.uid()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal', 'school_admin', 'hr_manager']::institution_role[])
  );

DROP POLICY IF EXISTS institution_users_insert ON institution_users;
CREATE POLICY institution_users_insert ON institution_users
  FOR INSERT
  WITH CHECK (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
  );

DROP POLICY IF EXISTS institution_users_update ON institution_users;
CREATE POLICY institution_users_update ON institution_users
  FOR UPDATE
  USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
  )
  WITH CHECK (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
  );

DROP POLICY IF EXISTS institution_users_delete ON institution_users;
CREATE POLICY institution_users_delete ON institution_users
  FOR DELETE
  USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner']::institution_role[])
  );

-- ------------------------------------------------------------------------------
-- F. STUDENTS & GUARDIANS (Campus Scoped & Longitudinal)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS students_select ON students;
CREATE POLICY students_select ON students
  FOR SELECT
  USING (
    is_platform_admin()
    OR (
      has_institution_membership(institution_id)
      AND has_campus_access(institution_id, campus_id)
    )
  );

DROP POLICY IF EXISTS students_insert ON students;
CREATE POLICY students_insert ON students
  FOR INSERT
  WITH CHECK (
    is_platform_admin()
    OR (
      has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal', 'school_admin']::institution_role[])
      AND has_campus_access(institution_id, campus_id)
    )
  );

DROP POLICY IF EXISTS students_update ON students;
CREATE POLICY students_update ON students
  FOR UPDATE
  USING (
    is_platform_admin()
    OR (
      has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal', 'school_admin']::institution_role[])
      AND has_campus_access(institution_id, campus_id)
    )
  )
  WITH CHECK (
    is_platform_admin()
    OR (
      has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal', 'school_admin']::institution_role[])
      AND has_campus_access(institution_id, campus_id)
    )
  );

DROP POLICY IF EXISTS students_delete ON students;
CREATE POLICY students_delete ON students
  FOR DELETE
  USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
  );

-- Guardians
DROP POLICY IF EXISTS guardians_select ON guardians;
CREATE POLICY guardians_select ON guardians
  FOR SELECT
  USING (is_platform_admin() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS guardians_insert ON guardians;
CREATE POLICY guardians_insert ON guardians
  FOR INSERT
  WITH CHECK (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal', 'school_admin']::institution_role[])
  );

DROP POLICY IF EXISTS guardians_update ON guardians;
CREATE POLICY guardians_update ON guardians
  FOR UPDATE
  USING (
    is_platform_admin()
    OR user_id = auth.uid()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal', 'school_admin']::institution_role[])
  );

-- Student-Guardian Link Table
DROP POLICY IF EXISTS student_guardians_select ON student_guardians;
CREATE POLICY student_guardians_select ON student_guardians
  FOR SELECT
  USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_guardians.student_id
        AND has_institution_membership(s.institution_id)
    )
  );

DROP POLICY IF EXISTS student_guardians_manage ON student_guardians;
CREATE POLICY student_guardians_manage ON student_guardians
  FOR ALL
  USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_guardians.student_id
        AND has_institution_role(s.institution_id, ARRAY['institution_owner', 'institution_admin', 'principal', 'school_admin']::institution_role[])
    )
  );

-- ------------------------------------------------------------------------------
-- G. ACADEMIC HIERARCHY
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS academic_years_select ON academic_years;
CREATE POLICY academic_years_select ON academic_years FOR SELECT
  USING (is_platform_user() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS academic_years_manage ON academic_years;
CREATE POLICY academic_years_manage ON academic_years FOR ALL
  USING (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal']::institution_role[]));

DROP POLICY IF EXISTS academic_terms_select ON academic_terms;
CREATE POLICY academic_terms_select ON academic_terms FOR SELECT
  USING (is_platform_user() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS academic_terms_manage ON academic_terms;
CREATE POLICY academic_terms_manage ON academic_terms FOR ALL
  USING (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal']::institution_role[]));

DROP POLICY IF EXISTS academic_grades_select ON academic_grades;
CREATE POLICY academic_grades_select ON academic_grades FOR SELECT
  USING (is_platform_user() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS academic_grades_manage ON academic_grades;
CREATE POLICY academic_grades_manage ON academic_grades FOR ALL
  USING (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal']::institution_role[]));

DROP POLICY IF EXISTS academic_classes_select ON academic_classes;
CREATE POLICY academic_classes_select ON academic_classes FOR SELECT
  USING (is_platform_user() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS academic_classes_manage ON academic_classes;
CREATE POLICY academic_classes_manage ON academic_classes FOR ALL
  USING (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal', 'school_admin']::institution_role[]));

DROP POLICY IF EXISTS student_enrollments_select ON student_enrollments;
CREATE POLICY student_enrollments_select ON student_enrollments FOR SELECT
  USING (is_platform_user() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS student_enrollments_manage ON student_enrollments;
CREATE POLICY student_enrollments_manage ON student_enrollments FOR ALL
  USING (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal', 'school_admin']::institution_role[]));

-- ------------------------------------------------------------------------------
-- H. HUMAN RESOURCES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS hr_departments_select ON hr_departments;
CREATE POLICY hr_departments_select ON hr_departments FOR SELECT
  USING (is_platform_user() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS hr_departments_manage ON hr_departments;
CREATE POLICY hr_departments_manage ON hr_departments FOR ALL
  USING (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal', 'hr_manager']::institution_role[]));

DROP POLICY IF EXISTS hr_staff_select ON hr_staff;
CREATE POLICY hr_staff_select ON hr_staff FOR SELECT
  USING (is_platform_user() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS hr_staff_manage ON hr_staff;
CREATE POLICY hr_staff_manage ON hr_staff FOR ALL
  USING (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'hr_manager']::institution_role[]));

-- ------------------------------------------------------------------------------
-- I. FINANCE
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS finance_fee_structures_select ON finance_fee_structures;
CREATE POLICY finance_fee_structures_select ON finance_fee_structures FOR SELECT
  USING (is_platform_user() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS finance_fee_structures_manage ON finance_fee_structures;
CREATE POLICY finance_fee_structures_manage ON finance_fee_structures FOR ALL
  USING (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'accountant']::institution_role[]));

DROP POLICY IF EXISTS finance_invoices_select ON finance_invoices;
CREATE POLICY finance_invoices_select ON finance_invoices FOR SELECT
  USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'principal', 'accountant']::institution_role[])
    OR EXISTS (
      SELECT 1 FROM student_guardians sg
      JOIN guardians g ON g.id = sg.guardian_id
      WHERE sg.student_id = finance_invoices.student_id
        AND g.user_id = auth.uid()
        AND sg.receives_billing = true
    )
  );

DROP POLICY IF EXISTS finance_invoices_insert ON finance_invoices;
CREATE POLICY finance_invoices_insert ON finance_invoices FOR INSERT
  WITH CHECK (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'accountant']::institution_role[]));

DROP POLICY IF EXISTS finance_invoices_update ON finance_invoices;
CREATE POLICY finance_invoices_update ON finance_invoices FOR UPDATE
  USING (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'accountant']::institution_role[]))
  WITH CHECK (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'accountant']::institution_role[]));

DROP POLICY IF EXISTS finance_invoices_delete ON finance_invoices;
CREATE POLICY finance_invoices_delete ON finance_invoices FOR DELETE
  USING (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner']::institution_role[]));

DROP POLICY IF EXISTS finance_payments_select ON finance_payments;
CREATE POLICY finance_payments_select ON finance_payments FOR SELECT
  USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'accountant']::institution_role[])
  );

DROP POLICY IF EXISTS finance_payments_insert ON finance_payments;
CREATE POLICY finance_payments_insert ON finance_payments FOR INSERT
  WITH CHECK (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin', 'accountant']::institution_role[])
  );

-- ------------------------------------------------------------------------------
-- J. GLOBAL CATALOGS & PACKAGES (Reference & Public)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS modules_select ON modules;
CREATE POLICY modules_select ON modules FOR SELECT USING (true);

DROP POLICY IF EXISTS modules_admin_manage ON modules;
CREATE POLICY modules_admin_manage ON modules FOR ALL USING (is_platform_admin());

DROP POLICY IF EXISTS packages_select ON packages;
CREATE POLICY packages_select ON packages FOR SELECT USING (true);

DROP POLICY IF EXISTS packages_admin_manage ON packages;
CREATE POLICY packages_admin_manage ON packages FOR ALL USING (is_platform_admin());

DROP POLICY IF EXISTS platform_websites_select ON platform_websites;
CREATE POLICY platform_websites_select ON platform_websites FOR SELECT USING (true);

DROP POLICY IF EXISTS platform_websites_admin_manage ON platform_websites;
CREATE POLICY platform_websites_admin_manage ON platform_websites FOR ALL USING (is_platform_admin());

DROP POLICY IF EXISTS subscriptions_select ON subscriptions;
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT
  USING (is_platform_user() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS subscriptions_admin_manage ON subscriptions;
CREATE POLICY subscriptions_admin_manage ON subscriptions FOR ALL
  USING (is_platform_admin());

DROP POLICY IF EXISTS subscription_addons_select ON subscription_addons;
CREATE POLICY subscription_addons_select ON subscription_addons FOR SELECT
  USING (
    is_platform_user()
    OR EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_addons.subscription_id
        AND has_institution_membership(s.institution_id)
    )
  );

DROP POLICY IF EXISTS subscription_addons_admin_manage ON subscription_addons;
CREATE POLICY subscription_addons_admin_manage ON subscription_addons FOR ALL
  USING (is_platform_admin());

DROP POLICY IF EXISTS institution_modules_select ON institution_modules;
CREATE POLICY institution_modules_select ON institution_modules FOR SELECT
  USING (is_platform_user() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS institution_modules_manage ON institution_modules;
DROP POLICY IF EXISTS institution_modules_admin_all ON institution_modules;
CREATE POLICY institution_modules_admin_all ON institution_modules FOR ALL
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Institution Owners & Admins can INSERT a module ONLY IF the institution has verified entitlement (or disabled state)
DROP POLICY IF EXISTS institution_modules_insert ON institution_modules;
CREATE POLICY institution_modules_insert ON institution_modules FOR INSERT
  WITH CHECK (
    (
      is_platform_admin()
      OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
    )
    AND (
      is_enabled = false
      OR institution_has_module_entitlement(institution_id, module_code)
    )
  );

-- Institution Owners & Admins can UPDATE module status ONLY IF the institution has verified entitlement (or disabling)
DROP POLICY IF EXISTS institution_modules_update ON institution_modules;
CREATE POLICY institution_modules_update ON institution_modules FOR UPDATE
  USING (
    is_platform_admin()
    OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
  )
  WITH CHECK (
    (
      is_platform_admin()
      OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
    )
    AND (
      is_enabled = false
      OR institution_has_module_entitlement(institution_id, module_code)
    )
  );

-- Institution Owners & Admins can DELETE an institution_module row to revert to default state
DROP POLICY IF EXISTS institution_modules_delete ON institution_modules;
CREATE POLICY institution_modules_delete ON institution_modules FOR DELETE
  USING (
    has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
  );

DROP POLICY IF EXISTS institution_websites_select ON institution_websites;
CREATE POLICY institution_websites_select ON institution_websites FOR SELECT
  USING (is_published = true OR is_platform_user() OR has_institution_membership(institution_id));

DROP POLICY IF EXISTS institution_websites_manage ON institution_websites;
CREATE POLICY institution_websites_manage ON institution_websites FOR ALL
  USING (is_platform_admin() OR has_institution_role(institution_id, ARRAY['institution_owner', 'institution_admin']::institution_role[]));

-- ------------------------------------------------------------------------------
-- K. AUDIT LOGGING & AI TELEMETRY (Append Only, No Deletions)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS audit_logs_select ON audit_logs;
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT
  USING (
    is_platform_admin()
    OR (
      tenant_id IS NOT NULL
      AND has_institution_role(tenant_id, ARRAY['institution_owner', 'institution_admin']::institution_role[])
    )
  );

DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT
  WITH CHECK (
    (actor_user_id = auth.uid() OR is_platform_admin())
    AND (tenant_id IS NULL OR has_institution_membership(tenant_id) OR is_platform_admin())
  );

DROP POLICY IF EXISTS ai_audit_events_select ON ai_audit_events;
CREATE POLICY ai_audit_events_select ON ai_audit_events FOR SELECT
  USING (is_platform_admin() OR has_institution_role(tenant_id, ARRAY['institution_owner', 'institution_admin']::institution_role[]));

DROP POLICY IF EXISTS ai_audit_events_insert ON ai_audit_events;
CREATE POLICY ai_audit_events_insert ON ai_audit_events FOR INSERT
  WITH CHECK (
    (actor_user_id = auth.uid() OR is_platform_admin())
    AND (tenant_id IS NULL OR has_institution_membership(tenant_id) OR is_platform_admin())
  );

-- ==============================================================================
-- 13. SEED CATALOG DATA (Core Modules & Platform Packages)
-- ==============================================================================

INSERT INTO modules (code, name, description, category, is_core, default_enabled, icon)
VALUES
  ('student_management', 'Student Information System', 'Student lifecycle management, longitudinal profiles, enrollments, and status tracking.', 'core', true, true, 'GraduationCap'),
  ('academics', 'Academic Curriculum & Classes', 'Grades, classes, streams, subject mapping, and academic hierarchy.', 'academics', true, true, 'BookOpen'),
  ('attendance', 'Attendance Management', 'Daily, session-based, and biometric attendance records with guardian notifications.', 'academics', false, true, 'CheckCircle2'),
  ('admissions', 'Online Admissions & Inquiries', 'Applicant portal, inquiry workflows, digital review, and admission conversion.', 'admissions', false, true, 'FileText'),
  ('fees_collection', 'Tuition & Fee Collection', 'Fee schedules, student invoice generation, receipts, and offline payment logging.', 'finance', false, true, 'DollarSign'),
  ('human_resources', 'HR & Faculty Management', 'Staff directory, department allocations, contracts, and role-based permissions.', 'operations', false, false, 'Users'),
  ('institution_website', 'School CMS & Public Website', 'Public-facing responsive website builder with customizable branding.', 'communication', false, true, 'Globe'),
  ('ai_intelligence', 'ACADEEMIA AI Analytics', 'Predictive academic risk alerts, attendance trends, and automated financial insights.', 'intelligence', false, false, 'Sparkles')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category;

INSERT INTO packages (name, slug, description, billing_cycle, price_cents, currency, included_modules, limits)
VALUES
  (
    'Essential Academy',
    'essential-academy',
    'Core Student Information System, Attendance, and Academic structure for independent schools.',
    'annual',
    29900,
    'USD',
    ARRAY['student_management', 'academics', 'attendance', 'institution_website'],
    '{"max_students": 400, "max_campuses": 1, "max_staff": 40, "storage_gb": 50}'::jsonb
  ),
  (
    'Omni-Campus Enterprise',
    'omni-campus-enterprise',
    'Complete multi-campus operational suite including Finance, HR, Website CMS, and AI Intelligence.',
    'annual',
    79900,
    'USD',
    ARRAY['student_management', 'academics', 'attendance', 'admissions', 'fees_collection', 'human_resources', 'institution_website', 'ai_intelligence'],
    '{"max_students": 2500, "max_campuses": 5, "max_staff": 250, "storage_gb": 500}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, price_cents = EXCLUDED.price_cents;
