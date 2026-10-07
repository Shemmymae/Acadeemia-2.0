// ==============================================================================
// ACADEEMIA 2.0 - Multi-Tenant Relational Data Layer (In-Memory Development Adapter)
// ==============================================================================
// In production, PostgreSQL via Supabase is authoritative with Row-Level Security.
// This module provides in-memory fallback data for offline development only.
// ZERO localStorage persistence. ZERO non-UUID mock identifiers.
// ==============================================================================

import {
  AcademicClass,
  AcademicGrade,
  AcademicTerm,
  AcademicYear,
  AuditLogEntry,
  Campus,
  FeeStructure,
  FinanceInvoice,
  FinancePayment,
  Guardian,
  HRDepartment,
  HRStaff,
  Institution,
  InstitutionModule,
  InstitutionUser,
  Package,
  PlatformWebsiteConfig,
  InstitutionWebsiteConfig,
  Student,
  StudentEnrollment,
  StudentGuardian,
  Subscription,
  User,
  AIInsight,
} from '../types';
import { SYSTEM_MODULES } from './moduleRegistry';

/**
 * Standard RFC 4122 v4 UUID Generator with reliable fallback
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Canonical RFC 4122 v4 UUIDs for all seeded platform entities.
 * Fully compatible with PostgreSQL `UUID` primary and foreign key constraints.
 */
export const SEED_UUIDS = {
  // Users
  USER_PLATFORM_ADMIN: '44444444-4444-4444-8444-444444444401',
  USER_INSTITUTION_OWNER: '44444444-4444-4444-8444-444444444402',
  USER_TEACHER_SARAH: '44444444-4444-4444-8444-444444444403',
  USER_ACCOUNTANT_MARCUS: '44444444-4444-4444-8444-444444444404',
  USER_PARENT_HELENA: '44444444-4444-4444-8444-444444444405',

  // Institutions
  INST_ST_JUDE: '11111111-1111-4111-8111-111111111111',
  INST_NOVA_STEM: '22222222-2222-4222-8222-222222222222',

  // Campuses
  CAMP_ST_JUDE_MAIN: '33333333-3333-4333-8333-333333333301',
  CAMP_ST_JUDE_CITY: '33333333-3333-4333-8333-333333333302',
  CAMP_NOVA_MAIN: '33333333-3333-4333-8333-333333333303',

  // Packages
  PKG_FOUNDATION: '55555555-5555-4555-8555-555555555501',
  PKG_ENTERPRISE: '55555555-5555-4555-8555-555555555502',

  // Subscriptions
  SUB_ST_JUDE: '66666666-6666-4666-8666-666666666601',
  SUB_NOVA_STEM: '66666666-6666-4666-8666-666666666602',
  ADDON_ONLINE_EXAM: '66666666-6666-4666-8666-666666666603',

  // Academic Structure
  AY_2026_2027: '77777777-7777-4777-8777-777777777701',
  TERM_FALL_2026: '77777777-7777-4777-8777-777777777711',
  TERM_WINTER_2027: '77777777-7777-4777-8777-777777777712',
  GR_09: '77777777-7777-4777-8777-777777777721',
  GR_10: '77777777-7777-4777-8777-777777777722',
  GR_11: '77777777-7777-4777-8777-777777777723',
  GR_12: '77777777-7777-4777-8777-777777777724',
  CLS_G10_ALPHA: '77777777-7777-4777-8777-777777777731',
  CLS_G10_BETA: '77777777-7777-4777-8777-777777777732',
  CLS_G11_PREP: '77777777-7777-4777-8777-777777777733',

  // Students
  STU_001: '88888888-8888-4888-8888-888888888801',
  STU_002: '88888888-8888-4888-8888-888888888802',
  STU_003: '88888888-8888-4888-8888-888888888803',
  STU_004: '88888888-8888-4888-8888-888888888804',

  // Guardians
  GRD_01: '99999999-9999-4999-8999-999999999901',
  GRD_02: '99999999-9999-4999-8999-999999999902',
  SG_01: '99999999-9999-4999-8999-999999999911',
  SG_02: '99999999-9999-4999-8999-999999999912',
  SG_03: '99999999-9999-4999-8999-999999999913',

  // HR Departments
  DEPT_SCI: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
  DEPT_HUM: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02',
  DEPT_ADM: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03',
  DEPT_FIN: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04',

  // HR Staff
  STAFF_01: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01',
  STAFF_02: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb02',
  STAFF_03: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb03',

  // Finance Fee Structures & Invoices
  FS_ANNUAL_TUITION: 'cccccccc-cccc-4ccc-8ccc-cccccccccc01',
  FS_STEM_LAB: 'cccccccc-cccc-4ccc-8ccc-cccccccccc02',
  INV_1001: 'dddddddd-dddd-4ddd-8ddd-dddddddddd01',
  INV_1002: 'dddddddd-dddd-4ddd-8ddd-dddddddddd02',
  INV_1003: 'dddddddd-dddd-4ddd-8ddd-dddddddddd03',
  PAY_01: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01',
  PAY_02: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02',

  // Websites
  PLATFORM_WEBSITE: 'ffffffff-ffff-4fff-8fff-ffffffffff01',
  SITE_ST_JUDE: 'ffffffff-ffff-4fff-8fff-ffffffffff02',
};

