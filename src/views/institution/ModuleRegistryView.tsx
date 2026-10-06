import React, { useState } from 'react';
import { Layers, Check, Shield, AlertCircle, ToggleLeft, ToggleRight, Sparkles, Filter, RefreshCw, Lock } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useModules } from '../../context/ModuleContext';
import { SYSTEM_MODULES } from '../../services/moduleRegistry';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';

export const ModuleRegistryView: React.FC = () => {
  const { activeInstitution } = useTenant();
  const { isModuleEnabled, isModuleEntitled, toggleModule, subscription, loading, error, refreshModules } = useModules();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);

  if (!activeInstitution) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Active Educational Institution</h3>
        <p className="text-xs text-slate-400">Select an authorized institution to manage modules and add-ons.</p>
      </div>
    );
  }

  const categories = [
    { id: 'all', label: 'All Modules' },
    { id: 'academic', label: 'Academic & SIS' },
    { id: 'finance', label: 'Finance & Ledgers' },
    { id: 'administrative', label: 'Operations & HR' },
    { id: 'communication', label: 'Web & Comms' },
    { id: 'intelligence', label: 'AI Intelligence' },
  ];

  const filtered = SYSTEM_MODULES.filter((m) => {
    if (selectedCategory === 'all') return true;
    return m.category === selectedCategory;
  });

  const totalEnabled = SYSTEM_MODULES.filter((m) => isModuleEnabled(m.code)).length;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Module Registry & Capability Licensing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Database-enforced licensing for <span className="text-slate-200 font-semibold">{activeInstitution.name}</span>. Entitlements are validated in PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => refreshModules()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Badge variant="info">
            {totalEnabled} of {SYSTEM_MODULES.length} Modules Active
          </Badge>
        </div>
      </div>

      {/* Error Banners */}
      {(error || toggleError) && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{toggleError || error}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setToggleError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Subscription Tier Info */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <span className="text-slate-400">Active Tier: </span>
          <span className="font-semibold text-white uppercase tracking-wider font-mono">
            {subscription?.package?.name || 'Standard Package'}
          </span>
          <span className="text-slate-500 ml-2">
            ({subscription?.status || 'Active'})
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          PostgreSQL RLS rejects unauthorized activation of unentitled modules.
        </span>
      </div>

      {/* Category Tabs */}
      <Tabs
        tabs={categories}
        activeTab={selectedCategory}
        onChange={setSelectedCategory}
      />

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((mod) => {
          const enabled = isModuleEnabled(mod.code);
          const entitled = isModuleEntitled(mod.code);
          const isCore = mod.is_core;
          const isProcessing = togglingCode === mod.code;

          return (
            <Card
              key={mod.code}
              padding="md"
              className={`flex flex-col justify-between transition-all ${
                enabled
                  ? 'border-slate-700 bg-slate-900/90'
                  : 'border-slate-850 bg-slate-950/40 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-100">{mod.name}</h3>
                      {isCore ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                          Core
                        </span>
                      ) : !entitled ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Unlicensed
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Code: {mod.code} · {mod.category}
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => {
                      if (!isCore && !isProcessing) {
                        handleToggle(mod.code, enabled);
                      }
                    }}
                    disabled={isCore || isProcessing}
                    className={`cursor-pointer transition-colors ${
                      isCore
                        ? 'opacity-60 cursor-not-allowed text-slate-500'
                        : isProcessing
                        ? 'opacity-50 cursor-wait'
                        : enabled
                        ? 'text-indigo-400 hover:text-indigo-300'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={isCore ? 'Core module cannot be disabled' : 'Toggle module'}
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

                <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                  {mod.description}
                </p>

                {/* Permissions Provided */}
                <div className="mt-3 pt-3 border-t border-slate-850">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Permissions Delegated:
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

              <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Status: {enabled ? <span className="text-emerald-400 font-medium">Enabled</span> : <span className="text-slate-500">Disabled</span>}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isCore ? 'Mandatory' : entitled ? 'Licensed Add-on' : 'Requires Upgrade'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
