// ==============================================================================
// ACADEEMIA 2.0 - Multi-Tenant Relational Data Layer
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
  AIInsight
} from '../types';
import { SYSTEM_MODULES } from './moduleRegistry';

const STORAGE_KEY = 'acadeemia_2_0_tenant_db_v1';

// Initial platform & multi-tenant seed data
const SEED_USERS: User[] = [
  {
    id: 'usr-platform-admin',
    email: 'admin@acadeemia.com',
    full_name: 'Dr. Evelyn Vance',
    avatar_url: '/src/assets/images/avatar_platform_admin_1791120629483.jpg',
    is_platform_user: true,
    platform_role: 'platform_admin',
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-institution-owner',
    email: 'principal@stjude.edu',
    full_name: 'Prof. Arthur Sterling',
    avatar_url: '/src/assets/images/avatar_institution_dean_1791120642544.jpg',
    is_platform_user: false,
    created_at: '2026-01-15T09:00:00Z',
  },
  {
    id: 'usr-teacher-sarah',
    email: 'sarah.connor@stjude.edu',
    full_name: 'Sarah Connor, M.Ed.',
    is_platform_user: false,
    created_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'usr-accountant-marcus',
    email: 'bursar@stjude.edu',
    full_name: 'Marcus Holloway, CPA',
    is_platform_user: false,
    created_at: '2026-02-05T11:00:00Z',
  },
  {
    id: 'usr-parent-helena',
    email: 'helena.morales@family.net',
    full_name: 'Helena Morales',
    phone: '+1 (555) 234-8891',
    is_platform_user: false,
    created_at: '2026-02-10T14:00:00Z',
  },
];

const SEED_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-st-jude',
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
    id: 'inst-nova-stem',
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
    id: 'camp-st-jude-main',
    institution_id: 'inst-st-jude',
    name: 'North Campus (Secondary & Senior Academy)',
    code: 'MAIN-01',
    is_main: true,
    address: '742 Cambridge Boulevard, Boston, MA',
    phone: '+1 (555) 890-4400',
    capacity: 1200,
  },
  {
    id: 'camp-st-jude-city',
    institution_id: 'inst-st-jude',
    name: 'Downtown Preparatory Campus',
    code: 'CITY-02',
    is_main: false,
    address: '45 Commonwealth Ave, Boston, MA',
    phone: '+1 (555) 890-4455',
    capacity: 650,
  },
  {
    id: 'camp-nova-main',
    institution_id: 'inst-nova-stem',
    name: 'Discovery Campus',
    code: 'NOVA-MAIN',
    is_main: true,
    address: '100 Innovation Way, Silicon Valley, CA',
    capacity: 800,
  },
];

const SEED_PACKAGES: Package[] = [
  {
    id: 'pkg-foundation',
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
    id: 'pkg-enterprise',
    name: 'Omni-Campus Enterprise',
    slug: 'omni-campus-enterprise',
    description: 'Complete multi-campus operational suite including Finance, HR, Website CMS, and AI Intelligence.',
    billing_cycle: 'annual',
    price_cents: 79900,
    currency: 'USD',
    included_modules: [
      'student_management', 'admissions', 'academics', 'attendance', 'examinations',
      'timetable', 'homework', 'fees_collection', 'student_accounting', 'human_resources',
      'communication', 'events_calendar', 'institution_website', 'ai_intelligence'
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
    id: 'sub-st-jude',
    institution_id: 'inst-st-jude',
    package_id: 'pkg-enterprise',
    status: 'active',
    current_period_start: '2026-01-01T00:00:00Z',
    current_period_end: '2027-01-01T00:00:00Z',
    cancel_at_period_end: false,
    addons: [
      {
        id: 'addon-online-exam',
        subscription_id: 'sub-st-jude',
        module_code: 'online_exam',
        price_cents: 9900,
        added_at: '2026-01-15T00:00:00Z',
      },
    ],
  },
  {
    id: 'sub-nova-stem',
    institution_id: 'inst-nova-stem',
    package_id: 'pkg-foundation',
    status: 'trialing',
    trial_ends_at: '2026-11-15T00:00:00Z',
    current_period_start: '2026-10-01T00:00:00Z',
    current_period_end: '2026-11-15T00:00:00Z',
    cancel_at_period_end: false,
    addons: [],
  },
];

// Initial institutional modules
const SEED_INSTITUTION_MODULES: InstitutionModule[] = SYSTEM_MODULES.map((mod) => ({
  id: `imod-stjude-${mod.code}`,
  institution_id: 'inst-st-jude',
  module_code: mod.code,
  is_enabled: mod.default_enabled || ['online_exam', 'human_resources', 'ai_intelligence', 'institution_website', 'fees_collection'].includes(mod.code),
  enabled_at: '2026-01-10T00:00:00Z',
}));

// Academic structure seed
const SEED_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 'ay-2026-2027',
    institution_id: 'inst-st-jude',
    name: '2026 - 2027 Academic Year',
    start_date: '2026-09-01',
    end_date: '2027-06-30',
    is_current: true,
  },
];

