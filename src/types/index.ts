// ==============================================================================
// ACADEEMIA 2.0 - Core TypeScript Type Definitions
// ==============================================================================

export type PlatformRole = 
  | 'platform_super_admin'
  | 'platform_admin' 
  | 'platform_finance'
  | 'platform_sales'
  | 'platform_support'
  | 'platform_customer_success'
  | 'platform_marketing'
  | 'platform_hr'
  | 'platform_operations'
  | 'platform_staff';

export interface PlatformMembership {
  id: string;
  user_id: string;
  role: PlatformRole;
  status: 'active' | 'suspended' | 'revoked';
  created_at: string;
}

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
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  capacity: number;
  status?: 'active' | 'inactive' | 'under_maintenance';
  principal_name?: string;
  timezone?: string;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  preferred_language?: string;
  timezone?: string;
  status?: 'active' | 'suspended';
  is_platform_user: boolean;
  platform_role?: PlatformRole;
  created_at: string;
  updated_at?: string;
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
  max_administrators?: number;
  ai_tokens_monthly?: number;
  max_monthly_messages?: number;
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
  status?: 'active' | 'upcoming' | 'archived';
  created_at?: string;
}

export interface AcademicTerm {
  id: string;
  institution_id: string;
  academic_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  sequence_order?: number;
  created_at?: string;
}

export interface AcademicGrade {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  sequence_order: number;
  education_level?: string;
  created_at?: string;
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
  stream?: string;
  created_at?: string;
  campus?: Campus;
  grade?: AcademicGrade;
  academic_year?: AcademicYear;
}

export interface Subject {
  id: string;
  institution_id: string;
  code: string;
  name: string;
  description?: string;
  education_level?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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
  campus?: Campus;
  current_class?: AcademicClass;
  enrollments?: StudentEnrollment[];
  student_guardians?: StudentGuardian[];
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
  academic_year?: AcademicYear;
  academic_class?: AcademicClass;
  campus?: Campus;
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

// ==============================================================================
// ADMISSIONS & APPLICANT MANAGEMENT DOMAIN (PHASE 4C)
// ==============================================================================

export type InquiryStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';

export type ApplicantStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'waitlisted'
  | 'rejected'
  | 'withdrawn'
  | 'converted';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'waitlisted'
  | 'rejected'
  | 'withdrawn'
  | 'converted';

export interface AdmissionInquiry {
  id: string;
  institution_id: string;
  campus_id?: string | null;
  academic_year_id?: string | null;
  interested_grade_id?: string | null;
  inquiry_number: string;
  prospective_student_name: string;
  prospective_student_date_of_birth?: string | null;
  guardian_name: string;
  guardian_email?: string | null;
  guardian_phone: string;
  source: string;
  notes?: string | null;
  status: InquiryStatus;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined relation metadata
  campus?: Campus;
  academic_year?: AcademicYear;
  interested_grade?: AcademicGrade;
}

export interface AdmissionApplicant {
  id: string;
  institution_id: string;
  campus_id?: string | null;
  applicant_number: string;
  inquiry_id?: string | null;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  preferred_name?: string | null;
  date_of_birth: string;
  gender?: string | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  previous_school?: string | null;
  notes?: string | null;
  status: ApplicantStatus;
  created_at: string;
  updated_at: string;
  // Joined relation metadata
  campus?: Campus;
  inquiry?: AdmissionInquiry;
  guardians?: AdmissionApplicantGuardian[];
  applications?: AdmissionApplication[];
}

export interface AdmissionApplicantGuardian {
  id: string;
  institution_id: string;
  applicant_id: string;
  guardian_id: string;
  relationship: string;
  is_primary: boolean;
  is_emergency_contact: boolean;
  can_pick_up: boolean;
  receives_billing_notifications: boolean;
  created_at: string;
  // Joined relation metadata
  guardian?: Guardian;
}

export interface AdmissionApplication {
  id: string;
  institution_id: string;
  applicant_id: string;
  academic_year_id: string;
  campus_id: string;
  grade_id: string;
  class_id?: string | null;
  application_number: string;
  application_date: string;
  status: ApplicationStatus;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  decision_at?: string | null;
  decided_by?: string | null;
  decision_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined relation metadata
  applicant?: AdmissionApplicant;
  academic_year?: AcademicYear;
  campus?: Campus;
  grade?: AcademicGrade;
  class?: AcademicClass;
}

export interface AdmissionConversion {
  id: string;
  institution_id: string;
  applicant_id: string;
  application_id: string;
  student_id: string;
  converted_at: string;
  converted_by?: string | null;
}

export interface DuplicateApplicantMatch {
  applicant_id: string;
  applicant_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  status: string;
  match_type: string;
}

export interface AdmissionStats {
  totalInquiries: number;
  newInquiries: number;
  totalApplicants: number;
  submittedApplications: number;
  underReviewApplications: number;
  acceptedApplications: number;
  waitlistedApplications: number;
  rejectedApplications: number;
  convertedStudents: number;
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
