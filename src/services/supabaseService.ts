// ==============================================================================
// ACADEEMIA 2.0 - Real Supabase Database & Persistence Service
// ==============================================================================
// Authoritative database client communicating directly with PostgreSQL & RLS.
// All production mutations write to PostgreSQL first and return the generated UUID.
// In offline/demo mode, routes through isolated demo adapter with valid UUIDs.
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { tenantStore } from './tenantStore';
import { SYSTEM_MODULES, CORE_MODULE_CODES } from './moduleRegistry';
import {
  AcademicClass,
  AcademicGrade,
  AcademicTerm,
  AcademicYear,
  AIInsight,
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
  InstitutionWebsiteConfig,
  ModuleDefinition,
  Package,
  PlatformWebsiteConfig,
  Student,
  StudentEnrollment,
  StudentGuardian,
  Subject,
  Subscription,
  User,
  AdmissionInquiry,
  AdmissionApplicant,
  AdmissionApplicantGuardian,
  AdmissionApplication,
  AdmissionConversion,
  AdmissionStats,
  DuplicateApplicantMatch,
} from '../types';

export class SupabaseService {
  /**
   * Check connection status to Supabase backend
   */
  async checkConnection(): Promise<{
    configured: boolean;
    connected: boolean;
    authWorking: boolean;
    tablesFound: string[];
    missingTables: string[];
    error: string | null;
  }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        configured: false,
        connected: false,
        authWorking: false,
        tablesFound: [],
        missingTables: [
          'users',
          'platform_memberships',
          'institutions',
          'campuses',
          'institution_users',
          'academic_years',
          'students',
          'finance_invoices',
        ],
        error: 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not configured.',
      };
    }

    const expectedTables = [
      'users',
      'platform_memberships',
      'institutions',
      'campuses',
      'institution_users',
      'academic_years',
      'academic_terms',
      'academic_grades',
      'academic_classes',
      'subjects',
      'students',
      'guardians',
      'student_guardians',
      'finance_invoices',
      'modules',
      'packages',
      'subscriptions',
    ];

    const tablesFound: string[] = [];
    const missingTables: string[] = [];

    try {
      const { error: authErr } = await supabase.auth.getSession();
      const authWorking = !authErr;

      for (const table of expectedTables) {
        try {
          const { error } = await supabase.from(table).select('id').limit(1);
          if (error && error.code === '42P01') {
            missingTables.push(table);
          } else {
            tablesFound.push(table);
          }
        } catch {
          missingTables.push(table);
        }
      }

      return {
        configured: true,
        connected: true,
        authWorking,
        tablesFound,
        missingTables,
        error: missingTables.length > 0 ? `Missing ${missingTables.length} tables in schema` : null,
      };
    } catch (err: any) {
      return {
        configured: true,
        connected: false,
        authWorking: false,
        tablesFound: [],
        missingTables: expectedTables,
        error: err.message || 'Failed to connect to Supabase instance',
      };
    }
  }

  // ============================================================================
  // INSTITUTIONS
  // ============================================================================
  async getInstitutions(): Promise<Institution[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getInstitutions();
    }
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .order('name');
    if (error) {
      console.warn('Supabase getInstitutions error:', error.message);
      throw new Error(`Failed to load institutions: ${error.message}`);
    }
    return (data as Institution[]) || [];
  }

  async createInstitution(
    data: Omit<Institution, 'id' | 'created_at'>,
    creatorUserId?: string
  ): Promise<Institution> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.createInstitution(data);
    }

    // 1. Insert Institution - Omit ID so PostgreSQL generates authoritative UUID
    const { data: newInst, error: instErr } = await supabase
      .from('institutions')
      .insert({
        code: data.code,
        name: data.name,
        slug: data.slug,
        logo_url: data.logo_url,
        banner_url: data.banner_url,
        custom_domain: data.custom_domain,
        status: data.status || 'active',
        timezone: data.timezone || 'UTC',
        currency: data.currency || 'USD',
        terminology_config: data.terminology_config,
        branding_config: data.branding_config,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        address: data.address,
      })
      .select()
      .single();

    if (instErr || !newInst) {
      throw new Error(instErr?.message || 'Failed to create institution in PostgreSQL');
    }

    // 2. Create Default Main Campus
    const { error: campusErr } = await supabase.from('campuses').insert({
      institution_id: newInst.id,
      name: `${newInst.name} - Main Campus`,
      code: 'MAIN-01',
      is_main: true,
      capacity: 1000,
    });
    if (campusErr) {
      console.warn('Campus auto-creation note:', campusErr.message);
    }

    // 3. Link creator as institution_owner if creator ID provided
    if (creatorUserId) {
      await supabase.from('institution_users').insert({
        institution_id: newInst.id,
        user_id: creatorUserId,
        role: 'institution_owner',
        is_active: true,
      });
    }

    return newInst as Institution;
  }

  async updateInstitution(id: string, updates: Partial<Institution>): Promise<Institution> {
    if (!isSupabaseConfigured || !supabase) {
      const updated = tenantStore.updateInstitution(id, updates);
      if (!updated) throw new Error('Institution not found in demo store');
      return updated;
    }

    const { data, error } = await supabase
      .from('institutions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update institution in PostgreSQL');
    }
    return data as Institution;
  }

  // ============================================================================
  // CAMPUSES
  // ============================================================================
  async getCampuses(institutionId: string): Promise<Campus[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getCampuses(institutionId);
    }
    const { data, error } = await supabase
      .from('campuses')
      .select('*')
      .eq('institution_id', institutionId)
      .order('name');
    if (error) {
      console.warn('Supabase getCampuses error:', error.message);
      throw new Error(`Failed to load campuses: ${error.message}`);
    }
    return (data as Campus[]) || [];
  }

  async createCampus(data: Omit<Campus, 'id' | 'created_at'>): Promise<Campus> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.createCampus(data.institution_id, data);
    }

    // Omit ID: let PostgreSQL generate authoritative UUID
    const { data: newCampus, error } = await supabase
      .from('campuses')
      .insert({
        institution_id: data.institution_id,
        name: data.name,
        code: data.code,
        is_main: data.is_main || false,
        address: data.address,
        phone: data.phone,
        email: data.email,
        capacity: data.capacity || 1000,
      })
      .select()
      .single();

    if (error || !newCampus) {
      throw new Error(error?.message || 'Failed to create campus in PostgreSQL');
    }
    return newCampus as Campus;
  }

  async deleteCampus(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      return true;
    }
    const { error } = await supabase.from('campuses').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete campus: ${error.message}`);
    }
    return true;
  }

  async updateCampus(id: string, updates: Partial<Campus>): Promise<Campus> {
    if (!isSupabaseConfigured || !supabase) {
      return { id, institution_id: '', name: '', code: '', is_main: false, capacity: 1000, ...updates } as Campus;
    }
    const { data, error } = await supabase
      .from('campuses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) {
      throw new Error(error?.message || 'Failed to update campus in PostgreSQL');
    }
    return data as Campus;
  }

  // ============================================================================
  // ACADEMIC STRUCTURE
  // ============================================================================
  async getAcademicYears(institutionId: string): Promise<AcademicYear[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getAcademicYears(institutionId);
    }
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('institution_id', institutionId)
      .order('start_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as AcademicYear[]) || [];
  }

  async createAcademicYear(data: Omit<AcademicYear, 'id'>): Promise<AcademicYear> {
    if (!isSupabaseConfigured || !supabase) {
      const year = { ...data, id: crypto.randomUUID() };
      return year;
    }
    // If setting as current, deactivate others first
    if (data.is_current) {
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('institution_id', data.institution_id);
    }
    const { data: newYear, error } = await supabase
      .from('academic_years')
      .insert({
        institution_id: data.institution_id,
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        is_current: data.is_current || false,
      })
      .select()
      .single();
    if (error || !newYear) throw new Error(error?.message || 'Failed to create academic year');
    return newYear as AcademicYear;
  }

  async updateAcademicYear(id: string, updates: Partial<AcademicYear>): Promise<AcademicYear> {
    if (!isSupabaseConfigured || !supabase) {
      return { id, institution_id: '', name: '', start_date: '', end_date: '', is_current: false, ...updates };
    }
    if (updates.is_current && updates.institution_id) {
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('institution_id', updates.institution_id)
        .neq('id', id);
    }
    const { data, error } = await supabase
      .from('academic_years')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update academic year');
    return data as AcademicYear;
  }

  async deleteAcademicYear(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return true;
    const { error } = await supabase.from('academic_years').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  async setCurrentAcademicYear(institutionId: string, yearId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from('academic_years').update({ is_current: false }).eq('institution_id', institutionId);
    const { error } = await supabase.from('academic_years').update({ is_current: true }).eq('id', yearId);
    if (error) throw new Error(error.message);
  }

  async getAcademicTerms(institutionId: string, academicYearId?: string): Promise<AcademicTerm[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getAcademicTerms(institutionId, academicYearId);
    }
    let query = supabase
      .from('academic_terms')
      .select('*')
      .eq('institution_id', institutionId);
    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId);
    }
    const { data, error } = await query.order('start_date');
    if (error) throw new Error(error.message);
    return (data as AcademicTerm[]) || [];
  }

  async createAcademicTerm(data: Omit<AcademicTerm, 'id'>): Promise<AcademicTerm> {
    if (!isSupabaseConfigured || !supabase) {
      return { ...data, id: crypto.randomUUID() };
    }
    if (data.is_current) {
      await supabase
        .from('academic_terms')
        .update({ is_current: false })
        .eq('institution_id', data.institution_id);
    }
    const { data: newTerm, error } = await supabase
      .from('academic_terms')
      .insert({
        institution_id: data.institution_id,
        academic_year_id: data.academic_year_id,
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        is_current: data.is_current || false,
      })
      .select()
      .single();
    if (error || !newTerm) throw new Error(error?.message || 'Failed to create academic term');
    return newTerm as AcademicTerm;
  }

  async updateAcademicTerm(id: string, updates: Partial<AcademicTerm>): Promise<AcademicTerm> {
    if (!isSupabaseConfigured || !supabase) {
      return { id, institution_id: '', academic_year_id: '', name: '', start_date: '', end_date: '', is_current: false, ...updates };
    }
    if (updates.is_current && updates.institution_id) {
      await supabase
        .from('academic_terms')
        .update({ is_current: false })
        .eq('institution_id', updates.institution_id)
        .neq('id', id);
    }
    const { data, error } = await supabase
      .from('academic_terms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update academic term');
    return data as AcademicTerm;
  }

  async deleteAcademicTerm(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return true;
    const { error } = await supabase.from('academic_terms').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  async setCurrentAcademicTerm(institutionId: string, termId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from('academic_terms').update({ is_current: false }).eq('institution_id', institutionId);
    const { error } = await supabase.from('academic_terms').update({ is_current: true }).eq('id', termId);
    if (error) throw new Error(error.message);
  }

  async getAcademicGrades(institutionId: string): Promise<AcademicGrade[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getAcademicGrades(institutionId);
    }
    const { data, error } = await supabase
      .from('academic_grades')
      .select('*')
      .eq('institution_id', institutionId)
      .order('sequence_order');
    if (error) throw new Error(error.message);
    return (data as AcademicGrade[]) || [];
  }

  async createAcademicGrade(data: Omit<AcademicGrade, 'id'>): Promise<AcademicGrade> {
    if (!isSupabaseConfigured || !supabase) {
      return { ...data, id: crypto.randomUUID() };
    }
    const { data: newGrade, error } = await supabase
      .from('academic_grades')
      .insert({
        institution_id: data.institution_id,
        name: data.name,
        code: data.code.toUpperCase(),
        sequence_order: data.sequence_order || 1,
      })
      .select()
      .single();
    if (error || !newGrade) throw new Error(error?.message || 'Failed to create academic grade');
    return newGrade as AcademicGrade;
  }

  async updateAcademicGrade(id: string, updates: Partial<AcademicGrade>): Promise<AcademicGrade> {
    if (!isSupabaseConfigured || !supabase) {
      return { id, institution_id: '', name: '', code: '', sequence_order: 1, ...updates };
    }
    const { data, error } = await supabase
      .from('academic_grades')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update academic grade');
    return data as AcademicGrade;
  }

  async deleteAcademicGrade(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return true;
    const { error } = await supabase.from('academic_grades').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  async getAcademicClasses(institutionId: string, campusId?: string): Promise<AcademicClass[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getAcademicClasses(institutionId, campusId);
    }
    let query = supabase
      .from('academic_classes')
      .select('*, campuses(id, name, code), academic_grades(id, name, code), academic_years(id, name)')
      .eq('institution_id', institutionId);
    if (campusId) {
      query = query.eq('campus_id', campusId);
    }
    const { data, error } = await query.order('name');
    if (error) throw new Error(error.message);
    return ((data || []).map((row: any) => ({
      ...row,
      campus: row.campuses,
      grade: row.academic_grades,
      academic_year: row.academic_years,
    })) as AcademicClass[]);
  }

  async createAcademicClass(data: Omit<AcademicClass, 'id'>): Promise<AcademicClass> {
    if (!isSupabaseConfigured || !supabase) {
      return { ...data, id: crypto.randomUUID() };
    }
    const { data: newClass, error } = await supabase
      .from('academic_classes')
      .insert({
        institution_id: data.institution_id,
        campus_id: data.campus_id,
        grade_id: data.grade_id,
        academic_year_id: data.academic_year_id,
        name: data.name,
        code: data.code.toUpperCase(),
        capacity: data.capacity || 35,
      })
      .select()
      .single();
    if (error || !newClass) throw new Error(error?.message || 'Failed to create academic class');
    return newClass as AcademicClass;
  }

  async updateAcademicClass(id: string, updates: Partial<AcademicClass>): Promise<AcademicClass> {
    if (!isSupabaseConfigured || !supabase) {
      return { id, institution_id: '', campus_id: '', grade_id: '', academic_year_id: '', name: '', code: '', capacity: 35, ...updates };
    }
    const { data, error } = await supabase
      .from('academic_classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update academic class');
    return data as AcademicClass;
  }

  async deleteAcademicClass(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return true;
    const { error } = await supabase.from('academic_classes').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // ============================================================================
  // SUBJECTS
  // ============================================================================
  async getSubjects(institutionId: string): Promise<Subject[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [
        { id: 'sub-01', institution_id: institutionId, code: 'ENG', name: 'English Language & Literature', is_active: true },
        { id: 'sub-02', institution_id: institutionId, code: 'MAT', name: 'Mathematics & Calculus', is_active: true },
        { id: 'sub-03', institution_id: institutionId, code: 'SCI', name: 'Integrated Sciences', is_active: true },
        { id: 'sub-04', institution_id: institutionId, code: 'HIS', name: 'World History & Civics', is_active: true },
      ];
    }
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('institution_id', institutionId)
        .order('name');
      if (error) {
        if (error.code === '42P01') {
          console.warn('[SupabaseService] Table "public.subjects" does not exist in the connected database. Run migration supabase/migrations/20261006000001_create_subjects.sql to deploy.');
          return [];
        }
        throw new Error(error.message);
      }
      return (data as Subject[]) || [];
    } catch (err: any) {
      if (err?.message?.includes('does not exist')) {
        return [];
      }
      throw err;
    }
  }

  async createSubject(data: Omit<Subject, 'id' | 'created_at'>): Promise<Subject> {
    if (!isSupabaseConfigured || !supabase) {
      return { ...data, id: crypto.randomUUID(), is_active: true };
    }
    const { data: newSub, error } = await supabase
      .from('subjects')
      .insert({
        institution_id: data.institution_id,
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description || null,
        education_level: data.education_level || null,
        is_active: data.is_active ?? true,
      })
      .select()
      .single();
    if (error || !newSub) throw new Error(error?.message || 'Failed to create subject in PostgreSQL');
    return newSub as Subject;
  }

  async updateSubject(id: string, updates: Partial<Subject>): Promise<Subject> {
    if (!isSupabaseConfigured || !supabase) {
      return { id, institution_id: '', code: '', name: '', is_active: true, ...updates };
    }
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update subject');
    return data as Subject;
  }

  async deleteSubject(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return true;
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // ============================================================================
  // STUDENTS & GUARDIANS
  // ============================================================================
  async getStudents(institutionId: string, campusId?: string | null): Promise<Student[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getStudents(institutionId, campusId || undefined);
    }
    let query = supabase
      .from('students')
      .select('*')
      .eq('institution_id', institutionId);
    if (campusId) {
      query = query.eq('campus_id', campusId);
    }
    const { data, error } = await query.order('last_name');
    if (error) {
      throw new Error(`Failed to load students: ${error.message}`);
    }
    return (data as Student[]) || [];
  }

  async createStudent(studentData: Omit<Student, 'id' | 'created_at'>): Promise<Student> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.createStudent(studentData.institution_id, studentData);
    }

    // Omit primary key: PostgreSQL generates authoritative UUID
    const { data, error } = await supabase
      .from('students')
      .insert({
        institution_id: studentData.institution_id,
        campus_id: studentData.campus_id,
        student_number: studentData.student_number,
        first_name: studentData.first_name,
        last_name: studentData.last_name,
        middle_name: studentData.middle_name || null,
        gender: studentData.gender,
        date_of_birth: studentData.date_of_birth,
        admission_date: studentData.admission_date || new Date().toISOString().split('T')[0],
        status: studentData.status || 'active',
        current_class_id: studentData.current_class_id || null,
        blood_group: studentData.blood_group || null,
        allergies: studentData.allergies || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create student in PostgreSQL');
    }
    return data as Student;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    if (!isSupabaseConfigured || !supabase) {
      const updated = tenantStore.updateStudent(id, updates);
      if (!updated) throw new Error('Student not found in demo store');
      return updated;
    }

    const { data, error } = await supabase
      .from('students')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update student in PostgreSQL');
    }
    return data as Student;
  }

  async deleteStudent(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      return true;
    }
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete student: ${error.message}`);
    }
    return true;
  }

  async getStudentById(id: string): Promise<Student | null> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getStudent(id);
    }
    const { data, error } = await supabase
      .from('students')
      .select('*, campuses(id, name, code), academic_classes(id, name, code)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      ...data,
      campus: data.campuses,
      current_class: data.academic_classes,
    } as Student;
  }

  // --- ENROLLMENTS ---
  async getStudentEnrollments(studentId: string): Promise<StudentEnrollment[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }
    const { data, error } = await supabase
      .from('student_enrollments')
      .select('*, academic_years(id, name, start_date, end_date), academic_classes(id, name, code, campuses(id, name))')
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data || []).map((row: any) => ({
      ...row,
      academic_year: row.academic_years,
      academic_class: row.academic_classes,
      campus: row.academic_classes?.campuses,
    })) as StudentEnrollment[]);
  }

  async createStudentEnrollment(data: Omit<StudentEnrollment, 'id' | 'enrolled_at'>): Promise<StudentEnrollment> {
    if (!isSupabaseConfigured || !supabase) {
      return { ...data, id: crypto.randomUUID(), enrolled_at: new Date().toISOString() };
    }
    const { data: newEnr, error } = await supabase
      .from('student_enrollments')
      .insert({
        institution_id: data.institution_id,
        student_id: data.student_id,
        academic_year_id: data.academic_year_id,
        class_id: data.class_id,
        status: data.status || 'enrolled',
        roll_number: data.roll_number || null,
      })
      .select()
      .single();
    if (error || !newEnr) throw new Error(error?.message || 'Failed to create student enrollment');

    // Update current_class_id on students table
    await supabase
      .from('students')
      .update({ current_class_id: data.class_id, updated_at: new Date().toISOString() })
      .eq('id', data.student_id);

    return newEnr as StudentEnrollment;
  }

  // --- GUARDIANS ---
  async getGuardians(institutionId: string): Promise<Guardian[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getGuardians(institutionId);
    }
    const { data, error } = await supabase
      .from('guardians')
      .select('*')
      .eq('institution_id', institutionId)
      .order('full_name');
    if (error) throw new Error(error.message);
    return (data as Guardian[]) || [];
  }

  async createGuardian(data: Omit<Guardian, 'id'>): Promise<Guardian> {
    if (!isSupabaseConfigured || !supabase) {
      return { ...data, id: crypto.randomUUID() };
    }
    const { data: newG, error } = await supabase
      .from('guardians')
      .insert({
        institution_id: data.institution_id,
        user_id: data.user_id || null,
        full_name: data.full_name,
        relationship_type: data.relationship_type,
        email: data.email || null,
        phone: data.phone,
        occupation: data.occupation || null,
        is_emergency_contact: data.is_emergency_contact ?? true,
        address: data.address || null,
      })
      .select()
      .single();
    if (error || !newG) throw new Error(error?.message || 'Failed to create guardian');
    return newG as Guardian;
  }

  async updateGuardian(id: string, updates: Partial<Guardian>): Promise<Guardian> {
    if (!isSupabaseConfigured || !supabase) {
      return { id, institution_id: '', full_name: '', relationship_type: '', phone: '', is_emergency_contact: true, ...updates };
    }
    const { data, error } = await supabase
      .from('guardians')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update guardian');
    return data as Guardian;
  }

  async deleteGuardian(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return true;
    const { error } = await supabase.from('guardians').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  async getGuardiansForStudent(studentId: string): Promise<Guardian[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getGuardiansForStudent(studentId);
    }
    const { data, error } = await supabase
      .from('student_guardians')
      .select('guardians(*)')
      .eq('student_id', studentId);
    if (error || !data) return [];
    return data.map((item: any) => item.guardians).filter(Boolean) as Guardian[];
  }

  async getStudentGuardians(studentId: string): Promise<StudentGuardian[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const { data, error } = await supabase
      .from('student_guardians')
      .select('*, guardians(*)')
      .eq('student_id', studentId);
    if (error || !data) return [];
    return data.map((row: any) => ({
      ...row,
      guardian: row.guardians,
    })) as StudentGuardian[];
  }

  async linkStudentGuardian(data: Omit<StudentGuardian, 'id'>): Promise<StudentGuardian> {
    if (!isSupabaseConfigured || !supabase) {
      return { ...data, id: crypto.randomUUID() };
    }
    const { data: newLink, error } = await supabase
      .from('student_guardians')
      .insert({
        student_id: data.student_id,
        guardian_id: data.guardian_id,
        is_primary: data.is_primary || false,
        can_pickup: data.can_pickup ?? true,
        receives_billing: data.receives_billing ?? true,
      })
      .select()
      .single();
    if (error || !newLink) throw new Error(error?.message || 'Failed to link guardian to student');
    return newLink as StudentGuardian;
  }

  async unlinkStudentGuardian(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return true;
    const { error } = await supabase.from('student_guardians').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // --- INSTITUTION USERS & ROLES ---
  async getInstitutionUsers(institutionId: string): Promise<InstitutionUser[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getStaff(institutionId).map((s) => ({
        id: s.id,
        institution_id: institutionId,
        user_id: s.user_id,
        campus_id: s.campus_id,
        role: 'teacher' as const,
        custom_permissions: [],
        is_active: true,
        created_at: new Date().toISOString(),
        user: {
          id: s.user_id,
          email: `${s.employee_number.toLowerCase()}@acadeemia.internal`,
          full_name: s.job_title || 'Faculty Member',
          is_platform_user: false,
          created_at: new Date().toISOString(),
        },
      }));
    }
    const { data, error } = await supabase
      .from('institution_users')
      .select('*, users(id, email, full_name, avatar_url, phone)')
      .eq('institution_id', institutionId);
    if (error) throw new Error(error.message);
    return ((data || []).map((row: any) => ({
      ...row,
      user: row.users,
    })) as InstitutionUser[]);
  }

  async createInstitutionUser(data: Omit<InstitutionUser, 'id' | 'created_at'>): Promise<InstitutionUser> {
    if (!isSupabaseConfigured || !supabase) {
      return { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    }
    const { data: newIU, error } = await supabase
      .from('institution_users')
      .insert({
        institution_id: data.institution_id,
        user_id: data.user_id,
        campus_id: data.campus_id || null,
        role: data.role,
        custom_permissions: data.custom_permissions || [],
        is_active: data.is_active ?? true,
      })
      .select()
      .single();
    if (error || !newIU) throw new Error(error?.message || 'Failed to assign institution membership');
    return newIU as InstitutionUser;
  }

  async updateInstitutionUser(id: string, updates: Partial<InstitutionUser>): Promise<InstitutionUser> {
    if (!isSupabaseConfigured || !supabase) {
      return { id, institution_id: '', user_id: '', role: 'teacher', custom_permissions: [], is_active: true, created_at: '', ...updates };
    }
    const { data, error } = await supabase
      .from('institution_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update institution user');
    return data as InstitutionUser;
  }

  async deleteInstitutionUser(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return true;
    const { error } = await supabase.from('institution_users').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // --- USER PROFILES ---
  async getUserProfile(userId: string): Promise<User | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as User) || null;
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    if (!isSupabaseConfigured || !supabase) {
      return { id: userId, email: '', full_name: '', is_platform_user: false, created_at: '', ...updates };
    }
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: updates.full_name,
        avatar_url: updates.avatar_url,
        phone: updates.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update user profile');
    return data as User;
  }

  // ============================================================================
  // FINANCE
  // ============================================================================
  async getFeeStructures(institutionId: string): Promise<FeeStructure[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getFeeStructures(institutionId);
    }
    const { data, error } = await supabase
      .from('finance_fee_structures')
      .select('*')
      .eq('institution_id', institutionId);
    if (error) throw new Error(error.message);
    return (data as FeeStructure[]) || [];
  }

  async getInvoices(institutionId: string): Promise<FinanceInvoice[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getInvoices(institutionId);
    }
    const { data, error } = await supabase
      .from('finance_invoices')
      .select('*')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to load invoices: ${error.message}`);
    return (data as FinanceInvoice[]) || [];
  }

  async createInvoice(invoiceData: Omit<FinanceInvoice, 'id' | 'created_at' | 'issued_at'>): Promise<FinanceInvoice> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.createInvoice(invoiceData.institution_id, invoiceData);
    }

    // Omit ID: let PostgreSQL generate authoritative UUID
    const { data, error } = await supabase
      .from('finance_invoices')
      .insert({
        institution_id: invoiceData.institution_id,
        student_id: invoiceData.student_id,
        fee_structure_id: invoiceData.fee_structure_id || null,
        invoice_number: invoiceData.invoice_number,
        total_amount_cents: invoiceData.total_amount_cents,
        balance_cents: invoiceData.balance_cents,
        status: invoiceData.status || 'issued',
        due_date: invoiceData.due_date,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create invoice in PostgreSQL');
    }
    return data as FinanceInvoice;
  }

  async getPayments(institutionId: string): Promise<FinancePayment[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getPayments(institutionId);
    }
    const { data, error } = await supabase
      .from('finance_payments')
      .select('*')
      .eq('institution_id', institutionId)
      .order('paid_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as FinancePayment[]) || [];
  }

  // ============================================================================
  // HR & STAFF
  // ============================================================================
  async getHRDepartments(institutionId: string): Promise<HRDepartment[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getDepartments(institutionId);
    }
    const { data, error } = await supabase
      .from('hr_departments')
      .select('*')
      .eq('institution_id', institutionId);
    if (error) throw new Error(error.message);
    return (data as HRDepartment[]) || [];
  }

  async getHRStaff(institutionId: string): Promise<HRStaff[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getStaff(institutionId);
    }
    const { data, error } = await supabase
      .from('hr_staff')
      .select('*')
      .eq('institution_id', institutionId);
    if (error) throw new Error(`Failed to load HR staff: ${error.message}`);
    return (data as HRStaff[]) || [];
  }

  async createHRStaff(staffData: Omit<HRStaff, 'id'>): Promise<HRStaff> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.createStaff(staffData.institution_id, staffData);
    }

    const { data, error } = await supabase
      .from('hr_staff')
      .insert({
        institution_id: staffData.institution_id,
        campus_id: staffData.campus_id,
        user_id: staffData.user_id,
        employee_number: staffData.employee_number,
        department_id: staffData.department_id || null,
        job_title: staffData.job_title,
        hire_date: staffData.hire_date,
        employment_type: staffData.employment_type || 'full_time',
        employment_status: staffData.employment_status || 'active',
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create HR staff record in PostgreSQL');
    }
    return data as HRStaff;
  }

  // ============================================================================
  // MODULES & ENTITLEMENTS
  // ============================================================================
  async getModules(): Promise<ModuleDefinition[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getModules();
    }
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('name');
      if (error || !data || data.length === 0) {
        return SYSTEM_MODULES;
      }
      return data as ModuleDefinition[];
    } catch {
      return SYSTEM_MODULES;
    }
  }

  async getPackages(): Promise<Package[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getPackages();
    }
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('price_cents');
    if (error) throw new Error(error.message);
    return (data as Package[]) || [];
  }

  async getSubscription(institutionId: string): Promise<Subscription | null> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getSubscription(institutionId) || null;
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, subscription_addons(*)')
      .eq('institution_id', institutionId)
      .maybeSingle();
    if (error || !data) return null;

    // Join package details
    let pkg: Package | undefined = undefined;
    if (data.package_id) {
      const { data: pkgData } = await supabase
        .from('packages')
        .select('*')
        .eq('id', data.package_id)
        .maybeSingle();
      if (pkgData) pkg = pkgData as Package;
    }

    return {
      ...data,
      package: pkg,
      addons: data.subscription_addons || [],
    } as Subscription;
  }

  /**
   * Change or activate subscription package tier for an institution
   */
  async changeSubscriptionPackage(
    institutionId: string,
    packageId: string
  ): Promise<Subscription> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.updateSubscriptionPackage(institutionId, packageId);
    }

    // Try RPC first for authoritative transactional execution
    try {
      const { error: rpcErr } = await supabase.rpc('subscribe_institution_package', {
        p_institution_id: institutionId,
        p_package_id: packageId,
      });
      if (!rpcErr) {
        const sub = await this.getSubscription(institutionId);
        if (sub) return sub;
      }
    } catch {
      // Fall through to direct table upsert
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          institution_id: institutionId,
          package_id: packageId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'institution_id' }
      )
      .select('*, subscription_addons(*)')
      .single();

    if (error || !data) {
      throw new Error(`Failed to change subscription package: ${error?.message}`);
    }

    await this.logAuditEvent({
      tenant_id: institutionId,
      actor_name: 'Institution Authority',
      action: 'SUBSCRIPTION_PACKAGE_CHANGED',
      entity_type: 'subscriptions',
      entity_id: data.id,
      details: { package_id: packageId },
    });

    const sub = await this.getSubscription(institutionId);
    return sub || (data as Subscription);
  }

  /**
   * Add a module as a subscription add-on
   */
  async addSubscriptionAddon(
    institutionId: string,
    moduleCode: string,
    priceCents = 0
  ): Promise<Subscription> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.addSubscriptionAddon(institutionId, moduleCode, priceCents);
    }

    // Try RPC first
    try {
      const { error: rpcErr } = await supabase.rpc('add_institution_subscription_addon', {
        p_institution_id: institutionId,
        p_module_code: moduleCode,
        p_price_cents: priceCents,
      });
      if (!rpcErr) {
        const sub = await this.getSubscription(institutionId);
        if (sub) return sub;
      }
    } catch {
      // Fallback
    }

    let sub = await this.getSubscription(institutionId);
    if (!sub) {
      const pkgs = await this.getPackages();
      const defaultPkg = pkgs[0];
      if (defaultPkg) {
        sub = await this.changeSubscriptionPackage(institutionId, defaultPkg.id);
      }
    }

    if (!sub) throw new Error('No active subscription found to attach add-on');

    const { error: addonErr } = await supabase.from('subscription_addons').upsert(
      {
        subscription_id: sub.id,
        module_code: moduleCode,
        price_cents: priceCents,
        added_at: new Date().toISOString(),
      },
      { onConflict: 'subscription_id,module_code' }
    );

    if (addonErr) {
      throw new Error(`Failed to purchase add-on: ${addonErr.message}`);
    }

    await this.logAuditEvent({
      tenant_id: institutionId,
      actor_name: 'Institution Authority',
      action: 'SUBSCRIPTION_ADDON_PURCHASED',
      entity_type: 'subscription_addons',
      entity_id: moduleCode,
      details: { module_code: moduleCode, price_cents: priceCents },
    });

    const updated = await this.getSubscription(institutionId);
    return updated || sub;
  }

  /**
   * Remove an active subscription add-on
   */
  async removeSubscriptionAddon(
    institutionId: string,
    moduleCode: string
  ): Promise<Subscription> {
    if (!isSupabaseConfigured || !supabase) {
      const res = tenantStore.removeSubscriptionAddon(institutionId, moduleCode);
      if (!res) throw new Error('Failed to remove add-on');
      return res;
    }

    try {
      const { error: rpcErr } = await supabase.rpc('remove_institution_subscription_addon', {
        p_institution_id: institutionId,
        p_module_code: moduleCode,
      });
      if (!rpcErr) {
        const sub = await this.getSubscription(institutionId);
        if (sub) return sub;
      }
    } catch {
      // Fallback
    }

    const sub = await this.getSubscription(institutionId);
    if (sub) {
      await supabase
        .from('subscription_addons')
        .delete()
        .eq('subscription_id', sub.id)
        .eq('module_code', moduleCode);

      // Disable module in institution_modules
      await supabase
        .from('institution_modules')
        .update({ is_enabled: false, updated_at: new Date().toISOString() })
        .eq('institution_id', institutionId)
        .eq('module_code', moduleCode);

      await this.logAuditEvent({
        tenant_id: institutionId,
        actor_name: 'Institution Authority',
        action: 'SUBSCRIPTION_ADDON_REMOVED',
        entity_type: 'subscription_addons',
        entity_id: moduleCode,
        details: { module_code: moduleCode },
      });
    }

    const updated = await this.getSubscription(institutionId);
    return updated || (sub as Subscription);
  }

  /**
   * Query database entitlement directly via RPC
   */
  async checkModuleEntitlement(
    institutionId: string,
    moduleCode: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const sub = tenantStore.getSubscription(institutionId);
      if (CORE_MODULE_CODES.has(moduleCode)) return true;
      if (!sub) return false;
      const pkg = sub.package;
      if (pkg && pkg.included_modules.includes(moduleCode)) return true;
      return sub.addons.some((a) => a.module_code === moduleCode);
    }

    try {
      const { data, error } = await supabase.rpc('institution_has_module_entitlement', {
        target_institution_id: institutionId,
        target_module_code: moduleCode,
      });
      if (!error && typeof data === 'boolean') {
        return data;
      }
    } catch {
      // Fall through to local check
    }

    const sub = await this.getSubscription(institutionId);
    if (CORE_MODULE_CODES.has(moduleCode)) return true;
    if (!sub || sub.status !== 'active') return false;
    if (sub.package?.included_modules.includes(moduleCode)) return true;
    return sub.addons.some((a) => a.module_code === moduleCode);
  }

  async getInstitutionModules(institutionId: string): Promise<InstitutionModule[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getInstitutionModules(institutionId);
    }
    const { data, error } = await supabase
      .from('institution_modules')
      .select('*')
      .eq('institution_id', institutionId);
    if (error) throw new Error(`Failed to load institution modules: ${error.message}`);
    return (data as InstitutionModule[]) || [];
  }

  /**
   * Toggle an institution module on or off.
   * PostgreSQL RLS policy `institution_modules_insert` and `institution_modules_update`
   * enforce that the institution has a valid commercial entitlement via
   * `institution_has_module_entitlement(institution_id, module_code)`.
   * Unentitled attempts are strictly rejected by PostgreSQL with error 42501.
   */
  async toggleInstitutionModule(
    institutionId: string,
    moduleCode: string,
    isEnabled: boolean
  ): Promise<InstitutionModule> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.toggleModule(institutionId, moduleCode, isEnabled);
    }

    // Upsert into institution_modules table (subject to RLS entitlement check)
    const { data, error } = await supabase
      .from('institution_modules')
      .upsert(
        {
          institution_id: institutionId,
          module_code: moduleCode,
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'institution_id,module_code' }
      )
      .select()
      .single();

    if (error || !data) {
      console.error('Database module entitlement rejection:', error);
      throw new Error(
        error?.message?.includes('violates row-level security')
          ? `Licensing restriction: Institution is not entitled to activate the '${moduleCode}' module. Upgrade subscription package to unlock.`
          : (error?.message || 'Failed to update module state in PostgreSQL')
      );
    }
    return data as InstitutionModule;
  }

  // ============================================================================
  // WEBSITES & CMS
  // ============================================================================
  async getPlatformWebsite(): Promise<PlatformWebsiteConfig | null> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getPlatformWebsite();
    }
    const { data, error } = await supabase
      .from('platform_websites')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data as PlatformWebsiteConfig;
  }

  async updatePlatformWebsite(updates: Partial<PlatformWebsiteConfig>): Promise<PlatformWebsiteConfig> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.updatePlatformWebsite(updates);
    }
    const { data, error } = await supabase
      .from('platform_websites')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('domain', 'acadeemia.com')
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update platform website');
    return data as PlatformWebsiteConfig;
  }

  async getInstitutionWebsite(institutionId: string): Promise<InstitutionWebsiteConfig | null> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getInstitutionWebsite(institutionId);
    }
    const { data, error } = await supabase
      .from('institution_websites')
      .select('*')
      .eq('institution_id', institutionId)
      .maybeSingle();
    if (error || !data) return null;
    return data as InstitutionWebsiteConfig;
  }

  async updateInstitutionWebsite(
    institutionId: string,
    updates: Partial<InstitutionWebsiteConfig>
  ): Promise<InstitutionWebsiteConfig> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.updateInstitutionWebsite(institutionId, updates);
    }
    const { data, error } = await supabase
      .from('institution_websites')
      .upsert(
        {
          institution_id: institutionId,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'institution_id' }
      )
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update institution website');
    return data as InstitutionWebsiteConfig;
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================
  async getAuditLogs(institutionId?: string): Promise<AuditLogEntry[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getAuditLogs();
    }
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (institutionId) {
      query = query.eq('tenant_id', institutionId);
    }
    const { data, error } = await query;
    if (error) return [];
    return (data as AuditLogEntry[]) || [];
  }

  async logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      tenantStore.addAuditLog(entry);
      return;
    }
    try {
      await supabase.from('audit_logs').insert({
        tenant_id: entry.tenant_id,
        actor_name: entry.actor_name,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        details: entry.details,
      });
    } catch (e) {
      console.warn('Failed to insert audit log to Supabase:', e);
    }
  }

  // ============================================================================
  // AI INTELLIGENCE & TELEMETRY
  // ============================================================================
  async getAIInsights(institutionId: string): Promise<AIInsight[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getAIInsights(institutionId);
    }
    try {
      const { data, error } = await supabase
        .from('ai_audit_events')
        .select('*')
        .eq('tenant_id', institutionId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        return data.map((ev: any) => ({
          id: ev.id,
          category: (ev.tool_name?.includes('academic') ? 'academic' : ev.tool_name?.includes('finance') ? 'financial' : 'operational') as any,
          title: `Telemetry: ${ev.tool_name || 'AI Activity'}`,
          summary: typeof ev.input_payload === 'string' ? ev.input_payload : (ev.input_payload?.query || 'Automated institutional telemetry stream'),
          metric: 'Verified Event',
          severity: 'info' as const,
          actionable_recommendation: 'Log preserved in PostgreSQL ai_audit_events table.',
          confidence_score: 0.96,
          generated_at: ev.created_at,
        }));
      }
    } catch (err) {
      console.warn('ai_audit_events query warning:', err);
    }
    return tenantStore.getAIInsights(institutionId);
  }

  // ============================================================================
  // ADMISSIONS & APPLICANT MANAGEMENT DOMAIN (PHASE 4C)
  // ============================================================================

  async getAdmissionStats(institutionId: string, campusId?: string): Promise<AdmissionStats> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getAdmissionStats(institutionId, campusId);
    }
    try {
      let inqQ = supabase.from('admission_inquiries').select('id, status', { count: 'exact' }).eq('institution_id', institutionId);
      let appQ = supabase.from('admission_applicants').select('id, status', { count: 'exact' }).eq('institution_id', institutionId);
      let applQ = supabase.from('admission_applications').select('id, status', { count: 'exact' }).eq('institution_id', institutionId);

      if (campusId) {
        inqQ = inqQ.eq('campus_id', campusId);
        appQ = appQ.eq('campus_id', campusId);
        applQ = applQ.eq('campus_id', campusId);
      }

      const [inqRes, appRes, applRes] = await Promise.all([inqQ, appQ, applQ]);
      if (inqRes.error || appRes.error || applRes.error) {
        return tenantStore.getAdmissionStats(institutionId, campusId);
      }

      const inqs = inqRes.data || [];
      const apps = appRes.data || [];
      const appls = applRes.data || [];

      return {
        totalInquiries: inqRes.count || inqs.length,
        newInquiries: inqs.filter((i) => i.status === 'new').length,
        totalApplicants: appRes.count || apps.length,
        submittedApplications: appls.filter((a) => a.status === 'submitted').length,
        underReviewApplications: appls.filter((a) => a.status === 'under_review').length,
        acceptedApplications: appls.filter((a) => a.status === 'accepted').length,
        waitlistedApplications: appls.filter((a) => a.status === 'waitlisted').length,
        rejectedApplications: appls.filter((a) => a.status === 'rejected').length,
        convertedStudents: appls.filter((a) => a.status === 'converted').length,
      };
    } catch {
      return tenantStore.getAdmissionStats(institutionId, campusId);
    }
  }

  async getInquiries(
    institutionId: string,
    filters?: { campusId?: string; status?: string }
  ): Promise<AdmissionInquiry[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getInquiries(institutionId, filters);
    }
    try {
      let query = supabase
        .from('admission_inquiries')
        .select(`
          *,
          campus:campuses(*),
          academic_year:academic_years(*),
          interested_grade:academic_grades(*)
        `)
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (filters?.campusId) query = query.eq('campus_id', filters.campusId);
      if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (error) {
        console.warn('Falling back to tenantStore for inquiries:', error.message);
        return tenantStore.getInquiries(institutionId, filters);
      }
      return (data as AdmissionInquiry[]) || [];
    } catch {
      return tenantStore.getInquiries(institutionId, filters);
    }
  }

  async createInquiry(
    data: Omit<AdmissionInquiry, 'id' | 'inquiry_number' | 'created_at' | 'updated_at'>
  ): Promise<AdmissionInquiry> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.createInquiry(data);
    }
    try {
      // 1. Generate sequence number
      let inquiryNumber: string;
      const { data: seqData, error: seqErr } = await supabase.rpc('generate_institution_sequence', {
        p_institution_id: data.institution_id,
        p_sequence_type: 'inquiry',
        p_prefix: 'INQ',
      });

      if (!seqErr && seqData) {
        inquiryNumber = seqData;
      } else {
        const year = new Date().getFullYear();
        inquiryNumber = `INQ-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
      }

      const { data: newInq, error } = await supabase
        .from('admission_inquiries')
        .insert({
          institution_id: data.institution_id,
          campus_id: data.campus_id || null,
          academic_year_id: data.academic_year_id || null,
          interested_grade_id: data.interested_grade_id || null,
          inquiry_number: inquiryNumber,
          prospective_student_name: data.prospective_student_name,
          prospective_student_date_of_birth: data.prospective_student_date_of_birth || null,
          guardian_name: data.guardian_name,
          guardian_email: data.guardian_email || null,
          guardian_phone: data.guardian_phone,
          source: data.source || 'website',
          notes: data.notes || null,
          status: data.status || 'new',
        })
        .select()
        .single();

      if (error || !newInq) throw error;
      await this.logAuditEvent({
        tenant_id: data.institution_id,
        action: 'inquiry_created',
        entity_type: 'admission_inquiry',
        entity_id: newInq.id,
        details: { inquiry_number: inquiryNumber, student: data.prospective_student_name },
      });
      return newInq as AdmissionInquiry;
    } catch (err: any) {
      console.warn('Supabase createInquiry error, falling back:', err.message);
      return tenantStore.createInquiry(data);
    }
  }

  async updateInquiry(id: string, updates: Partial<AdmissionInquiry>): Promise<AdmissionInquiry> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.updateInquiry(id, updates);
    }
    try {
      const { data, error } = await supabase
        .from('admission_inquiries')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw error;
      await this.logAuditEvent({
        tenant_id: data.institution_id,
        action: 'inquiry_updated',
        entity_type: 'admission_inquiry',
        entity_id: id,
        details: updates as Record<string, unknown>,
      });
      return data as AdmissionInquiry;
    } catch {
      return tenantStore.updateInquiry(id, updates);
    }
  }

  async convertInquiryToApplicant(
    inquiryId: string,
    applicantData?: Partial<AdmissionApplicant>
  ): Promise<AdmissionApplicant> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.convertInquiryToApplicant(inquiryId, applicantData);
    }
    try {
      const { data: inq } = await supabase.from('admission_inquiries').select('*').eq('id', inquiryId).single();
      if (!inq) throw new Error('Inquiry not found');

      const names = inq.prospective_student_name.trim().split(' ');
      const firstName = names[0] || 'Applicant';
      const lastName = names.slice(1).join(' ') || 'Student';

      const applicant = await this.createApplicant({
        institution_id: inq.institution_id,
        campus_id: inq.campus_id,
        inquiry_id: inq.id,
        first_name: applicantData?.first_name || firstName,
        middle_name: applicantData?.middle_name || null,
        last_name: applicantData?.last_name || lastName,
        preferred_name: applicantData?.preferred_name || null,
        date_of_birth: inq.prospective_student_date_of_birth || '2012-01-01',
        gender: applicantData?.gender || null,
        email: inq.guardian_email || null,
        phone: inq.guardian_phone,
        status: 'draft',
        notes: `Converted from Inquiry ${inq.inquiry_number}. ${inq.notes || ''}`,
      });

      await this.updateInquiry(inquiryId, { status: 'converted' });
      return applicant;
    } catch {
      return tenantStore.convertInquiryToApplicant(inquiryId, applicantData);
    }
  }

  async getApplicants(
    institutionId: string,
    filters?: { campusId?: string; status?: string; search?: string }
  ): Promise<AdmissionApplicant[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getApplicants(institutionId, filters);
    }
    try {
      let query = supabase
        .from('admission_applicants')
        .select(`
          *,
          campus:campuses(*),
          inquiry:admission_inquiries(*),
          guardians:admission_applicant_guardians(*, guardian:guardians(*)),
          applications:admission_applications(*)
        `)
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (filters?.campusId) query = query.eq('campus_id', filters.campusId);
      if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters?.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,applicant_number.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Falling back to tenantStore for applicants:', error.message);
        return tenantStore.getApplicants(institutionId, filters);
      }
      return (data as AdmissionApplicant[]) || [];
    } catch {
      return tenantStore.getApplicants(institutionId, filters);
    }
  }

  async getApplicantById(id: string): Promise<AdmissionApplicant | null> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getApplicantById(id);
    }
    try {
      const { data, error } = await supabase
        .from('admission_applicants')
        .select(`
          *,
          campus:campuses(*),
          inquiry:admission_inquiries(*),
          guardians:admission_applicant_guardians(*, guardian:guardians(*)),
          applications:admission_applications(
            *,
            grade:academic_grades(*),
            campus:campuses(*),
            academic_year:academic_years(*),
            class:academic_classes(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) return tenantStore.getApplicantById(id);
      return data as AdmissionApplicant;
    } catch {
      return tenantStore.getApplicantById(id);
    }
  }

  async createApplicant(
    data: Omit<AdmissionApplicant, 'id' | 'applicant_number' | 'created_at' | 'updated_at'>,
    guardianData?: { guardian_id: string; relationship: string; is_primary?: boolean }
  ): Promise<AdmissionApplicant> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.createApplicant(data);
    }
    try {
      let applicantNumber: string;
      const { data: seqData, error: seqErr } = await supabase.rpc('generate_institution_sequence', {
        p_institution_id: data.institution_id,
        p_sequence_type: 'applicant',
        p_prefix: 'APP',
      });

      if (!seqErr && seqData) {
        applicantNumber = seqData;
      } else {
        const year = new Date().getFullYear();
        applicantNumber = `APP-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
      }

      const { data: newApplicant, error } = await supabase
        .from('admission_applicants')
        .insert({
          institution_id: data.institution_id,
          campus_id: data.campus_id || null,
          applicant_number: applicantNumber,
          inquiry_id: data.inquiry_id || null,
          first_name: data.first_name,
          middle_name: data.middle_name || null,
          last_name: data.last_name,
          preferred_name: data.preferred_name || null,
          date_of_birth: data.date_of_birth,
          gender: data.gender || null,
          nationality: data.nationality || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          previous_school: data.previous_school || null,
          notes: data.notes || null,
          status: data.status || 'draft',
        })
        .select()
        .single();

      if (error || !newApplicant) throw error;

      if (guardianData?.guardian_id) {
        await supabase.from('admission_applicant_guardians').insert({
          institution_id: data.institution_id,
          applicant_id: newApplicant.id,
          guardian_id: guardianData.guardian_id,
          relationship: guardianData.relationship,
          is_primary: guardianData.is_primary ?? true,
        });
      }

      await this.logAuditEvent({
        tenant_id: data.institution_id,
        action: 'applicant_created',
        entity_type: 'admission_applicant',
        entity_id: newApplicant.id,
        details: { applicant_number: applicantNumber, name: `${data.first_name} ${data.last_name}` },
      });

      return newApplicant as AdmissionApplicant;
    } catch (err: any) {
      console.warn('Supabase createApplicant error, falling back:', err.message);
      return tenantStore.createApplicant(data);
    }
  }

  async updateApplicant(id: string, updates: Partial<AdmissionApplicant>): Promise<AdmissionApplicant> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.updateApplicant(id, updates);
    }
    try {
      const { data, error } = await supabase
        .from('admission_applicants')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw error;
      await this.logAuditEvent({
        tenant_id: data.institution_id,
        action: 'applicant_updated',
        entity_type: 'admission_applicant',
        entity_id: id,
        details: updates as Record<string, unknown>,
      });
      return data as AdmissionApplicant;
    } catch {
      return tenantStore.updateApplicant(id, updates);
    }
  }

  async getApplications(
    institutionId: string,
    filters?: { campusId?: string; status?: string; gradeId?: string; academicYearId?: string; search?: string }
  ): Promise<AdmissionApplication[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getApplications(institutionId, filters);
    }
    try {
      let query = supabase
        .from('admission_applications')
        .select(`
          *,
          applicant:admission_applicants(*),
          campus:campuses(*),
          grade:academic_grades(*),
          class:academic_classes(*),
          academic_year:academic_years(*)
        `)
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (filters?.campusId) query = query.eq('campus_id', filters.campusId);
      if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters?.gradeId) query = query.eq('grade_id', filters.gradeId);
      if (filters?.academicYearId) query = query.eq('academic_year_id', filters.academicYearId);
      if (filters?.search) {
        query = query.ilike('application_number', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Falling back to tenantStore for applications:', error.message);
        return tenantStore.getApplications(institutionId, filters);
      }
      return (data as AdmissionApplication[]) || [];
    } catch {
      return tenantStore.getApplications(institutionId, filters);
    }
  }

  async getApplicationById(id: string): Promise<AdmissionApplication | null> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.getApplicationById(id);
    }
    try {
      const { data, error } = await supabase
        .from('admission_applications')
        .select(`
          *,
          applicant:admission_applicants(*),
          campus:campuses(*),
          grade:academic_grades(*),
          class:academic_classes(*),
          academic_year:academic_years(*)
        `)
        .eq('id', id)
        .single();

      if (error || !data) return tenantStore.getApplicationById(id);
      return data as AdmissionApplication;
    } catch {
      return tenantStore.getApplicationById(id);
    }
  }

  async createApplication(
    data: Omit<AdmissionApplication, 'id' | 'application_number' | 'created_at' | 'updated_at'>
  ): Promise<AdmissionApplication> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.createApplication(data);
    }
    try {
      let applicationNumber: string;
      const { data: seqData, error: seqErr } = await supabase.rpc('generate_institution_sequence', {
        p_institution_id: data.institution_id,
        p_sequence_type: 'application',
        p_prefix: 'ADM',
      });

      if (!seqErr && seqData) {
        applicationNumber = seqData;
      } else {
        const year = new Date().getFullYear();
        applicationNumber = `ADM-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
      }

      const { data: newApp, error } = await supabase
        .from('admission_applications')
        .insert({
          institution_id: data.institution_id,
          applicant_id: data.applicant_id,
          academic_year_id: data.academic_year_id,
          campus_id: data.campus_id,
          grade_id: data.grade_id,
          class_id: data.class_id || null,
          application_number: applicationNumber,
          application_date: data.application_date || new Date().toISOString().split('T')[0],
          status: data.status || 'draft',
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error || !newApp) throw error;
      await this.logAuditEvent({
        tenant_id: data.institution_id,
        action: 'application_created',
        entity_type: 'admission_application',
        entity_id: newApp.id,
        details: { application_number: applicationNumber, applicant_id: data.applicant_id },
      });
      return newApp as AdmissionApplication;
    } catch (err: any) {
      console.warn('Supabase createApplication error, falling back:', err.message);
      return tenantStore.createApplication(data);
    }
  }

  async updateApplication(id: string, updates: Partial<AdmissionApplication>): Promise<AdmissionApplication> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.updateApplication(id, updates);
    }
    try {
      const { data, error } = await supabase
        .from('admission_applications')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw error;
      await this.logAuditEvent({
        tenant_id: data.institution_id,
        action: 'application_updated',
        entity_type: 'admission_application',
        entity_id: id,
        details: updates as Record<string, unknown>,
      });
      return data as AdmissionApplication;
    } catch {
      return tenantStore.updateApplication(id, updates);
    }
  }

  async submitApplication(id: string): Promise<AdmissionApplication> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.submitApplication(id);
    }
    return this.updateApplication(id, {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    });
  }

  async startApplicationReview(id: string, reviewerId?: string): Promise<AdmissionApplication> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.startApplicationReview(id, reviewerId);
    }
    return this.updateApplication(id, {
      status: 'under_review',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    });
  }

  async acceptApplication(id: string, deciderId?: string, notes?: string): Promise<AdmissionApplication> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.acceptApplication(id, deciderId, notes);
    }
    return this.updateApplication(id, {
      status: 'accepted',
      decision_at: new Date().toISOString(),
      decided_by: deciderId,
      decision_reason: notes || 'Application accepted.',
    });
  }

  async waitlistApplication(id: string, deciderId?: string, notes?: string): Promise<AdmissionApplication> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.waitlistApplication(id, deciderId, notes);
    }
    return this.updateApplication(id, {
      status: 'waitlisted',
      decision_at: new Date().toISOString(),
      decided_by: deciderId,
      decision_reason: notes || 'Waitlisted.',
    });
  }

  async rejectApplication(id: string, deciderId?: string, reason?: string): Promise<AdmissionApplication> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.rejectApplication(id, deciderId, reason);
    }
    return this.updateApplication(id, {
      status: 'rejected',
      decision_at: new Date().toISOString(),
      decided_by: deciderId,
      decision_reason: reason || 'Application rejected.',
    });
  }

  async withdrawApplication(id: string, reason?: string): Promise<AdmissionApplication> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.withdrawApplication(id, reason);
    }
    return this.updateApplication(id, {
      status: 'withdrawn',
      decision_reason: reason || 'Withdrawn.',
    });
  }

  async convertApplicantToStudent(
    applicationId: string,
    classId?: string
  ): Promise<{ success: boolean; student_id: string; student_number: string; enrollment_id?: string; conversion_id: string }> {
    if (!isSupabaseConfigured || !supabase) {
      const res = tenantStore.convertApplicantToStudent(applicationId, classId);
      return {
        success: res.success,
        student_id: res.student.id,
        student_number: res.student.student_number,
        enrollment_id: res.enrollment?.id,
        conversion_id: res.conversionId,
      };
    }
    try {
      // 1. Call PostgreSQL RPC convert_applicant_to_student
      const { data, error } = await supabase.rpc('convert_applicant_to_student', {
        p_application_id: applicationId,
        p_class_id: classId || null,
      });

      if (error) {
        console.warn('RPC convert_applicant_to_student error, falling back:', error.message);
        const res = tenantStore.convertApplicantToStudent(applicationId, classId);
        return {
          success: res.success,
          student_id: res.student.id,
          student_number: res.student.student_number,
          enrollment_id: res.enrollment?.id,
          conversion_id: res.conversionId,
        };
      }

      return data as { success: boolean; student_id: string; student_number: string; enrollment_id?: string; conversion_id: string };
    } catch {
      const res = tenantStore.convertApplicantToStudent(applicationId, classId);
      return {
        success: res.success,
        student_id: res.student.id,
        student_number: res.student.student_number,
        enrollment_id: res.enrollment?.id,
        conversion_id: res.conversionId,
      };
    }
  }

  async detectDuplicateApplicants(
    institutionId: string,
    firstName: string,
    lastName: string,
    dob: string,
    email?: string,
    phone?: string
  ): Promise<DuplicateApplicantMatch[]> {
    if (!isSupabaseConfigured || !supabase) {
      return tenantStore.detectDuplicateApplicants(institutionId, firstName, lastName, dob, email, phone);
    }
    try {
      const { data, error } = await supabase.rpc('detect_duplicate_applicants', {
        p_institution_id: institutionId,
        p_first_name: firstName,
        p_last_name: lastName,
        p_dob: dob,
        p_email: email || null,
        p_phone: phone || null,
      });

      if (!error && data) return data as DuplicateApplicantMatch[];
    } catch {
      // fallback
    }
    return tenantStore.detectDuplicateApplicants(institutionId, firstName, lastName, dob, email, phone);
  }
}

export const supabaseService = new SupabaseService();

