import React, { useState } from 'react';
import { Package as PackageIcon, Check, Layers, ShieldCheck, DollarSign, Plus } from 'lucide-react';
import { tenantStore } from '../../services/tenantStore';
import { SYSTEM_MODULES } from '../../services/moduleRegistry';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Package } from '../../types';

export const PlatformPackagesView: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>(() => tenantStore.getPackages());
  const [activePackageId, setActivePackageId] = useState<string>(packages[0]?.id || '');

  const activePackage = packages.find((p) => p.id === activePackageId) || packages[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Packages, Add-ons & Licensing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure tiered subscription packages, module entitlements, limits, and pricing architecture.
          </p>
        </div>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const isSelected = pkg.id === activePackageId;
          return (
            <Card
              key={pkg.id}
              padding="lg"
              variant={isSelected ? 'interactive' : 'default'}
              className={`flex flex-col justify-between transition-all ${
                isSelected ? 'ring-2 ring-indigo-500 bg-slate-900' : 'opacity-90'
              }`}
              onClick={() => setActivePackageId(pkg.id)}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    {pkg.slug}
                  </span>
                  <Badge variant="success">Active Plan</Badge>
                </div>

                <h3 className="text-lg font-bold text-white mt-2">{pkg.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{pkg.description}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white font-mono tabular-nums">
                    ${(pkg.price_cents / 100).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">
                    /{pkg.billing_cycle === 'annual' ? 'yr' : 'mo'}
                  </span>
                </div>

                {/* Hard Limits Box */}
                <div className="mt-5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-slate-300">Institutional Limits:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <span className="text-slate-400">Max Scholars:</span>
                    <span className="text-right text-slate-200">{pkg.limits.max_students}</span>
                    <span className="text-slate-400">Max Campuses:</span>
                    <span className="text-right text-slate-200">{pkg.limits.max_campuses}</span>
                    <span className="text-slate-400">Max Faculty/Staff:</span>
                    <span className="text-right text-slate-200">{pkg.limits.max_staff}</span>
                    <span className="text-slate-400">Storage Quota:</span>
                    <span className="text-right text-slate-200">{pkg.limits.storage_gb} GB</span>
                  </div>
                </div>

                {/* Included Module Summary */}
                <div className="mt-5 space-y-2">
                  <div className="text-xs font-semibold text-slate-300">
                    Included Modules ({pkg.included_modules.length}):
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {pkg.included_modules.map((modCode) => {
                      const mod = SYSTEM_MODULES.find((m) => m.code === modCode);
                      return (
                        <div
                          key={modCode}
                          className="flex items-center gap-2 text-xs text-slate-300"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{mod?.name || modCode}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-800">
                <Button
                  size="sm"
                  variant={isSelected ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={() => setActivePackageId(pkg.id)}
                >
                  {isSelected ? 'Package Selected' : 'View Package Details'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Module Entitlement Matrix for Selected Package */}
      {activePackage && (
        <Card padding="md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Module Entitlement Breakdown: {activePackage.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every platform module is either bundled in this base package, available as an add-on, or restricted.
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-400">
              {activePackage.included_modules.length} of {SYSTEM_MODULES.length} Modules Included
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SYSTEM_MODULES.map((mod) => {
              const isIncluded = activePackage.included_modules.includes(mod.code);
              return (
                <div
                  key={mod.code}
                  className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                    isIncluded
                      ? 'bg-slate-900 border-indigo-900/60 text-slate-200'
                      : 'bg-slate-950/40 border-slate-850 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      {isIncluded ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                      )}
                      <span>{mod.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {mod.description}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-500 uppercase">
                      Category: {mod.category}
                    </div>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                      isIncluded
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isIncluded ? 'Included' : 'Add-on'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
