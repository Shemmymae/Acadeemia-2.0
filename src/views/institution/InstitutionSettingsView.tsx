import React, { useState } from 'react';
import { Settings, Save, Building2, Plus, Check } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { tenantStore } from '../../services/tenantStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { TerminologyConfig } from '../../types';

export const InstitutionSettingsView: React.FC = () => {
  const { activeInstitution, campuses, refreshTenantData } = useTenant();

  // Terminology state
  const [gradeLabel, setGradeLabel] = useState(activeInstitution.terminology_config.grade_label);
  const [classLabel, setClassLabel] = useState(activeInstitution.terminology_config.class_label);
  const [termLabel, setTermLabel] = useState(activeInstitution.terminology_config.term_label);
  const [studentLabel, setStudentLabel] = useState(activeInstitution.terminology_config.student_label);
  const [teacherLabel, setTeacherLabel] = useState(activeInstitution.terminology_config.teacher_label);

  // Branding state
  const [primaryColor, setPrimaryColor] = useState(activeInstitution.branding_config?.primary_color || '#4f46e5');
  const [motto, setMotto] = useState(activeInstitution.branding_config?.motto || '');
  const [isSaved, setIsSaved] = useState(false);

  // New Campus Modal State
  const [campusModalOpen, setCampusModalOpen] = useState(false);
  const [newCampusName, setNewCampusName] = useState('');
  const [newCampusCode, setNewCampusCode] = useState('');
  const [newCampusAddress, setNewCampusAddress] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    tenantStore.updateInstitution(activeInstitution.id, {
      terminology_config: {
        grade_label: gradeLabel,
        class_label: classLabel,
        term_label: termLabel,
        student_label: studentLabel,
        teacher_label: teacherLabel,
      },
      branding_config: {
        ...activeInstitution.branding_config,
        primary_color: primaryColor,
        motto,
      },
    });

    refreshTenantData();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleCreateCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampusName || !newCampusCode) return;

    tenantStore.createCampus(activeInstitution.id, {
      name: newCampusName,
      code: newCampusCode.toUpperCase(),
      is_main: false,
      address: newCampusAddress,
      capacity: 500,
    });

    refreshTenantData();
    setCampusModalOpen(false);
    setNewCampusName('');
    setNewCampusCode('');
    setNewCampusAddress('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Institution Settings & Terminology Customization
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure flexible nomenclature, branding theme colors, and physical campus nodes for <span className="text-slate-200 font-semibold">{activeInstitution.name}</span>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Terminology Customization */}
        <Card padding="md">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100">
              Institutional Nomenclature & Terminology
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize how academic units and stakeholders are labeled across the system (e.g. British "Form" vs American "Grade", "Scholar" vs "Student").
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Student Term (e.g. Student, Scholar, Cadet)"
              value={studentLabel}
              onChange={(e) => setStudentLabel(e.target.value)}
              required
            />
            <Input
              label="Teacher Term (e.g. Teacher, Faculty, Instructor)"
              value={teacherLabel}
              onChange={(e) => setTeacherLabel(e.target.value)}
              required
            />
            <Input
              label="Grade / Level Term (e.g. Grade, Form, Year)"
              value={gradeLabel}
              onChange={(e) => setGradeLabel(e.target.value)}
              required
            />
            <Input
              label="Class / Section Term (e.g. Class, Stream, Cohort)"
              value={classLabel}
              onChange={(e) => setClassLabel(e.target.value)}
              required
            />
            <Input
              label="Term / Session Term (e.g. Term, Trimester, Semester)"
              value={termLabel}
              onChange={(e) => setTermLabel(e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Branding & Visual Identity */}
        <Card padding="md">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100">
              Branding & Accent Styling
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Primary brand identity applied to navigation badges, reports, and public portals.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <Input
                label="Primary Accent Color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-24 p-1 cursor-pointer"
              />
              <div className="text-xs text-slate-400">
                Hex code: <span className="font-mono text-slate-200">{primaryColor}</span>
              </div>
            </div>

            <Input
              label="School Motto / Creed"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="e.g. Veritas, Libertas, Excellentia"
            />
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
            {isSaved ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Settings updated successfully!
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-mono">
                Changes apply immediately across all modules.
              </span>
            )}
            <Button size="sm" variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
              Save Settings
            </Button>
          </div>
        </Card>
      </form>

      {/* Campus Management Section */}
      <Card padding="md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Physical & Logical Campuses ({campuses.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Each institution may operate multiple physical locations with distributed classrooms.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setCampusModalOpen(true)}
          >
            Add New Campus
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {campuses.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100">{c.name}</span>
                  {c.is_main && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                      Main Campus HQ
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Code: <span className="font-mono">{c.code}</span> · {c.address || 'Address pending'}
                </div>
              </div>
              <div className="text-right text-slate-400 font-mono">
                Capacity: {c.capacity}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Campus Modal */}
      <Modal
        isOpen={campusModalOpen}
        onClose={() => setCampusModalOpen(false)}
        title="Add Campus Location"
        subtitle={`Adds a new physical branch to ${activeInstitution.name}`}
      >
        <form onSubmit={handleCreateCampus} className="space-y-4">
          <Input
            label="Campus Name"
            placeholder="e.g. West Lake Preparatory Branch"
            value={newCampusName}
            onChange={(e) => setNewCampusName(e.target.value)}
            required
          />
          <Input
            label="Campus Code"
            placeholder="e.g. WEST-03"
            value={newCampusCode}
            onChange={(e) => setNewCampusCode(e.target.value)}
            required
          />
          <Input
            label="Street Address & City"
            placeholder="e.g. 500 Highland Way, Boston, MA"
            value={newCampusAddress}
            onChange={(e) => setNewCampusAddress(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button size="sm" variant="ghost" type="button" onClick={() => setCampusModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Create Campus
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
