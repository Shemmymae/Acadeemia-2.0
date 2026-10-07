import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Users,
  Shield,
  Phone,
  Mail,
  AlertCircle,
  Eye,
  HeartPulse,
  Trash2,
  RefreshCw,
  Building2,
  Edit2,
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  BookOpen,
  DollarSign,
  Bus,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabaseService } from '../../services/supabaseService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { AcademicClass, AcademicYear, Guardian, Student, StudentEnrollment, StudentGuardian } from '../../types';

export const StudentManagementView: React.FC = () => {
  const { activeInstitution, activeCampus, campuses, academicYears } = useTenant();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState<string>(activeCampus?.id || '');

  // Profile Drawer / Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>([]);
  const [studentGuardians, setStudentGuardians] = useState<StudentGuardian[]>([]);
  const [profileTab, setProfileTab] = useState<'overview' | 'enrollments' | 'guardians' | 'future'>('overview');

  // Progression / New Enrollment Modal
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressYearId, setProgressYearId] = useState('');
  const [progressClassId, setProgressClassId] = useState('');
  const [progressRollNumber, setProgressRollNumber] = useState('');

  // Enroll Student Modal State
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Female');
  const [dateOfBirth, setDateOfBirth] = useState('2012-05-12');
  const [campusId, setCampusId] = useState('');
  const [initialClassId, setInitialClassId] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Edit Student Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Delete Student Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (campuses.length > 0 && !campusId) {
      setCampusId(campuses[0].id);
    }
  }, [campuses, campusId]);

  const loadData = useCallback(async () => {
    if (!activeInstitution) return;
    setLoading(true);
    setError(null);
    try {
      const [stuList, clList] = await Promise.all([
        supabaseService.getStudents(activeInstitution.id, selectedCampusId || undefined),
        supabaseService.getAcademicClasses(activeInstitution.id),
      ]);
      setStudents(stuList);
      setClasses(clList);
    } catch (err: any) {
      console.error('Failed to load students:', err);
      setError(err.message || 'Failed to load scholar records from database');
    } finally {
      setLoading(false);
    }
  }, [activeInstitution?.id, selectedCampusId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load detailed profile relations
  const openStudentProfile = async (s: Student) => {
    setSelectedStudent(s);
    setProfileTab('overview');
    setProfileModalOpen(true);

    try {
      const [enrList, sgList] = await Promise.all([
        supabaseService.getStudentEnrollments(s.id),
        supabaseService.getStudentGuardians(s.id),
      ]);
      setStudentEnrollments(enrList);
      setStudentGuardians(sgList);
    } catch (err) {
      console.warn('Profile relations query warning:', err);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !campusId || !activeInstitution) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const codePrefix = activeInstitution.code.substring(0, 3).toUpperCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();
      const studentNumber = `${codePrefix}-${year}-${randomSuffix}`;

      // 1. Create persistent student record with PostgreSQL authoritative UUID
      const newStudent = await supabaseService.createStudent({
        institution_id: activeInstitution.id,
        campus_id: campusId,
        student_number: studentNumber,
        first_name: firstName.trim(),
        middle_name: middleName.trim() || undefined,
        last_name: lastName.trim(),
        gender,
        date_of_birth: dateOfBirth,
        admission_date: new Date().toISOString().split('T')[0],
        status: 'active',
        current_class_id: initialClassId || undefined,
        blood_group: bloodGroup || undefined,
        allergies: allergies.trim() || undefined,
      });

      // 2. If initial class and academic year exist, create initial academic progression enrollment
      const activeYear = academicYears.find((ay) => ay.is_current) || academicYears[0];
      if (initialClassId && activeYear) {
        await supabaseService.createStudentEnrollment({
          institution_id: activeInstitution.id,
          student_id: newStudent.id,
          academic_year_id: activeYear.id,
          class_id: initialClassId,
          status: 'enrolled',
          roll_number: `R-${randomSuffix}`,
        });
      }

      await loadData();
      setEnrollModalOpen(false);
      resetEnrollForm();
    } catch (err: any) {
      console.error('Enrollment error:', err);
      setSubmitError(err.message || 'Database rejected student creation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !firstName.trim() || !lastName.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await supabaseService.updateStudent(editingStudent.id, {
        first_name: firstName.trim(),
        middle_name: middleName.trim() || undefined,
        last_name: lastName.trim(),
        gender,
        date_of_birth: dateOfBirth,
        campus_id: campusId,
        current_class_id: initialClassId || undefined,
        blood_group: bloodGroup,
        allergies: allergies.trim() || undefined,
      });

      await loadData();
      setEditModalOpen(false);
      setEditingStudent(null);
      resetEnrollForm();
    } catch (err: any) {
      console.error('Edit student error:', err);
      setSubmitError(err.message || 'Database rejected student update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProgression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !progressYearId || !progressClassId || !activeInstitution) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await supabaseService.createStudentEnrollment({
        institution_id: activeInstitution.id,
        student_id: selectedStudent.id,
        academic_year_id: progressYearId,
        class_id: progressClassId,
        status: 'enrolled',
        roll_number: progressRollNumber.trim() || undefined,
      });

      const updatedEnrs = await supabaseService.getStudentEnrollments(selectedStudent.id);
      setStudentEnrollments(updatedEnrs);
      await loadData();
      setProgressModalOpen(false);
      setProgressYearId('');
      setProgressClassId('');
      setProgressRollNumber('');
    } catch (err: any) {
      console.error('Progression error:', err);
      setSubmitError(err.message || 'Failed to record academic progression');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setIsSubmitting(true);
    try {
      await supabaseService.deleteStudent(deletingStudent.id);
      await loadData();
      setDeleteModalOpen(false);
      setDeletingStudent(null);
      if (selectedStudent?.id === deletingStudent.id) {
        setProfileModalOpen(false);
      }
    } catch (err: any) {
      console.error('Delete student error:', err);
      setError(err.message || 'Database rejected student deletion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setFirstName(s.first_name);
    setMiddleName(s.middle_name || '');
    setLastName(s.last_name);
    setGender(s.gender);
    setDateOfBirth(s.date_of_birth || '2012-05-12');
    setCampusId(s.campus_id);
    setInitialClassId(s.current_class_id || '');
    setBloodGroup(s.blood_group || 'O+');
    setAllergies(s.allergies || '');
    setSubmitError(null);
    setEditModalOpen(true);
  };

  const resetEnrollForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setGender('Female');
    setDateOfBirth('2012-05-12');
    setCampusId(campuses[0]?.id || '');
    setInitialClassId(classes[0]?.id || '');
    setBloodGroup('O+');
    setAllergies('');
    setSubmitError(null);
  };

  if (!activeInstitution) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Active Educational Institution</h3>
        <p className="text-xs text-slate-400">Select an authorized institution to view scholar records.</p>
      </div>
    );
  }

  const terminology = activeInstitution.terminology_config;

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    return fullName.includes(q) || s.student_number.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {terminology.student_label} Information System (SIS)
            </h1>
            <Badge variant="info">{students.length} Enrolled</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authoritative student identities, permanent records, and academic progression history for <span className="text-slate-200 font-semibold">{activeInstitution.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetEnrollForm();
              setEnrollModalOpen(true);
            }}
          >
            Admit New {terminology.student_label}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${terminology.student_label.toLowerCase()}s by name or number...`}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="w-full sm:w-60">
          <Select
            value={selectedCampusId}
            onChange={(e) => setSelectedCampusId(e.target.value)}
            options={[
              { value: '', label: 'All Campuses (Consolidated)' },
              ...campuses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
            ]}
          />
        </div>
      </div>

      {/* Students Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">{terminology.student_label} Identity</th>
                <th className="px-6 py-3.5">Admission Number</th>
                <th className="px-6 py-3.5">Campus Node</th>
                <th className="px-6 py-3.5">Current {terminology.class_label}</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredStudents.map((s) => {
                const campus = campuses.find((c) => c.id === s.campus_id);
                const currentCl = classes.find((cl) => cl.id === s.current_class_id);
                return (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-indigo-300 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                          {s.first_name.charAt(0)}{s.last_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">
                            {s.first_name} {s.middle_name ? `${s.middle_name} ` : ''}{s.last_name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Admitted: {s.admission_date} · {s.gender}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-indigo-400">
                      {s.student_number}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-300 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        {campus?.name || 'Assigned Campus'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {currentCl ? (
                        <span className="font-medium text-slate-200">
                          {currentCl.name} ({currentCl.code})
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Unassigned Cohort</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant={s.status === 'active' ? 'success' : 'neutral'}>
                        {s.status}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openStudentProfile(s)}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          title="View Profile & Academic Progression"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          title="Edit Scholar Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingStudent(s);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          title="Delete Scholar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredStudents.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No scholar records match the specified filters.
            </div>
          )}
        </div>
      </Card>

      {/* STUDENT PROFILE & PROGRESSION MODAL */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Scholar Permanent Record & Progression History"
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* Scholar Identity Header */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 flex items-center justify-center font-bold text-base uppercase shrink-0">
                  {selectedStudent.first_name.charAt(0)}{selectedStudent.last_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedStudent.first_name} {selectedStudent.middle_name || ''} {selectedStudent.last_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                    <span className="text-indigo-400 font-semibold">{selectedStudent.student_number}</span>
                    <span>·</span>
                    <span>Admitted {selectedStudent.admission_date}</span>
                  </div>
                </div>
              </div>
              <Badge variant={selectedStudent.status === 'active' ? 'success' : 'neutral'}>
                {selectedStudent.status}
              </Badge>
            </div>

            {/* Profile Sub-tabs */}
            <div className="flex border-b border-slate-800 gap-2 text-xs font-medium">
              <button
                onClick={() => setProfileTab('overview')}
                className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  profileTab === 'overview'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview & Health
              </button>
              <button
                onClick={() => setProfileTab('enrollments')}
                className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  profileTab === 'enrollments'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Academic History ({studentEnrollments.length})
              </button>
              <button
                onClick={() => setProfileTab('guardians')}
                className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  profileTab === 'guardians'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Guardians ({studentGuardians.length})
              </button>
              <button
                onClick={() => setProfileTab('future')}
                className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  profileTab === 'future'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Extended Modules
              </button>
            </div>

            {/* Tab 1: Overview */}
            {profileTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Demographic Data
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-850">
                    <span className="text-slate-400">Gender</span>
                    <span className="font-semibold text-slate-200">{selectedStudent.gender}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-850">
                    <span className="text-slate-400">Date of Birth</span>
                    <span className="font-semibold text-slate-200 font-mono">{selectedStudent.date_of_birth || 'Not recorded'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Blood Group</span>
                    <span className="font-semibold text-slate-200 font-mono">{selectedStudent.blood_group || 'Unspecified'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Health & Medical Alerts
                  </div>
                  {selectedStudent.allergies ? (
                    <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs">
                      <strong className="block mb-1 text-amber-300">Allergies / Special Conditions:</strong>
                      {selectedStudent.allergies}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic py-2">No known allergies or medical restrictions recorded.</div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Academic History & Enrollments */}
            {profileTab === 'enrollments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Progression records are immutable. Advancing a scholar creates a new enrollment row without changing identity.
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setProgressYearId(academicYears[0]?.id || '');
                      setProgressClassId(classes[0]?.id || '');
                      setProgressRollNumber('');
                      setSubmitError(null);
                      setProgressModalOpen(true);
                    }}
                  >
                    Progress / Enroll
                  </Button>
                </div>

                <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900 overflow-hidden text-xs">
                  {studentEnrollments.map((enr) => (
                    <div key={enr.id} className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{enr.academic_year?.name || 'Academic Session'}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-2">
                          <span>Cohort: <strong className="text-slate-300">{enr.academic_class?.name || 'Class'}</strong></span>
                          <span>·</span>
                          <span>Enrolled: {enr.enrolled_at.split('T')[0]}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant="success">{enr.status}</Badge>
                        {enr.roll_number && (
                          <div className="text-[11px] font-mono text-slate-400">Roll: {enr.roll_number}</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {studentEnrollments.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No progression records attached to this scholar yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Guardians */}
            {profileTab === 'guardians' && (
              <div className="space-y-3 text-xs">
                {studentGuardians.map((sg) => (
                  <div key={sg.id} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200">
                        {sg.guardian?.full_name || 'Guardian Contact'}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="capitalize">{sg.guardian?.relationship_type}</span>
                        <span>·</span>
                        <span className="font-mono">{sg.guardian?.phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sg.is_primary && <Badge variant="warning">Primary Guardian</Badge>}
                      {sg.receives_billing && <Badge variant="info">Billing Notifications</Badge>}
                    </div>
                  </div>
                ))}

                {studentGuardians.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-lg">
                    No guardians linked. Use the Guardians view to connect parents and family contacts.
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Future Extensions */}
            {profileTab === 'future' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Attendance Tracking
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Clean extension point for automated RFID gate checks and daily classroom rolls.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-300">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Student Fee Ledger
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Extension point for tuition structures, scholarship waivers, and split-parent payments.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-300">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Gradebook & Transcript
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Extension point for semester examinations, GPA evaluation, and official transcripts.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-300">
                    <Bus className="w-3.5 h-3.5 text-purple-400" /> Transport & Logistics
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Extension point for bus routing, designated pickup stations, and boarding house rooms.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ADMIT NEW STUDENT MODAL */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title={`Admit New ${terminology.student_label}`}
      >
        <form onSubmit={handleEnrollStudent} className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="First Name *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Liam"
              required
            />
            <Input
              label="Middle Name"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              placeholder="e.g. Kip"
            />
            <Input
              label="Last Name *"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Koech"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Gender *"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={[
                { value: 'Female', label: 'Female' },
                { value: 'Male', label: 'Male' },
                { value: 'Other', label: 'Other / Non-disclosed' },
              ]}
              required
            />
            <Input
              label="Date of Birth *"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
            <Select
              label="Blood Group"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              options={[
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Campus Node *"
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              options={campuses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
              required
            />
            <Select
              label={`Initial ${terminology.class_label} Cohort`}
              value={initialClassId}
              onChange={(e) => setInitialClassId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned Cohort' },
                ...classes.map((cl) => ({ value: cl.id, label: `${cl.name} (${cl.code})` })),
              ]}
            />
          </div>

          <Input
            label="Known Allergies / Health Restrictions"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="e.g. Peanut allergy, carries EpiPen"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setEnrollModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Admitting in Database...' : 'Complete Admission'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT STUDENT MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Scholar Details"
      >
        <form onSubmit={handleEditStudent} className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="First Name *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Middle Name"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
            />
            <Input
              label="Last Name *"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Gender *"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={[
                { value: 'Female', label: 'Female' },
                { value: 'Male', label: 'Male' },
                { value: 'Other', label: 'Other / Non-disclosed' },
              ]}
              required
            />
            <Input
              label="Date of Birth *"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
            <Select
              label="Blood Group"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              options={[
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Campus Node *"
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              options={campuses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
              required
            />
            <Select
              label={`Current ${terminology.class_label}`}
              value={initialClassId}
              onChange={(e) => setInitialClassId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned Cohort' },
                ...classes.map((cl) => ({ value: cl.id, label: `${cl.name} (${cl.code})` })),
              ]}
            />
          </div>

          <Input
            label="Known Allergies / Health Restrictions"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* PROGRESSION MODAL */}
      <Modal
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        title="Advance Scholar to Academic Session"
      >
        <form onSubmit={handleCreateProgression} className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
            <span className="text-slate-400">Advancing Scholar:</span>
            <div className="font-bold text-white text-sm">
              {selectedStudent?.first_name} {selectedStudent?.last_name} ({selectedStudent?.student_number})
            </div>
          </div>

          <Select
            label="Target Academic Session *"
            value={progressYearId}
            onChange={(e) => setProgressYearId(e.target.value)}
            options={academicYears.map((ay) => ({ value: ay.id, label: ay.name }))}
            required
          />

          <Select
            label={`Target ${terminology.class_label} Cohort *`}
            value={progressClassId}
            onChange={(e) => setProgressClassId(e.target.value)}
            options={classes.map((cl) => ({ value: cl.id, label: `${cl.name} (${cl.code})` }))}
            required
          />

          <Input
            label="Roll Number / Desk ID"
            value={progressRollNumber}
            onChange={(e) => setProgressRollNumber(e.target.value)}
            placeholder="e.g. R-104"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setProgressModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording Progression...' : 'Confirm Progression'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Scholar Removal"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Are you sure you want to delete scholar record for{' '}
            <strong className="text-white">
              {deletingStudent?.first_name} {deletingStudent?.last_name} ({deletingStudent?.student_number})
            </strong>?
          </p>
          <p className="text-xs text-red-400 bg-red-950/30 p-3 rounded-lg border border-red-800/30">
            This permanently removes enrollment links, attendance records, and tuition ledger attachments.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStudent} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete Record'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