const SEED_ACADEMIC_TERMS: AcademicTerm[] = [
  {
    id: 'term-fall-2026',
    institution_id: 'inst-st-jude',
    academic_year_id: 'ay-2026-2027',
    name: 'Autumn Trimester 2026',
    start_date: '2026-09-01',
    end_date: '2026-12-18',
    is_current: true,
  },
  {
    id: 'term-winter-2027',
    institution_id: 'inst-st-jude',
    academic_year_id: 'ay-2026-2027',
    name: 'Winter Trimester 2027',
    start_date: '2027-01-08',
    end_date: '2027-03-26',
    is_current: false,
  },
];

const SEED_ACADEMIC_GRADES: AcademicGrade[] = [
  { id: 'gr-09', institution_id: 'inst-st-jude', name: 'Grade 9', code: 'G9', sequence_order: 1 },
  { id: 'gr-10', institution_id: 'inst-st-jude', name: 'Grade 10', code: 'G10', sequence_order: 2 },
  { id: 'gr-11', institution_id: 'inst-st-jude', name: 'Grade 11', code: 'G11', sequence_order: 3 },
  { id: 'gr-12', institution_id: 'inst-st-jude', name: 'Grade 12', code: 'G12', sequence_order: 4 },
];

const SEED_ACADEMIC_CLASSES: AcademicClass[] = [
  {
    id: 'cls-g10-alpha',
    institution_id: 'inst-st-jude',
    campus_id: 'camp-st-jude-main',
    grade_id: 'gr-10',
    academic_year_id: 'ay-2026-2027',
    name: 'Grade 10 - Alpha (Accelerated STEM)',
    code: '10-A',
    capacity: 28,
  },
  {
    id: 'cls-g10-beta',
    institution_id: 'inst-st-jude',
    campus_id: 'camp-st-jude-main',
    grade_id: 'gr-10',
    academic_year_id: 'ay-2026-2027',
    name: 'Grade 10 - Beta (Humanities & Arts)',
    code: '10-B',
    capacity: 30,
  },
  {
    id: 'cls-g11-prep',
    institution_id: 'inst-st-jude',
    campus_id: 'camp-st-jude-city',
    grade_id: 'gr-11',
    academic_year_id: 'ay-2026-2027',
    name: 'Grade 11 - City Honors Seminar',
    code: '11-HON',
    capacity: 25,
  },
];

