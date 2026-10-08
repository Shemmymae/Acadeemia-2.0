import { ModuleDefinition, ModuleCategory, Package } from '../types';

export const SYSTEM_MODULES: ModuleDefinition[] = [
  // ============================================================================
  // 1. CORE PLATFORM CAPABILITIES (Mandatory, Non-deactivatable, Always Entitled)
  // ============================================================================
  {
    id: 'mod-students',
    code: 'student_management',
    name: 'Student Information System',
    description: 'Comprehensive student lifecycle, longitudinal profiles, academic records, unique institutional identifiers, and cohort progression.',
    category: 'core',
    is_core: true,
    default_enabled: true,
    icon: 'GraduationCap',
    permissions_provided: ['students.read', 'students.write', 'students.export', 'students.delete'],
  },
  {
    id: 'mod-academics',
    code: 'academics',
    name: 'Academic Structure & Curriculum',
    description: 'Multi-term academic sessions, grading scales, educational levels, classes, subject offerings, and timetable curriculum mapping.',
    category: 'core',
    is_core: true,
    default_enabled: true,
    icon: 'BookOpen',
    permissions_provided: ['academics.manage', 'academics.view'],
  },

  // ============================================================================
  // 2. ACADEMIC & STUDENT OPERATIONS
  // ============================================================================
  {
    id: 'mod-admissions',
    code: 'admissions',
    name: 'Online Admissions & Inquiries',
    description: 'Prospective applicant portal, inquiry intake pipeline, document screening workflows, and automated enrollment conversion.',
    category: 'academic',
    is_core: false,
    default_enabled: true,
    icon: 'UserPlus',
    permissions_provided: ['admissions.manage', 'admissions.review', 'admissions.convert'],
  },
  {
    id: 'mod-attendance',
    code: 'attendance',
    name: 'Attendance & Truancy Monitoring',
    description: 'Daily and period-level roll calls, biometric scanner synchronization, automated absent SMS triggers, and attendance audits.',
    category: 'academic',
    is_core: false,
    default_enabled: true,
    icon: 'CalendarCheck',
    permissions_provided: ['attendance.mark', 'attendance.view', 'attendance.reports'],
  },
  {
    id: 'mod-exams',
    code: 'exams',
    name: 'Examinations & Grading',
    description: 'Examination session scheduling, grading scales, mark entry sheets, consolidated report card generation, and student rankings.',
    category: 'academic',
    is_core: false,
    default_enabled: true,
    icon: 'Award',
    permissions_provided: ['exams.create', 'exams.grade', 'exams.publish'],
  },
  {
    id: 'mod-homework',
    code: 'homework',
    name: 'Homework & Assignments',
    description: 'Digital assignment distribution, student submission portals, teacher grading feedback, rubric evaluation, and due date trackers.',
    category: 'academic',
    is_core: false,
    default_enabled: true,
    icon: 'FileText',
    permissions_provided: ['homework.create', 'homework.submit', 'homework.grade'],
  },
  {
    id: 'mod-lesson-plans',
    code: 'lesson_plans',
    name: 'Lesson Planning & Syllabus',
    description: 'Curriculum mapping, instructional lesson plans, departmental syllabus review, and topic completion tracking.',
    category: 'academic',
    is_core: false,
    default_enabled: false,
    icon: 'BookOpen',
    permissions_provided: ['lesson_plans.create', 'lesson_plans.review', 'lesson_plans.view'],
  },
  {
    id: 'mod-live-classes',
    code: 'live_classes',
    name: 'Virtual Classrooms & Live Streaming',
    description: 'Remote teaching integration, virtual class links (Meet, Zoom), live session attendee logging, and recorded lecture archives.',
    category: 'academic',
    is_core: false,
    default_enabled: false,
    icon: 'Laptop',
    permissions_provided: ['live_classes.host', 'live_classes.join', 'live_classes.record'],
  },
  {
    id: 'mod-student-cv',
    code: 'student_cv',
    name: 'Student Portfolio & Extracurricular CV',
    description: 'Co-curricular achievements, sports leadership, awards portfolio, community service logs, and graduation transcripts.',
    category: 'academic',
    is_core: false,
    default_enabled: false,
    icon: 'UserCheck',
    permissions_provided: ['student_cv.edit', 'student_cv.view', 'student_cv.endorse'],
  },

  // ============================================================================
  // 3. FINANCE & BILLING OPERATIONS
  // ============================================================================
  {
    id: 'mod-fees',
    code: 'fees_collection',
    name: 'Tuition & Fees Billing',
    description: 'Multi-term fee schedules, customizable fee categories, student invoices, offline receipts, discounts, and payment reconciliation.',
    category: 'finance',
    is_core: false,
    default_enabled: true,
    icon: 'Receipt',
    permissions_provided: ['finance.fee_structures', 'finance.invoices', 'finance.collect_payment', 'finance.waivers'],
  },
  {
    id: 'mod-finance',
    code: 'finance',
    name: 'Finance & Office Accounting',
    description: 'Campus operational ledgers, income vouchers, expense approvals, petty cash tracking, balance sheets, and audit trails.',
    category: 'finance',
    is_core: false,
    default_enabled: false,
    icon: 'DollarSign',
    permissions_provided: ['finance.ledgers', 'finance.refunds', 'accounting.expenses', 'accounting.income', 'accounting.reports'],
  },

  // ============================================================================
  // 4. ADMINISTRATIVE & OPERATIONAL
  // ============================================================================
  {
    id: 'mod-hr',
    code: 'human_resources',
    name: 'Human Resources & Faculty',
    description: 'Faculty directory, academic qualifications, employment contracts, leave management, attendance tracking, and payroll slips.',
    category: 'administrative',
    is_core: false,
    default_enabled: true,
    icon: 'Users',
    permissions_provided: ['hr.manage', 'hr.payroll', 'hr.leave'],
  },
  {
    id: 'mod-library',
    code: 'library',
    name: 'Library Management',
    description: 'Book cataloging with ISBN and barcodes, circulation issue/return logs, overdue fine calculations, and digital e-book access.',
    category: 'administrative',
    is_core: false,
    default_enabled: false,
    icon: 'Library',
    permissions_provided: ['library.catalog', 'library.issue'],
  },
  {
    id: 'mod-inventory',
    code: 'inventory',
    name: 'Inventory & Asset Management',
    description: 'Institutional asset registry, school consumables, supplier purchase orders, stock depreciation, and room inventories.',
    category: 'administrative',
    is_core: false,
    default_enabled: false,
    icon: 'Package',
    permissions_provided: ['inventory.manage', 'inventory.audit'],
  },
  {
    id: 'mod-transport',
    code: 'transport',
    name: 'Transport & Fleet Logistics',
    description: 'School bus fleet management, driver rosters, vehicle route scheduling, pickup stops, and passenger manifests.',
    category: 'administrative',
    is_core: false,
    default_enabled: false,
    icon: 'Bus',
    permissions_provided: ['transport.routes', 'transport.manifest'],
  },
  {
    id: 'mod-hostel',
    code: 'hostel',
    name: 'Hostel & Residential Boarding',
    description: 'Dormitory building structures, room and bed assignments, residential warden duties, and boarding student records.',
    category: 'administrative',
    is_core: false,
    default_enabled: false,
    icon: 'Home',
    permissions_provided: ['hostel.rooms', 'hostel.residents'],
  },
  {
    id: 'mod-documents',
    code: 'documents',
    name: 'Document Vault & Transcripts',
    description: 'Encrypted institutional document repository, student identification archives, birth certificates, and immunization records.',
    category: 'administrative',
    is_core: false,
    default_enabled: true,
    icon: 'FolderLock',
    permissions_provided: ['documents.upload', 'documents.view', 'documents.verify'],
  },
  {
    id: 'mod-certificates',
    code: 'certificates',
    name: 'Certificates & Diploma Generator',
    description: 'Customizable diploma designer, school leaving certificates, merit credentials, and tamper-evident QR verification codes.',
    category: 'administrative',
    is_core: false,
    default_enabled: false,
    icon: 'Award',
    permissions_provided: ['certificates.design', 'certificates.issue'],
  },
  {
    id: 'mod-card-management',
    code: 'card_management',
    name: 'ID Cards & Smart Badges',
    description: 'Student ID card generation, faculty smart badge printing, RFID/NFC tag association, and barcode gate passes.',
    category: 'administrative',
    is_core: false,
    default_enabled: false,
    icon: 'CreditCard',
    permissions_provided: ['cards.design', 'cards.print', 'cards.scan'],
  },

  // ============================================================================
  // 5. COMMUNICATION & COMMUNITY
  // ============================================================================
  {
    id: 'mod-communication',
    code: 'communication',
    name: 'Internal Messaging & Circulars',
    description: 'School circulars, teacher-parent direct communication, department chat channels, and emergency notifications.',
    category: 'communication',
    is_core: false,
    default_enabled: true,
    icon: 'MessageSquare',
    permissions_provided: ['comms.broadcast', 'comms.chat'],
  },
  {
    id: 'mod-bulk-messaging',
    code: 'bulk_messaging',
    name: 'Bulk SMS & Email Campaigns',
    description: 'Institutional mass SMS gateway, transactional email broadcasting, announcement templates, and delivery reports.',
    category: 'communication',
    is_core: false,
    default_enabled: false,
    icon: 'Send',
    permissions_provided: ['comms.broadcast', 'bulk_messaging.send', 'bulk_messaging.templates'],
  },
  {
    id: 'mod-calendar',
    code: 'calendar',
    name: 'Institutional Calendar & Schedules',
    description: 'Multi-term institution schedule, exam windows, faculty meetings, public holidays, and academic calendar sync.',
    category: 'communication',
    is_core: false,
    default_enabled: true,
    icon: 'Calendar',
    permissions_provided: ['events.manage', 'events.view'],
  },
  {
    id: 'mod-events',
    code: 'events',
    name: 'Campus Events & Ticketing',
    description: 'Annual sports day, graduation ceremonies, parent-teacher conferences, ticket reservations, and guest registration.',
    category: 'communication',
    is_core: false,
    default_enabled: true,
    icon: 'Calendar',
    permissions_provided: ['events.manage', 'events.view', 'events.ticket'],
  },
  {
    id: 'mod-alumni',
    code: 'alumni',
    name: 'Alumni Network & Graduate Registry',
    description: 'Alumni registry, graduate employment tracking, mentorship networks, alumni reunions, and donor engagement.',
    category: 'communication',
    is_core: false,
    default_enabled: false,
    icon: 'Network',
    permissions_provided: ['alumni.directory', 'alumni.events', 'alumni.outreach'],
  },

  // ============================================================================
  // 6. EXPERIENCE & PLATFORM EXTENSIONS
  // ============================================================================
  {
    id: 'mod-website',
    code: 'institution_website',
    name: 'School CMS & Public Website',
    description: 'Custom-branded public institutional web presence directly linked to live admissions applications, events, and news.',
    category: 'communication',
    is_core: false,
    default_enabled: true,
    icon: 'Globe',
    permissions_provided: ['website.publish', 'website.design', 'website.admissions_link'],
  },
  {
    id: 'mod-analytics',
    code: 'analytics',
    name: 'Institutional Analytics & Trends',
    description: 'Longitudinal enrollment trends, retention metrics, financial yield analytics, and multi-year academic progression graphs.',
    category: 'intelligence',
    is_core: false,
    default_enabled: false,
    icon: 'BarChart3',
    permissions_provided: ['analytics.view', 'analytics.export'],
  },
  {
    id: 'mod-reports',
    code: 'reports',
    name: 'Reports & Regulatory Exports',
    description: 'Ministry and regulatory compliance reporting, statistical census generators, custom tabular exports, and PDF digests.',
    category: 'administrative',
    is_core: false,
    default_enabled: true,
    icon: 'FileSpreadsheet',
    permissions_provided: ['reports.generate', 'reports.export'],
  },
  {
    id: 'mod-multi-class',
    code: 'multi_class',
    name: 'Multi-Class & Cross-Section Groups',
    description: 'Cross-class instructional streams, elective cohort groups, joint-section lessons, and synchronized multi-class timetabling.',
    category: 'academic',
    is_core: false,
    default_enabled: false,
    icon: 'Layers',
    permissions_provided: ['classes.manage', 'classes.stream'],
  },

  // ============================================================================
  // 7. INTELLIGENCE & AUTOMATION
  // ============================================================================
  {
    id: 'mod-ai-intelligence',
    code: 'ai_intelligence',
    name: 'ACADEEMIA AI Intelligence Hub',
    description: 'Tenant-isolated machine learning analytics, early student risk alerts, automated financial insights, and executive summaries.',
    category: 'intelligence',
    is_core: false,
    default_enabled: true,
    icon: 'Sparkles',
    permissions_provided: ['ai.assistant', 'ai.predictive', 'ai.audit'],
  },
];

