import React, { useState } from 'react';
import {
  Menu,
  Search,
  Building2,
  ChevronDown,
  UserCheck,
  Shield,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { INSTITUTION_ROLES_CONFIG, PLATFORM_ROLES_CONFIG } from '../../services/permissionEngine';
import { InstitutionRole, PlatformRole } from '../../types';

export interface HeaderProps {
  breadcrumbTitle: string;
  onOpenSearch: () => void;
  onToggleMobile: () => void;
  onPreviewPublicPortal: () => void;
  onPreviewSchoolWebsite: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  breadcrumbTitle,
  onOpenSearch,
  onToggleMobile,
  onPreviewPublicPortal,
  onPreviewSchoolWebsite,
}) => {
  const {
    mode,
    setMode,
    activeInstitution,
    institutions,
    selectInstitution,
    activeCampus,
  } = useTenant();
  const { currentUser, activeRole, switchRole, availableUsers, switchUser } = useAuth();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);

  const breadcrumbs = [
    {
      label: mode === 'platform' ? 'ACADEEMIA Platform' : activeInstitution.name,
    },
    ...(mode === 'institution' && activeCampus
      ? [{ label: activeCampus.name }]
      : []),
    {
      label: breadcrumbTitle,
    },
  ];

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

        {/* Institution Tenant Switcher (Dropdown) */}
        {mode === 'institution' && (
          <div className="relative">
            <button
              onClick={() => setTenantMenuOpen(!tenantMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 border border-slate-700/80 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer max-w-[160px] truncate"
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
                    Switch Educational Institution
                  </div>
                  {institutions.map((inst) => (
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

        {/* Environment Switcher: Platform vs Institution */}
        <button
          onClick={() => setMode(mode === 'platform' ? 'institution' : 'platform')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
            mode === 'platform'
              ? 'bg-purple-950/80 text-purple-200 border-purple-700/60 hover:bg-purple-900/60 shadow-xs'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
          }`}
          title="Toggle between ACADEEMIA Company Console and Customer Institution"
        >
          <Laptop className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">
            {mode === 'platform' ? 'Platform HQ' : 'Switch to Platform'}
          </span>
        </button>

        {/* Role & User Switcher (Interactive RBAC simulation) */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-750 transition-colors cursor-pointer"
            title="Switch User & Test RBAC Access Permissions"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-indigo-700 shrink-0 flex items-center justify-center text-[10px] text-white font-bold">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                currentUser.full_name.substring(0, 1)
              )}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-[11px] leading-tight text-slate-200 font-semibold truncate max-w-[120px]">
                {currentUser.full_name}
              </div>
              <div className="text-[10px] leading-tight text-indigo-400 capitalize">
                {activeRole.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {roleMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setRoleMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-3 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">Interactive Role Switcher</span>
                  <span className="text-[10px] text-slate-400 font-mono">RBAC Sandbox</span>
                </div>

                {/* Simulate Institution Roles */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Simulate Institutional Role
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(INSTITUTION_ROLES_CONFIG).slice(0, 8).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => {
                          switchRole(key as InstitutionRole);
                          setRoleMenuOpen(false);
                        }}
                        className={`px-2 py-1.5 text-[11px] text-left rounded-md transition-colors cursor-pointer truncate ${
                          activeRole === key
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                        title={config.description}
                      >
                        {config.label.split('/')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulate User Accounts */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Sign In As Different Persona
                  </div>
                  <div className="space-y-1">
                    {availableUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          currentUser.id === u.id
                            ? 'bg-slate-800 text-white font-medium border border-slate-700'
                            : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="truncate text-left">
                          <div className="truncate font-medium">{u.full_name}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                        {u.is_platform_user && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                            HQ Admin
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Public Website Previews */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <button
                    onClick={() => {
                      setRoleMenuOpen(false);
                      onPreviewPublicPortal();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-xs text-indigo-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  >
                    <span>View Public ACADEEMIA Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
