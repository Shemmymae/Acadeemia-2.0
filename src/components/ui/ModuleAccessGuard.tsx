import React, { useState } from 'react';
import { Lock, ToggleLeft, ShieldAlert, Sparkles, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { useModules } from '../../context/ModuleContext';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { getModuleByCode } from '../../services/moduleRegistry';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';

export interface ModuleAccessGuardProps {
  moduleCode: string;
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermission?: string;
  onNavigateToRegistry?: () => void;
}

export const ModuleAccessGuard: React.FC<ModuleAccessGuardProps> = ({
  moduleCode,
  children,
  requiredRoles,
  requiredPermission,
  onNavigateToRegistry,
}) => {
  const { getModuleAccessStatus, toggleModule, subscription } = useModules();
  const { activeInstitution, activeRole } = useTenant();
  const { isPlatformAdmin, isSandboxMode } = useAuth();
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  const status = getModuleAccessStatus(moduleCode, requiredRoles, requiredPermission);
  const modDef = getModuleByCode(moduleCode);
  const moduleName = modDef?.name || moduleCode;

  // Fully authorized
  if (status.isAccessible) {
    return <>{children}</>;
  }

  const isOwnerOrAdmin =
    isPlatformAdmin ||
    isSandboxMode ||
    activeRole === 'institution_owner' ||
    activeRole === 'institution_admin';

  const handleQuickEnable = async () => {
    setActivating(true);
    setActivationError(null);
    try {
      const result = await toggleModule(moduleCode, true);
      if (!result.success) {
        setActivationError(result.error || 'Failed to activate module');
      }
    } catch (err: any) {
      setActivationError(err.message || 'Error activating module');
    } finally {
      setActivating(false);
    }
  };

  // State 1: Unlicensed / Not Entitled
  if (!status.isEntitled) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
        <Card padding="lg" className="border-amber-900/40 bg-slate-900/90 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="warning">Subscription Licensing Required</Badge>
                <span className="text-[11px] font-mono text-slate-500">
                  Code: {moduleCode}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {moduleName}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {modDef?.description ||
                    'This institutional capability requires a valid subscription package entitlement or add-on license.'}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Plan Tier:</span>
                  <span className="font-semibold text-slate-200 uppercase font-mono">
                    {subscription?.package?.name || 'Standard Tier'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Entitlement Status:</span>
                  <span className="text-amber-400 font-medium">Unlicensed in Active Tier</span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-850">
                  Commercial entitlements are validated at the PostgreSQL database engine level. Frontend activation without a license will be rejected.
                </div>
              </div>

              {onNavigateToRegistry && (
                <div className="pt-2 flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Layers className="w-3.5 h-3.5" />}
                    onClick={onNavigateToRegistry}
                  >
                    Open Module Registry & Upgrades
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // State 2: Entitled, but Disabled
  if (!status.isEnabled) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
        <Card padding="lg" className="border-slate-800 bg-slate-900/90 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 shadow-inner">
              <ToggleLeft className="w-6 h-6 text-slate-400" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="neutral">Module Deactivated</Badge>
                <Badge variant="success">Licensed Add-on</Badge>
                <span className="text-[11px] font-mono text-slate-500">
                  Code: {moduleCode}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {moduleName}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  This module is commercially entitled to <span className="text-slate-200 font-semibold">{activeInstitution?.name}</span>, but is currently turned off in institutional settings.
                </p>
              </div>

              {activationError && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs">
                  {activationError}
                </div>
              )}

              {isOwnerOrAdmin ? (
                <div className="pt-2 flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={
                      activating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )
                    }
                    onClick={handleQuickEnable}
                    disabled={activating}
                  >
                    {activating ? 'Activating Module...' : 'Activate Module Now'}
                  </Button>
                  {onNavigateToRegistry && (
                    <Button variant="secondary" size="sm" onClick={onNavigateToRegistry}>
                      Manage in Module Registry
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Contact an authorized Institution Administrator to activate this module for your campus.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // State 3: Entitled & Enabled, but User Lacks Privilege (Forbidden)
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
      <Card padding="lg" className="border-red-950/60 bg-slate-900/90 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="danger">Access Denied</Badge>
              <span className="text-[11px] font-mono text-slate-500">
                Active Role: {activeRole}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {moduleName} — Restricted Access
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                This module is enabled in your institution, but your user role ({activeRole}) lacks the necessary security permissions to view this workspace.
              </p>
            </div>

            {modDef?.permissions_provided && (
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Required Role Permissions:
                </div>
                <div className="flex flex-wrap gap-1">
                  {modDef.permissions_provided.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
