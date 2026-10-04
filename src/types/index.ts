// ==============================================================================
// ACADEEMIA 2.0 - Core TypeScript Type Definitions
// ==============================================================================

export type PlatformRole = 
  | 'platform_admin' 
  | 'platform_staff' 
  | 'platform_support' 
  | 'platform_sales';

export type InstitutionRole =
  | 'institution_owner'
  | 'institution_admin'
  | 'principal'
  | 'school_admin'
  | 'teacher'
  | 'student'
  | 'parent_guardian'
  | 'accountant'
  | 'hr_manager'
  | 'librarian'
  | 'transport_manager'
  | 'hostel_manager'
  | 'receptionist'
  | 'custom_role';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';
export type StudentStatus = 'active' | 'admitted' | 'graduated' | 'transferred' | 'suspended' | 'withdrawn';
export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void' | 'overdue';

export interface TerminologyConfig {
  grade_label: string; // e.g. "Grade" or "Form" or "Year"
  class_label: string; // e.g. "Class" or "Stream" or "Section"
  term_label: string;  // e.g. "Term" or "Semester" or "Quarter"
  student_label: string; // e.g. "Student" or "Scholar"
  teacher_label: string; // e.g. "Teacher" or "Faculty" or "Lecturer"
}

export interface BrandingConfig {
  primary_color: string;
  accent_color: string;
  font_family: string;
  school_crest_url?: string;
  motto?: string;
}

export interface Institution {
  id: string;
  code: string;
  name: string;
  slug: string;
  logo_url?: string;
  banner_url?: string;
  custom_domain?: string;
  status: 'active' | 'pending_setup' | 'suspended' | 'archived';
  timezone: string;
  currency: string;
  terminology_config: TerminologyConfig;
  branding_config: BrandingConfig;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  created_at: string;
}

export interface Campus {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  is_main: boolean;
  address?: string;
  phone?: string;
  email?: string;
  capacity: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  is_platform_user: boolean;
  platform_role?: PlatformRole;
  created_at: string;
}

export interface InstitutionUser {
  id: string;
  institution_id: string;
  user_id: string;
  campus_id?: string; // null means all campuses
  role: InstitutionRole;
  custom_role_id?: string;
  custom_permissions: string[];
  is_active: boolean;
  created_at: string;
  user?: User;
}

export interface RoleDefinition {
  id: string;
  institution_id?: string;
  name: string;
  slug: string;
  description: string;
  is_system: boolean;
  permissions: string[];
}

export type ModuleCategory = 'core' | 'academic' | 'administrative' | 'finance' | 'communication' | 'intelligence';

export interface ModuleDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  category: ModuleCategory;
  is_core: boolean;
  default_enabled: boolean;
  icon: string;
  permissions_provided: string[];
}

export interface InstitutionModule {
  id: string;
  institution_id: string;
  module_code: string;
  is_enabled: boolean;
  settings?: Record<string, unknown>;
  enabled_at: string;
}

export interface PackageLimits {
  max_students: number;
  max_campuses: number;
  max_staff: number;
  storage_gb: number;
}

export interface Package {
  id: string;
  name: string;
  slug: string;
  description: string;
  billing_cycle: BillingCycle;
  price_cents: number;
  currency: string;
  included_modules: string[];
  limits: PackageLimits;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  institution_id: string;
  package_id: string;
  status: SubscriptionStatus;
  trial_ends_at?: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  package?: Package;
  addons: SubscriptionAddon[];
}

export interface SubscriptionAddon {
  id: string;
  subscription_id: string;
  module_code: string;
  price_cents: number;
  added_at: string;
}

// Academic Structures
export interface AcademicYear {
  id: string;
  institution_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface AcademicTerm {
  id: string;
  institution_id: string;
  academic_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface AcademicGrade {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  sequence_order: number;
}

export interface AcademicClass {
  id: string;
  institution_id: string;
  campus_id: string;
  grade_id: string;
  academic_year_id: string;
  name: string;
  code: string;
  capacity: number;
}

// Student & Guardian
export interface Student {
  id: string;
  institution_id: string;
  campus_id: string;
  student_number: string; // unique per institution
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender: string;
  date_of_birth?: string;
  admission_date: string;
  status: StudentStatus;
  current_class_id?: string;
  avatar_url?: string;
  blood_group?: string;
  allergies?: string;
  created_at: string;
}

export interface StudentEnrollment {
  id: string;
  institution_id: string;
  student_id: string;
  academic_year_id: string;
  class_id: string;
  enrolled_at: string;
  status: string;
  roll_number?: string;
}

export interface Guardian {
  id: string;
  institution_id: string;
  user_id?: string;
  full_name: string;
  relationship_type: 'mother' | 'father' | 'guardian' | 'sponsor' | string;
  email?: string;
  phone: string;
  occupation?: string;
  is_emergency_contact: boolean;
  address?: string;
}

export interface StudentGuardian {
  id: string;
  student_id: string;
  guardian_id: string;
  is_primary: boolean;
  can_pickup: boolean;
  receives_billing: boolean;
  guardian?: Guardian;
}

// HR & Staff
export interface HRDepartment {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  head_user_id?: string;
}

export interface HRStaff {
  id: string;
  institution_id: string;
  campus_id: string;
  user_id: string;
  employee_number: string;
  department_id?: string;
  job_title: string;
  hire_date: string;
  employment_type: 'full_time' | 'part_time' | 'contract';
  employment_status: 'active' | 'on_leave' | 'terminated';
  user?: User;
  department?: HRDepartment;
}

// Finance
export interface FeeStructure {
  id: string;
  institution_id: string;
  academic_year_id: string;
  name: string;
  code: string;
  amount_cents: number;
  currency: string;
  due_date?: string;
  applicable_grade_id?: string;
}

export interface FinanceInvoice {
  id: string;
  institution_id: string;
  student_id: string;
  fee_structure_id?: string;
  invoice_number: string;
  total_amount_cents: number;
  balance_cents: number;
  status: InvoiceStatus;
  due_date: string;
  issued_at: string;
  student?: Student;
}

export interface FinancePayment {
  id: string;
  institution_id: string;
  invoice_id: string;
  amount_cents: number;
  payment_method: string;
  transaction_reference: string;
  notes?: string;
  paid_at: string;
}

// Websites & CMS
export interface PlatformWebsiteConfig {
  id: string;
  domain: string;
  hero_title: string;
  hero_subtitle: string;
  featured_modules: string[];
  pricing_plans: Array<{
    name: string;
    price: string;
    cadence: string;
    features: string[];
  }>;
  blog_articles: Array<{
    title: string;
    slug: string;
    date: string;
    summary: string;
  }>;
  is_live: boolean;
  updated_at: string;
}

export interface InstitutionWebsiteConfig {
  id: string;
  institution_id: string;
  site_title: string;
  tagline: string;
  hero_heading: string;
  hero_subheading: string;
  banner_image_url?: string;
  is_published: boolean;
  custom_domain?: string;
  theme_config: {
    primary_color: string;
    accent_color: string;
    layout: string;
  };
  nav_items: Array<{
    label: string;
    path: string;
  }>;
  pages: Array<{
    title: string;
    slug: string;
    content: string;
  }>;
  updated_at: string;
}

// Audit & AI
export interface AuditLogEntry {
  id: string;
  tenant_id?: string;
  actor_user_id?: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface AIInsight {
  id: string;
  category: 'academic' | 'retention' | 'financial' | 'operational';
  title: string;
  summary: string;
  metric?: string;
  severity: 'low' | 'medium' | 'high' | 'info';
  actionable_recommendation: string;
  confidence_score: number;
  generated_at: string;
}
