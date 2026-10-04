import { InstitutionRole, PlatformRole, RoleDefinition } from '../types';

export const PLATFORM_ROLES_CONFIG: Record<PlatformRole, { label: string; description: string }> = {
  platform_admin: {
    label: 'Platform Administrator',
    description: 'Complete root access to all ACADEEMIA platform operations, institutions, billing, and infrastructure.',
  },
  platform_staff: {
    label: 'Platform Staff',
    description: 'Operational access to manage institution onboarding, support tickets, and platform health.',
  },
  platform_support: {
    label: 'Platform Support Engineer',
    description: 'Read-only diagnostics and customer support across institution configurations.',
  },
  platform_sales: {
    label: 'Platform Growth & Sales',
    description: 'CRM, prospective institution leads, demo environments, and subscription proposals.',
  },
};

export const INSTITUTION_ROLES_CONFIG: Record<InstitutionRole, { label: string; description: string; defaultPermissions: string[] }> = {
  institution_owner: {
    label: 'Institution Owner',
    description: 'Executive authority with full administrative, financial, academic, and contractual control over the institution.',
    defaultPermissions: ['*'],
  },
  institution_admin: {
    label: 'Institution Administrator',
    description: 'Day-to-day administrative authority over campuses, staff, academic sessions, and core settings.',
    defaultPermissions: [
      'students.read', 'students.write', 'students.export',
      'academics.manage', 'academics.view',
      'admissions.manage', 'admissions.review',
      'attendance.mark', 'attendance.view',
      'exams.create', 'exams.grade', 'exams.publish',
      'hr.manage', 'hr.leave',
      'finance.invoices', 'finance.collect_payment',
      'comms.broadcast', 'events.manage',
      'website.publish', 'website.design',
      'ai.assistant', 'ai.predictive'
    ],
  },
  principal: {
    label: 'Principal / Head of School',
    description: 'Academic and instructional leader with oversight over academic standards, students, faculty, and reporting.',
    defaultPermissions: [
      'students.read', 'students.write', 'students.export',
      'academics.manage', 'academics.view',
      'attendance.view', 'attendance.reports',
      'exams.grade', 'exams.publish',
      'hr.leave',
      'comms.broadcast', 'events.manage',
      'ai.assistant', 'ai.predictive'
    ],
  },
  school_admin: {
    label: 'School Operations Officer',
    description: 'Operational coordinator managing daily schedules, enrollments, and front office workflows.',
    defaultPermissions: [
      'students.read', 'students.write',
      'academics.view', 'attendance.view',
      'admissions.manage', 'comms.broadcast', 'events.manage'
    ],
  },
  teacher: {
    label: 'Teacher / Faculty',
    description: 'Instructional staff managing assigned classes, student attendance, lesson plans, assignments, and grades.',
    defaultPermissions: [
      'students.read',
      'academics.view',
      'attendance.mark', 'attendance.view',
      'homework.create', 'homework.grade',
      'exams.grade',
      'events.view',
      'ai.assistant'
    ],
  },
  student: {
    label: 'Student / Scholar',
    description: 'Self-service portal for enrolled learners to view timetables, submit homework, see grades, and attendance.',
    defaultPermissions: [
      'students.read_self',
      'timetable.view',
      'homework.submit',
      'exams.view_self',
      'attendance.view_self',
      'finance.view_self'
    ],
  },
  parent_guardian: {
    label: 'Parent / Legal Guardian',
    description: 'Family portal for linked children, fee payment, progress reports, attendance monitoring, and teacher messages.',
    defaultPermissions: [
      'students.read_children',
      'attendance.view_children',
      'exams.view_children',
      'finance.view_children',
      'finance.collect_payment',
      'comms.chat'
    ],
  },
  accountant: {
    label: 'Bursar / Accountant',
    description: 'Financial officer managing fee structures, invoicing, fee collections, payment reconciliation, and ledger audits.',
    defaultPermissions: [
      'finance.fee_structures', 'finance.invoices', 'finance.collect_payment',
      'finance.waivers', 'finance.ledgers', 'finance.refunds',
      'students.read', 'ai.assistant'
    ],
  },
  hr_manager: {
    label: 'Human Resources Director',
    description: 'Personnel manager handling employee records, contracts, onboarding, leave requests, and payroll records.',
    defaultPermissions: [
      'hr.manage', 'hr.payroll', 'hr.leave',
      'events.manage'
    ],
  },
  librarian: {
    label: 'Librarian',
    description: 'Cataloger and custodian of physical and digital library assets and circulation records.',
    defaultPermissions: [
      'library.catalog', 'library.issue', 'students.read'
    ],
  },
  transport_manager: {
    label: 'Transport & Logistics Lead',
    description: 'Fleet manager overseeing bus routes, stops, vehicle inspections, and student transportation manifests.',
    defaultPermissions: [
      'transport.routes', 'transport.manifest', 'students.read'
    ],
  },
  hostel_manager: {
    label: 'Hostel Warden / Residential Dean',
    description: 'Manager of boarding facilities, room allocations, bed counts, and student pastoral care in dorms.',
    defaultPermissions: [
      'hostel.rooms', 'hostel.residents', 'students.read'
    ],
  },
  receptionist: {
    label: 'Front Office Receptionist',
    description: 'First point of institutional contact handling visitor sign-ins, dispatch, and general parent inquiries.',
    defaultPermissions: [
      'front_office.visitors', 'front_office.dispatch',
      'admissions.review', 'students.read'
    ],
  },
  custom_role: {
    label: 'Custom Configured Role',
    description: 'Custom tailor-made institutional role with bespoke permission delegations.',
    defaultPermissions: [],
  },
};

/**
 * Checks whether an active role with optional custom permission overrides can execute a target action
 */
export function hasPermission(
  role: InstitutionRole | PlatformRole,
  customPermissions: string[] = [],
  requiredPermission: string,
  isPlatformAdmin = false
): boolean {
  if (isPlatformAdmin) return true;
  if (role === 'institution_owner') return true;

  // Direct wildcard
  if (customPermissions.includes('*') || customPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check default institutional role permissions
  if (role in INSTITUTION_ROLES_CONFIG) {
    const defaults = INSTITUTION_ROLES_CONFIG[role as InstitutionRole].defaultPermissions;
    if (defaults.includes('*') || defaults.includes(requiredPermission)) {
      return true;
    }
  }

  return false;
}
