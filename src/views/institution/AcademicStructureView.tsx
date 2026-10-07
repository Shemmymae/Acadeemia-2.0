import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderTree,
  Star,
  Users,
  Building2,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabaseService } from '../../services/supabaseService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import {
  AcademicClass,
  AcademicGrade,
  AcademicTerm,
  AcademicYear,
  Subject,
} from '../../types';

type AcademicTab = 'years' | 'terms' | 'grades' | 'classes' | 'subjects';

export const AcademicStructureView: React.FC = () => {
  const { activeInstitution, activeCampus, campuses, refreshTenantData } = useTenant();

  const [activeTab, setActiveTab] = useState<AcademicTab>('years');
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [grades, setGrades] = useState<AcademicGrade[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Year Modal State
  const [yearModalOpen, setYearModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [yearName, setYearName] = useState('');
  const [yearStartDate, setYearStartDate] = useState('');
  const [yearEndDate, setYearEndDate] = useState('');
  const [yearIsCurrent, setYearIsCurrent] = useState(false);

  // Term Modal State
  const [termModalOpen, setTermModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null);
  const [termName, setTermName] = useState('');
  const [termYearId, setTermYearId] = useState('');
  const [termStartDate, setTermStartDate] = useState('');
  const [termEndDate, setTermEndDate] = useState('');
  const [termIsCurrent, setTermIsCurrent] = useState(false);

  // Grade Modal State
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<AcademicGrade | null>(null);
  const [gradeName, setGradeName] = useState('');
  const [gradeCode, setGradeCode] = useState('');
  const [gradeSeq, setGradeSeq] = useState(1);
  const [gradeLevel, setGradeLevel] = useState('Primary');

  // Class Modal State
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [classCampusId, setClassCampusId] = useState('');
  const [classGradeId, setClassGradeId] = useState('');
  const [classYearId, setClassYearId] = useState('');
  const [classCapacity, setClassCapacity] = useState(35);

  // Subject Modal State
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectDesc, setSubjectDesc] = useState('');
  const [subjectLevel, setSubjectLevel] = useState('General');

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string; name: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!activeInstitution) return;
    setLoading(true);
    setError(null);
    try {
      const [ayList, grList, clList, subList] = await Promise.all([
        supabaseService.getAcademicYears(activeInstitution.id),
        supabaseService.getAcademicGrades(activeInstitution.id),
        supabaseService.getAcademicClasses(activeInstitution.id, activeCampus?.id),
        supabaseService.getSubjects(activeInstitution.id),
      ]);
      setAcademicYears(ayList);
      setGrades(grList);
      setClasses(clList);
      setSubjects(subList);

      const activeYear = ayList.find((ay) => ay.is_current) || ayList[0];
      if (activeYear) {
        const atList = await supabaseService.getAcademicTerms(activeInstitution.id, activeYear.id);
        setTerms(atList);
      } else {
        setTerms([]);
      }
    } catch (err: any) {
      console.warn('Academic data load error:', err);
      setError(err.message || 'Failed to load academic records');
    } finally {
      setLoading(false);
    }
  }, [activeInstitution?.id, activeCampus?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- ACADEMIC YEAR HANDLERS ---
  const handleSaveYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName.trim() || !yearStartDate || !yearEndDate || !activeInstitution) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingYear) {
        await supabaseService.updateAcademicYear(editingYear.id, {
          institution_id: activeInstitution.id,
          name: yearName.trim(),
          start_date: yearStartDate,
          end_date: yearEndDate,
          is_current: yearIsCurrent,
        });
      } else {
        await supabaseService.createAcademicYear({
          institution_id: activeInstitution.id,
          name: yearName.trim(),
          start_date: yearStartDate,
          end_date: yearEndDate,
          is_current: yearIsCurrent,
        });
      }
      await loadData();
      refreshTenantData();
      setYearModalOpen(false);
    } catch (err: any) {
      console.error('Save year error:', err);
      setFormError(err.message || 'Database rejected academic year');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCurrentYear = async (year: AcademicYear) => {
    if (!activeInstitution) return;
    try {
      await supabaseService.setCurrentAcademicYear(activeInstitution.id, year.id);
      await loadData();
      refreshTenantData();
    } catch (err: any) {
      setError(err.message || 'Failed to update current academic year');
    }
  };

  // --- TERM HANDLERS ---
  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termName.trim() || !termYearId || !termStartDate || !termEndDate || !activeInstitution) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingTerm) {
        await supabaseService.updateAcademicTerm(editingTerm.id, {
          institution_id: activeInstitution.id,
          academic_year_id: termYearId,
          name: termName.trim(),
          start_date: termStartDate,
          end_date: termEndDate,
          is_current: termIsCurrent,
        });
      } else {
        await supabaseService.createAcademicTerm({
          institution_id: activeInstitution.id,
          academic_year_id: termYearId,
          name: termName.trim(),
          start_date: termStartDate,
          end_date: termEndDate,
          is_current: termIsCurrent,
        });
      }
      await loadData();
      refreshTenantData();
      setTermModalOpen(false);
    } catch (err: any) {
      console.error('Save term error:', err);
      setFormError(err.message || 'Database rejected term');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCurrentTerm = async (term: AcademicTerm) => {
    if (!activeInstitution) return;
    try {
      await supabaseService.setCurrentAcademicTerm(activeInstitution.id, term.id);
      await loadData();
      refreshTenantData();
    } catch (err: any) {
      setError(err.message || 'Failed to set active term');
    }
  };

  // --- GRADE HANDLERS ---
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeName.trim() || !gradeCode.trim() || !activeInstitution) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingGrade) {
        await supabaseService.updateAcademicGrade(editingGrade.id, {
          name: gradeName.trim(),
          code: gradeCode.trim().toUpperCase(),
          sequence_order: Number(gradeSeq) || 1,
          education_level: gradeLevel,
        });
      } else {
        await supabaseService.createAcademicGrade({
          institution_id: activeInstitution.id,
          name: gradeName.trim(),
          code: gradeCode.trim().toUpperCase(),
          sequence_order: Number(gradeSeq) || 1,
          education_level: gradeLevel,
        });
      }
      await loadData();
      setGradeModalOpen(false);
    } catch (err: any) {
      console.error('Save grade error:', err);
      setFormError(err.message || 'Database rejected grade');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- CLASS HANDLERS ---
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !classCode.trim() || !classCampusId || !classGradeId || !classYearId || !activeInstitution) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingClass) {
        await supabaseService.updateAcademicClass(editingClass.id, {
          name: className.trim(),
          code: classCode.trim().toUpperCase(),
          campus_id: classCampusId,
          grade_id: classGradeId,
          academic_year_id: classYearId,
          capacity: Number(classCapacity) || 35,
        });
      } else {
        await supabaseService.createAcademicClass({
          institution_id: activeInstitution.id,
          campus_id: classCampusId,
          grade_id: classGradeId,
          academic_year_id: classYearId,
          name: className.trim(),
          code: classCode.trim().toUpperCase(),
          capacity: Number(classCapacity) || 35,
        });
      }
      await loadData();
      setClassModalOpen(false);
    } catch (err: any) {
      console.error('Save class error:', err);
      setFormError(err.message || 'Database rejected class cohort');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- SUBJECT HANDLERS ---
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCode.trim() || !activeInstitution) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingSubject) {
        await supabaseService.updateSubject(editingSubject.id, {
          name: subjectName.trim(),
          code: subjectCode.trim().toUpperCase(),
          description: subjectDesc.trim() || undefined,
          education_level: subjectLevel,
        });
      } else {
        await supabaseService.createSubject({
          institution_id: activeInstitution.id,
          name: subjectName.trim(),
          code: subjectCode.trim().toUpperCase(),
          description: subjectDesc.trim() || undefined,
          education_level: subjectLevel,
          is_active: true,
        });
      }
      await loadData();
      setSubjectModalOpen(false);
    } catch (err: any) {
      console.error('Save subject error:', err);
      setFormError(err.message || 'Database rejected subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DELETE CONFIRMATION ---
  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setIsSubmitting(true);
    try {
      if (deleteItem.type === 'year') await supabaseService.deleteAcademicYear(deleteItem.id);
      if (deleteItem.type === 'term') await supabaseService.deleteAcademicTerm(deleteItem.id);
      if (deleteItem.type === 'grade') await supabaseService.deleteAcademicGrade(deleteItem.id);
      if (deleteItem.type === 'class') await supabaseService.deleteAcademicClass(deleteItem.id);
      if (deleteItem.type === 'subject') await supabaseService.deleteSubject(deleteItem.id);

      await loadData();
      refreshTenantData();
      setDeleteModalOpen(false);
      setDeleteItem(null);
    } catch (err: any) {
      console.error('Deletion error:', err);
      setError(err.message || 'Database rejected deletion');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeInstitution) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Active Educational Institution</h3>
        <p className="text-xs text-slate-400">Select an authorized institution to view curriculum structures.</p>
      </div>
    );
  }

  const terminology = activeInstitution.terminology_config;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Academic Hierarchy & Curriculum
            </h1>
            <Badge variant="info">{activeInstitution.name}</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authoritative sessions, {terminology.term_label.toLowerCase()}s, {terminology.grade_label.toLowerCase()} levels, cohorts, and subjects.
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
          {activeTab === 'years' && (
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingYear(null);
                setYearName('2026-2027 Academic Session');
                setYearStartDate('2026-09-01');
                setYearEndDate('2027-06-30');
                setYearIsCurrent(false);
                setFormError(null);
                setYearModalOpen(true);
              }}
            >
              New Academic Year
            </Button>
          )}
          {activeTab === 'terms' && (
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingTerm(null);
                setTermName(`${terminology.term_label} 1`);
                setTermYearId(academicYears[0]?.id || '');
                setTermStartDate('2026-09-01');
                setTermEndDate('2026-12-15');
                setTermIsCurrent(false);
                setFormError(null);
                setTermModalOpen(true);
              }}
            >
              New {terminology.term_label}
            </Button>
          )}
          {activeTab === 'grades' && (
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingGrade(null);
                setGradeName(`${terminology.grade_label} 1`);
                setGradeCode('G1');
                setGradeSeq(grades.length + 1);
                setGradeLevel('Primary');
                setFormError(null);
                setGradeModalOpen(true);
              }}
            >
              New {terminology.grade_label}
            </Button>
          )}
          {activeTab === 'classes' && (
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingClass(null);
                setClassName(`${terminology.grade_label} 1 - North`);
                setClassCode('1N');
                setClassCampusId(campuses[0]?.id || '');
                setClassGradeId(grades[0]?.id || '');
                setClassYearId(academicYears[0]?.id || '');
                setClassCapacity(35);
                setFormError(null);
                setClassModalOpen(true);
              }}
            >
              New {terminology.class_label}
            </Button>
          )}
          {activeTab === 'subjects' && (
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingSubject(null);
                setSubjectCode('ENG');
                setSubjectName('English Language');
                setSubjectDesc('Grammar, reading comprehension, and literature.');
                setSubjectLevel('General');
                setFormError(null);
                setSubjectModalOpen(true);
              }}
            >
              New Subject
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('years')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'years'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Academic Sessions & Years</span>
          <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
            {academicYears.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'terms'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>{terminology.term_label} Cycles</span>
          <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
            {terms.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('grades')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'grades'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{terminology.grade_label} Levels</span>
          <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
            {grades.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'classes'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{terminology.class_label} Cohorts</span>
          <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
            {classes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'subjects'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Subjects</span>
          <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
            {subjects.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. ACADEMIC YEARS */}
      {activeTab === 'years' && (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Session Name</th>
                <th className="px-6 py-3.5">Date Range</th>
                <th className="px-6 py-3.5">Active Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {academicYears.map((ay) => (
                <tr key={ay.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-200">{ay.name}</td>
                  <td className="px-6 py-4 font-mono text-slate-400">
                    {ay.start_date} → {ay.end_date}
                  </td>
                  <td className="px-6 py-4">
                    {ay.is_current ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                        <CheckCircle2 className="w-3 h-3" /> Current Academic Session
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetCurrentYear(ay)}
                        className="text-[11px] text-slate-400 hover:text-indigo-300 hover:underline cursor-pointer"
                      >
                        Set as Active
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingYear(ay);
                          setYearName(ay.name);
                          setYearStartDate(ay.start_date);
                          setYearEndDate(ay.end_date);
                          setYearIsCurrent(ay.is_current);
                          setFormError(null);
                          setYearModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-md transition-colors"
                        title="Edit Year"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteItem({ type: 'year', id: ay.id, name: ay.name });
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="Delete Year"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {academicYears.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No academic years configured yet.
            </div>
          )}
        </Card>
      )}

      {/* 2. TERMS / SEMESTERS */}
      {activeTab === 'terms' && (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">{terminology.term_label} Name</th>
                <th className="px-6 py-3.5">Academic Session</th>
                <th className="px-6 py-3.5">Start / End Dates</th>
                <th className="px-6 py-3.5">Active Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {terms.map((t) => {
                const year = academicYears.find((y) => y.id === t.academic_year_id);
                return (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-200">{t.name}</td>
                    <td className="px-6 py-4 text-slate-300">{year?.name || 'Academic Year'}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {t.start_date} → {t.end_date}
                    </td>
                    <td className="px-6 py-4">
                      {t.is_current ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" /> Active Term
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetCurrentTerm(t)}
                          className="text-[11px] text-slate-400 hover:text-indigo-300 hover:underline cursor-pointer"
                        >
                          Set Active
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingTerm(t);
                            setTermName(t.name);
                            setTermYearId(t.academic_year_id);
                            setTermStartDate(t.start_date);
                            setTermEndDate(t.end_date);
                            setTermIsCurrent(t.is_current);
                            setFormError(null);
                            setTermModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-md transition-colors"
                          title="Edit Term"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteItem({ type: 'term', id: t.id, name: t.name });
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                          title="Delete Term"
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
          {terms.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No {terminology.term_label.toLowerCase()} cycles registered.
            </div>
          )}
        </Card>
      )}

      {/* 3. GRADES / FORMS */}
      {activeTab === 'grades' && (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Sequence</th>
                <th className="px-6 py-3.5">{terminology.grade_label} Level</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Education Tier</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {grades.map((gr) => (
                <tr key={gr.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-400">{gr.sequence_order}</td>
                  <td className="px-6 py-4 font-semibold text-slate-200">{gr.name}</td>
                  <td className="px-6 py-4 font-mono uppercase text-slate-400">{gr.code}</td>
                  <td className="px-6 py-4 text-slate-300">{gr.education_level || 'General'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingGrade(gr);
                          setGradeName(gr.name);
                          setGradeCode(gr.code);
                          setGradeSeq(gr.sequence_order);
                          setGradeLevel(gr.education_level || 'Primary');
                          setFormError(null);
                          setGradeModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-md transition-colors"
                        title="Edit Grade"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteItem({ type: 'grade', id: gr.id, name: gr.name });
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="Delete Grade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {grades.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No {terminology.grade_label.toLowerCase()} levels registered.
            </div>
          )}
        </Card>
      )}

      {/* 4. CLASSES / COHORTS */}
      {activeTab === 'classes' && (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">{terminology.class_label} Cohort</th>
                <th className="px-6 py-3.5">{terminology.grade_label} Level</th>
                <th className="px-6 py-3.5">Campus Node</th>
                <th className="px-6 py-3.5">Capacity</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {classes.map((cl) => {
                const campus = campuses.find((c) => c.id === cl.campus_id);
                const grade = grades.find((g) => g.id === cl.grade_id);
                return (
                  <tr key={cl.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{cl.name}</div>
                      <div className="text-[11px] font-mono text-indigo-400">{cl.code}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{grade?.name || 'Grade'}</td>
                    <td className="px-6 py-4 text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      {campus?.name || 'Campus'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">{cl.capacity} scholars</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingClass(cl);
                            setClassName(cl.name);
                            setClassCode(cl.code);
                            setClassCampusId(cl.campus_id);
                            setClassGradeId(cl.grade_id);
                            setClassYearId(cl.academic_year_id);
                            setClassCapacity(cl.capacity);
                            setFormError(null);
                            setClassModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-md transition-colors"
                          title="Edit Class"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteItem({ type: 'class', id: cl.id, name: cl.name });
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                          title="Delete Class"
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
          {classes.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No {terminology.class_label.toLowerCase()} cohorts configured.
            </div>
          )}
        </Card>
      )}

      {/* 5. SUBJECTS */}
      {activeTab === 'subjects' && (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Subject Code</th>
                <th className="px-6 py-3.5">Title & Description</th>
                <th className="px-6 py-3.5">Education Tier</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-400">{sub.code}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-200">{sub.name}</div>
                    {sub.description && (
                      <div className="text-[11px] text-slate-400 mt-0.5">{sub.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-300">{sub.education_level || 'General'}</td>
                  <td className="px-6 py-4">
                    <Badge variant={sub.is_active ? 'success' : 'neutral'}>
                      {sub.is_active ? 'Active Curriculum' : 'Archived'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingSubject(sub);
                          setSubjectCode(sub.code);
                          setSubjectName(sub.name);
                          setSubjectDesc(sub.description || '');
                          setSubjectLevel(sub.education_level || 'General');
                          setFormError(null);
                          setSubjectModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-md transition-colors"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteItem({ type: 'subject', id: sub.id, name: sub.name });
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subjects.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No subjects registered yet.
            </div>
          )}
        </Card>
      )}

      {/* YEAR MODAL */}
      <Modal
        isOpen={yearModalOpen}
        onClose={() => setYearModalOpen(false)}
        title={editingYear ? 'Edit Academic Year' : 'Create Academic Year'}
      >
        <form onSubmit={handleSaveYear} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Academic Year Label *"
            value={yearName}
            onChange={(e) => setYearName(e.target.value)}
            placeholder="e.g. 2026-2027 Academic Session"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="date"
              value={yearStartDate}
              onChange={(e) => setYearStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date *"
              type="date"
              value={yearEndDate}
              onChange={(e) => setYearEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="yearCurrentCheck"
              checked={yearIsCurrent}
              onChange={(e) => setYearIsCurrent(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="yearCurrentCheck" className="text-xs text-slate-300 font-medium">
              Designate as Active / Current Institutional Year
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setYearModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving to Database...' : editingYear ? 'Save Changes' : 'Create Session'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* TERM MODAL */}
      <Modal
        isOpen={termModalOpen}
        onClose={() => setTermModalOpen(false)}
        title={editingTerm ? `Edit ${terminology.term_label}` : `Add ${terminology.term_label} Cycle`}
      >
        <form onSubmit={handleSaveTerm} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Select
            label="Associated Academic Year *"
            value={termYearId}
            onChange={(e) => setTermYearId(e.target.value)}
            options={academicYears.map((ay) => ({ value: ay.id, label: ay.name }))}
            required
          />

          <Input
            label={`${terminology.term_label} Name *`}
            value={termName}
            onChange={(e) => setTermName(e.target.value)}
            placeholder={`e.g. ${terminology.term_label} 1`}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="date"
              value={termStartDate}
              onChange={(e) => setTermStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date *"
              type="date"
              value={termEndDate}
              onChange={(e) => setTermEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="termCurrentCheck"
              checked={termIsCurrent}
              onChange={(e) => setTermIsCurrent(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="termCurrentCheck" className="text-xs text-slate-300 font-medium">
              Designate as Currently Active Term
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setTermModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Confirm Cycle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* GRADE MODAL */}
      <Modal
        isOpen={gradeModalOpen}
        onClose={() => setGradeModalOpen(false)}
        title={editingGrade ? `Edit ${terminology.grade_label}` : `Add ${terminology.grade_label} Level`}
      >
        <form onSubmit={handleSaveGrade} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${terminology.grade_label} Name *`}
              value={gradeName}
              onChange={(e) => setGradeName(e.target.value)}
              placeholder={`e.g. ${terminology.grade_label} 6`}
              required
            />
            <Input
              label="Short Code *"
              value={gradeCode}
              onChange={(e) => setGradeCode(e.target.value)}
              placeholder="e.g. G6"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Progression Sequence Order *"
              type="number"
              value={gradeSeq}
              onChange={(e) => setGradeSeq(Number(e.target.value))}
              required
            />
            <Select
              label="Education Tier / Level"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              options={[
                { value: 'Early Childhood', label: 'Early Childhood / Pre-Primary' },
                { value: 'Primary', label: 'Primary Education' },
                { value: 'Junior Secondary', label: 'Junior Secondary / Middle School' },
                { value: 'Senior Secondary', label: 'Senior Secondary / High School' },
                { value: 'Tertiary', label: 'Tertiary / Vocational' },
              ]}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setGradeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Grade Level'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CLASS MODAL */}
      <Modal
        isOpen={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        title={editingClass ? `Edit ${terminology.class_label}` : `Add ${terminology.class_label} Cohort`}
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${terminology.class_label} Name *`}
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder={`e.g. ${terminology.grade_label} 6 - North Stream`}
              required
            />
            <Input
              label="Cohort Code *"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="e.g. 6N"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={`${terminology.grade_label} Level *`}
              value={classGradeId}
              onChange={(e) => setClassGradeId(e.target.value)}
              options={grades.map((g) => ({ value: g.id, label: g.name }))}
              required
            />
            <Select
              label="Campus Node *"
              value={classCampusId}
              onChange={(e) => setClassCampusId(e.target.value)}
              options={campuses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Academic Session *"
              value={classYearId}
              onChange={(e) => setClassYearId(e.target.value)}
              options={academicYears.map((ay) => ({ value: ay.id, label: ay.name }))}
              required
            />
            <Input
              label="Max Scholar Capacity"
              type="number"
              value={classCapacity}
              onChange={(e) => setClassCapacity(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setClassModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Cohort'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* SUBJECT MODAL */}
      <Modal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add Subject to Curriculum'}
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Subject Code *"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              placeholder="e.g. MTH"
              required
            />
            <Input
              label="Subject Title *"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Pure Mathematics"
              required
            />
          </div>

          <Select
            label="Education Tier"
            value={subjectLevel}
            onChange={(e) => setSubjectLevel(e.target.value)}
            options={[
              { value: 'General', label: 'All Levels (Universal)' },
              { value: 'Primary', label: 'Primary' },
              { value: 'Secondary', label: 'Secondary / High School' },
              { value: 'Advanced', label: 'Advanced Placement / Form 5-6' },
            ]}
          />

          <Input
            label="Course Syllabus / Description"
            value={subjectDesc}
            onChange={(e) => setSubjectDesc(e.target.value)}
            placeholder="Key concepts, literature, or lab components."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Subject'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Record Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Are you sure you want to delete <strong className="text-white">{deleteItem?.name}</strong>?
          </p>
          <p className="text-xs text-amber-400 bg-amber-950/30 p-3 rounded-lg border border-amber-800/30">
            PostgreSQL constraints will prevent deletion if dependent classes, enrollments, or scholar records rely on this item.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete Record'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
