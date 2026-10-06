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
  X,
  HeartPulse,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabaseService } from '../../services/supabaseService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { AcademicClass, Guardian, Student } from '../../types';

export const StudentManagementView: React.FC = () => {
  const { activeInstitution, activeCampus, campuses } = useTenant();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [selectedStudentGuardians, setSelectedStudentGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState<string>(activeCampus?.id || '');
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  // New Student Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Female');
  const [dateOfBirth, setDateOfBirth] = useState('2010-05-12');
  const [campusId, setCampusId] = useState(campuses[0]?.id || '');
  const [allergies, setAllergies] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Synchronously sync campusId when campuses load
  useEffect(() => {
    if (campuses.length > 0 && !campusId) {
      setCampusId(campuses[0].id);
    }
  }, [campuses, campusId]);

  // Asynchronous read from Supabase
  const loadStudents = useCallback(async () => {
    if (!activeInstitution) return;
    setLoading(true);
    setError(null);
    try {
      const [studentList, classList] = await Promise.all([
        supabaseService.getStudents(activeInstitution.id, selectedCampusId || undefined),
        supabaseService.getAcademicClasses(activeInstitution.id),
      ]);
      setStudents(studentList);
      setClasses(classList);
    } catch (err: any) {
      console.error('Failed to load students from Supabase:', err);
      setError(err.message || 'Failed to load scholar records from database');
    } finally {
      setLoading(false);
    }
  }, [activeInstitution?.id, selectedCampusId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Load guardians when student is selected
  useEffect(() => {
    if (!activeStudentId) {
      setSelectedStudentGuardians([]);
      return;
    }
    supabaseService.getGuardiansForStudent(activeStudentId).then((g) => {
      setSelectedStudentGuardians(g);
    });
  }, [activeStudentId]);

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

  const selectedStudent = activeStudentId
    ? students.find((s) => s.id === activeStudentId)
    : null;

  // Authoritative Database Mutation
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !campusId || !activeInstitution) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const codePrefix = activeInstitution.code.substring(0, 3).toUpperCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const studentNumber = `${codePrefix}-2026-${randomSuffix}`;

      // Omit ID: let PostgreSQL generate authoritative UUID
      const newStudent = await supabaseService.createStudent({
        institution_id: activeInstitution.id,
        campus_id: campusId,
        student_number: studentNumber,
        first_name: firstName,
        last_name: lastName,
        gender,
        date_of_birth: dateOfBirth,
        admission_date: new Date().toISOString().split('T')[0],
        status: 'active',
        allergies: allergies || undefined,
      });

      // Update state with authoritative database row
      setStudents((prev) => [newStudent, ...prev]);
      setEnrollModalOpen(false);
      setFirstName('');
      setLastName('');
      setAllergies('');
    } catch (err: any) {
      console.error('Enrollment error from database:', err);
      setSubmitError(err.message || 'Database rejected enrollment. Check Row Level Security permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this scholar record from the database?')) {
      return;
    }
    try {
      await supabaseService.deleteStudent(studentId);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      if (activeStudentId === studentId) {
        setActiveStudentId(null);
      }
    } catch (err: any) {
      alert(`Database error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {terminology.student_label} Information System (SIS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authoritative database scholar records, unique institutional numbers, and campus isolation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => loadStudents()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setSubmitError(null);
              setEnrollModalOpen(true);
            }}
          >
            Enroll {terminology.student_label}
          </Button>
        </div>
      </div>

      {/* Database Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => loadStudents()}>
            Retry
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            placeholder={`Search ${terminology.student_label.toLowerCase()} by name or ID...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={selectedCampusId}
            onChange={(e) => setSelectedCampusId(e.target.value)}
            options={[
              { value: '', label: 'All Authorized Campuses' },
              ...campuses.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>

      {/* Scholar Roster Table */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3">Institutional ID</th>
                <th className="px-6 py-3">{terminology.student_label} Name</th>
                <th className="px-6 py-3">Campus</th>
                <th className="px-6 py-3">Current {terminology.class_label}</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading && students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    Querying authoritative PostgreSQL scholar records...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    No scholars found in database for the selected campus.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => {
                  const camp = campuses.find((c) => c.id === stu.campus_id);
                  const cls = classes.find((cl) => cl.id === stu.current_class_id);

                  return (
                    <tr
                      key={stu.id}
                      className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                      onClick={() => setActiveStudentId(stu.id)}
                    >
                      <td className="px-6 py-3.5 font-mono text-indigo-300 font-semibold">
                        {stu.student_number}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-100">
                          {stu.first_name} {stu.last_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {stu.gender} · DOB: {stu.date_of_birth}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-300 text-[11px]">
                        {camp?.name.split('(')[0] || 'Campus'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-300">
                        {cls?.name || 'Class Assigned'}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge variant="success">Active</Badge>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setActiveStudentId(stu.id)}
                          >
                            Profile
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                            onClick={(e) => handleDeleteStudent(stu.id, e)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Student Profile Modal */}
      {selectedStudent && (
        <Modal
          isOpen={Boolean(selectedStudent)}
          onClose={() => setActiveStudentId(null)}
          title={`${terminology.student_label} Profile: ${selectedStudent.first_name} ${selectedStudent.last_name}`}
          subtitle={`Authoritative UUID: ${selectedStudent.id}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Core Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="text-slate-400 block">Student Number</span>
                <span className="font-mono font-semibold text-indigo-300 mt-0.5 block">
                  {selectedStudent.student_number}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Gender</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">
                  {selectedStudent.gender}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Admission Date</span>
                <span className="font-mono text-slate-200 mt-0.5 block">
                  {selectedStudent.admission_date}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Blood Group</span>
                <span className="font-mono text-slate-200 mt-0.5 block">
                  {selectedStudent.blood_group || 'O+'}
                </span>
              </div>
            </div>

            {/* Medical / Allergies */}
            {selectedStudent.allergies && (
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200 flex items-start gap-2.5">
                <HeartPulse className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-semibold">Medical & Allergy Protocol:</span>
                  <p className="mt-0.5 text-[11px] text-amber-300/90">{selectedStudent.allergies}</p>
                </div>
              </div>
            )}

            {/* Parent & Guardian Relationships */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                  Authorized Parents & Legal Guardians ({selectedStudentGuardians.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Many-to-Many Relationship</span>
              </div>

              {selectedStudentGuardians.length === 0 ? (
                <p className="text-slate-500 italic p-3 border border-slate-800/60 rounded-lg">
                  No guardian link records linked to this scholar yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedStudentGuardians.map((guardian, idx) => (
                    <div
                      key={guardian.id || idx}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span>{guardian.full_name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase">
                            {guardian.relationship_type}
                          </span>
                        </div>
                        <div className="mt-1 text-slate-400 flex items-center gap-3">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3" /> {guardian.phone}
                          </span>
                          {guardian.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {guardian.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        {guardian.is_emergency_contact && (
                          <div className="text-[10px] text-sky-400 font-medium">✓ Emergency Contact</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setActiveStudentId(null)}>
                Close Record
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Enroll Scholar Modal */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title={`Enroll New ${terminology.student_label}`}
        subtitle={`Generates authoritative UUID in PostgreSQL for ${activeInstitution.name}`}
      >
        <form onSubmit={handleEnrollStudent} className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Liam"
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Vance"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={[
                { value: 'Female', label: 'Female' },
                { value: 'Male', label: 'Male' },
                { value: 'Non-Binary', label: 'Non-Binary' },
              ]}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          <Select
            label="Assigned Campus"
            value={campusId}
            onChange={(e) => setCampusId(e.target.value)}
            options={campuses.map((c) => ({ value: c.id, label: c.name }))}
          />

          <Input
            label="Allergies / Special Medical Notes (Optional)"
            placeholder="e.g. Peanut allergy, Asthma inhaler required"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
          />

          <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300">
            PostgreSQL will generate a unique UUID and enforce campus RLS policy for this scholar.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setEnrollModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              icon={isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
            >
              {isSubmitting ? 'Persisting to Database...' : 'Complete Enrollment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
