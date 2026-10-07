// ==============================================================================
// ACADEEMIA 2.0 - Real Supabase Database & Persistence Service
// ==============================================================================
// Authoritative database client communicating directly with PostgreSQL & RLS.
// All production mutations write to PostgreSQL first and return the generated UUID.
// In offline/demo mode, routes through isolated demo adapter with valid UUIDs.
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { tenantStore } from './tenantStore';
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
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('name');
    if (error) throw new Error(error.message);
    return (data as unknown as ModuleDefinition[]) || [];
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
    return {
      ...data,
      addons: data.subscription_addons || [],
    } as Subscription;
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
}

export const supabaseService = new SupabaseService();