// Initial platform & multi-tenant seed data using valid RFC 4122 v4 UUIDs
const SEED_USERS: User[] = [
  {
    id: SEED_UUIDS.USER_PLATFORM_ADMIN,
    email: 'admin@acadeemia.com',
    full_name: 'Dr. Evelyn Vance',
    avatar_url: '/src/assets/images/avatar_platform_admin_1791120629483.jpg',
    is_platform_user: true,
    platform_role: 'platform_admin',
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: SEED_UUIDS.USER_INSTITUTION_OWNER,
    email: 'principal@stjude.edu',
    full_name: 'Prof. Arthur Sterling',
    avatar_url: '/src/assets/images/avatar_institution_dean_1791120642544.jpg',
    is_platform_user: false,
    created_at: '2026-01-15T09:00:00Z',
  },
  {
    id: SEED_UUIDS.USER_TEACHER_SARAH,
    email: 'sarah.connor@stjude.edu',
    full_name: 'Sarah Connor, M.Ed.',
    is_platform_user: false,
    created_at: '2026-02-01T10:00:00Z',
  },
  {
    id: SEED_UUIDS.USER_ACCOUNTANT_MARCUS,
    email: 'bursar@stjude.edu',
    full_name: 'Marcus Holloway, CPA',
    is_platform_user: false,
    created_at: '2026-02-05T11:00:00Z',
  },
  {
    id: SEED_UUIDS.USER_PARENT_HELENA,
    email: 'helena.morales@family.net',
    full_name: 'Helena Morales',
    phone: '+1 (555) 234-8891',
    is_platform_user: false,
    created_at: '2026-02-10T14:00:00Z',
  },
];

const SEED_INSTITUTIONS: Institution[] = [
  {
    id: SEED_UUIDS.INST_ST_JUDE,
    code: 'STJUDE-01',
    name: 'St. Jude International Academy',
    slug: 'st-jude-academy',
    logo_url: '',
    banner_url: '/src/assets/images/hero_institution_campus_1791120653291.jpg',
    custom_domain: 'portal.stjudeacademy.edu',
    status: 'active',
    timezone: 'America/New_York',
    currency: 'USD',
    terminology_config: {
      grade_label: 'Grade',
      class_label: 'Class Stream',
      term_label: 'Trimester',
      student_label: 'Scholar',
      teacher_label: 'Faculty',
    },
    branding_config: {
      primary_color: '#4f46e5',
      accent_color: '#06b6d4',
      font_family: 'Plus Jakarta Sans',
      motto: 'Excellence in Inquiry, Character in Action',
    },
    contact_email: 'admissions@stjudeacademy.edu',
    contact_phone: '+1 (555) 890-4400',
    address: '742 Cambridge Boulevard, Boston, MA 02138',
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: SEED_UUIDS.INST_NOVA_STEM,
    code: 'NOVA-STEM',
    name: 'Nova Horizon STEM Institute',
    slug: 'nova-horizon-stem',
    custom_domain: 'campus.novahorizon.edu',
    status: 'active',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    terminology_config: {
      grade_label: 'Form',
      class_label: 'Cohort',
      term_label: 'Semester',
      student_label: 'Researcher',
      teacher_label: 'Instructor',
    },
    branding_config: {
      primary_color: '#0284c7',
      accent_color: '#10b981',
      font_family: 'Plus Jakarta Sans',
      motto: 'Advancing Science, Engineering the Future',
    },
    contact_email: 'contact@novahorizon.edu',
    contact_phone: '+1 (415) 880-9200',
    address: '100 Innovation Way, Silicon Valley, CA 94025',
    created_at: '2026-02-01T00:00:00Z',
  },
];

const SEED_CAMPUSES: Campus[] = [
  {
    id: SEED_UUIDS.CAMP_ST_JUDE_MAIN,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    name: 'North Campus (Secondary & Senior Academy)',
    code: 'MAIN-01',
    is_main: true,
    address: '742 Cambridge Boulevard, Boston, MA',
    phone: '+1 (555) 890-4400',
    capacity: 1200,
  },
  {
    id: SEED_UUIDS.CAMP_ST_JUDE_CITY,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    name: 'Downtown Preparatory Campus',
    code: 'CITY-02',
    is_main: false,
    address: '45 Commonwealth Ave, Boston, MA',
    phone: '+1 (555) 890-4455',
    capacity: 650,
  },
  {
    id: SEED_UUIDS.CAMP_NOVA_MAIN,
    institution_id: SEED_UUIDS.INST_NOVA_STEM,
    name: 'Discovery Campus',
    code: 'NOVA-MAIN',
    is_main: true,
    address: '100 Innovation Way, Silicon Valley, CA',
    capacity: 800,
  },
];

const SEED_PACKAGES: Package[] = [
  {
    id: SEED_UUIDS.PKG_FOUNDATION,
    name: 'Essential Academy',
    slug: 'essential-academy',
    description: 'Core Student Information System, Attendance, and Academic structure for independent schools.',
    billing_cycle: 'annual',
    price_cents: 29900,
    currency: 'USD',
    included_modules: ['student_management', 'academics', 'attendance', 'events_calendar', 'communication'],
    limits: {
      max_students: 400,
      max_campuses: 1,
      max_staff: 40,
      storage_gb: 50,
    },
    is_active: true,
  },
  {
    id: SEED_UUIDS.PKG_ENTERPRISE,
    name: 'Omni-Campus Enterprise',
    slug: 'omni-campus-enterprise',
    description: 'Complete multi-campus operational suite including Finance, HR, Website CMS, and AI Intelligence.',
    billing_cycle: 'annual',
    price_cents: 79900,
    currency: 'USD',
    included_modules: [
      'student_management',
      'admissions',
      'academics',
      'attendance',
      'examinations',
      'timetable',
      'homework',
      'fees_collection',
      'student_accounting',
      'human_resources',
      'communication',
      'events_calendar',
      'institution_website',
      'ai_intelligence',
    ],
    limits: {
      max_students: 2500,
      max_campuses: 5,
      max_staff: 250,
      storage_gb: 500,
    },
    is_active: true,
  },
];

