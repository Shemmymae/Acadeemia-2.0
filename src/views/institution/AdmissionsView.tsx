import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserPlus,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  UserCheck,
  ShieldAlert,
  Building2,
  Calendar,
  GraduationCap,
  Layers,
  Phone,
  Mail,
  MapPin,
  Eye,
  Check,
  X,
  FileCheck
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useModules } from '../../context/ModuleContext';
import { supabaseService } from '../../services/supabaseService';
import {
  AdmissionInquiry,
  AdmissionApplicant,
  AdmissionApplication,
  AdmissionStats,
  DuplicateApplicantMatch,
  InquiryStatus,
  ApplicantStatus,
  ApplicationStatus,
  Campus,
  AcademicYear,
  AcademicGrade,
  AcademicClass
} from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';

export const AdmissionsView: React.FC = () => {
  const { activeInstitution, activeCampus, activeRole } = useTenant();
  const { isPlatformAdmin } = useAuth();
  const { isModuleAccessible } = useModules();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'inquiries' | 'applicants' | 'applications'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core domain records
  const [stats, setStats] = useState<AdmissionStats | null>(null);
  const [inquiries, setInquiries] = useState<AdmissionInquiry[]>([]);
  const [applicants, setApplicants] = useState<AdmissionApplicant[]>([]);
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);

  // Metadata catalogs
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<AcademicGrade[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState<string>(activeCampus?.id || 'all');
  const [gradeFilter, setGradeFilter] = useState('all');

  // Modals & Action State
  const [newInquiryOpen, setNewInquiryOpen] = useState(false);
  const [newApplicantOpen, setNewApplicantOpen] = useState(false);
  const [newApplicationOpen, setNewApplicationOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedAppForConvert, setSelectedAppForConvert] = useState<AdmissionApplication | null>(null);
  const [selectedClassForConvert, setSelectedClassForConvert] = useState<string>('');
  const [convertSubmitting, setConvertSubmitting] = useState(false);
  const [convertSuccessData, setConvertSuccessData] = useState<{ studentNumber: string } | null>(null);

  // Detail Drawers / View Modals
  const [selectedApplicant, setSelectedApplicant] = useState<AdmissionApplicant | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<AdmissionApplication | null>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateApplicantMatch[]>([]);

  // Form states
  const [inquiryForm, setInquiryForm] = useState({
    prospective_student_name: '',
    prospective_student_date_of_birth: '',
    guardian_name: '',
    guardian_email: '',
    guardian_phone: '',
    interested_grade_id: '',
    campus_id: activeCampus?.id || '',
    academic_year_id: '',
    source: 'website',
    notes: '',
  });

  const [applicantForm, setApplicantForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    preferred_name: '',
    date_of_birth: '',
    gender: 'Male',
    nationality: 'American',
    email: '',
    phone: '',
    address: '',
    previous_school: '',
    campus_id: activeCampus?.id || '',
    notes: '',
  });

  const [applicationForm, setApplicationForm] = useState({
    applicant_id: '',
    campus_id: activeCampus?.id || '',
    academic_year_id: '',
    grade_id: '',
    class_id: '',
    notes: '',
  });

  const canManage =
    isPlatformAdmin ||
    activeRole === 'institution_owner' ||
    activeRole === 'institution_admin' ||
    activeRole === 'school_admin' ||
    activeRole === 'principal';

  // Load live data
  const loadData = useCallback(async () => {
    if (!activeInstitution) return;
    setLoading(true);
    setError(null);
    try {
      const cId = campusFilter !== 'all' ? campusFilter : undefined;
      const [
        statsData,
        inqsData,
        appsData,
        applsData,
        camps,
        ays,
        grds,
        clss
      ] = await Promise.all([
        supabaseService.getAdmissionStats(activeInstitution.id, cId),
        supabaseService.getInquiries(activeInstitution.id, { campusId: cId }),
        supabaseService.getApplicants(activeInstitution.id, { campusId: cId }),
        supabaseService.getApplications(activeInstitution.id, { campusId: cId }),
        supabaseService.getCampuses(activeInstitution.id),
        supabaseService.getAcademicYears(activeInstitution.id),
        supabaseService.getAcademicGrades(activeInstitution.id),
        supabaseService.getAcademicClasses(activeInstitution.id),
      ]);

      setStats(statsData);
      setInquiries(inqsData);
      setApplicants(appsData);
      setApplications(applsData);
      setCampuses(camps);
      setAcademicYears(ays);
      setGrades(grds);
      setClasses(clss);
    } catch (err: any) {
      console.error('Failed to load admissions domain data:', err);
      setError(err.message || 'Failed to load admissions information');
    } finally {
      setLoading(false);
    }
  }, [activeInstitution?.id, campusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync campus filter if header switch changes
  useEffect(() => {
    if (activeCampus) {
      setCampusFilter(activeCampus.id);
    }
  }, [activeCampus]);

  // Filtered queries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          i.prospective_student_name.toLowerCase().includes(q) ||
          i.guardian_name.toLowerCase().includes(q) ||
          i.inquiry_number.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inquiries, statusFilter, searchQuery]);

  const filteredApplicants = useMemo(() => {
    return applicants.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          a.first_name.toLowerCase().includes(q) ||
          a.last_name.toLowerCase().includes(q) ||
          a.applicant_number.toLowerCase().includes(q) ||
          (a.email && a.email.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [applicants, statusFilter, searchQuery]);

  const filteredApplications = useMemo(() => {
    return applications.filter((ap) => {
      if (statusFilter !== 'all' && ap.status !== statusFilter) return false;
      if (gradeFilter !== 'all' && ap.grade_id !== gradeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const numMatch = ap.application_number.toLowerCase().includes(q);
        const nameMatch =
          ap.applicant &&
          (ap.applicant.first_name.toLowerCase().includes(q) ||
            ap.applicant.last_name.toLowerCase().includes(q));
        return numMatch || nameMatch;
      }
      return true;
    });
  }, [applications, statusFilter, gradeFilter, searchQuery]);

  // Handle Create Inquiry
  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitution) return;
    try {
      await supabaseService.createInquiry({
        institution_id: activeInstitution.id,
        campus_id: inquiryForm.campus_id || null,
        academic_year_id: inquiryForm.academic_year_id || null,
        interested_grade_id: inquiryForm.interested_grade_id || null,
        prospective_student_name: inquiryForm.prospective_student_name,
        prospective_student_date_of_birth: inquiryForm.prospective_student_date_of_birth || null,
        guardian_name: inquiryForm.guardian_name,
        guardian_email: inquiryForm.guardian_email || null,
        guardian_phone: inquiryForm.guardian_phone,
        source: inquiryForm.source,
        notes: inquiryForm.notes || null,
        status: 'new',
      });
      setNewInquiryOpen(false);
      setInquiryForm({
        prospective_student_name: '',
        prospective_student_date_of_birth: '',
        guardian_name: '',
        guardian_email: '',
        guardian_phone: '',
        interested_grade_id: '',
        campus_id: activeCampus?.id || '',
        academic_year_id: '',
        source: 'website',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      alert(`Error creating inquiry: ${err.message}`);
    }
  };

  // Handle Convert Inquiry to Applicant
  const handleConvertInquiry = async (inq: AdmissionInquiry) => {
    try {
      await supabaseService.convertInquiryToApplicant(inq.id);
      loadData();
      setActiveTab('applicants');
    } catch (err: any) {
      alert(`Error converting inquiry: ${err.message}`);
    }
  };

  // Handle Create Applicant
  const handleCreateApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitution) return;
    try {
      await supabaseService.createApplicant({
        institution_id: activeInstitution.id,
        campus_id: applicantForm.campus_id || null,
        first_name: applicantForm.first_name,
        middle_name: applicantForm.middle_name || null,
        last_name: applicantForm.last_name,
        preferred_name: applicantForm.preferred_name || null,
        date_of_birth: applicantForm.date_of_birth,
        gender: applicantForm.gender || null,
        nationality: applicantForm.nationality || null,
        email: applicantForm.email || null,
        phone: applicantForm.phone || null,
        address: applicantForm.address || null,
        previous_school: applicantForm.previous_school || null,
        status: 'draft',
        notes: applicantForm.notes || null,
      });
      setNewApplicantOpen(false);
      setApplicantForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        preferred_name: '',
        date_of_birth: '',
        gender: 'Male',
        nationality: 'American',
        email: '',
        phone: '',
        address: '',
        previous_school: '',
        campus_id: activeCampus?.id || '',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      alert(`Error creating applicant: ${err.message}`);
    }
  };

  // Handle Create Application
  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitution) return;
    try {
      await supabaseService.createApplication({
        institution_id: activeInstitution.id,
        applicant_id: applicationForm.applicant_id,
        campus_id: applicationForm.campus_id,
        academic_year_id: applicationForm.academic_year_id,
        grade_id: applicationForm.grade_id,
        class_id: applicationForm.class_id || null,
        status: 'draft',
        application_date: new Date().toISOString().split('T')[0],
        notes: applicationForm.notes || null,
      });
      setNewApplicationOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating application: ${err.message}`);
    }
  };

  // Application Lifecycle Actions
  const handleLifecycleAction = async (
    applicationId: string,
    action: 'submit' | 'review' | 'accept' | 'waitlist' | 'reject' | 'withdraw'
  ) => {
    try {
      if (action === 'submit') {
        await supabaseService.submitApplication(applicationId);
      } else if (action === 'review') {
        await supabaseService.startApplicationReview(applicationId);
      } else if (action === 'accept') {
        await supabaseService.acceptApplication(applicationId, undefined, 'Accepted after review.');
      } else if (action === 'waitlist') {
        await supabaseService.waitlistApplication(applicationId, undefined, 'Waitlisted due to current class capacity.');
      } else if (action === 'reject') {
        await supabaseService.rejectApplication(applicationId, undefined, 'Does not meet current admissions criteria.');
      } else if (action === 'withdraw') {
        await supabaseService.withdrawApplication(applicationId, 'Withdrawn by family request.');
      }
      loadData();
    } catch (err: any) {
      alert(`Lifecycle error: ${err.message}`);
    }
  };

  // Trigger Conversion to Student
  const handleTriggerConvert = (app: AdmissionApplication) => {
    setSelectedAppForConvert(app);
    setSelectedClassForConvert(app.class_id || '');
    setConvertSuccessData(null);
    setConvertModalOpen(true);
  };

  const handleExecuteConversion = async () => {
    if (!selectedAppForConvert) return;
    setConvertSubmitting(true);
    try {
      const res = await supabaseService.convertApplicantToStudent(
        selectedAppForConvert.id,
        selectedClassForConvert || undefined
      );
      setConvertSuccessData({ studentNumber: res.student_number });
      loadData();
    } catch (err: any) {
      alert(`Conversion error: ${err.message}`);
    } finally {
      setConvertSubmitting(false);
    }
  };

  // Check Duplicate Applicants
  const checkDuplicates = async (a: AdmissionApplicant) => {
    setSelectedApplicant(a);
    if (!activeInstitution) return;
    const matches = await supabaseService.detectDuplicateApplicants(
      activeInstitution.id,
      a.first_name,
      a.last_name,
      a.date_of_birth,
      a.email || undefined,
      a.phone || undefined
    );
    setDuplicateMatches(matches.filter((m) => m.applicant_id !== a.id));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'qualified':
      case 'converted':
        return 'success';
      case 'under_review':
      case 'contacted':
      case 'submitted':
        return 'warning';
      case 'waitlisted':
        return 'neutral';
      case 'rejected':
      case 'closed':
      case 'withdrawn':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (!activeInstitution) {
    return (
      <EmptyState
        icon={<Building2 className="w-8 h-8 text-slate-500" />}
        title="No Institution Selected"
        description="Select an active educational institution to manage admissions, applicant inquiries, and student conversions."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <UserPlus className="w-6 h-6 text-indigo-400" />
              Admissions & Applicant Management
            </h1>
            <Badge variant="primary">Phase 4C Foundation</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            End-to-end prospective family intake, applicant lifecycle review, and transactional student enrollment conversion.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => loadData()}
            disabled={loading}
          >
            Refresh Data
          </Button>
          {canManage && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setNewInquiryOpen(true)}
              >
                New Inquiry
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => setNewApplicantOpen(true)}
              >
                Register Applicant
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            label="Total Inquiries"
            value={stats.totalInquiries}
            trend={`${stats.newInquiries} uncontacted`}
            icon={<HelpCircle className="w-4 h-4 text-sky-400" />}
          />
          <StatCard
            label="Total Applicants"
            value={stats.totalApplicants}
            trend="Active Cohort"
            icon={<Users className="w-4 h-4 text-indigo-400" />}
          />
          <StatCard
            label="Applications Submitted"
            value={stats.submittedApplications}
            trend="Awaiting Review"
            icon={<FileText className="w-4 h-4 text-blue-400" />}
          />
          <StatCard
            label="Under Review"
            value={stats.underReviewApplications}
            trend="In Evaluation"
            icon={<Clock className="w-4 h-4 text-amber-400" />}
          />
          <StatCard
            label="Accepted"
            value={stats.acceptedApplications}
            trend="Ready to Enroll"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          />
          <StatCard
            label="Converted to Students"
            value={stats.convertedStudents}
            trend="Official SIS Records"
            icon={<GraduationCap className="w-4 h-4 text-purple-400" />}
          />
        </div>
      )}

      {/* Main Tabs Navigation */}
      <Tabs
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab as any);
          setStatusFilter('all');
        }}
        tabs={[
          { id: 'dashboard', label: 'Admissions Overview', icon: <FileCheck className="w-4 h-4" /> },
          { id: 'inquiries', label: `Inquiries (${inquiries.length})`, icon: <HelpCircle className="w-4 h-4" /> },
          { id: 'applicants', label: `Applicants (${applicants.length})`, icon: <Users className="w-4 h-4" /> },
          { id: 'applications', label: `Applications (${applications.length})`, icon: <FileText className="w-4 h-4" /> },
        ]}
      />

      {/* Loading State */}
      {loading && !stats && <LoadingState message="Loading admissions records from database..." />}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DASHBOARD OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversion Funnel */}
            <Card padding="lg" className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Admissions Conversion Pipeline
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live pipeline conversion tracking from first inquiry to verified SIS enrollment.
                  </p>
                </div>
                <Badge variant="neutral">PostgreSQL Live Data</Badge>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { stage: '1. Inquiries Received', count: stats.totalInquiries, total: stats.totalInquiries || 1, color: 'bg-sky-500' },
                  { stage: '2. Formal Applicants Registered', count: stats.totalApplicants, total: stats.totalInquiries || 1, color: 'bg-indigo-500' },
                  { stage: '3. Applications Submitted & Reviewed', count: stats.submittedApplications + stats.underReviewApplications, total: stats.totalApplicants || 1, color: 'bg-amber-500' },
                  { stage: '4. Applications Accepted', count: stats.acceptedApplications, total: stats.totalApplicants || 1, color: 'bg-emerald-500' },
                  { stage: '5. Converted & Enrolled into SIS', count: stats.convertedStudents, total: stats.totalApplicants || 1, color: 'bg-purple-500' },
                ].map((item, idx) => {
                  const pct = Math.min(100, Math.round((item.count / (stats.totalInquiries || 1)) * 100));
                  return (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950/60 border border-slate-850 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{item.stage}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-white">{item.count}</span>
                          <span className="text-[11px] text-slate-500">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Quick Actions & Policy summary */}
            <Card padding="lg" className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Admissions Policy & Flow
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-semibold text-indigo-400">Auditable Student Conversion</div>
                  <p className="text-[11px] text-slate-400">
                    Converting an accepted applicant automatically creates a unique student ID, links guardians, generates enrollment, and records in <code className="text-slate-300 font-mono">admission_conversions</code>.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-semibold text-emerald-400">Duplicate Guardian Reuse</div>
                  <p className="text-[11px] text-slate-400">
                    Family contact details reuse existing guardian entities without creating orphan records.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-semibold text-amber-400">Campus Authorization Scoping</div>
                  <p className="text-[11px] text-slate-400">
                    Staff members with assigned campus access are isolated to applicants and inquiries for their respective branch.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INQUIRIES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Search prospective students, guardians, or inquiry numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Inquiry Statuses</option>
                <option value="new">New (Uncontacted)</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </Select>
            </div>
          </div>

          {/* Inquiries Table */}
          {filteredInquiries.length === 0 ? (
            <EmptyState
              icon={<HelpCircle className="w-8 h-8 text-slate-500" />}
              title="No Inquiries Found"
              description="No prospective student inquiries match your filter criteria."
              action={
                <Button size="sm" variant="primary" onClick={() => setNewInquiryOpen(true)}>
                  Create Inquiry
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Inquiry Number</th>
                    <th className="py-3 px-4">Prospective Student</th>
                    <th className="py-3 px-4">Guardian Contact</th>
                    <th className="py-3 px-4">Campus & Grade</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredInquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-400">
                        {inq.inquiry_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {inq.prospective_student_name}
                        {inq.prospective_student_date_of_birth && (
                          <div className="text-[11px] text-slate-500 font-normal">
                            DOB: {inq.prospective_student_date_of_birth}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{inq.guardian_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{inq.guardian_phone}</div>
                        {inq.guardian_email && (
                          <div className="text-[11px] text-slate-500">{inq.guardian_email}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">
                          {inq.campus?.name || 'All Campuses'}
                        </div>
                        <div className="text-[11px] text-indigo-300">
                          {inq.interested_grade?.name || 'Grade Pending'}
                        </div>
                      </td>
                      <td className="py-3 px-4 uppercase text-[11px] text-slate-400 font-mono">
                        {inq.source}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(inq.status)}>{inq.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {inq.status !== 'converted' && canManage && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleConvertInquiry(inq)}
                          >
                            Convert to Applicant
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. APPLICANTS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'applicants' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Search applicants by name, applicant number, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Applicant Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="accepted">Accepted</option>
                <option value="waitlisted">Waitlisted</option>
                <option value="rejected">Rejected</option>
                <option value="converted">Converted to Student</option>
              </Select>
            </div>
          </div>

          {/* Applicants Table */}
          {filteredApplicants.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-slate-500" />}
              title="No Applicants Found"
              description="No registered applicants found for this institution."
              action={
                <Button size="sm" variant="primary" onClick={() => setNewApplicantOpen(true)}>
                  Register Applicant
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Applicant ID</th>
                    <th className="py-3 px-4">Full Legal Name</th>
                    <th className="py-3 px-4">Date of Birth</th>
                    <th className="py-3 px-4">Campus</th>
                    <th className="py-3 px-4">Previous School</th>
                    <th className="py-3 px-4">Lifecycle Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredApplicants.map((appl) => (
                    <tr key={appl.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-400">
                        {appl.applicant_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">
                          {appl.first_name} {appl.middle_name ? `${appl.middle_name} ` : ''}
                          {appl.last_name}
                        </div>
                        {appl.email && <div className="text-[11px] text-slate-400 font-mono">{appl.email}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{appl.date_of_birth}</td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {appl.campus?.name || 'All Campuses'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {appl.previous_school || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(appl.status)}>{appl.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => checkDuplicates(appl)}
                          >
                            Details
                          </Button>
                          {appl.status === 'draft' && canManage && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setApplicationForm((prev) => ({ ...prev, applicant_id: appl.id }));
                                setNewApplicationOpen(true);
                              }}
                            >
                              Create Application
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. APPLICATIONS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Search by application number or student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="accepted">Accepted</option>
                <option value="waitlisted">Waitlisted</option>
                <option value="rejected">Rejected</option>
                <option value="converted">Converted to Student</option>
              </Select>
              <Select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                <option value="all">All Grades</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Applications Table */}
          {filteredApplications.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-8 h-8 text-slate-500" />}
              title="No Applications Found"
              description="No formal academic applications found for this institution."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Application No.</th>
                    <th className="py-3 px-4">Applicant Student</th>
                    <th className="py-3 px-4">Target Grade & Campus</th>
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-4">Application Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Workflow Transition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-400">
                        {app.application_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {app.applicant
                          ? `${app.applicant.first_name} ${app.applicant.last_name}`
                          : 'Applicant'}
                        <div className="text-[11px] text-slate-400 font-mono">
                          {app.applicant?.applicant_number}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">
                          {app.grade?.name || 'Grade Assigned'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {app.campus?.name} {app.class ? `• ${app.class.name}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {app.academic_year?.name || 'Session Year'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {app.application_date}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(app.status)}>{app.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Controlled Workflow State Actions */}
                          {app.status === 'draft' && canManage && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleLifecycleAction(app.id, 'submit')}
                            >
                              Submit
                            </Button>
                          )}

                          {app.status === 'submitted' && canManage && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleLifecycleAction(app.id, 'review')}
                            >
                              Start Review
                            </Button>
                          )}

                          {app.status === 'under_review' && canManage && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                className="bg-emerald-600 hover:bg-emerald-500"
                                onClick={() => handleLifecycleAction(app.id, 'accept')}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleLifecycleAction(app.id, 'waitlist')}
                              >
                                Waitlist
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleLifecycleAction(app.id, 'reject')}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {app.status === 'waitlisted' && canManage && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                className="bg-emerald-600 hover:bg-emerald-500"
                                onClick={() => handleLifecycleAction(app.id, 'accept')}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleLifecycleAction(app.id, 'reject')}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {app.status === 'accepted' && canManage && (
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-purple-600 hover:bg-purple-500 font-semibold"
                              icon={<GraduationCap className="w-3.5 h-3.5" />}
                              onClick={() => handleTriggerConvert(app)}
                            >
                              Convert to Student
                            </Button>
                          )}

                          {app.status === 'converted' && (
                            <Badge variant="success">Converted to Student</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE INQUIRY */}
      {/* ========================================================================= */}
      <Modal
        isOpen={newInquiryOpen}
        onClose={() => setNewInquiryOpen(false)}
        title="Register Prospective Student Inquiry"
      >
        <form onSubmit={handleCreateInquiry} className="space-y-4">
          <Input
            label="Prospective Student Full Name *"
            required
            value={inquiryForm.prospective_student_name}
            onChange={(e) => setInquiryForm({ ...inquiryForm, prospective_student_name: e.target.value })}
            placeholder="e.g. Liam Walker"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date of Birth"
              type="date"
              value={inquiryForm.prospective_student_date_of_birth}
              onChange={(e) => setInquiryForm({ ...inquiryForm, prospective_student_date_of_birth: e.target.value })}
            />
            <Select
              label="Target Grade Level"
              value={inquiryForm.interested_grade_id}
              onChange={(e) => setInquiryForm({ ...inquiryForm, interested_grade_id: e.target.value })}
            >
              <option value="">Select Grade</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Preferred Campus"
              value={inquiryForm.campus_id}
              onChange={(e) => setInquiryForm({ ...inquiryForm, campus_id: e.target.value })}
            >
              <option value="">Select Campus</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select
              label="Academic Session"
              value={inquiryForm.academic_year_id}
              onChange={(e) => setInquiryForm({ ...inquiryForm, academic_year_id: e.target.value })}
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </Select>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-300">Guardian / Family Information</div>
            <Input
              label="Guardian Name *"
              required
              value={inquiryForm.guardian_name}
              onChange={(e) => setInquiryForm({ ...inquiryForm, guardian_name: e.target.value })}
              placeholder="e.g. David Walker"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone Number *"
                required
                value={inquiryForm.guardian_phone}
                onChange={(e) => setInquiryForm({ ...inquiryForm, guardian_phone: e.target.value })}
                placeholder="+1 555-019-2831"
              />
              <Input
                label="Email Address"
                type="email"
                value={inquiryForm.guardian_email}
                onChange={(e) => setInquiryForm({ ...inquiryForm, guardian_email: e.target.value })}
                placeholder="david@example.com"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setNewInquiryOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Inquiry
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: REGISTER APPLICANT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={newApplicantOpen}
        onClose={() => setNewApplicantOpen(false)}
        title="Register New Applicant"
      >
        <form onSubmit={handleCreateApplicant} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="First Name *"
              required
              value={applicantForm.first_name}
              onChange={(e) => setApplicantForm({ ...applicantForm, first_name: e.target.value })}
            />
            <Input
              label="Middle Name"
              value={applicantForm.middle_name}
              onChange={(e) => setApplicantForm({ ...applicantForm, middle_name: e.target.value })}
            />
            <Input
              label="Last Name *"
              required
              value={applicantForm.last_name}
              onChange={(e) => setApplicantForm({ ...applicantForm, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Date of Birth *"
              type="date"
              required
              value={applicantForm.date_of_birth}
              onChange={(e) => setApplicantForm({ ...applicantForm, date_of_birth: e.target.value })}
            />
            <Select
              label="Gender"
              value={applicantForm.gender}
              onChange={(e) => setApplicantForm({ ...applicantForm, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
            <Select
              label="Campus"
              value={applicantForm.campus_id}
              onChange={(e) => setApplicantForm({ ...applicantForm, campus_id: e.target.value })}
            >
              <option value="">Select Campus</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={applicantForm.email}
              onChange={(e) => setApplicantForm({ ...applicantForm, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={applicantForm.phone}
              onChange={(e) => setApplicantForm({ ...applicantForm, phone: e.target.value })}
            />
          </div>

          <Input
            label="Address"
            value={applicantForm.address}
            onChange={(e) => setApplicantForm({ ...applicantForm, address: e.target.value })}
          />

          <Input
            label="Previous School Attended"
            value={applicantForm.previous_school}
            onChange={(e) => setApplicantForm({ ...applicantForm, previous_school: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setNewApplicantOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Register Applicant
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CREATE APPLICATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={newApplicationOpen}
        onClose={() => setNewApplicationOpen(false)}
        title="Create Academic Application"
      >
        <form onSubmit={handleCreateApplication} className="space-y-4">
          <Select
            label="Target Campus *"
            required
            value={applicationForm.campus_id}
            onChange={(e) => setApplicationForm({ ...applicationForm, campus_id: e.target.value })}
          >
            <option value="">Select Campus</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>

          <Select
            label="Academic Year *"
            required
            value={applicationForm.academic_year_id}
            onChange={(e) => setApplicationForm({ ...applicationForm, academic_year_id: e.target.value })}
          >
            <option value="">Select Academic Year</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>{ay.name}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Grade Level *"
              required
              value={applicationForm.grade_id}
              onChange={(e) => setApplicationForm({ ...applicationForm, grade_id: e.target.value })}
            >
              <option value="">Select Grade</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>

            <Select
              label="Assigned Section / Class (Optional)"
              value={applicationForm.class_id}
              onChange={(e) => setApplicationForm({ ...applicationForm, class_id: e.target.value })}
            >
              <option value="">Auto-Assign Later</option>
              {classes
                .filter((c) => !applicationForm.grade_id || c.grade_id === applicationForm.grade_id)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setNewApplicationOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CONVERT APPLICANT TO STUDENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title="Convert Accepted Applicant to Official Student"
      >
        {convertSuccessData ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Student Conversion Successful!</h3>
              <p className="text-xs text-slate-400 mt-1">
                The applicant has been formally enrolled into the SIS database.
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-indigo-400">
              Assigned Student ID: <span className="font-bold text-white">{convertSuccessData.studentNumber}</span>
            </div>
            <Button variant="primary" className="w-full" onClick={() => setConvertModalOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              You are about to convert application{' '}
              <span className="font-mono font-semibold text-indigo-400">
                {selectedAppForConvert?.application_number}
              </span>{' '}
              into an authoritative student record in the SIS.
            </p>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Applicant:</span>
                <span className="text-white font-semibold">
                  {selectedAppForConvert?.applicant?.first_name} {selectedAppForConvert?.applicant?.last_name}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Grade:</span>
                <span className="text-white">{selectedAppForConvert?.grade?.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Campus:</span>
                <span className="text-white">{selectedAppForConvert?.campus?.name}</span>
              </div>
            </div>

            <Select
              label="Class / Section Allocation"
              value={selectedClassForConvert}
              onChange={(e) => setSelectedClassForConvert(e.target.value)}
            >
              <option value="">Automatic Section Allocation</option>
              {classes
                .filter((c) => c.grade_id === selectedAppForConvert?.grade_id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
            </Select>

            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Conversion is a permanent transaction that copies applicant guardians into student guardians and creates enrollment records.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setConvertModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-purple-600 hover:bg-purple-500 font-semibold"
                onClick={handleExecuteConversion}
                disabled={convertSubmitting}
              >
                {convertSubmitting ? 'Converting...' : 'Confirm Conversion'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: APPLICANT DETAILS & DUPLICATE WARNING */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!selectedApplicant}
        onClose={() => setSelectedApplicant(null)}
        title="Applicant Detailed Profile"
      >
        {selectedApplicant && (
          <div className="space-y-4 text-xs">
            {/* Duplicate review alert */}
            {duplicateMatches.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  Potential Duplicate Records Detected ({duplicateMatches.length})
                </div>
                <div className="text-[11px] text-amber-200/80">
                  Other applicants with matching names, birth dates, or phone numbers exist in the database:
                  <ul className="list-disc pl-4 mt-1">
                    {duplicateMatches.map((m) => (
                      <li key={m.applicant_id} className="font-mono">
                        {m.applicant_number}: {m.first_name} {m.last_name} ({m.match_type})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px]">Applicant Number</span>
                <span className="font-mono font-bold text-white text-sm">{selectedApplicant.applicant_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status</span>
                <Badge variant={getStatusBadgeVariant(selectedApplicant.status)}>{selectedApplicant.status}</Badge>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Full Name</span>
                <span className="text-white font-semibold">
                  {selectedApplicant.first_name} {selectedApplicant.middle_name} {selectedApplicant.last_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                <span className="text-white font-mono">{selectedApplicant.date_of_birth}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Contact Email</span>
                <span className="text-slate-200 font-mono">{selectedApplicant.email || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Phone</span>
                <span className="text-slate-200 font-mono">{selectedApplicant.phone || '—'}</span>
              </div>
            </div>

            {/* Guardian relationships */}
            <div>
              <div className="font-semibold text-slate-200 mb-1.5">Linked Guardians</div>
              {selectedApplicant.guardians && selectedApplicant.guardians.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedApplicant.guardians.map((g) => (
                    <div key={g.id} className="p-2 rounded bg-slate-950 border border-slate-850 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white">{g.guardian?.full_name}</span>
                        <span className="text-[11px] text-slate-400 ml-2">({g.relationship})</span>
                      </div>
                      <Badge variant="neutral">Primary Contact</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">No guardians explicitly linked yet.</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedApplicant(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
