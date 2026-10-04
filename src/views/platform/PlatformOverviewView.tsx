import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { tenantStore } from '../../services/tenantStore';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export interface PlatformOverviewViewProps {
  onNavigate: (view: string) => void;
  onOpenCreateInstitution: () => void;
}

export const PlatformOverviewView: React.FC<PlatformOverviewViewProps> = ({
  onNavigate,
  onOpenCreateInstitution,
}) => {
  const { institutions, selectInstitution, setMode } = useTenant();
  const packages = tenantStore.getPackages();
  const auditLogs = tenantStore.getAuditLogs().slice(0, 5);

  // Calculate high-level platform metrics
  const totalCampuses = institutions.reduce((acc, inst) => acc + tenantStore.getCampuses(inst.id).length, 0);
  const totalStudents = institutions.reduce((acc, inst) => acc + tenantStore.getStudents(inst.id).length, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            ACADEEMIA Platform Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global multi-tenant infrastructure, institution onboarding, subscriptions, and platform telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onOpenCreateInstitution}
          >
            Provision Institution
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Educational Tenants"
          value={institutions.length}
          subtext="Active tenant instances"
          indicator={{ value: '+1 this month', isPositive: true }}
          icon={<Building2 className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          label="Operational Campuses"
          value={totalCampuses}
          subtext="Distributed physical facilities"
          indicator={{ value: '100% Online', isPositive: true }}
          icon={<Building2 className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Active Platform Subscriptions"
          value={institutions.length}
          subtext="Across Essential & Enterprise"
          indicator={{ value: '0% Churn', isPositive: true }}
          icon={<DollarSign className="w-5 h-5 text-purple-400" />}
        />
        <StatCard
          label="Enrolled Scholars Platform-Wide"
          value={totalStudents.toLocaleString()}
          subtext="With tenant-isolated IDs"
          indicator={{ value: '+8.4% YoY', isPositive: true }}
          icon={<TrendingUp className="w-5 h-5 text-sky-400" />}
        />
      </div>

      {/* Institutions Directory Table */}
      <Card padding="none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Customer Educational Institutions</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Isolated database tenants with autonomous modules and custom branding.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('platform-institutions')}
          >
            Manage All Tenants
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Institution & Code</th>
                <th className="px-6 py-3">Campuses</th>
                <th className="px-6 py-3">Subscription Tier</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Domain / Portal</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {institutions.map((inst) => {
                const campuses = tenantStore.getCampuses(inst.id);
                const sub = tenantStore.getSubscription(inst.id);
                return (
                  <tr key={inst.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-100">{inst.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{inst.code}</div>
                    </td>
                    <td className="px-6 py-3.5 font-mono tabular-nums text-slate-300">
                      {campuses.length} {campuses.length === 1 ? 'Campus' : 'Campuses'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs font-medium text-indigo-300">
                        {sub?.package?.name || 'Standard Tier'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-400 text-[11px]">
                      {inst.custom_domain || 'Pending Setup'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          selectInstitution(inst.id);
                          setMode('institution');
                          onNavigate('dashboard');
                        }}
                      >
                        Enter Workspace
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Two Column Section: Packages & Security Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Packages & Add-on Catalog Overview */}
        <Card padding="md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Subscription Packages</h2>
              <p className="text-xs text-slate-400 mt-0.5">Tiered licensing plans and add-on module bundles</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigate('platform-packages')}
            >
              Configure
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-200">{pkg.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{pkg.description}</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    Limit: {pkg.limits.max_students} Students · {pkg.limits.max_campuses} Campuses
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white font-mono tabular-nums">
                    ${(pkg.price_cents / 100).toFixed(0)}
                  </div>
                  <div className="text-[10px] text-slate-400">{pkg.billing_cycle}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Security Audit Trail */}
        <Card padding="md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Security & Provisioning Audit</h2>
              <p className="text-xs text-slate-400 mt-0.5">Tamper-evident log of platform and tenant mutations</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigate('platform-audit')}
            >
              View Full Trail
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-850 flex items-start justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{log.action}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Actor: <span className="text-slate-300">{log.actor_name}</span> · Entity: {log.entity_type}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
