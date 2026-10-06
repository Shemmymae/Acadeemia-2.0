import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, Building2, Layers, DollarSign, Users, Globe, Sparkles, X, ArrowRight } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useModules } from '../../context/ModuleContext';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const { accessibleInstitutions, selectInstitution, activeInstitution, mode, setMode } = useTenant();
  const { modules } = useModules();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Navigation commands
  const quickActions = [
    { id: 'students', label: 'Student Information System (SIS)', icon: <GraduationCap className="w-4 h-4" />, category: 'Navigation', view: 'students' },
    { id: 'finance', label: 'Fees Collection & Financial Invoices', icon: <DollarSign className="w-4 h-4" />, category: 'Navigation', view: 'finance' },
    { id: 'hr', label: 'Human Resources & Faculty Directory', icon: <Users className="w-4 h-4" />, category: 'Navigation', view: 'hr' },
    { id: 'modules', label: 'Module Registry & Add-ons', icon: <Layers className="w-4 h-4" />, category: 'Navigation', view: 'modules' },
    { id: 'website', label: 'Institution Website & CMS Builder', icon: <Globe className="w-4 h-4" />, category: 'Navigation', view: 'website' },
    { id: 'ai', label: 'ACADEEMIA AI Intelligence Hub', icon: <Sparkles className="w-4 h-4" />, category: 'Navigation', view: 'ai' },
  ];

  const filteredInstitutions = accessibleInstitutions.filter(
    (i) => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)
  );

  const filteredActions = quickActions.filter(
    (a) => a.label.toLowerCase().includes(q)
  );

  const filteredModules = modules.filter(
    (m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-950/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search modules, or switch institution... (Esc to exit)"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Switch Environment */}
          <div>
            <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Platform Environment
            </div>
            <div className="space-y-1 mt-1">
              <button
                onClick={() => {
                  setMode(mode === 'platform' ? 'institution' : 'platform');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>
                    Switch to {mode === 'platform' ? 'Institution Workspace' : 'ACADEEMIA Platform Operations'}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Workspace Modules
              </div>
              <div className="space-y-1 mt-1">
                {filteredActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (mode !== 'institution') setMode('institution');
                      onNavigate(action.view);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400">{action.icon}</span>
                      <span>{action.label}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">Jump</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Educational Institutions */}
          {filteredInstitutions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Educational Institutions (Tenants)
              </div>
              <div className="space-y-1 mt-1">
                {filteredInstitutions.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => {
                      selectInstitution(inst.id);
                      if (mode !== 'institution') setMode('institution');
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-lg transition-colors cursor-pointer ${
                      activeInstitution?.id === inst.id
                        ? 'bg-indigo-950/40 text-indigo-200 border border-indigo-800/40'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{inst.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{inst.code} · {inst.custom_domain || 'Standard Domain'}</div>
                    </div>
                    {activeInstitution?.id === inst.id && (
                      <span className="text-[10px] text-indigo-400 font-medium px-2 py-0.5 rounded bg-indigo-900/60">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Module Catalog Filter */}
          {q && filteredModules.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Available Modules Catalog ({filteredModules.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredModules.slice(0, 5).map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between px-3 py-2 text-xs text-slate-400 rounded-lg bg-slate-950/40"
                  >
                    <div>
                      <span className="text-slate-200 font-medium">{mod.name}</span>
                      <span className="text-slate-500 ml-2">({mod.category})</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{mod.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Esc</kbd> to close</span>
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">⌘K</kbd> anywhere</span>
        </div>
      </div>
    </div>
  );
};