const SEED_SUBSCRIPTIONS: Subscription[] = [
  {
    id: SEED_UUIDS.SUB_ST_JUDE,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    package_id: SEED_UUIDS.PKG_ENTERPRISE,
    status: 'active',
    current_period_start: '2026-01-01T00:00:00Z',
    current_period_end: '2027-01-01T00:00:00Z',
    cancel_at_period_end: false,
    addons: [
      {
        id: SEED_UUIDS.ADDON_ONLINE_EXAM,
        subscription_id: SEED_UUIDS.SUB_ST_JUDE,
        module_code: 'online_exam',
        price_cents: 9900,
        added_at: '2026-01-15T00:00:00Z',
      },
    ],
  },
  {
    id: SEED_UUIDS.SUB_NOVA_STEM,
    institution_id: SEED_UUIDS.INST_NOVA_STEM,
    package_id: SEED_UUIDS.PKG_FOUNDATION,
    status: 'trialing',
    trial_ends_at: '2026-11-15T00:00:00Z',
    current_period_start: '2026-10-01T00:00:00Z',
    current_period_end: '2026-11-15T00:00:00Z',
    cancel_at_period_end: false,
    addons: [],
  },
];

const SEED_INSTITUTION_MODULES: InstitutionModule[] = SYSTEM_MODULES.map((mod) => ({
  id: generateUUID(),
  institution_id: SEED_UUIDS.INST_ST_JUDE,
  module_code: mod.code,
  is_enabled:
    mod.default_enabled ||
    ['online_exam', 'human_resources', 'ai_intelligence', 'institution_website', 'fees_collection'].includes(mod.code),
  enabled_at: '2026-01-10T00:00:00Z',
}));

const SEED_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: SEED_UUIDS.AY_2026_2027,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    name: '2026 - 2027 Academic Year',
    start_date: '2026-09-01',
    end_date: '2027-06-30',
    is_current: true,
  },
];

const SEED_ACADEMIC_TERMS: AcademicTerm[] = [
  {
    id: SEED_UUIDS.TERM_FALL_2026,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    academic_year_id: SEED_UUIDS.AY_2026_2027,
    name: 'Autumn Trimester 2026',
    start_date: '2026-09-01',
    end_date: '2026-12-18',
    is_current: true,
  },
  {
    id: SEED_UUIDS.TERM_WINTER_2027,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    academic_year_id: SEED_UUIDS.AY_2026_2027,
    name: 'Winter Trimester 2027',
    start_date: '2027-01-08',
    end_date: '2027-03-26',
    is_current: false,
  },
];

const SEED_ACADEMIC_GRADES: AcademicGrade[] = [
  { id: SEED_UUIDS.GR_09, institution_id: SEED_UUIDS.INST_ST_JUDE, name: 'Grade 9', code: 'G9', sequence_order: 1 },
  { id: SEED_UUIDS.GR_10, institution_id: SEED_UUIDS.INST_ST_JUDE, name: 'Grade 10', code: 'G10', sequence_order: 2 },
  { id: SEED_UUIDS.GR_11, institution_id: SEED_UUIDS.INST_ST_JUDE, name: 'Grade 11', code: 'G11', sequence_order: 3 },
  { id: SEED_UUIDS.GR_12, institution_id: SEED_UUIDS.INST_ST_JUDE, name: 'Grade 12', code: 'G12', sequence_order: 4 },
];

const SEED_ACADEMIC_CLASSES: AcademicClass[] = [
  {
    id: SEED_UUIDS.CLS_G10_ALPHA,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    campus_id: SEED_UUIDS.CAMP_ST_JUDE_MAIN,
    grade_id: SEED_UUIDS.GR_10,
    academic_year_id: SEED_UUIDS.AY_2026_2027,
    name: 'Grade 10 - Alpha (Accelerated STEM)',
    code: '10-A',
    capacity: 28,
  },
  {
    id: SEED_UUIDS.CLS_G10_BETA,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    campus_id: SEED_UUIDS.CAMP_ST_JUDE_MAIN,
    grade_id: SEED_UUIDS.GR_10,
    academic_year_id: SEED_UUIDS.AY_2026_2027,
    name: 'Grade 10 - Beta (Humanities & Arts)',
    code: '10-B',
    capacity: 30,
  },
  {
    id: SEED_UUIDS.CLS_G11_PREP,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    campus_id: SEED_UUIDS.CAMP_ST_JUDE_CITY,
    grade_id: SEED_UUIDS.GR_11,
    academic_year_id: SEED_UUIDS.AY_2026_2027,
    name: 'Grade 11 - City Honors Seminar',
    code: '11-HON',
    capacity: 25,
  },
];

const SEED_STUDENTS: Student[] = [
  {
    id: SEED_UUIDS.STU_001,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    campus_id: SEED_UUIDS.CAMP_ST_JUDE_MAIN,
    student_number: 'STJ-2026-0042',
    first_name: 'Mateo',
    last_name: 'Morales',
    gender: 'Male',
    date_of_birth: '2010-04-14',
    admission_date: '2024-09-01',
    status: 'active',
    current_class_id: SEED_UUIDS.CLS_G10_ALPHA,
    blood_group: 'O+',
    allergies: 'Tree nuts (EpiPen kept with nurse)',
    created_at: '2024-09-01T00:00:00Z',
  },
  {
    id: SEED_UUIDS.STU_002,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    campus_id: SEED_UUIDS.CAMP_ST_JUDE_MAIN,
    student_number: 'STJ-2026-0043',
    first_name: 'Sofia',
    last_name: 'Morales',
    gender: 'Female',
    date_of_birth: '2012-08-21',
    admission_date: '2025-09-01',
    status: 'active',
    current_class_id: SEED_UUIDS.CLS_G10_BETA,
    blood_group: 'O+',
    created_at: '2025-09-01T00:00:00Z',
  },
  {
    id: SEED_UUIDS.STU_003,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    campus_id: SEED_UUIDS.CAMP_ST_JUDE_CITY,
    student_number: 'STJ-2026-0089',
    first_name: 'Julian',
    last_name: 'Kassab',
    gender: 'Male',
    date_of_birth: '2009-11-03',
    admission_date: '2023-09-01',
    status: 'active',
    current_class_id: SEED_UUIDS.CLS_G11_PREP,
    blood_group: 'A+',
    created_at: '2023-09-01T00:00:00Z',
  },
  {
    id: SEED_UUIDS.STU_004,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    campus_id: SEED_UUIDS.CAMP_ST_JUDE_MAIN,
    student_number: 'STJ-2026-0112',
    first_name: 'Amara',
    last_name: 'Okonkwo',
    gender: 'Female',
    date_of_birth: '2010-02-18',
    admission_date: '2024-09-01',
    status: 'active',
    current_class_id: SEED_UUIDS.CLS_G10_ALPHA,
    blood_group: 'B+',
    created_at: '2024-09-01T00:00:00Z',
  },
];