// Students with institutional unique identifiers
const SEED_STUDENTS: Student[] = [
  {
    id: 'stu-001',
    institution_id: 'inst-st-jude',
    campus_id: 'camp-st-jude-main',
    student_number: 'STJ-2026-0042', // Unique within institution
    first_name: 'Mateo',
    last_name: 'Morales',
    gender: 'Male',
    date_of_birth: '2010-04-14',
    admission_date: '2024-09-01',
    status: 'active',
    current_class_id: 'cls-g10-alpha',
    blood_group: 'O+',
    allergies: 'Tree nuts (EpiPen kept with nurse)',
    created_at: '2024-09-01T00:00:00Z',
  },
  {
    id: 'stu-002',
    institution_id: 'inst-st-jude',
    campus_id: 'camp-st-jude-main',
    student_number: 'STJ-2026-0043',
    first_name: 'Sofia',
    last_name: 'Morales',
    gender: 'Female',
    date_of_birth: '2012-08-21',
    admission_date: '2025-09-01',
    status: 'active',
    current_class_id: 'cls-g10-beta',
    blood_group: 'O+',
    created_at: '2025-09-01T00:00:00Z',
  },
  {
    id: 'stu-003',
    institution_id: 'inst-st-jude',
    campus_id: 'camp-st-jude-city',
    student_number: 'STJ-2026-0089',
    first_name: 'Julian',
    last_name: 'Kassab',
    gender: 'Male',
    date_of_birth: '2009-11-03',
    admission_date: '2023-09-01',
    status: 'active',
    current_class_id: 'cls-g11-prep',
    blood_group: 'A+',
    created_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 'stu-004',
    institution_id: 'inst-st-jude',
    campus_id: 'camp-st-jude-main',
    student_number: 'STJ-2026-0112',
    first_name: 'Amara',
    last_name: 'Okonkwo',
    gender: 'Female',
    date_of_birth: '2010-02-18',
    admission_date: '2024-09-01',
    status: 'active',
    current_class_id: 'cls-g10-alpha',
    blood_group: 'B+',
    created_at: '2024-09-01T00:00:00Z',
  },
];

const SEED_GUARDIANS: Guardian[] = [
  {
    id: 'grd-01',
    institution_id: 'inst-st-jude',
    user_id: 'usr-parent-helena',
    full_name: 'Helena Morales',
    relationship_type: 'mother',
    email: 'helena.morales@family.net',
    phone: '+1 (555) 234-8891',
    occupation: 'Senior Research Scientist',
    is_emergency_contact: true,
    address: '14 Beacon Crest Way, Boston, MA',
  },
  {
    id: 'grd-02',
    institution_id: 'inst-st-jude',
    full_name: 'David Morales',
    relationship_type: 'father',
    email: 'david.morales@architects.org',
    phone: '+1 (555) 234-8892',
    occupation: 'Civil Architect',
    is_emergency_contact: true,
    address: '14 Beacon Crest Way, Boston, MA',
  },
];

// Many-to-many parent relationships
const SEED_STUDENT_GUARDIANS: StudentGuardian[] = [
  {
    id: 'sg-01',
    student_id: 'stu-001', // Mateo
    guardian_id: 'grd-01', // Helena
    is_primary: true,
    can_pickup: true,
    receives_billing: true,
  },
  {
    id: 'sg-02',
    student_id: 'stu-001', // Mateo
    guardian_id: 'grd-02', // David
    is_primary: false,
    can_pickup: true,
    receives_billing: false,
  },
  {
    id: 'sg-03',
    student_id: 'stu-002', // Sofia (Helena's second child in same institution!)
    guardian_id: 'grd-01', // Helena
    is_primary: true,
    can_pickup: true,
    receives_billing: true,
  },
];

// HR & Staff
const SEED_HR_DEPARTMENTS: HRDepartment[] = [
  { id: 'dept-sci', institution_id: 'inst-st-jude', name: 'Physical & Natural Sciences', code: 'SCI' },
  { id: 'dept-hum', institution_id: 'inst-st-jude', name: 'Humanities & World Languages', code: 'HUM' },
  { id: 'dept-adm', institution_id: 'inst-st-jude', name: 'School Administration & Admissions', code: 'ADM' },
  { id: 'dept-fin', institution_id: 'inst-st-jude', name: 'Bursary & Financial Services', code: 'FIN' },
];

