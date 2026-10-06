import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Plus,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Server,
  RefreshCw,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabaseService } from '../../services/supabaseService';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AuditLogEntry, Package } from '../../types';

export interface PlatformOverviewViewProps {
  onNavigate: (view: string) => void;
  onOpenCreateInstitution: () => void;
}

export const PlatformOverviewView: React.FC<PlatformOverviewViewProps> = ({
  onNavigate,
  onOpenCreateInstitution,
}) => {
  const { institutions, selectInstitution, setMode } = useTenant();
  const [packages, setPackages] = useState<Package[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      supabaseService.getPackages(),
      supabaseService.getAuditLogs(),
    ])
      .then(([pkgs, logs]) => {
        if (isMounted) {
          setPackages(pkgs);
          setAuditLogs(logs.slice(0, 5));
        }
      })
      .catch((err) => {
        console.warn('Platform overview load error:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
          label="Provisioned Tenants"
          value={institutions.length}
          subtext="Active educational organizations"
          indicator={{ value: '100% Operational', isPositive: true }}
          icon={<Building2 className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          label="Commercial Packages"
          value={packages.length}
          subtext="Tiered subscription plans"
          indicator={{ value: 'PostgreSQL Enforced', isPositive: true }}
          icon={<Layers className="w-5 h-5 text-purple-400" />}
        />
        <StatCard
          label="Database Isolation"
          value="RLS Native"
          subtext="Multi-tenant row level security"
          indicator={{ value: 'Zero JWT Trust', isPositive: true }}
          icon={<Server className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Security Audits"
          value={auditLogs.length}
          subtext="Append-only compliance logs"
          indicator={{ value: 'Protected', isPositive: true }}
          icon={<ShieldCheck className="w-5 h-5 text-sky-400" />}
        />
      </div>

      {/* Main Content: Tenants Overview & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Educational Institutions List */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Provisioned Educational Tenants ({institutions.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Independent institutions with custom nomenclature, branding, and campus topologies.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('institutions')}
              >
                Manage All Tenants
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Institution & Code</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Domain / Portal</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {institutions.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-100">{inst.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{inst.code}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge variant="success">Active Tenant</Badge>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-400 text-[11px]">
                        {inst.custom_domain || `${inst.slug}.acadeemia.edu`}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            selectInstitution(inst.id);
                            setMode('institution');
                          }}
                        >
                          Workspace
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick Operations & Recent Audit Logs */}
        <div className="space-y-4">
          <Card padding="md" className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Platform Architecture
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Identity Authority</span>
                <span className="font-mono text-indigo-400 font-semibold">auth.users.id</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Primary Key Standard</span>
                <span className="font-mono text-emerald-400 font-semibold">PostgreSQL UUID</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Module Entitlement</span>
                <span className="font-mono text-purple-400 font-semibold">Database RLS</span>
              </div>
            </div>
          </Card>

          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Security Audit Log
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-indigo-400 hover:text-indigo-300 p-0 h-auto"
                onClick={() => onNavigate('audit')}
              >
                View Log
              </Button>
            </div>

            <div className="space-y-2">
              {auditLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{log.action}</span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono truncate">{log.actor_name}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
