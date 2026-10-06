import React, { useState, useEffect } from 'react';
import { Package as PackageIcon, Check, Layers, ShieldCheck, DollarSign, Plus, RefreshCw } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { SYSTEM_MODULES } from '../../services/moduleRegistry';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Package } from '../../types';

export const PlatformPackagesView: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [activePackageId, setActivePackageId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getPackages();
      setPackages(data);
      if (data.length > 0 && !activePackageId) {
        setActivePackageId(data[0].id);
      }
    } catch (err) {
      console.warn('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

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
            Authoritative tiered subscription packages, module entitlements, limits, and pricing architecture from PostgreSQL.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={() => loadPackages()}
          disabled={loading}
        >
          Refresh Packages
        </Button>
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
              className={`flex flex-col justify-between transition-all cursor-pointer ${
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

                {/* Resource Limits */}
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Resource Capacities:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-850">
                      <span className="text-slate-400 block">Max Students</span>
                      <span className="text-slate-100 font-bold">{pkg.limits?.max_students || 500}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-850">
                      <span className="text-slate-400 block">Max Campuses</span>
                      <span className="text-slate-100 font-bold">{pkg.limits?.max_campuses || 2}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  UUID: {pkg.id.substring(0, 8)}...
                </span>
                <span className="text-indigo-400 font-medium">
                  {isSelected ? '✓ Selected Plan' : 'Click to inspect'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Package Module Breakdown */}
      {activePackage && (
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Module Entitlements: {activePackage.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Modules bundled in this tier will be permitted by the database RLS entitlement check.
              </p>
            </div>
            <Badge variant="info">
              {activePackage.included_modules.length} Modules Included
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
