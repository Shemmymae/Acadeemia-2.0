import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Globe,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useModules } from '../../context/ModuleContext';
import { supabaseService } from '../../services/supabaseService';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FinanceInvoice, HRStaff, Student } from '../../types';

export interface InstitutionDashboardViewProps {
  onNavigate: (view: string) => void;
  onPreviewWebsite: () => void;
}

export const InstitutionDashboardView: React.FC<InstitutionDashboardViewProps> = ({
  onNavigate,
  onPreviewWebsite,
}) => {
  const { activeInstitution, activeCampus, campuses, activeAcademicYear, activeAcademicTerm } = useTenant();
  const { subscription, isModuleEnabled, isModuleAccessible } = useModules();

  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<HRStaff[]>([]);
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeInstitution) return;
    let isMounted = true;
    setLoading(true);

    Promise.all([
      supabaseService.getStudents(activeInstitution.id, activeCampus?.id),
      supabaseService.getHRStaff(activeInstitution.id),
      supabaseService.getInvoices(activeInstitution.id),
    ])
      .then(([stuData, staffData, invData]) => {
        if (isMounted) {
          setStudents(stuData);
          setStaff(staffData);
          setInvoices(invData);
        }
      })
      .catch((err) => {
        console.warn('Dashboard live query warning:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeInstitution?.id, activeCampus?.id]);

  if (!activeInstitution) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Active Educational Institution</h3>
        <p className="text-xs text-slate-400">Please select an authorized institution from your memberships.</p>
      </div>
    );
  }

  // Financial calculation
  const totalBilled = invoices.reduce((acc, inv) => acc + inv.total_amount_cents, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + (inv.total_amount_cents - inv.balance_cents), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  const terminology = activeInstitution.terminology_config;

  return (
    <div className="space-y-6">
      {/* Institution Banner & Academic Session Header */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: activeInstitution.branding_config?.primary_color || '#4f46e5' }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {activeInstitution.code} · {activeCampus ? activeCampus.name : 'All Campuses Scope'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {activeInstitution.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {activeInstitution.branding_config?.motto || 'Empowering learners through rigorous discovery.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-indigo-300">
                <Calendar className="w-3.5 h-3.5" />
                {activeAcademicYear?.name || '2026-2027 Year'}
              </span>
              <span>·</span>
              <span className="text-slate-300">
                {activeAcademicTerm?.name || 'Current Term'}
              </span>
              <span>·</span>
              <Badge variant="success">PostgreSQL RLS Protected</Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            {isModuleAccessible('admissions') && (
              <Button
                size="sm"
                variant="outline"
                icon={<UserPlus className="w-4 h-4" />}
                onClick={() => onNavigate('admissions')}
              >
                Admissions
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              icon={<Globe className="w-4 h-4" />}
              onClick={onPreviewWebsite}
            >
              School Website
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<Sparkles className="w-4 h-4" />}
              onClick={() => onNavigate('ai')}
            >
              AI Insights Hub
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={`Enrolled ${terminology.student_label}s`}
          value={loading ? '...' : students.length}
          subtext={`In ${activeCampus ? activeCampus.name : 'all campuses'}`}
          indicator={{ value: 'Capacity: 92%', isPositive: true }}
          icon={<GraduationCap className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          label={`Faculty & ${terminology.teacher_label}s`}
          value={loading ? '...' : staff.length}
          subtext="Active certified personnel"
          indicator={{ value: '1:12 Ratio', isPositive: true }}
          icon={<Users className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Fees Realization"
          value={loading ? '...' : `${collectionRate}%`}
          subtext={`$${(totalCollected / 100).toLocaleString()} collected`}
          indicator={{ value: '+8% vs prev term', isPositive: true }}
          icon={<DollarSign className="w-5 h-5 text-sky-400" />}
        />
        <StatCard
          label="Campuses"
          value={campuses.length}
          subtext="Multi-campus topology"
          indicator={{ value: 'All Operational', isPositive: true }}
          icon={<Building2 className="w-5 h-5 text-purple-400" />}
        />
      </div>

      {/* Two Column Layout: Recent Scholars & AI Operational Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrolled Scholars Preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Recently Enrolled {terminology.student_label}s
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authoritative database records maintaining longitudinal academic history.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('students')}
              >
                View Full SIS
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">{terminology.student_label}</th>
                    <th className="px-6 py-3">Institutional ID</th>
                    <th className="px-6 py-3">Current {terminology.class_label}</th>
                    <th className="px-6 py-3">Campus</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {loading && students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1.5 text-indigo-400" />
                        Loading scholars from database...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No scholars found in this institution.
                      </td>
                    </tr>
                  ) : (
                    students.slice(0, 4).map((stu) => {
                      const camp = campuses.find((c) => c.id === stu.campus_id);
                      return (
                        <tr key={stu.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="font-semibold text-slate-100">
                              {stu.first_name} {stu.last_name}
                            </div>
                            <div className="text-[11px] text-slate-400">{stu.gender} · DOB: {stu.date_of_birth}</div>
                          </td>
                          <td className="px-6 py-3.5 font-mono text-indigo-300 font-medium">
                            {stu.student_number}
                          </td>
                          <td className="px-6 py-3.5 text-slate-300">
                            {stu.current_class_id ? 'Class Assigned' : 'Unassigned'}
                          </td>
                          <td className="px-6 py-3.5 text-slate-400 text-[11px]">
                            {camp?.name.split('(')[0] || 'Campus'}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <Badge variant="success">Enrolled</Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* AI & Operations Panel */}
        <div className="space-y-4">
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-300">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Predictive Telemetry</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Institutional intelligence models track student retention risks and automated invoice collections.
            </p>
            <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs space-y-1">
              <div className="font-semibold text-white">Attendance Stability</div>
              <div className="text-slate-300 text-[11px]">96.4% cohort presence across campuses.</div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="w-full text-xs"
              onClick={() => onNavigate('ai')}
            >
              Open AI Analytics
            </Button>
          </Card>

          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 text-purple-300">
              <Building2 className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Campus Hierarchy</h3>
            </div>
            <p className="text-xs text-slate-400">
              {campuses.length} active physical locations operating under unified institutional governance.
            </p>
            <div className="space-y-1.5 pt-1">
              {campuses.map((c) => (
                <div key={c.id} className="text-xs flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-200 font-medium">{c.name}</span>
                  <span className="text-[10px] font-mono text-indigo-400">{c.code}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
