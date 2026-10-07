/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { ModuleProvider } from './context/ModuleContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CommandPalette } from './components/ui/CommandPalette';
import { PublicWebsitePreviewModal } from './components/modals/PublicWebsitePreviewModal';
import { InstitutionWebsitePreviewModal } from './components/modals/InstitutionWebsitePreviewModal';
import { SupabaseConfigModal } from './components/modals/SupabaseConfigModal';
import { LoginView } from './views/auth/LoginView';

// Platform Views
import { PlatformOverviewView } from './views/platform/PlatformOverviewView';
import { PlatformInstitutionsView } from './views/platform/PlatformInstitutionsView';
import { PlatformPackagesView } from './views/platform/PlatformPackagesView';
import { PlatformCRMView } from './views/platform/PlatformCRMView';
import { PlatformWebsiteCMSView } from './views/platform/PlatformWebsiteCMSView';
import { PlatformAuditView } from './views/platform/PlatformAuditView';

// Institution Views
import { InstitutionDashboardView } from './views/institution/InstitutionDashboardView';
import { StudentManagementView } from './views/institution/StudentManagementView';
import { AcademicStructureView } from './views/institution/AcademicStructureView';
import { FinanceBillingView } from './views/institution/FinanceBillingView';
import { HumanResourcesView } from './views/institution/HumanResourcesView';
import { ModuleRegistryView } from './views/institution/ModuleRegistryView';
import { InstitutionWebsiteCMSView } from './views/institution/InstitutionWebsiteCMSView';
import { AIIntelligenceHubView } from './views/institution/AIIntelligenceHubView';
import { InstitutionSettingsView } from './views/institution/InstitutionSettingsView';
import { CampusesManagementView } from './views/institution/CampusesManagementView';
import { InstitutionUsersView } from './views/institution/InstitutionUsersView';
import { GuardiansManagementView } from './views/institution/GuardiansManagementView';

const AppShell: React.FC = () => {
  const { mode, setMode, selectInstitution, activeInstitution } = useTenant();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [publicModalOpen, setPublicModalOpen] = useState<boolean>(false);
  const [schoolModalOpen, setSchoolModalOpen] = useState<boolean>(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState<boolean>(false);

  // Derive friendly breadcrumb title
  const getBreadcrumbTitle = () => {
    if (mode === 'platform') {
      switch (currentView) {
        case 'platform-overview': return 'Operations Overview';
        case 'platform-institutions': return 'Institutions & Campuses';
        case 'platform-packages': return 'Packages & Licensing';
        case 'platform-crm': return 'Sales & Prospects';
        case 'platform-website-cms': return 'Public Website CMS';
        case 'platform-audit': return 'Security & Audit';
        default: return 'Platform Operations';
      }
    } else {
      switch (currentView) {
        case 'dashboard': return 'Executive Dashboard';
        case 'students': return 'Student Information System';
        case 'academics': return 'Academic Structure';
        case 'campuses': return 'Campuses & Branches';
        case 'guardians': return 'Guardians & Families';
        case 'institution-users': return 'Staff & User Roles';
        case 'finance': return 'Fees & Student Billing';
        case 'hr': return 'Human Resources & Faculty';
        case 'modules': return 'Module Registry & Licensing';
        case 'website': return 'Institution Website CMS';
        case 'ai': return 'AI Intelligence Hub';
        case 'settings': return 'Institution Settings';
        default: return 'Institution Workspace';
      }
    }
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
  };

  const handleEnterWorkspace = (instId: string) => {
    const success = selectInstitution(instId);
    if (success) {
      setMode('institution');
      setCurrentView('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-72'
        }`}
      >
        {/* Top Header */}
        <Header
          breadcrumbTitle={getBreadcrumbTitle()}
          onOpenSearch={() => setCommandPaletteOpen(true)}
          onToggleMobile={() => setMobileSidebarOpen(true)}
          onPreviewPublicPortal={() => setPublicModalOpen(true)}
          onPreviewSchoolWebsite={() => setSchoolModalOpen(true)}
          onOpenSupabaseConfig={() => setSupabaseModalOpen(true)}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {mode === 'platform' ? (
            /* PLATFORM CONSOLE VIEWS */
            <>
              {currentView === 'platform-overview' && (
                <PlatformOverviewView
                  onNavigate={handleNavigate}
                  onOpenCreateInstitution={() => setCurrentView('platform-institutions')}
                />
              )}
              {currentView === 'platform-institutions' && (
                <PlatformInstitutionsView onEnterWorkspace={handleEnterWorkspace} />
              )}
              {currentView === 'platform-packages' && <PlatformPackagesView />}
              {currentView === 'platform-crm' && <PlatformCRMView />}
              {currentView === 'platform-website-cms' && (
                <PlatformWebsiteCMSView onPreviewPublicPortal={() => setPublicModalOpen(true)} />
              )}
              {currentView === 'platform-audit' && <PlatformAuditView />}
            </>
          ) : (
            /* INSTITUTION WORKSPACE VIEWS */
            <>
              {currentView === 'dashboard' && (
                <InstitutionDashboardView
                  onNavigate={handleNavigate}
                  onPreviewWebsite={() => setSchoolModalOpen(true)}
                />
              )}
              {currentView === 'students' && <StudentManagementView />}
              {currentView === 'academics' && <AcademicStructureView />}
              {currentView === 'campuses' && <CampusesManagementView />}
              {currentView === 'guardians' && <GuardiansManagementView />}
              {currentView === 'institution-users' && <InstitutionUsersView />}
              {currentView === 'finance' && <FinanceBillingView />}
              {currentView === 'hr' && <HumanResourcesView />}
              {currentView === 'modules' && <ModuleRegistryView />}
              {currentView === 'website' && (
                <InstitutionWebsiteCMSView onPreviewWebsite={() => setSchoolModalOpen(true)} />
              )}
              {currentView === 'ai' && <AIIntelligenceHubView />}
              {currentView === 'settings' && <InstitutionSettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Global Interactive Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Public ACADEEMIA Portal Preview Modal */}
      <PublicWebsitePreviewModal
        isOpen={publicModalOpen}
        onClose={() => setPublicModalOpen(false)}
      />

      {/* Institution Live Website Preview Modal */}
      <InstitutionWebsitePreviewModal
        isOpen={schoolModalOpen}
        onClose={() => setSchoolModalOpen(false)}
      />

      {/* Supabase Database Architecture & Diagnostics Modal */}
      <SupabaseConfigModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />
    </div>
  );
};

// Root Router coordinating Authenticated State vs Login Screen
const RootRouter: React.FC = () => {
  const { session, isSandboxMode, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3 font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs font-mono">Restoring ACADEEMIA 2.0 Security Session...</span>
      </div>
    );
  }

  // Unauthenticated users are strictly held at the Login screen
  if (!session && !isSandboxMode) {
    return <LoginView />;
  }

  return (
    <TenantProvider>
      <ModuleProvider>
        <AppShell />
      </ModuleProvider>
    </TenantProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootRouter />
    </AuthProvider>
  );
}
