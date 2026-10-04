import React, { useState } from 'react';
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
  HeartPulse
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { tenantStore } from '../../services/tenantStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Student } from '../../types';

export const StudentManagementView: React.FC = () => {
  const { activeInstitution, activeCampus, campuses } = useTenant();
  const terminology = activeInstitution.terminology_config;

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

  const students = tenantStore.getStudents(activeInstitution.id, selectedCampusId || undefined);
  const classes = tenantStore.getAcademicClasses(activeInstitution.id);

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    return fullName.includes(q) || s.student_number.toLowerCase().includes(q);
  });

  const selectedStudent = activeStudentId
    ? students.find((s) => s.id === activeStudentId)
    : null;

  const guardiansForSelected = selectedStudent
    ? tenantStore.getGuardiansForStudent(selectedStudent.id)
    : [];

  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !campusId) return;

    tenantStore.createStudent(activeInstitution.id, {
      campus_id: campusId,
      first_name: firstName,
      last_name: lastName,
      gender,
      date_of_birth: dateOfBirth,
      admission_date: new Date().toISOString().split('T')[0],
      status: 'active',
      allergies: allergies || undefined,
    });

    setEnrollModalOpen(false);
    setFirstName('');
    setLastName('');
    setAllergies('');
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
            Institutional unique identifiers, demographics, many-to-many guardian relationships, and longitudinal academic records.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setEnrollModalOpen(true)}
        >
          Enroll {terminology.student_label}
        </Button>
      </div>

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
        <div className="w-full sm:w-64">
          <Select
            value={selectedCampusId}
            onChange={(e) => setSelectedCampusId(e.target.value)}
            options={[
              { value: '', label: 'All Campuses (Consolidated)' },
              ...campuses.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>

      {/* Students Data Grid */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Institutional ID</th>
                <th className="px-6 py-3">{terminology.student_label} Name</th>
                <th className="px-6 py-3">Campus</th>
                <th className="px-6 py-3">Current {terminology.class_label}</th>
                <th className="px-6 py-3">Parents / Guardians</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredStudents.map((stu) => {
                const camp = campuses.find((c) => c.id === stu.campus_id);
                const cls = classes.find((cl) => cl.id === stu.current_class_id);
                const gCount = tenantStore.getGuardiansForStudent(stu.id).length;

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
                      {cls?.name || 'Grade 10 - Alpha'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-slate-300 font-medium">
                        {gCount} {gCount === 1 ? 'Linked Guardian' : 'Linked Guardians'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStudentId(stu.id);
                        }}
                      >
                        Profile
                      </Button>
                    </td>
                  </tr>
                );
              })}
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
          subtitle={`Institutional ID: ${selectedStudent.student_number} (Isolated to ${activeInstitution.name})`}
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
                  Authorized Parents & Legal Guardians ({guardiansForSelected.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Many-to-Many Relationship</span>
              </div>

              <div className="space-y-2">
                {guardiansForSelected.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        <span>{item.guardian.full_name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase">
                          {item.guardian.relationship_type}
                        </span>
                        {item.isPrimary && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-slate-400 flex items-center gap-3">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3" /> {item.guardian.phone}
                        </span>
                        {item.guardian.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {item.guardian.email}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {item.guardian.address}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      {item.canPickup && (
                        <div className="text-[10px] text-emerald-400 font-medium">✓ Pickup Authorized</div>
                      )}
                      {item.guardian.is_emergency_contact && (
                        <div className="text-[10px] text-sky-400 font-medium">✓ Emergency Contact</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
        subtitle={`Generates unique institutional ID for ${activeInstitution.name}`}
      >
        <form onSubmit={handleEnrollStudent} className="space-y-4">
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
            Institutional ID prefix: <span className="font-mono font-bold">{activeInstitution.code.substring(0, 3)}-2026-XXXX</span>. ID is unique across this institution.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button size="sm" variant="ghost" type="button" onClick={() => setEnrollModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Complete Enrollment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