/**
 * Standard module code normalization table to support common aliases
 */
export const MODULE_CODE_ALIASES: Record<string, string> = {
  examinations: 'exams',
  online_exam: 'exams',
  office_accounting: 'finance',
  student_accounting: 'fees_collection',
  events_calendar: 'calendar',
  website_cms: 'institution_website',
  ai_analytics: 'ai_intelligence',
  certificates_cards: 'certificates',
  multi_branch: 'multi_class', // Map legacy multi_branch to canonical multi_class
};

/**
 * Resolves a module code or alias to its primary canonical code
 */
export function normalizeModuleCode(code: string): string {
  if (!code) return '';
  const trimmed = code.trim().toLowerCase();
  return MODULE_CODE_ALIASES[trimmed] || trimmed;
}

/**
 * Look up a module definition by code or recognized alias
 */
export function getModuleByCode(code: string): ModuleDefinition | undefined {
  const normalized = normalizeModuleCode(code);
  return SYSTEM_MODULES.find((m) => m.code === normalized || m.code === code);
}

/**
 * Filter modules by category
 */
export function getModulesByCategory(category: ModuleCategory): ModuleDefinition[] {
  return SYSTEM_MODULES.filter((m) => m.category === category);
}

/**
 * Set of core module codes that can never be disabled
 */