const SEED_HR_STAFF: HRStaff[] = [
  {
    id: 'stf-01',
    institution_id: 'inst-st-jude',
    campus_id: 'camp-st-jude-main',
    user_id: 'usr-institution-owner',
    employee_number: 'EMP-001',
    department_id: 'dept-adm',
    job_title: 'Head of School & Executive Dean',
    hire_date: '2020-08-01',
    employment_type: 'full_time',
    employment_status: 'active',
  },
  {
    id: 'stf-02',
    institution_id: 'inst-st-jude',
    campus_id: 'camp-st-jude-main',
    user_id: 'usr-teacher-sarah',
    employee_number: 'EMP-014',
    department_id: 'dept-sci',
    job_title: 'Lead Advanced Physics & Robotics Faculty',
    hire_date: '2022-09-01',
    employment_type: 'full_time',
    employment_status: 'active',
  },
  {
    id: 'stf-03',
    institution_id: 'inst-st-jude',
    campus_id: 'camp-st-jude-main',
    user_id: 'usr-accountant-marcus',
    employee_number: 'EMP-009',
    department_id: 'dept-fin',
    job_title: 'Chief Financial Officer & Bursar',
    hire_date: '2021-01-15',
    employment_type: 'full_time',
    employment_status: 'active',
  },
];

// Finance
const SEED_FEE_STRUCTURES: FeeStructure[] = [
  {
    id: 'fee-t1-tuition',
    institution_id: 'inst-st-jude',
    academic_year_id: 'ay-2026-2027',
    name: 'Autumn Trimester 2026 - Comprehensive Tuition',
    code: 'T1-TUIT-26',
    amount_cents: 485000, // $4,850.00
    currency: 'USD',
    due_date: '2026-09-15',
  },
  {
    id: 'fee-stem-lab',
    institution_id: 'inst-st-jude',
    academic_year_id: 'ay-2026-2027',
    name: 'STEM Robotics & Fabrication Lab Fee',
    code: 'STEM-LAB-26',
    amount_cents: 35000, // $350.00
    currency: 'USD',
    due_date: '2026-09-30',
  },
];

const SEED_INVOICES: FinanceInvoice[] = [
  {
    id: 'inv-1001',
    institution_id: 'inst-st-jude',
    student_id: 'stu-001',
    fee_structure_id: 'fee-t1-tuition',
    invoice_number: 'INV-STJ-2026-0081',
    total_amount_cents: 485000,
    balance_cents: 0,
    status: 'paid',
    due_date: '2026-09-15',
    issued_at: '2026-08-20T00:00:00Z',
  },
  {
    id: 'inv-1002',
    institution_id: 'inst-st-jude',
    student_id: 'stu-002',
    fee_structure_id: 'fee-t1-tuition',
    invoice_number: 'INV-STJ-2026-0082',
    total_amount_cents: 485000,
    balance_cents: 185000,
    status: 'partially_paid',
    due_date: '2026-09-15',
    issued_at: '2026-08-20T00:00:00Z',
  },
  {
    id: 'inv-1003',
    institution_id: 'inst-st-jude',
    student_id: 'stu-003',
    fee_structure_id: 'fee-t1-tuition',
    invoice_number: 'INV-STJ-2026-0083',
    total_amount_cents: 485000,
    balance_cents: 485000,
    status: 'issued',
    due_date: '2026-10-15',
    issued_at: '2026-09-01T00:00:00Z',
  },
];

// Dual Websites
const SEED_PLATFORM_WEBSITE: PlatformWebsiteConfig = {
  id: 'web-acadeemia-portal',
  domain: 'acadeemia.com',
  hero_title: 'The Modular Operating System for Modern Education',
  hero_subtitle: 'Unify multi-campus academics, finance, admissions, autonomous websites, and tenant-isolated AI into a single institutional command layer.',
  featured_modules: ['student_management', 'fees_collection', 'admissions', 'human_resources', 'institution_website', 'ai_intelligence'],
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
      features: ['Up to 2,500 Students', '5 Physical Campuses', 'Integrated Fee Billing & HR', 'Autonomous School Website Builder', 'ACADEEMIA AI Intelligence Layer'],
    },
    {
      name: 'Global University Consortium',
      price: 'Custom',
      cadence: 'tailored SLA',
      features: ['Unlimited Learners & Campuses', 'Dedicated Postgres RLS Cluster', 'Custom Module Engineering', '24/7 Dedicated Systems Engineer'],
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
  id: 'site-st-jude',
  institution_id: 'inst-st-jude',
  site_title: 'St. Jude International Academy',
  tagline: 'Inspiring Scholars, Cultivating Principled Global Leaders',
  hero_heading: 'Where Intellectual Rigor Meets Lifelong Character',
  hero_subheading: 'A premier Cambridge-accredited preparatory academy serving scholars from Grade 9 through Grade 12 across two dynamic Boston campuses.',
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
      content: 'Our curriculum combines the discipline of empirical inquiry with creative expression. Scholars engage in accelerated STEM research, foreign language immersion, and seminar-style humanities discussions.',
    },
  ],
  updated_at: '2026-10-04T00:00:00Z',
};