const SEED_GUARDIANS: Guardian[] = [
  {
    id: SEED_UUIDS.GRD_01,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    user_id: SEED_UUIDS.USER_PARENT_HELENA,
    full_name: 'Helena Morales',
    relationship_type: 'mother',
    email: 'helena.morales@family.net',
    phone: '+1 (555) 234-8891',
    occupation: 'Senior Research Scientist',
    is_emergency_contact: true,
    address: '14 Beacon Crest Way, Boston, MA',
  },
  {
    id: SEED_UUIDS.GRD_02,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    full_name: 'David Morales',
    relationship_type: 'father',
    email: 'david.morales@architects.org',
    phone: '+1 (555) 234-8892',
    occupation: 'Civil Architect',
    is_emergency_contact: true,
    address: '14 Beacon Crest Way, Boston, MA',
  },
];

const SEED_STUDENT_GUARDIANS: StudentGuardian[] = [
  {
    id: SEED_UUIDS.SG_01,
    student_id: SEED_UUIDS.STU_001,
    guardian_id: SEED_UUIDS.GRD_01,
    is_primary: true,
    can_pickup: true,
    receives_billing: true,
  },
  {
    id: SEED_UUIDS.SG_02,
    student_id: SEED_UUIDS.STU_001,
    guardian_id: SEED_UUIDS.GRD_02,
    is_primary: false,
    can_pickup: true,
    receives_billing: false,
  },
  {
    id: SEED_UUIDS.SG_03,
    student_id: SEED_UUIDS.STU_002,
    guardian_id: SEED_UUIDS.GRD_01,
    is_primary: true,
    can_pickup: true,
    receives_billing: true,
  },
];

const SEED_HR_DEPARTMENTS: HRDepartment[] = [
  { id: SEED_UUIDS.DEPT_SCI, institution_id: SEED_UUIDS.INST_ST_JUDE, name: 'Physical & Natural Sciences', code: 'SCI' },
  { id: SEED_UUIDS.DEPT_HUM, institution_id: SEED_UUIDS.INST_ST_JUDE, name: 'Humanities & World Languages', code: 'HUM' },
  { id: SEED_UUIDS.DEPT_ADM, institution_id: SEED_UUIDS.INST_ST_JUDE, name: 'School Administration & Admissions', code: 'ADM' },
  { id: SEED_UUIDS.DEPT_FIN, institution_id: SEED_UUIDS.INST_ST_JUDE, name: 'Bursary & Financial Services', code: 'FIN' },
];

const SEED_HR_STAFF: HRStaff[] = [
  {
    id: SEED_UUIDS.STAFF_01,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    campus_id: SEED_UUIDS.CAMP_ST_JUDE_MAIN,
    user_id: SEED_UUIDS.USER_INSTITUTION_OWNER,
    employee_number: 'EMP-001',
    department_id: SEED_UUIDS.DEPT_ADM,
    job_title: 'Head of School & Executive Dean',
    hire_date: '2020-08-01',
    employment_type: 'full_time',
    employment_status: 'active',
  },
  {
    id: SEED_UUIDS.STAFF_02,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    campus_id: SEED_UUIDS.CAMP_ST_JUDE_MAIN,
    user_id: SEED_UUIDS.USER_TEACHER_SARAH,
    employee_number: 'EMP-014',
    department_id: SEED_UUIDS.DEPT_SCI,
    job_title: 'Lead Advanced Physics & Robotics Faculty',
    hire_date: '2022-09-01',
    employment_type: 'full_time',
    employment_status: 'active',
  },
  {
    id: SEED_UUIDS.STAFF_03,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    campus_id: SEED_UUIDS.CAMP_ST_JUDE_MAIN,
    user_id: SEED_UUIDS.USER_ACCOUNTANT_MARCUS,
    employee_number: 'EMP-009',
    department_id: SEED_UUIDS.DEPT_FIN,
    job_title: 'Chief Financial Officer & Bursar',
    hire_date: '2021-01-15',
    employment_type: 'full_time',
    employment_status: 'active',
  },
];

const SEED_FEE_STRUCTURES: FeeStructure[] = [
  {
    id: SEED_UUIDS.FS_ANNUAL_TUITION,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    academic_year_id: SEED_UUIDS.AY_2026_2027,
    name: 'Autumn Trimester 2026 - Comprehensive Tuition',
    code: 'T1-TUIT-26',
    amount_cents: 485000,
    currency: 'USD',
    due_date: '2026-09-15',
  },
  {
    id: SEED_UUIDS.FS_STEM_LAB,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    academic_year_id: SEED_UUIDS.AY_2026_2027,
    name: 'STEM Robotics & Fabrication Lab Fee',
    code: 'STEM-LAB-26',
    amount_cents: 35000,
    currency: 'USD',
    due_date: '2026-09-30',
  },
];

