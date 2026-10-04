import React from 'react';
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
  Globe
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useModules } from '../../context/ModuleContext';
import { tenantStore } from '../../services/tenantStore';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export interface InstitutionDashboardViewProps {
  onNavigate: (view: string) => void;
  onPreviewWebsite: () => void;
}

export const InstitutionDashboardView: React.FC<InstitutionDashboardViewProps> = ({
  onNavigate,
  onPreviewWebsite,
}) => {
  const { activeInstitution, activeCampus, campuses, activeAcademicYear, activeAcademicTerm } = useTenant();
  const { subscription, isModuleEnabled } = useModules();

  const students = tenantStore.getStudents(activeInstitution.id, activeCampus?.id);
  const staff = tenantStore.getStaff(activeInstitution.id);
  const invoices = tenantStore.getInvoices(activeInstitution.id);
  const aiInsights = tenantStore.getAIInsights(activeInstitution.id);

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
              <Badge variant="success">Tenant Isolated</Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
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
          value={students.length}
          subtext={`In ${activeCampus ? activeCampus.name : 'all campuses'}`}
          indicator={{ value: 'Capacity: 92%', isPositive: true }}
          icon={<GraduationCap className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          label={`Faculty & ${terminology.teacher_label}s`}
          value={staff.length}
          subtext="Active certified personnel"
          indicator={{ value: '1:12 Ratio', isPositive: true }}
          icon={<Users className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Fees Realization"
          value={`${collectionRate}%`}
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
                  Unique institutional IDs maintaining longitudinal academic history.
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
                  {students.slice(0, 4).map((stu) => {
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
                          {stu.current_class_id ? 'Grade 10 - Alpha' : 'Unassigned'}
                        </td>
                        <td className="px-6 py-3.5 text-slate-400 text-[11px]">
                          {camp?.name.split('(')[0] || 'Campus'}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Badge variant="success">Enrolled</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* AI Intelligence & Insights Panel */}
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-slate-100">AI Intelligence Alerts</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('ai')}
              >
                Launch Hub
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {aiInsights.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{item.title}</span>
                    <Badge variant={item.severity === 'medium' ? 'warning' : 'info'}>
                      {item.metric}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">{item.summary}</p>
                  <div className="text-[11px] text-indigo-300 font-medium pt-1 border-t border-slate-850">
                    Rec: {item.actionable_recommendation}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Active Subscription & Entitlement Summary */}
          <Card padding="md">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Subscription & Entitlements
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-sm font-bold text-white">
                {subscription?.package?.name || 'Omni-Campus Enterprise'}
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Term renewal: {subscription ? new Date(subscription.current_period_end).toLocaleDateString() : 'Annual'}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => onNavigate('modules')}
              >
                Manage Modular Add-ons
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