// Seed Audit Logs
const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    tenant_id: 'inst-st-jude',
    actor_name: 'Dr. Evelyn Vance',
    action: 'INSTITUTION_PROVISIONED',
    entity_type: 'institution',
    entity_id: 'inst-st-jude',
    details: { package: 'omni-campus-enterprise', campuses_created: 2 },
    ip_address: '192.168.1.10',
    created_at: '2026-01-10T08:30:00Z',
  },
  {
    id: 'aud-002',
    tenant_id: 'inst-st-jude',
    actor_name: 'Prof. Arthur Sterling',
    action: 'ACADEMIC_TERM_ACTIVATED',
    entity_type: 'academic_term',
    entity_id: 'term-fall-2026',
    details: { term: 'Autumn Trimester 2026', current: true },
    ip_address: '172.56.21.9',
    created_at: '2026-09-01T09:00:00Z',
  },
  {
    id: 'aud-003',
    tenant_id: 'inst-st-jude',
    actor_name: 'Marcus Holloway, CPA',
    action: 'INVOICE_GENERATED',
    entity_type: 'finance_invoice',
    entity_id: 'inv-1001',
    details: { student_number: 'STJ-2026-0042', amount: '$4,850.00' },
    ip_address: '172.56.21.14',
    created_at: '2026-08-20T11:20:00Z',
  },
];