const SEED_INVOICES: FinanceInvoice[] = [
  {
    id: SEED_UUIDS.INV_1001,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    student_id: SEED_UUIDS.STU_001,
    fee_structure_id: SEED_UUIDS.FS_ANNUAL_TUITION,
    invoice_number: 'INV-STJ-2026-0081',
    total_amount_cents: 485000,
    balance_cents: 0,
    status: 'paid',
    due_date: '2026-09-15',
    issued_at: '2026-08-20T00:00:00Z',
  },
  {
    id: SEED_UUIDS.INV_1002,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    student_id: SEED_UUIDS.STU_002,
    fee_structure_id: SEED_UUIDS.FS_ANNUAL_TUITION,
    invoice_number: 'INV-STJ-2026-0082',
    total_amount_cents: 485000,
    balance_cents: 185000,
    status: 'partially_paid',
    due_date: '2026-09-15',
    issued_at: '2026-08-20T00:00:00Z',
  },
  {
    id: SEED_UUIDS.INV_1003,
    institution_id: SEED_UUIDS.INST_ST_JUDE,
    student_id: SEED_UUIDS.STU_003,
    fee_structure_id: SEED_UUIDS.FS_ANNUAL_TUITION,
    invoice_number: 'INV-STJ-2026-0083',
    total_amount_cents: 485000,
    balance_cents: 485000,
    status: 'issued',
    due_date: '2026-10-15',
    issued_at: '2026-09-01T00:00:00Z',
  },
];

const SEED_PLATFORM_WEBSITE: PlatformWebsiteConfig = {
  id: SEED_UUIDS.PLATFORM_WEBSITE,
  domain: 'acadeemia.com',
  hero_title: 'The Modular Operating System for Modern Education',
  hero_subtitle:
    'Unify multi-campus academics, finance, admissions, autonomous websites, and tenant-isolated AI into a single institutional command layer.',
  featured_modules: [
    'student_management',
    'fees_collection',
    'admissions',
    'human_resources',
    'institution_website',
    'ai_intelligence',
  ],
  pricing_plans: [
    {
      name: 'Essential Academy',
      price: '$299',
      cadence: '/mo billed annually',
      features: ['Up to 400 Students', 'Single Campus', 'Student Records & Attendance', 'Parent Communication', 'Academic Scheduling'],
    },
    {
      name: 'Omni-Campus Enterprise',
      price: '$799',
      cadence: '/mo billed annually',
      features: [
        'Up to 2,500 Students',
        '5 Physical Campuses',
        'Integrated Fee Billing & HR',
        'Autonomous School Website Builder',
        'ACADEEMIA AI Intelligence Layer',
      ],
    },
  ],
  blog_articles: [
    {
      title: 'Eliminating Data Silos: Why Multi-Tenant Architecture Matters in Education',
      slug: 'eliminating-data-silos-multi-tenant-edtech',
      date: 'October 2026',
      summary: 'How modern educational institutions replace disjointed software with unified, tenant-isolated data architectures.',
    },
    {
      title: 'Connecting the School Website Directly to the Student Information System',
      slug: 'connecting-school-cms-to-admissions',
      date: 'September 2026',
      summary: 'Why manual admissions re-entry is obsolete: how ACADEEMIA turns prospective web submissions into instant applicant records.',
    },
  ],
  is_live: true,
  updated_at: '2026-10-04T00:00:00Z',
};

const SEED_INSTITUTION_WEBSITE: InstitutionWebsiteConfig = {
  id: SEED_UUIDS.SITE_ST_JUDE,
  institution_id: SEED_UUIDS.INST_ST_JUDE,
  site_title: 'St. Jude International Academy',
  tagline: 'Inspiring Scholars, Cultivating Principled Global Leaders',
  hero_heading: 'Where Intellectual Rigor Meets Lifelong Character',
  hero_subheading:
    'A premier Cambridge-accredited preparatory academy serving scholars from Grade 9 through Grade 12 across two dynamic Boston campuses.',
  banner_image_url: '/src/assets/images/hero_institution_campus_1791120653291.jpg',
  is_published: true,
  custom_domain: 'www.stjudeacademy.edu',
  theme_config: {
    primary_color: '#312e81',
    accent_color: '#4f46e5',
    layout: 'modern_academy',
  },
  nav_items: [
    { label: 'Welcome', path: '/' },
    { label: 'Academics & Faculty', path: '/academics' },
    { label: 'Admissions Portal', path: '/admissions' },
    { label: 'Campus Life & Events', path: '/events' },
    { label: 'Contact Us', path: '/contact' },
  ],
  pages: [
    {
      title: 'Academic Philosophy',
      slug: 'academics',
      content:
        'Our curriculum combines the discipline of empirical inquiry with creative expression. Scholars engage in accelerated STEM research, foreign language immersion, and seminar-style humanities discussions.',
    },
  ],
  updated_at: '2026-10-04T00:00:00Z',
};

const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: generateUUID(),
    tenant_id: SEED_UUIDS.INST_ST_JUDE,
    actor_name: 'Dr. Evelyn Vance',
    action: 'INSTITUTION_PROVISIONED',
    entity_type: 'institution',
    entity_id: SEED_UUIDS.INST_ST_JUDE,
    details: { package: 'omni-campus-enterprise', campuses_created: 2 },
    ip_address: '192.168.1.10',
    created_at: '2026-01-10T08:30:00Z',
  },
  {
    id: generateUUID(),
    tenant_id: SEED_UUIDS.INST_ST_JUDE,
    actor_name: 'Prof. Arthur Sterling',
    action: 'ACADEMIC_TERM_ACTIVATED',
    entity_type: 'academic_term',
    entity_id: SEED_UUIDS.TERM_FALL_2026,
    details: { term: 'Autumn Trimester 2026', current: true },
    ip_address: '172.56.21.9',
    created_at: '2026-09-01T09:00:00Z',
  },
  {
    id: generateUUID(),
    tenant_id: SEED_UUIDS.INST_ST_JUDE,
    actor_name: 'Marcus Holloway, CPA',
    action: 'INVOICE_GENERATED',
    entity_type: 'finance_invoice',
    entity_id: SEED_UUIDS.INV_1001,
    details: { student_number: 'STJ-2026-0042', amount: '$4,850.00' },
    ip_address: '172.56.21.14',
    created_at: '2026-08-20T11:20:00Z',
  },
];

