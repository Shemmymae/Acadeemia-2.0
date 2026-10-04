-- ==============================================================================
-- ACADEEMIA 2.0 - Core Multi-Tenant Database Schema (PostgreSQL / Supabase)
-- ==============================================================================
-- This schema establishes the production-grade foundation for:
-- 1. ACADEEMIA Platform & Multi-Tenancy (Institutions & Campuses)
-- 2. Role-Based Access Control (RBAC) & Custom Permissions
-- 3. Dynamic Module Registry & Subscriptions / Add-ons
-- 4. Academic Structure (Years, Terms, Grades, Classes)
-- 5. Student Identity, History, and Parent/Guardian Relationships
-- 6. Modular Human Resources & Modular Finance
-- 7. Dual CMS (ACADEEMIA Public Website & Institution Websites)
-- 8. Row Level Security (RLS) & Audit Logging
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
CREATE TYPE platform_role AS ENUM (
  'platform_admin',
  'platform_staff',
  'platform_support',
  'platform_sales'
);

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

CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete'
);

CREATE TYPE billing_cycle AS ENUM (
  'monthly',
  'quarterly',
  'annual'
);

CREATE TYPE module_status AS ENUM (
  'active',
  'inactive',
  'beta',
  'deprecated'
);

CREATE TYPE student_status AS ENUM (
  'active',
  'admitted',
  'graduated',
  'transferred',
  'suspended',
  'withdrawn'
);

CREATE TYPE invoice_status AS ENUM (
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'void',
  'overdue'
);

-- 3. PLATFORM & TENANCY TABLES

-- Institutions (Tenants)
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'STJUDE-01'
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
CREATE TABLE campuses (
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

-- Users (Unified Authenticated Person)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(50),
  is_platform_user BOOLEAN DEFAULT false,
  platform_role platform_role,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Institution Roles & Custom Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE, -- NULL means global system role template
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, slug)
);

-- Institution User Memberships (Many-to-Many with multi-campus scope)
CREATE TABLE institution_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL, -- NULL means all campuses
  role institution_role NOT NULL,
  custom_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  custom_permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, user_id)
);

-- 4. MODULE REGISTRY & SUBSCRIPTIONS

-- Module Registry (Catalog of all modular platform features)
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- 'core', 'academic', 'administrative', 'finance', 'communication', 'intelligence'
  is_core BOOLEAN DEFAULT false,
  default_enabled BOOLEAN DEFAULT true,
  icon VARCHAR(100) DEFAULT 'Layers',
  permissions_provided TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Institution Module Configuration (Enabled/Disabled per Institution)
CREATE TABLE institution_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  module_code VARCHAR(100) NOT NULL REFERENCES modules(code) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, module_code)
);

-- Packages (Base tiers)
CREATE TABLE packages (
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

-- Subscriptions
CREATE TABLE subscriptions (
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

-- Subscription Add-Ons
CREATE TABLE subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  module_code VARCHAR(100) NOT NULL REFERENCES modules(code) ON DELETE CASCADE,
  price_cents INT NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id, module_code)
);

-- 5. ACADEMIC STRUCTURE

CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g. '2026-2027 Academic Year'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE academic_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g. 'Term 1 / Fall Semester'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE academic_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g. 'Grade 10' or 'Form 4'
  code VARCHAR(50) NOT NULL,
  sequence_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, code)
);

CREATE TABLE academic_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  grade_id UUID NOT NULL REFERENCES academic_grades(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g. 'Grade 10 - Alpha Stream'
  code VARCHAR(50) NOT NULL,
  capacity INT DEFAULT 35,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, academic_year_id, code)
);

-- 6. STUDENT IDENTITY & GUARDIANS

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE RESTRICT,
  student_number VARCHAR(100) NOT NULL, -- Unique strictly within institution!
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

CREATE TABLE student_enrollments (
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

CREATE TABLE guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  relationship_type VARCHAR(50) NOT NULL, -- 'mother', 'father', 'guardian', 'sponsor'
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  occupation VARCHAR(100),
  is_emergency_contact BOOLEAN DEFAULT true,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-Many Student-to-Guardian
CREATE TABLE student_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  can_pickup BOOLEAN DEFAULT true,
  receives_billing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, guardian_id)
);

-- 7. HUMAN RESOURCES (MODULAR)

CREATE TABLE hr_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  head_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, code)
);

CREATE TABLE hr_staff (
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

-- 8. FINANCE (MODULAR)

CREATE TABLE finance_fee_structures (
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

CREATE TABLE finance_invoices (
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

CREATE TABLE finance_payments (
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

-- 9. DUAL WEBSITES (ACADEEMIA Public & Institution Sites)

CREATE TABLE platform_websites (
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

CREATE TABLE institution_websites (
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

-- 10. AUDIT LOGGING & AI TELEMETRY

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES institutions(id) ON DELETE CASCADE, -- NULL for ACADEEMIA platform level actions
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_audit_events (
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
-- 11. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Helper Functions to identify caller's tenant and platform administrator status
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'institution_id', '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'is_platform_admin')::BOOLEAN,
    false
  );
$$ LANGUAGE SQL STABLE;

-- Enable RLS on all tenant-isolated tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE institution_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_events ENABLE ROW LEVEL SECURITY;

-- Sample Tenant Policies for Institutions
CREATE POLICY tenant_isolation_institutions ON institutions
  FOR ALL
  USING (
    is_platform_admin() OR id = get_current_tenant_id()
  );

-- Sample Tenant Policies for Campuses
CREATE POLICY tenant_isolation_campuses ON campuses
  FOR ALL
  USING (
    is_platform_admin() OR institution_id = get_current_tenant_id()
  );

-- Sample Tenant Policies for Students
CREATE POLICY tenant_isolation_students ON students
  FOR ALL
  USING (
    is_platform_admin() OR institution_id = get_current_tenant_id()
  );

-- Sample Tenant Policies for Finance Invoices
CREATE POLICY tenant_isolation_finance ON finance_invoices
  FOR ALL
  USING (
    is_platform_admin() OR institution_id = get_current_tenant_id()
  );

-- Sample Tenant Policies for Audit Logs
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  FOR ALL
  USING (
    is_platform_admin() OR tenant_id = get_current_tenant_id()
  );
