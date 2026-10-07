import React, { useState } from 'react';
import {
  Menu,
  Search,
  Building2,
  ChevronDown,
  UserCheck,
  Shield,
  ExternalLink,
  Laptop,
  LogOut,
  AlertTriangle,
  Database
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { INSTITUTION_ROLES_CONFIG } from '../../services/permissionEngine';
import { InstitutionRole, PlatformRole } from '../../types';
import { UserProfileModal } from '../modals/UserProfileModal';

export interface HeaderProps {
  breadcrumbTitle: string;
  onOpenSearch: () => void;
  onToggleMobile: () => void;
  onPreviewPublicPortal: () => void;
  onPreviewSchoolWebsite: () => void;
  onOpenSupabaseConfig?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  breadcrumbTitle,
  onOpenSearch,
  onToggleMobile,
  onPreviewPublicPortal,
  onPreviewSchoolWebsite,
  onOpenSupabaseConfig,
}) => {
  const {
    mode,
    setMode,
    activeInstitution,
    accessibleInstitutions,
    selectInstitution,
    activeCampus,
    activeRole,
  } = useTenant();

  const {
    authUser,
    appProfile,
    isPlatformAdmin,
    isPlatformUser,
    signOut,
    isSandboxMode,
    isSupabaseConfigured,
    sandboxActiveRole,
    setSandboxActiveRole,
  } = useAuth();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const breadcrumbs = [
    {
      label: mode === 'platform' ? 'ACADEEMIA Platform' : activeInstitution?.name || 'Institution',
    },
    ...(mode === 'institution' && activeCampus
      ? [{ label: activeCampus.name }]
      : []),
    {
      label: breadcrumbTitle,
    },
  ];

  const displayName = appProfile?.full_name || authUser?.email || (isSandboxMode ? 'Sandbox Engineer' : 'Authenticated User');
  const displayEmail = authUser?.email || (isSandboxMode ? 'sandbox@acadeemia.internal' : '');

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Mobile toggle & Breadcrumb trail */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobile}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 md:hidden cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      </div>

      {/* Zone 2 & 3: Search, Switchers & Role Simulation */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sandbox Warning Badge if in offline sandbox */}
        {isSandboxMode && (
          <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/60">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Sandbox Mode
          </span>
        )}

        {/* Supabase Database Status / Architecture Inspector Button */}
        {onOpenSupabaseConfig && (
          <button
            onClick={onOpenSupabaseConfig}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              isSupabaseConfigured
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/40'
            }`}
            title="Inspect Supabase database connectivity, RLS status, and SQL schema"
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">
              {isSupabaseConfigured ? 'Supabase Connected' : 'Supabase Setup'}
            </span>
          </button>
        )}

        {/* Quick Search Palette Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Quick Search...</span>
          <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] bg-slate-800 rounded font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Institution Tenant Switcher (Strictly restricted to accessibleInstitutions) */}
        {mode === 'institution' && activeInstitution && (
          <div className="relative">
            <button
              onClick={() => setTenantMenuOpen(!tenantMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 border border-slate-700/80 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer max-w-[170px] truncate"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{activeInstitution.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {tenantMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setTenantMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-1">
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Accessible Educational Institutions ({accessibleInstitutions.length})
                  </div>
                  {accessibleInstitutions.map((inst) => (
                    <button
                      key={inst.id}
                      onClick={() => {
                        selectInstitution(inst.id);
                        setTenantMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-lg transition-colors cursor-pointer ${
                        activeInstitution.id === inst.id
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate">{inst.name}</div>
                        <div className="text-[10px] text-slate-400 opacity-80">{inst.code}</div>
                      </div>
                      {activeInstitution.id === inst.id && <span className="text-[11px]">✓</span>}
                    </button>
                  ))}
                  <div className="pt-2 border-t border-slate-850">
                    <button
                      onClick={() => {
                        setTenantMenuOpen(false);
                        onPreviewSchoolWebsite();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview Live School Website</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Environment Switcher: Platform vs Institution (Restricted to platform members) */}
        {(isPlatformAdmin || isPlatformUser || isSandboxMode) && (
          <button
            onClick={() => setMode(mode === 'platform' ? 'institution' : 'platform')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              mode === 'platform'
                ? 'bg-purple-950/80 text-purple-200 border-purple-700/60 hover:bg-purple-900/60 shadow-xs'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
            title="Toggle between ACADEEMIA Platform Console and Institution Workspace"
          >
            <Laptop className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">
              {mode === 'platform' ? 'Platform HQ' : 'Switch to Platform'}
            </span>
          </button>
        )}

        {/* User Profile & Account Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-700 shrink-0 flex items-center justify-center text-[10px] text-white font-bold">
              {displayName.substring(0, 1).toUpperCase()}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-[11px] leading-tight text-slate-200 font-semibold truncate max-w-[120px]">
                {displayName}
              </div>
              <div className="text-[10px] leading-tight text-indigo-400 capitalize">
                {String(activeRole).replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-3 space-y-3">
                {/* User info */}
                <div className="pb-2 border-b border-slate-800">
                  <div className="font-semibold text-xs text-white truncate">{displayName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{displayEmail}</div>
                  {isPlatformAdmin && (
                    <span className="mt-1 inline-block text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                      Platform Administrator (Database-Verified)
                    </span>
                  )}
                </div>

                {/* Development Sandbox Simulation (Isolated strictly to sandbox mode) */}
                {isSandboxMode && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Sandbox Role Preview Only</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(INSTITUTION_ROLES_CONFIG).slice(0, 6).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setSandboxActiveRole(key as InstitutionRole);
                            setUserMenuOpen(false);
                          }}
                          className={`px-2 py-1 text-[10px] text-left rounded-md transition-colors cursor-pointer truncate ${
                            sandboxActiveRole === key
                              ? 'bg-amber-900/60 text-amber-200 font-semibold'
                              : 'text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {config.label.split('/')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Links */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Edit Profile & Identity</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">DB</span>
                  </button>

                  {onOpenSupabaseConfig && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenSupabaseConfig();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1 text-xs text-indigo-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Database & RLS Status</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Inspect</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onPreviewPublicPortal();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-xs text-indigo-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  >
                    <span>View Public ACADEEMIA Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* User Profile & Account Settings Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </header>
  );
};