const SEED_AI_INSIGHTS: Record<string, AIInsight[]> = {
  [SEED_UUIDS.INST_ST_JUDE]: [
    {
      id: generateUUID(),
      category: 'retention',
      title: 'STEM Track Retention Alert',
      summary: '3 scholars in Grade 10-Alpha have shown sudden 14% attendance dip following midterm assessments.',
      metric: '3 Scholars At-Risk',
      severity: 'medium',
      actionable_recommendation: 'Schedule advisory check-ins with science faculty and notify pastoral team before Term 1 concludes.',
      confidence_score: 0.94,
      generated_at: '2026-10-04T05:30:00Z',
    },
    {
      id: generateUUID(),
      category: 'financial',
      title: 'Fee Collection Velocity Positive',
      summary: 'Term 1 tuition collection is 88.4% realized—12% ahead of historical pace at the same interval.',
      metric: '+12% Early Realization',
      severity: 'info',
      actionable_recommendation: 'Automate gentle SMS reminder to remaining 11.6% families with outstanding balances ahead of due date.',
      confidence_score: 0.98,
      generated_at: '2026-10-03T18:00:00Z',
    },
    {
      id: generateUUID(),
      category: 'academic',
      title: 'Curriculum Capacity Optimization',
      summary: 'North Campus physics laboratories are at 93% seat saturation during periods 3 and 5.',
      metric: '93% Lab Utilization',
      severity: 'low',
      actionable_recommendation: 'Split next term lab sections between North and Downtown campuses to maintain 18-student safety ratios.',
      confidence_score: 0.91,
      generated_at: '2026-10-02T12:00:00Z',
    },
  ],
  [SEED_UUIDS.INST_NOVA_STEM]: [
    {
      id: generateUUID(),
      category: 'operational',
      title: 'Trial Period Module Recommendation',
      summary: 'Nova Horizon has activated 5 modules during onboarding. Enabling Finance module is projected to save 8 hours/week.',
      metric: '8 hrs/wk Savings',
      severity: 'info',
      actionable_recommendation: 'Present Bursar workflow demo during upcoming onboarding review meeting.',
      confidence_score: 0.89,
      generated_at: '2026-10-04T04:15:00Z',
    },
  ],
};

interface DatabaseState {
  users: User[];
  institutions: Institution[];
  campuses: Campus[];
  packages: Package[];
  subscriptions: Subscription[];
  institutionModules: InstitutionModule[];
  academicYears: AcademicYear[];
  academicTerms: AcademicTerm[];
  academicGrades: AcademicGrade[];
  academicClasses: AcademicClass[];
  students: Student[];
  guardians: Guardian[];
  studentGuardians: StudentGuardian[];
  hrDepartments: HRDepartment[];
  hrStaff: HRStaff[];
  feeStructures: FeeStructure[];
  invoices: FinanceInvoice[];
  platformWebsite: PlatformWebsiteConfig;
  institutionWebsites: Record<string, InstitutionWebsiteConfig>;
  auditLogs: AuditLogEntry[];
  aiInsights: Record<string, AIInsight[]>;
}