export const CORE_MODULE_CODES = new Set<string>(
  SYSTEM_MODULES.filter((m) => m.is_core).map((m) => m.code)
);

/**
 * Predefined Platform Packages for tiered licensing
 * Note: Pricing figures represent demonstration and baseline configuration data,
 * subject to commercial institutional contracts.
 */
export const DEFAULT_PACKAGES: Array<Omit<Package, 'id'> & { id: string }> = [
  {
    id: 'e69a1bf8-5dc5-4a07-948d-59d94eb74c58',
    name: 'Essential Academy',
    slug: 'essential-academy',
    description: 'Foundational Student Information System, Academic hierarchy, Attendance, Calendar, Communication, and School Website for modern schools.',
    billing_cycle: 'annual',
    price_cents: 29900,
    currency: 'USD',
    included_modules: [
      'student_management',
      'academics',
      'attendance',
      'calendar',
      'communication',
      'institution_website',
      'reports',
    ],
    limits: {
      max_students: 500,
      max_campuses: 1,
      max_staff: 50,
      storage_gb: 100,
      max_administrators: 5,
      ai_tokens_monthly: 50000,
      max_monthly_messages: 5000,
    },
    is_active: true,
  },
  {
    id: 'c5208b5f-9721-4d3e-8cb5-45a86d267980',
    name: 'Professional School',
    slug: 'professional-school',
    description: 'Expanded operational suite including Admissions, Examinations, Homework, Lesson Plans, Finance, Document Vault, and Analytics.',
    billing_cycle: 'annual',
    price_cents: 54900,
    currency: 'USD',
    included_modules: [
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
      'analytics',
    ],
    limits: {
      max_students: 1500,
      max_campuses: 3,
      max_staff: 150,
      storage_gb: 300,
      max_administrators: 15,
      ai_tokens_monthly: 200000,
      max_monthly_messages: 25000,
    },
    is_active: true,
  },
  {
    id: 'b911bdf6-3df4-40d0-adc3-380e29dd555a',
    name: 'Omni-Campus Enterprise',
    slug: 'omni-campus-enterprise',
    description: 'The ultimate enterprise solution with all 29 operational and intelligence modules, Cross-Section Groups, Fleet Logistics, and AI Analytics.',
    billing_cycle: 'annual',
    price_cents: 99900,
    currency: 'USD',
    included_modules: [
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
      'analytics',
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
      'ai_intelligence',
    ],
    limits: {
      max_students: 5000,
      max_campuses: 10,
      max_staff: 500,
      storage_gb: 1000,
      max_administrators: 50,
      ai_tokens_monthly: 1000000,
      max_monthly_messages: 100000,
    },
    is_active: true,
  },
];
