import React, { useState } from 'react';
import { Settings, Save, Building2, Plus, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabaseService } from '../../services/supabaseService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { TerminologyConfig } from '../../types';

export const InstitutionSettingsView: React.FC = () => {
  const { activeInstitution, campuses, refreshTenantData } = useTenant();

  // Terminology state
  const [gradeLabel, setGradeLabel] = useState(activeInstitution?.terminology_config.grade_label || 'Grade');
  const [classLabel, setClassLabel] = useState(activeInstitution?.terminology_config.class_label || 'Class');
  const [termLabel, setTermLabel] = useState(activeInstitution?.terminology_config.term_label || 'Term');
  const [studentLabel, setStudentLabel] = useState(activeInstitution?.terminology_config.student_label || 'Student');
  const [teacherLabel, setTeacherLabel] = useState(activeInstitution?.terminology_config.teacher_label || 'Teacher');

  // Branding state
  const [primaryColor, setPrimaryColor] = useState(activeInstitution?.branding_config?.primary_color || '#4f46e5');
  const [motto, setMotto] = useState(activeInstitution?.branding_config?.motto || '');
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Campus Modal State
  const [campusModalOpen, setCampusModalOpen] = useState(false);
  const [newCampusName, setNewCampusName] = useState('');
  const [newCampusCode, setNewCampusCode] = useState('');
  const [newCampusAddress, setNewCampusAddress] = useState('');
  const [creatingCampus, setCreatingCampus] = useState(false);
  const [campusError, setCampusError] = useState<string | null>(null);

  if (!activeInstitution) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Active Educational Institution</h3>
        <p className="text-xs text-slate-400">Select an authorized institution to customize nomenclature and branding.</p>
      </div>
    );
  }

  // Authoritative Database Update
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await supabaseService.updateInstitution(activeInstitution.id, {
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
    } catch (err: any) {
      console.error('Settings update error:', err);
      setError(err.message || 'Database rejected settings update');
    } finally {
      setSaving(false);
    }
  };

  // Authoritative Database Insert for Campus
  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampusName || !newCampusCode) return;

    setCreatingCampus(true);
    setCampusError(null);

    try {
      // Omit ID: let PostgreSQL generate authoritative UUID
      await supabaseService.createCampus({
        institution_id: activeInstitution.id,
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
    } catch (err: any) {
      console.error('Campus creation error:', err);
      setCampusError(err.message || 'Database rejected campus creation');
    } finally {
      setCreatingCampus(false);
    }
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

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Terminology Customization */}
        <Card padding="md">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100">
              Institutional Terminology Engine (White-Label Nomenclature)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize entity labels throughout the UI to reflect your school's educational tradition.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            <Input
              label="Student Label (e.g. Scholar, Cadet, Pupil, Researcher)"
              value={studentLabel}
              onChange={(e) => setStudentLabel(e.target.value)}
              required
            />
            <Input
              label="Teacher Label (e.g. Faculty, Instructor, Professor, Tutor)"
              value={teacherLabel}
              onChange={(e) => setTeacherLabel(e.target.value)}
              required
            />
            <Input
              label="Grade / Year Label (e.g. Form, Year Group, Standard)"
              value={gradeLabel}
              onChange={(e) => setGradeLabel(e.target.value)}
              required
            />
            <Input
              label="Class / Section Label (e.g. Cohort, Stream, Section)"
              value={classLabel}
              onChange={(e) => setClassLabel(e.target.value)}
              required
            />
            <Input
              label="Academic Term Label (e.g. Trimester, Semester, Term, Quarter)"
              value={termLabel}
              onChange={(e) => setTermLabel(e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Branding & Theme Customization */}
        <Card padding="md">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100">
              Visual Identity & Institutional Branding
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Colors and heraldic motto reflected across student portals and institutional headers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary Brand Color (Hex Code)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-700 bg-slate-900"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#4f46e5"
                  className="font-mono text-xs uppercase"
                  required
                />
              </div>
            </div>

            <Input
              label="Institutional Motto / Crest Inscription"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="e.g. Veritas, Caritas, Excellentia"
            />
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-in fade-in">
              <Check className="w-4 h-4" /> Settings persisted to PostgreSQL database!
            </span>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            icon={saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          >
            {saving ? 'Saving to Database...' : 'Persist Institutional Settings'}
          </Button>
        </div>
      </form>

      {/* Campus Management */}
      <Card padding="md">
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Physical Campuses & Branches ({campuses.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-branch operational nodes with database-level isolation.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setCampusError(null);
              setCampusModalOpen(true);
            }}
          >
            Add Campus Branch
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
          {campuses.map((camp) => (
            <div
              key={camp.id}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-indigo-400 font-semibold">{camp.code}</span>
                {camp.is_main && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                    Main Campus
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-slate-100">{camp.name}</h3>
              <p className="text-[11px] text-slate-400 line-clamp-1">{camp.address || 'Address not listed'}</p>
              <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-850">
                Capacity: {camp.capacity || 1000} scholars · UUID: {camp.id.substring(0, 8)}...
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* New Campus Modal */}
      <Modal
        isOpen={campusModalOpen}
        onClose={() => setCampusModalOpen(false)}
        title="Add Physical Campus Node"
        subtitle={`Creates an isolated branch for ${activeInstitution.name} in PostgreSQL`}
      >
        <form onSubmit={handleCreateCampus} className="space-y-4">
          {campusError && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{campusError}</span>
            </div>
          )}

          <Input
            label="Campus Name"
            placeholder="e.g. West Coast Preparatory Campus"
            value={newCampusName}
            onChange={(e) => setNewCampusName(e.target.value)}
            required
          />

          <Input
            label="Campus Code (Unique Within Institution)"
            placeholder="e.g. WEST-02"
            value={newCampusCode}
            onChange={(e) => setNewCampusCode(e.target.value)}
            className="uppercase font-mono"
            required
          />

          <Input
            label="Street Address / Location"
            placeholder="e.g. 500 University Ave, Seattle, WA"
            value={newCampusAddress}
            onChange={(e) => setNewCampusAddress(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setCampusModalOpen(false)}
              disabled={creatingCampus}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              disabled={creatingCampus}
              icon={creatingCampus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
            >
              {creatingCampus ? 'Creating in Database...' : 'Create Campus'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
