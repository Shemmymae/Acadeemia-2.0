import React from 'react';
import {
  Building2,
  GraduationCap,
  Layers,
  DollarSign,
  Users,
  Globe,
  Sparkles,
  ShieldCheck,
  Package,
  BookOpen,
  LayoutDashboard,
  Settings,
  ChevronRight,
  TrendingUp,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useModules } from '../../context/ModuleContext';
import { useAuth } from '../../context/AuthContext';

export interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { mode, activeInstitution, activeCampus, campuses, selectCampus } = useTenant();
  const { isModuleEnabled } = useModules();
  const { currentUser } = useAuth();

  const handleNavClick = (view: string) => {
    onNavigate(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-900 border-r border-slate-800 transition-all duration-200 flex flex-col justify-between ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Top Brand & Environment Header */}
        <div className="flex flex-col border-b border-slate-800">
          <div className="flex items-center justify-between px-5 h-16">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm shadow-indigo-900/40">
                A2
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <span className="font-bold text-base tracking-tight text-white block truncate">
                    ACADEEMIA <span className="text-indigo-400 font-normal">2.0</span>
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
              />
            </button>
          </div>

          {/* Current Environment Context Box */}
          {!isCollapsed && (
            <div className="px-4 py-2.5 bg-slate-950/40 border-t border-slate-850">
              <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                <span>Active Scope</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    mode === 'platform'
                      ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                      : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/40'
                  }`}
                >
                  {mode === 'platform' ? 'Platform HQ' : 'Institution'}
                </span>
              </div>
              <div className="mt-1 font-medium text-xs text-slate-200 truncate">
                {mode === 'platform' ? 'ACADEEMIA Platform Operations' : activeInstitution.name}
              </div>

              {/* Campus Selector in Institution Mode */}
              {mode === 'institution' && (
                <div className="mt-2 pt-2 border-t border-slate-850/60">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Campus Scope</span>
                    <span className="text-slate-400 font-mono">{campuses.length} Campuses</span>
                  </div>
                  <div className="relative">
                    <select
                      value={activeCampus?.id || ''}
                      onChange={(e) => selectCampus(e.target.value ? e.target.value : null)}
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded-md py-1 px-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="">All Campuses (Consolidated)</option>
                      {campuses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.is_main ? '★' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-6">
          {mode === 'platform' ? (
            /* PLATFORM NAVIGATION */
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Platform Operations
                </div>
              )}

              <button
                onClick={() => handleNavClick('platform-overview')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentView === 'platform-overview'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
                title="Platform Overview"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Platform Overview</span>}
              </button>

              <button
                onClick={() => handleNavClick('platform-institutions')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentView === 'platform-institutions'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
                title="Institutions & Campuses"
              >
                <Building2 className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Institutions & Campuses</span>}
              </button>

              <button
                onClick={() => handleNavClick('platform-packages')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentView === 'platform-packages'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
                title="Packages & Add-ons"
              >
                <Package className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Packages & Add-ons</span>}
              </button>

              <button
                onClick={() => handleNavClick('platform-crm')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentView === 'platform-crm'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
                title="Sales & CRM Leads"
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Sales & CRM Leads</span>}
              </button>

              <button
                onClick={() => handleNavClick('platform-website-cms')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentView === 'platform-website-cms'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
                title="ACADEEMIA Public CMS"
              >
                <Globe className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Public Website CMS</span>}
              </button>

              <button
                onClick={() => handleNavClick('platform-audit')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentView === 'platform-audit'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
                title="Platform Audit Trail"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Security & Audit Logs</span>}
              </button>
            </div>
          ) : (
            /* INSTITUTION NAVIGATION */
            <div className="space-y-4">
              {/* Core Section */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Institutional Core
                  </div>
                )}

                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Executive Dashboard</span>}
                </button>

                {isModuleEnabled('student_management') && (
                  <button
                    onClick={() => handleNavClick('students')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentView === 'students'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                    title="Student Information System"
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>{activeInstitution.terminology_config.student_label} Information (SIS)</span>}
                  </button>
                )}

                {isModuleEnabled('academics') && (
                  <button
                    onClick={() => handleNavClick('academics')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentView === 'academics'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                    title="Academic Structure"
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>Academic Structure</span>}
                  </button>
                )}
              </div>

              {/* Operations & Finance Section */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Administration & Finance
                  </div>
                )}

                {isModuleEnabled('fees_collection') && (
                  <button
                    onClick={() => handleNavClick('finance')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentView === 'finance'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                    title="Fees & Student Billing"
                  >
                    <DollarSign className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>Fees & Billing Ledgers</span>}
                  </button>
                )}

                {isModuleEnabled('human_resources') && (
                  <button
                    onClick={() => handleNavClick('hr')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentView === 'hr'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                    title="Staff & Human Resources"
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>Human Resources & Faculty</span>}
                  </button>
                )}

                <button
                  onClick={() => handleNavClick('modules')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    currentView === 'modules'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                  title="Module Registry & Subscriptions"
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Module System & Add-ons</span>}
                </button>
              </div>

              {/* Web & Intelligence Section */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Web Presence & Intelligence
                  </div>
                )}

                {isModuleEnabled('institution_website') && (
                  <button
                    onClick={() => handleNavClick('website')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentView === 'website'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                    title="Institution Website & CMS"
                  >
                    <Globe className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>School Website & CMS</span>}
                  </button>
                )}

                {isModuleEnabled('ai_intelligence') && (
                  <button
                    onClick={() => handleNavClick('ai')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentView === 'ai'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                    title="AI Intelligence Hub"
                  >
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                    {!isCollapsed && <span>AI Intelligence Hub</span>}
                  </button>
                )}

                <button
                  onClick={() => handleNavClick('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    currentView === 'settings'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                  title="Settings & Terminology"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Institution Settings</span>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom User Quick View */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-300">
                  {currentUser.full_name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="truncate flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-200 truncate">{currentUser.full_name}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