class TenantStore {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadInitial();
  }

  private loadInitial(): DatabaseState {
    return {
      users: SEED_USERS,
      institutions: SEED_INSTITUTIONS,
      campuses: SEED_CAMPUSES,
      packages: SEED_PACKAGES,
      subscriptions: SEED_SUBSCRIPTIONS,
      institutionModules: SEED_INSTITUTION_MODULES,
      academicYears: SEED_ACADEMIC_YEARS,
      academicTerms: SEED_ACADEMIC_TERMS,
      academicGrades: SEED_ACADEMIC_GRADES,
      academicClasses: SEED_ACADEMIC_CLASSES,
      students: SEED_STUDENTS,
      guardians: SEED_GUARDIANS,
      studentGuardians: SEED_STUDENT_GUARDIANS,
      hrDepartments: SEED_HR_DEPARTMENTS,
      hrStaff: SEED_HR_STAFF,
      feeStructures: SEED_FEE_STRUCTURES,
      invoices: SEED_INVOICES,
      platformWebsite: SEED_PLATFORM_WEBSITE,
      institutionWebsites: {
        [SEED_UUIDS.INST_ST_JUDE]: SEED_INSTITUTION_WEBSITE,
      },
      auditLogs: SEED_AUDIT_LOGS,
      aiInsights: SEED_AI_INSIGHTS,
    };
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private recordAudit(
    tenantId: string | undefined,
    actor: string,
    action: string,
    type: string,
    id: string,
    details: Record<string, unknown>
  ) {
    const entry: AuditLogEntry = {
      id: generateUUID(),
      tenant_id: tenantId,
      actor_name: actor,
      action,
      entity_type: type,
      entity_id: id,
      details,
      created_at: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(entry);
  }

  // --- INSTITUTIONS & CAMPUSES ---
  getInstitutions(): Institution[] {
    return [...this.state.institutions];
  }

  getInstitution(id: string): Institution | undefined {
    return this.state.institutions.find((i) => i.id === id);
  }

  createInstitution(data: Omit<Institution, 'id' | 'created_at'>, actorName = 'Platform Admin'): Institution {
    const newInst: Institution = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    this.state.institutions.push(newInst);

    // Create main campus with authoritative UUID
    const mainCampus: Campus = {
      id: generateUUID(),
      institution_id: newInst.id,
      name: `${newInst.name} - Main Campus`,
      code: 'CAMP-01',
      is_main: true,
      capacity: 500,
    };
    this.state.campuses.push(mainCampus);

    // Seed default enabled core modules
    SYSTEM_MODULES.forEach((m) => {
      this.state.institutionModules.push({
        id: generateUUID(),
        institution_id: newInst.id,
        module_code: m.code,
        is_enabled: m.default_enabled,
        enabled_at: new Date().toISOString(),
      });
    });

    // Seed default subscription
    const defaultPackage = this.state.packages[0];
    this.state.subscriptions.push({
      id: generateUUID(),
      institution_id: newInst.id,
      package_id: defaultPackage.id,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      cancel_at_period_end: false,
      addons: [],
    });

    // Seed initial institution website
    this.state.institutionWebsites[newInst.id] = {
      id: generateUUID(),
      institution_id: newInst.id,
      site_title: newInst.name,
      tagline: 'Inspiring Excellence in Education',
      hero_heading: `Welcome to ${newInst.name}`,
      hero_subheading: 'A forward-looking educational institution dedicated to developing scholars and global innovators.',
      is_published: true,
      custom_domain: newInst.custom_domain,
      theme_config: {
        primary_color: newInst.branding_config.primary_color,
        accent_color: newInst.branding_config.accent_color,
        layout: 'modern_academy',
      },
      nav_items: [
        { label: 'Welcome', path: '/' },
        { label: 'Academics', path: '/academics' },
        { label: 'Admissions', path: '/admissions' },
        { label: 'Contact', path: '/contact' },
      ],
      pages: [],
      updated_at: new Date().toISOString(),
    };

    this.recordAudit(newInst.id, actorName, 'INSTITUTION_CREATED', 'institution', newInst.id, { name: newInst.name });
    this.notify();
    return newInst;
  }

  updateInstitution(id: string, updates: Partial<Institution>, actorName = 'Admin'): Institution {
    const idx = this.state.institutions.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Institution not found');
    this.state.institutions[idx] = { ...this.state.institutions[idx], ...updates };
    this.recordAudit(id, actorName, 'INSTITUTION_UPDATED', 'institution', id, updates as Record<string, unknown>);
    this.notify();
    return this.state.institutions[idx];
  }

  getCampuses(institutionId: string): Campus[] {
    return this.state.campuses.filter((c) => c.institution_id === institutionId);
  }

  createCampus(institutionId: string, data: Omit<Campus, 'id' | 'institution_id'>, actorName = 'Admin'): Campus {
    const campus: Campus = {
      ...data,
      id: generateUUID(),
      institution_id: institutionId,
    };
    this.state.campuses.push(campus);
    this.recordAudit(institutionId, actorName, 'CAMPUS_CREATED', 'campus', campus.id, { name: campus.name });
    this.notify();
    return campus;
  }

  // --- MODULES & LICENSING ---
  getModules(): typeof SYSTEM_MODULES {
    return SYSTEM_MODULES;
  }

  getInstitutionModules(institutionId: string): InstitutionModule[] {
    return this.state.institutionModules.filter((im) => im.institution_id === institutionId);
  }

  toggleModule(institutionId: string, moduleCode: string, enabled: boolean, actorName = 'Admin'): InstitutionModule {
    const idx = this.state.institutionModules.findIndex(
      (im) => im.institution_id === institutionId && im.module_code === moduleCode
    );
    if (idx !== -1) {
      this.state.institutionModules[idx].is_enabled = enabled;
      this.recordAudit(institutionId, actorName, 'MODULE_TOGGLED', 'module', moduleCode, { enabled });
      this.notify();
      return this.state.institutionModules[idx];
    } else {
      const newModule: InstitutionModule = {
        id: generateUUID(),
        institution_id: institutionId,
        module_code: moduleCode,
        is_enabled: enabled,
        enabled_at: new Date().toISOString(),
      };
      this.state.institutionModules.push(newModule);
      this.recordAudit(institutionId, actorName, 'MODULE_TOGGLED', 'module', moduleCode, { enabled });
      this.notify();
      return newModule;
    }
  }

  // --- SUBSCRIPTIONS & PACKAGES ---
  getPackages(): Package[] {
    return [...this.state.packages];
  }

  getSubscription(institutionId: string): Subscription | undefined {
    const sub = this.state.subscriptions.find((s) => s.institution_id === institutionId);
    if (!sub) return undefined;
    const pkg = this.state.packages.find((p) => p.id === sub.package_id);
    return { ...sub, package: pkg };
  }

  // --- ACADEMIC MODEL ---
  getAcademicYears(institutionId: string): AcademicYear[] {
    return this.state.academicYears.filter((ay) => ay.institution_id === institutionId);
  }

  getAcademicTerms(institutionId: string, yearId?: string): AcademicTerm[] {
    return this.state.academicTerms.filter(
      (at) => at.institution_id === institutionId && (!yearId || at.academic_year_id === yearId)
    );
  }

  getAcademicGrades(institutionId: string): AcademicGrade[] {
    return this.state.academicGrades
      .filter((g) => g.institution_id === institutionId)
      .sort((a, b) => a.sequence_order - b.sequence_order);
  }

  getAcademicClasses(institutionId: string, campusId?: string): AcademicClass[] {
    return this.state.academicClasses.filter(
      (c) => c.institution_id === institutionId && (!campusId || c.campus_id === campusId)
    );
  }

  // --- STUDENTS & GUARDIANS ---
  getStudents(institutionId: string, campusId?: string): Student[] {
    return this.state.students.filter(
      (s) => s.institution_id === institutionId && (!campusId || s.campus_id === campusId)
    );
  }

  createStudent(
    institutionId: string,
    data: Omit<Student, 'id' | 'institution_id' | 'student_number' | 'created_at'>,
    actorName = 'Staff'
  ): Student {
    const count = this.state.students.filter((s) => s.institution_id === institutionId).length + 1;
    const inst = this.getInstitution(institutionId);
    const prefix = inst ? inst.code.substring(0, 3).toUpperCase() : 'STU';
    const year = new Date().getFullYear();
    const studentNumber = `${prefix}-${year}-${String(count).padStart(4, '0')}`;

    const student: Student = {
      ...data,
      id: generateUUID(),
      institution_id: institutionId,
      student_number: studentNumber,
      created_at: new Date().toISOString(),
    };

    this.state.students.push(student);
    this.recordAudit(institutionId, actorName, 'STUDENT_ENROLLED', 'student', student.id, {
      student_number: studentNumber,
      name: `${student.first_name} ${student.last_name}`,
    });
    this.notify();
    return student;
  }

  updateStudent(id: string, updates: Partial<Student>): Student {
    const idx = this.state.students.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Student not found');
    this.state.students[idx] = { ...this.state.students[idx], ...updates };
    this.notify();
    return this.state.students[idx];
  }

  getStudent(id: string): Student | null {
    return this.state.students.find((s) => s.id === id) || null;
  }

  getGuardians(institutionId: string): Guardian[] {
    return this.state.guardians.filter((g) => g.institution_id === institutionId);
  }

  getGuardiansForStudent(studentId: string): Guardian[] {
    const links = this.state.studentGuardians.filter((sg) => sg.student_id === studentId);
    return links
      .map((l) => this.state.guardians.find((item) => item.id === l.guardian_id))
      .filter(Boolean) as Guardian[];
  }

  // --- HR / STAFF ---
  getDepartments(institutionId: string): HRDepartment[] {
    return this.state.hrDepartments.filter((d) => d.institution_id === institutionId);
  }

  getStaff(institutionId: string): HRStaff[] {
    return this.state.hrStaff
      .filter((s) => s.institution_id === institutionId)
      .map((s) => ({
        ...s,
        user: this.state.users.find((u) => u.id === s.user_id),
        department: this.state.hrDepartments.find((d) => d.id === s.department_id),
      }));
  }

  createStaff(institutionId: string, data: Omit<HRStaff, 'id'>): HRStaff {
    const staff: HRStaff = {
      ...data,
      id: generateUUID(),
    };
    this.state.hrStaff.push(staff);
    this.notify();
    return staff;
  }

  // --- FINANCE ---
  getFeeStructures(institutionId: string): FeeStructure[] {
    return this.state.feeStructures.filter((f) => f.institution_id === institutionId);
  }

  getInvoices(institutionId: string): FinanceInvoice[] {
    return this.state.invoices
      .filter((i) => i.institution_id === institutionId)
      .map((i) => ({
        ...i,
        student: this.state.students.find((s) => s.id === i.student_id),
      }));
  }

  createInvoice(
    institutionId: string,
    data: Omit<FinanceInvoice, 'id' | 'institution_id' | 'invoice_number' | 'issued_at'>,
    actorName = 'Accountant'
  ): FinanceInvoice {
    const count = this.state.invoices.filter((i) => i.institution_id === institutionId).length + 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
    const invoice: FinanceInvoice = {
      ...data,
      id: generateUUID(),
      institution_id: institutionId,
      invoice_number: invoiceNumber,
      issued_at: new Date().toISOString(),
    };
    this.state.invoices.push(invoice);
    this.recordAudit(institutionId, actorName, 'INVOICE_ISSUED', 'finance_invoice', invoice.id, {
      invoice_number: invoiceNumber,
      amount: invoice.total_amount_cents,
    });
    this.notify();
    return invoice;
  }

  getPayments(institutionId: string): FinancePayment[] {
    return [];
  }

  // --- WEBSITES & CMS ---
  getPlatformWebsite(): PlatformWebsiteConfig {
    return { ...this.state.platformWebsite };
  }

  updatePlatformWebsite(updates: Partial<PlatformWebsiteConfig>, actorName = 'Platform Admin'): PlatformWebsiteConfig {
    this.state.platformWebsite = {
      ...this.state.platformWebsite,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.recordAudit(
      undefined,
      actorName,
      'PLATFORM_WEBSITE_UPDATED',
      'platform_website',
      this.state.platformWebsite.id,
      updates as Record<string, unknown>
    );
    this.notify();
    return this.state.platformWebsite;
  }

  getInstitutionWebsite(institutionId: string): InstitutionWebsiteConfig {
    if (!this.state.institutionWebsites[institutionId]) {
      const inst = this.getInstitution(institutionId);
      this.state.institutionWebsites[institutionId] = {
        id: generateUUID(),
        institution_id: institutionId,
        site_title: inst?.name || 'Institution Portal',
        tagline: 'Leading Academic Institution',
        hero_heading: `Welcome to ${inst?.name || 'our Academy'}`,
        hero_subheading: 'A community dedicated to high academic standards and student character.',
        is_published: true,
        theme_config: { primary_color: '#312e81', accent_color: '#4f46e5', layout: 'modern_academy' },
        nav_items: [
          { label: 'Home', path: '/' },
          { label: 'Academics', path: '/academics' },
          { label: 'Admissions', path: '/admissions' },
          { label: 'Contact', path: '/contact' },
        ],
        pages: [],
        updated_at: new Date().toISOString(),
      };
      this.notify();
    }
    return { ...this.state.institutionWebsites[institutionId] };
  }

  updateInstitutionWebsite(
    institutionId: string,
    updates: Partial<InstitutionWebsiteConfig>,
    actorName = 'Admin'
  ): InstitutionWebsiteConfig {
    const current = this.getInstitutionWebsite(institutionId);
    this.state.institutionWebsites[institutionId] = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.recordAudit(
      institutionId,
      actorName,
      'INSTITUTION_WEBSITE_UPDATED',
      'institution_website',
      current.id,
      updates as Record<string, unknown>
    );
    this.notify();
    return this.state.institutionWebsites[institutionId];
  }

  // --- AI INTELLIGENCE ---
  getAIInsights(institutionId: string): AIInsight[] {
    return this.state.aiInsights[institutionId] || [];
  }

  // --- AUDIT LOGS ---
  getAuditLogs(tenantId?: string): AuditLogEntry[] {
    if (tenantId) {
      return this.state.auditLogs.filter((log) => log.tenant_id === tenantId);
    }
    return [...this.state.auditLogs];
  }

  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): void {
    this.state.auditLogs.unshift({
      ...entry,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    });
    this.notify();
  }

  // --- USERS & AUTH ---
  getUsers(): User[] {
    return [...this.state.users];
  }

  getUser(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }
}

export const tenantStore = new TenantStore();
