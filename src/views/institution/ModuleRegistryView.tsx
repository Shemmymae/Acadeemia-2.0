import React, { useState, useMemo } from 'react';
import {
  Layers,
  Check,
  Shield,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Filter,
  RefreshCw,
  Lock,
  Search,
  Package as PackageIcon,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Send
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useModules } from '../../context/ModuleContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Package } from '../../types';

export const ModuleRegistryView: React.FC = () => {
  const { activeInstitution, activeRole } = useTenant();
  const { isPlatformAdmin, isSandboxMode } = useAuth();
  const {
    modules,
    packages,
    isModuleEnabled,
    isModuleEntitled,
    isModuleAccessible,
    getModuleAccessStatus,
    toggleModule,
    changeSubscriptionPackage,
    addAddon,
    removeAddon,
    requestSubscriptionUpgrade,
    subscription,
    loading,
    error,
    refreshModules,
  } = useModules();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'entitled' | 'unlicensed' | 'enabled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);

  // Plan & Add-on Management Modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [switchingPlanId, setSwitchingPlanId] = useState<string | null>(null);
  const [modifyingAddonCode, setModifyingAddonCode] = useState<string | null>(null);
  const [planModalError, setPlanModalError] = useState<string | null>(null);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);

  if (!activeInstitution) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Active Educational Institution</h3>
        <p className="text-xs text-slate-400">Select an authorized institution to manage modules and add-ons.</p>
      </div>
    );
  }

  const isOwnerOrAdmin =
    isPlatformAdmin ||
    isSandboxMode ||
    activeRole === 'institution_owner' ||
    activeRole === 'institution_admin';

  const categories = [
    { id: 'all', label: 'All Modules' },
    { id: 'core', label: 'Platform Core' },
    { id: 'academic', label: 'Academic & SIS' },
    { id: 'finance', label: 'Finance & Ledgers' },
    { id: 'administrative', label: 'Operations & HR' },
    { id: 'communication', label: 'Communication & Community' },
    { id: 'intelligence', label: 'Analytics & AI' },
  ];

  // Filtered Modules
  const filtered = useMemo(() => {
    return modules.filter((mod) => {
      // Category filter
      if (selectedCategory !== 'all' && mod.category !== selectedCategory) {
        return false;
      }

      // Status filter
      const entitled = isModuleEntitled(mod.code);
      const enabled = isModuleEnabled(mod.code);

      if (statusFilter === 'entitled' && !entitled) return false;
      if (statusFilter === 'unlicensed' && entitled) return false;
      if (statusFilter === 'enabled' && !enabled) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = mod.name.toLowerCase().includes(q);
        const matchesCode = mod.code.toLowerCase().includes(q);
        const matchesDesc = mod.description.toLowerCase().includes(q);
        const matchesPerms = mod.permissions_provided.some((p) => p.toLowerCase().includes(q));
        if (!matchesName && !matchesCode && !matchesDesc && !matchesPerms) {
          return false;
        }
      }

      return true;
    });
  }, [modules, selectedCategory, statusFilter, searchQuery, isModuleEntitled, isModuleEnabled]);

  // Statistics
  const totalCatalog = modules.length;
  const totalEntitled = modules.filter((m) => isModuleEntitled(m.code)).length;
  const totalEnabled = modules.filter((m) => isModuleEnabled(m.code)).length;
  const totalAddons = subscription?.addons?.length || 0;

  const handleToggle = async (code: string, currentlyEnabled: boolean) => {
    setToggleError(null);
    setTogglingCode(code);
    try {
      const result = await toggleModule(code, !currentlyEnabled);
      if (!result.success) {
        setToggleError(result.error || 'Database rejected module activation.');
      }
    } catch (err: any) {
      setToggleError(err.message || 'Failed to toggle module');
    } finally {
      setTogglingCode(null);
    }
  };

  const handleAdminAssignPackage = async (pkgId: string) => {
    setPlanModalError(null);
    setSwitchingPlanId(pkgId);
    try {
      const res = await changeSubscriptionPackage(pkgId);
      if (!res.success) {
        setPlanModalError(res.error || 'Failed to assign plan');
      }
    } catch (err: any) {
      setPlanModalError(err.message || 'Failed to update subscription tier');
    } finally {
      setSwitchingPlanId(null);
    }
  };

  const handleAdminAddAddon = async (modCode: string) => {
    setPlanModalError(null);
    setModifyingAddonCode(modCode);
    try {
      const res = await addAddon(modCode, 1500);
      if (!res.success) {
        setPlanModalError(res.error || 'Failed to add addon');
      }
    } catch (err: any) {
      setPlanModalError(err.message || 'Failed to provision add-on');
    } finally {
      setModifyingAddonCode(null);
    }
  };

  const handleAdminRemoveAddon = async (modCode: string) => {
    setPlanModalError(null);
    setModifyingAddonCode(modCode);
    try {
      const res = await removeAddon(modCode);
      if (!res.success) {
        setPlanModalError(res.error || 'Failed to remove addon');
      }
    } catch (err: any) {
      setPlanModalError(err.message || 'Failed to remove add-on');
    } finally {
      setModifyingAddonCode(null);
    }
  };

  const handleRequestUpgrade = async (targetTitle: string) => {
    setPlanModalError(null);
    setRequestSuccessMessage(null);
    try {
      const res = await requestSubscriptionUpgrade(targetTitle);
      if (res.success) {
        setRequestSuccessMessage(`Upgrade request for "${targetTitle}" recorded in platform audit logs.`);
      } else {
        setPlanModalError(res.error || 'Failed to record upgrade request');
      }
    } catch (err: any) {
      setPlanModalError(err.message || 'Failed to submit request');
    }
  };

  const activePackage = subscription?.package || packages[0];
  const activePackageInclusions = new Set(activePackage?.included_modules || []);
  const addonCodes = new Set(subscription?.addons?.map((a) => a.module_code) || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-400" />
            Module Registry & Capability Licensing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authoritative, PostgreSQL-enforced licensing architecture for{' '}
            <span className="text-slate-200 font-semibold">{activeInstitution.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => refreshModules()}
            disabled={loading}
          >
            Refresh
          </Button>
          {isOwnerOrAdmin && (
            <Button
              size="sm"
              variant="primary"
              icon={<PackageIcon className="w-3.5 h-3.5" />}
              onClick={() => setPlanModalOpen(true)}
            >
              Subscription Tier & Add-ons
            </Button>
          )}
        </div>
      </div>

      {/* Error Banners */}
      {(error || toggleError) && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{toggleError || error}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setToggleError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Subscription Tier Overview & Metrics Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tier Info Card */}
        <Card padding="md" className="md:col-span-2 flex flex-col justify-between bg-slate-900/90 border-slate-800">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Commercial Subscription Tier
              </span>
              <Badge variant={subscription?.status === 'active' ? 'success' : 'warning'}>
                {subscription?.status || 'Active Plan'}
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-white mt-2 flex items-center gap-2">
              {activePackage?.name || 'Essential Academy'}
              <span className="text-xs font-mono font-normal text-indigo-400">
                ({activePackage?.slug})
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {activePackage?.description || 'Active operational suite for educational institutions.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-slate-400">
              <div>
                Baseline: <span className="text-slate-200 font-mono font-medium">${((activePackage?.price_cents || 0) / 100).toLocaleString()}/yr*</span>
              </div>
              <div>
                Add-ons: <span className="text-indigo-400 font-mono font-medium">{totalAddons} active</span>
              </div>
            </div>
            {isOwnerOrAdmin && (
              <button
                onClick={() => setPlanModalOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer inline-flex items-center gap-1"
              >
                Inspect Plan <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </Card>

        {/* Resource Limits Card */}
        <Card padding="md" className="flex flex-col justify-between bg-slate-900/90 border-slate-800">
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Plan Resource Capacities
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Max Students:</span>
                <span className="font-mono text-slate-200 font-semibold">{activePackage?.limits?.max_students || 500}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Campuses:</span>
                <span className="font-mono text-slate-200 font-semibold">{activePackage?.limits?.max_campuses || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Faculty:</span>
                <span className="font-mono text-slate-200 font-semibold">{activePackage?.limits?.max_staff || 50}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Storage:</span>
                <span className="font-mono text-slate-200 font-semibold">{activePackage?.limits?.storage_gb || 100} GB</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-850 text-[10px] text-slate-500 font-mono">
            Enforced by PostgreSQL limits
          </div>
        </Card>

        {/* Modules Ratio Card */}
        <Card padding="md" className="flex flex-col justify-between bg-slate-900/90 border-slate-800">
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Licensing Entitlements
            </span>
            <div className="mt-1">
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {totalEnabled} <span className="text-xs font-normal text-slate-400">/ {totalEntitled} Entitled</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {totalCatalog} total platform modules in catalog.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-850 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-medium">
              {Math.round((totalEnabled / totalCatalog) * 100)}% Active
            </span>
            <span className="text-amber-400 font-medium">
              {totalCatalog - totalEntitled} Unlicensed
            </span>
          </div>
        </Card>
      </div>

      <div className="text-[11px] text-slate-500 italic">
        * Note: Subscription figures represent baseline demo/configuration benchmarks. Commercial agreements and pricing terms are managed by Platform Operations.
      </div>

      {/* Search, Filter & Tabs Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by module name, code, or permission..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider mr-1 hidden md:inline">
              Filter:
            </span>
            {(['all', 'entitled', 'enabled', 'unlicensed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize ${
                  statusFilter === filter
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {filter === 'all'
                  ? 'All Status'
                  : filter === 'entitled'
                  ? 'Licensed'
                  : filter === 'enabled'
                  ? 'Enabled Only'
                  : 'Unlicensed'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs
          tabs={categories}
          activeTab={selectedCategory}
          onChange={setSelectedCategory}
        />
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((mod) => {
          const isCore = mod.is_core;
          const status = getModuleAccessStatus(mod.code);
          const entitled = status.isEntitled;
          const enabled = status.isEnabled;
          const accessible = status.isAccessible;
          const isProcessing = togglingCode === mod.code;
          const isAddon = addonCodes.has(mod.code);
          const isPackageIncluded = activePackageInclusions.has(mod.code);

          return (
            <Card
              key={mod.code}
              padding="md"
              className={`flex flex-col justify-between transition-all ${
                enabled
                  ? 'border-slate-700 bg-slate-900/90 shadow-md'
                  : entitled
                  ? 'border-slate-850 bg-slate-950/60 opacity-85'
                  : 'border-slate-850 bg-slate-950/40 opacity-70'
              }`}
            >
              <div>
                {/* Header row with badges and toggle switch */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-100">{mod.name}</h3>

                      {isCore ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                          Platform Core
                        </span>
                      ) : isAddon ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                          Active Add-on
                        </span>
                      ) : isPackageIncluded ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                          Plan Included
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Unlicensed
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Code: {mod.code} · Category: {mod.category}
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => {
                      if (!isCore && entitled && !isProcessing) {
                        handleToggle(mod.code, enabled);
                      }
                    }}
                    disabled={isCore || !entitled || isProcessing}
                    className={`cursor-pointer transition-colors shrink-0 ${
                      isCore
                        ? 'opacity-60 cursor-not-allowed text-indigo-400'
                        : !entitled
                        ? 'opacity-40 cursor-not-allowed text-slate-600'
                        : isProcessing
                        ? 'opacity-50 cursor-wait'
                        : enabled
                        ? 'text-indigo-400 hover:text-indigo-300'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={
                      isCore
                        ? 'Core platform module cannot be disabled'
                        : !entitled
                        ? 'Requires commercial entitlement'
                        : enabled
                        ? 'Click to deactivate module'
                        : 'Click to activate module'
                    }
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                    ) : enabled ? (
                      <ToggleRight className="w-7 h-7 text-indigo-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-600" />
                    )}
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                  {mod.description}
                </p>

                {/* Permissions Delegated */}
                <div className="mt-3 pt-3 border-t border-slate-850">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Permissions Provided:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {mod.permissions_provided.slice(0, 3).map((perm) => (
                      <span
                        key={perm}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800"
                      >
                        {perm}
                      </span>
                    ))}
                    {mod.permissions_provided.length > 3 && (
                      <span className="text-[10px] font-mono text-slate-500">
                        +{mod.permissions_provided.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Status: </span>
                  {isCore ? (
                    <span className="text-indigo-300 font-medium">Permanent Core</span>
                  ) : enabled ? (
                    <span className="text-emerald-400 font-medium">Enabled (Active)</span>
                  ) : entitled ? (
                    <span className="text-slate-400 font-medium">Licensed (Disabled)</span>
                  ) : (
                    <span className="text-amber-400/80 font-medium">Unlicensed</span>
                  )}
                </div>

                {!entitled && isOwnerOrAdmin ? (
                  <button
                    onClick={() => {
                      setPlanModalOpen(true);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Request License
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    {accessible ? 'Accessible' : 'Role Restricted'}
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 space-y-2">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm">No modules match the selected filter criteria.</p>
          <Button size="sm" variant="secondary" onClick={() => { setSelectedCategory('all'); setStatusFilter('all'); setSearchQuery(''); }}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* PLAN & ADD-ON INSPECTION MODAL */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => { setPlanModalOpen(false); setRequestSuccessMessage(null); setPlanModalError(null); }}
        title="Subscription Tier & Capability Licensing"
        maxWidth="xl"
      >
        <div className="space-y-6">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <ShieldCheck className="w-4 h-4" /> Platform Authority Notice
            </div>
            <p className="text-slate-400">
              Commercial packages and add-ons are governed by Platform Operations. Institution administrators may review plans and submit upgrade requests, which are recorded in the institutional audit log.
            </p>
          </div>

          {planModalError && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs">
              {planModalError}
            </div>
          )}

          {requestSuccessMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{requestSuccessMessage}</span>
            </div>
          )}

          {/* Tier Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              1. Platform Subscription Tiers
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {packages.map((pkg) => {
                const isCurrent = activePackage?.id === pkg.id;
                const isProcessing = switchingPlanId === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-950/30 ring-1 ring-indigo-500'
                        : 'border-slate-850 bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{pkg.name}</span>
                        {isCurrent && <Badge variant="success">Active Plan</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 min-h-[32px]">{pkg.description}</p>
                      <div className="mt-2 text-lg font-bold font-mono text-white">
                        ${((pkg.price_cents || 0) / 100).toLocaleString()}
                        <span className="text-[10px] font-normal text-slate-400">/yr*</span>
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-slate-400">
                        {pkg.included_modules.length} Modules Included
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800">
                      {isCurrent ? (
                        <div className="text-center text-xs font-medium text-emerald-400 flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Current Plan
                        </div>
                      ) : isPlatformAdmin || isSandboxMode ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          onClick={() => handleAdminAssignPackage(pkg.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Assigning...' : 'Assign Plan (Admin)'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          icon={<Send className="w-3 h-3" />}
                          onClick={() => handleRequestUpgrade(pkg.name)}
                        >
                          Request Upgrade
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Standalone Add-ons Section */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              2. Standalone Module Add-ons
            </h4>
            <p className="text-xs text-slate-400">
              Modules not included in the active subscription tier can be licensed as commercial add-ons.
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {modules
                .filter((m) => !m.is_core)
                .map((mod) => {
                  const isIncludedInPlan = activePackageInclusions.has(mod.code);
                  const isAddedAsAddon = addonCodes.has(mod.code);
                  const isProcessing = modifyingAddonCode === mod.code;

                  return (
                    <div
                      key={mod.code}
                      className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200 truncate">{mod.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {mod.code} · {mod.category}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        {isIncludedInPlan ? (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Bundled in {activePackage.name}
                          </span>
                        ) : isAddedAsAddon ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                              Active Add-on
                            </span>
                            {(isPlatformAdmin || isSandboxMode) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                icon={<Trash2 className="w-3.5 h-3.5" />}
                                onClick={() => handleAdminRemoveAddon(mod.code)}
                                disabled={isProcessing}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ) : isPlatformAdmin || isSandboxMode ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => handleAdminAddAddon(mod.code)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Adding...' : 'Provision Add-on (Admin)'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Send className="w-3 h-3" />}
                            onClick={() => handleRequestUpgrade(`Add-on: ${mod.name} (${mod.code})`)}
                          >
                            Request Add-on
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
