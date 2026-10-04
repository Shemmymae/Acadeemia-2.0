import React, { useState } from 'react';
import { Layers, Check, Shield, AlertCircle, ToggleLeft, ToggleRight, Sparkles, Filter } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useModules } from '../../context/ModuleContext';
import { SYSTEM_MODULES } from '../../services/moduleRegistry';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { ModuleCategory } from '../../types';

export const ModuleRegistryView: React.FC = () => {
  const { activeInstitution } = useTenant();
  const { isModuleEnabled, toggleModule, subscription } = useModules();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Module Registry & Capability Licensing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Independently enable or disable functional modules for <span className="text-slate-200 font-semibold">{activeInstitution.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">
            {totalEnabled} of {SYSTEM_MODULES.length} Modules Active
          </Badge>
        </div>
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
          const isCore = mod.is_core;

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
                      {isCore && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                          Core
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Code: {mod.code} · {mod.category}
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => {
                      if (!isCore) {
                        toggleModule(mod.code, !enabled);
                      }
                    }}
                    disabled={isCore}
                    className={`cursor-pointer transition-colors ${
                      isCore
                        ? 'opacity-60 cursor-not-allowed text-slate-500'
                        : enabled
                        ? 'text-indigo-400 hover:text-indigo-300'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={isCore ? 'Core module cannot be disabled' : 'Toggle module'}
                  >
                    {enabled ? (
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
                  {isCore ? 'Mandatory' : 'Optional Add-on'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