// Seed AI Insights
const SEED_AI_INSIGHTS: Record<string, AIInsight[]> = {
  'inst-st-jude': [
    {
      id: 'ai-01',
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
      id: 'ai-02',
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
      id: 'ai-03',
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
  'inst-nova-stem': [
    {
      id: 'ai-nova-01',
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

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        return JSON.parse(serialized);
      }
    } catch {
      // fallback to initial seed
    }

    const initial: DatabaseState = {
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
        'inst-st-jude': SEED_INSTITUTION_WEBSITE,
      },
      auditLogs: SEED_AUDIT_LOGS,
      aiInsights: SEED_AI_INSIGHTS,
    };

    this.save(initial);
    return initial;
  }

  private save(state: DatabaseState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
  }

  private recordAudit(tenantId: string | undefined, actor: string, action: string, type: string, id: string, details: Record<string, unknown>) {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenant_id: tenantId,
      actor_name: actor,
      action,
      entity_type: type,
      entity_id: id,
      details,
      created_at: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(entry);
    this.save(this.state);
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
      id: `inst-${Date.now().toString(36)}`,
      created_at: new Date().toISOString(),
    };
    this.state.institutions.push(newInst);

    // Create main campus
    const mainCampus: Campus = {
      id: `camp-${Date.now().toString(36)}`,
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
        id: `imod-${newInst.id}-${m.code}`,
        institution_id: newInst.id,
        module_code: m.code,
        is_enabled: m.default_enabled,
        enabled_at: new Date().toISOString(),
      });
    });

    // Seed default subscription
    const defaultPackage = this.state.packages[0];
    this.state.subscriptions.push({
      id: `sub-${newInst.id}`,
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
      id: `site-${newInst.id}`,
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
    this.save(this.state);
    return newInst;
  }

  updateInstitution(id: string, updates: Partial<Institution>, actorName = 'Admin'): Institution {
    const idx = this.state.institutions.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Institution not found');
    this.state.institutions[idx] = { ...this.state.institutions[idx], ...updates };
    this.recordAudit(id, actorName, 'INSTITUTION_UPDATED', 'institution', id, updates as Record<string, unknown>);
    this.save(this.state);
    return this.state.institutions[idx];
  }

  getCampuses(institutionId: string): Campus[] {
    return this.state.campuses.filter((c) => c.institution_id === institutionId);
  }

  createCampus(institutionId: string, data: Omit<Campus, 'id' | 'institution_id'>, actorName = 'Admin'): Campus {
    const campus: Campus = {
      ...data,
      id: `camp-${Date.now().toString(36)}`,
      institution_id: institutionId,
    };
    this.state.campuses.push(campus);
    this.recordAudit(institutionId, actorName, 'CAMPUS_CREATED', 'campus', campus.id, { name: campus.name });
    this.save(this.state);
    return campus;
  }

  // --- MODULES & LICENSING ---
  getInstitutionModules(institutionId: string): InstitutionModule[] {
    return this.state.institutionModules.filter((im) => im.institution_id === institutionId);
  }

  toggleModule(institutionId: string, moduleCode: string, enabled: boolean, actorName = 'Admin'): void {
    const idx = this.state.institutionModules.findIndex(
      (im) => im.institution_id === institutionId && im.module_code === moduleCode
    );
    if (idx !== -1) {
      this.state.institutionModules[idx].is_enabled = enabled;
    } else {
      this.state.institutionModules.push({
        id: `imod-${institutionId}-${moduleCode}`,
        institution_id: institutionId,
        module_code: moduleCode,
        is_enabled: enabled,
        enabled_at: new Date().toISOString(),
      });
    }
    this.recordAudit(institutionId, actorName, 'MODULE_TOGGLED', 'module', moduleCode, { enabled });
    this.save(this.state);
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

  upgradeSubscription(institutionId: string, packageId: string, actorName = 'Admin'): Subscription {
    const idx = this.state.subscriptions.findIndex((s) => s.institution_id === institutionId);
    if (idx === -1) throw new Error('Subscription not found');
    this.state.subscriptions[idx].package_id = packageId;
    this.recordAudit(institutionId, actorName, 'SUBSCRIPTION_UPGRADED', 'subscription', packageId, {});
    this.save(this.state);
    return this.getSubscription(institutionId)!;
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

  createStudent(institutionId: string, data: Omit<Student, 'id' | 'institution_id' | 'student_number' | 'created_at'>, actorName = 'Staff'): Student {
    // Generate institutional unique ID
    const count = this.state.students.filter((s) => s.institution_id === institutionId).length + 1;
    const inst = this.getInstitution(institutionId);
    const prefix = inst ? inst.code.substring(0, 3).toUpperCase() : 'STU';
    const year = new Date().getFullYear();
    const studentNumber = `${prefix}-${year}-${String(count).padStart(4, '0')}`;

    const student: Student = {
      ...data,
      id: `stu-${Date.now().toString(36)}`,
      institution_id: institutionId,
      student_number: studentNumber,
      created_at: new Date().toISOString(),
    };

    this.state.students.push(student);
    this.recordAudit(institutionId, actorName, 'STUDENT_ENROLLED', 'student', student.id, {
      student_number: studentNumber,
      name: `${student.first_name} ${student.last_name}`,
    });
    this.save(this.state);
    return student;
  }

  getGuardiansForStudent(studentId: string): Array<{ guardian: Guardian; isPrimary: boolean; canPickup: boolean }> {
    const links = this.state.studentGuardians.filter((sg) => sg.student_id === studentId);
    return links
      .map((l) => {
        const g = this.state.guardians.find((item) => item.id === l.guardian_id);
        return g ? { guardian: g, isPrimary: l.is_primary, canPickup: l.can_pickup } : null;
      })
      .filter(Boolean) as Array<{ guardian: Guardian; isPrimary: boolean; canPickup: boolean }>;
  }

  getStudentsForGuardian(guardianId: string): Student[] {
    const links = this.state.studentGuardians.filter((sg) => sg.guardian_id === guardianId);
    return links
      .map((l) => this.state.students.find((s) => s.id === l.student_id))
      .filter(Boolean) as Student[];
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

  createInvoice(institutionId: string, data: Omit<FinanceInvoice, 'id' | 'institution_id' | 'invoice_number' | 'issued_at'>, actorName = 'Accountant'): FinanceInvoice {
    const count = this.state.invoices.filter((i) => i.institution_id === institutionId).length + 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
    const invoice: FinanceInvoice = {
      ...data,
      id: `inv-${Date.now().toString(36)}`,
      institution_id: institutionId,
      invoice_number: invoiceNumber,
      issued_at: new Date().toISOString(),
    };
    this.state.invoices.push(invoice);
    this.recordAudit(institutionId, actorName, 'INVOICE_ISSUED', 'finance_invoice', invoice.id, {
      invoice_number: invoiceNumber,
      amount: invoice.total_amount_cents,
    });
    this.save(this.state);
    return invoice;
  }

  // --- WEBSITES & CMS ---
  getPlatformWebsite(): PlatformWebsiteConfig {
    return { ...this.state.platformWebsite };
  }

  updatePlatformWebsite(updates: Partial<PlatformWebsiteConfig>, actorName = 'Platform Admin'): PlatformWebsiteConfig {
    this.state.platformWebsite = { ...this.state.platformWebsite, ...updates, updated_at: new Date().toISOString() };
    this.recordAudit(undefined, actorName, 'PLATFORM_WEBSITE_UPDATED', 'platform_website', this.state.platformWebsite.id, updates as Record<string, unknown>);
    this.save(this.state);
    return this.state.platformWebsite;
  }

  getInstitutionWebsite(institutionId: string): InstitutionWebsiteConfig {
    if (!this.state.institutionWebsites[institutionId]) {
      const inst = this.getInstitution(institutionId);
      this.state.institutionWebsites[institutionId] = {
        id: `site-${institutionId}`,
        institution_id: institutionId,
        site_title: inst?.name || 'Institution Portal',
        tagline: 'Leading Academic Institution',
        hero_heading: `Welcome to ${inst?.name || 'our Academy'}`,
        hero_subheading: 'A community dedicated to high academic standards and student character.',
        is_published: true,
        theme_config: { primary_color: '#312e81', accent_color: '#4f46e5', layout: 'modern_academy' },
        nav_items: [{ label: 'Home', path: '/' }, { label: 'Academics', path: '/academics' }, { label: 'Admissions', path: '/admissions' }, { label: 'Contact', path: '/contact' }],
        pages: [],
        updated_at: new Date().toISOString(),
      };
      this.save(this.state);
    }
    return { ...this.state.institutionWebsites[institutionId] };
  }

  updateInstitutionWebsite(institutionId: string, updates: Partial<InstitutionWebsiteConfig>, actorName = 'Admin'): InstitutionWebsiteConfig {
    const current = this.getInstitutionWebsite(institutionId);
    this.state.institutionWebsites[institutionId] = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.recordAudit(institutionId, actorName, 'INSTITUTION_WEBSITE_UPDATED', 'institution_website', current.id, updates as Record<string, unknown>);
    this.save(this.state);
    return this.state.institutionWebsites[institutionId];
  }

  // --- AI INTELLIGENCE ---
  getAIInsights(institutionId: string): AIInsight[] {
    return this.state.aiInsights[institutionId] || [];
  }

  addAIInsight(institutionId: string, insight: Omit<AIInsight, 'id' | 'generated_at'>): AIInsight {
    if (!this.state.aiInsights[institutionId]) {
      this.state.aiInsights[institutionId] = [];
    }
    const newInsight: AIInsight = {
      ...insight,
      id: `ai-${Date.now()}`,
      generated_at: new Date().toISOString(),
    };
    this.state.aiInsights[institutionId].unshift(newInsight);
    this.save(this.state);
    return newInsight;
  }

  // --- AUDIT LOGS ---
  getAuditLogs(tenantId?: string): AuditLogEntry[] {
    if (tenantId) {
      return this.state.auditLogs.filter((log) => log.tenant_id === tenantId);
    }
    return [...this.state.auditLogs];
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
