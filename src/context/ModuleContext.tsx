import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ModuleDefinition, Subscription } from '../types';
import { SYSTEM_MODULES } from '../services/moduleRegistry';
import { supabaseService } from '../services/supabaseService';
import { useTenant } from './TenantContext';

interface ModuleContextType {
  modules: ModuleDefinition[];
  entitledModules: Set<string>;
  enabledModules: Set<string>;
  isModuleEnabled: (code: string) => boolean;
  isModuleEntitled: (code: string) => boolean;
  toggleModule: (code: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  subscription?: Subscription | null;
  loading: boolean;
  error: string | null;
  refreshModules: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const ModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeInstitution } = useTenant();
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
  const [entitledModules, setEntitledModules] = useState<Set<string>>(new Set());
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!activeInstitution) {
      setEnabledModules(new Set());
      setEntitledModules(new Set());
      setSubscription(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch live subscription and enabled modules from Supabase
      const [sub, instModules] = await Promise.all([
        supabaseService.getSubscription(activeInstitution.id),
        supabaseService.getInstitutionModules(activeInstitution.id),
      ]);

      setSubscription(sub);

      // 2. Compute Entitled Modules (Core + Package Inclusions + Active Addons)
      const entitledSet = new Set<string>();

      // All core modules are entitled
      SYSTEM_MODULES.filter((m) => m.is_core).forEach((m) => entitledSet.add(m.code));

      // Modules included in active subscription package
      if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
        const pkgModules = sub.package?.included_modules || [];
        pkgModules.forEach((code) => entitledSet.add(code));

        // Add-ons
        const addonModules = sub.addons?.map((a) => a.module_code) || [];
        addonModules.forEach((code) => entitledSet.add(code));
      }

      setEntitledModules(entitledSet);

      // 3. Enabled modules: active records from institution_modules table
      const enabledSet = new Set(
        instModules.filter((im) => im.is_enabled).map((im) => im.module_code)
      );

      // Default-enable core modules if no explicit disable record
      SYSTEM_MODULES.filter((m) => m.is_core).forEach((m) => {
        const record = instModules.find((im) => im.module_code === m.code);
        if (!record || record.is_enabled) {
          enabledSet.add(m.code);
        }
      });

      setEnabledModules(enabledSet);
    } catch (err: any) {
      console.error('Failed to load module state from database:', err);
      setError(err.message || 'Failed to load module entitlements');
    } finally {
      setLoading(false);
    }
  }, [activeInstitution?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isModuleEnabled = (code: string): boolean => {
    return enabledModules.has(code);
  };

  const isModuleEntitled = (code: string): boolean => {
    return entitledModules.has(code);
  };

  /**
   * Authoritative toggle enforced by PostgreSQL RLS.
   * If the institution lacks commercial entitlement to an un-included module,
   * PostgreSQL RLS rejects the write and the UI reflects the rejection.
   */
  const toggleModule = async (
    code: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeInstitution) return { success: false, error: 'No active institution' };

    try {
      // Direct call to PostgreSQL via Supabase client
      await supabaseService.toggleInstitutionModule(activeInstitution.id, code, enabled);

      // Only update local UI state AFTER database confirms success
      setEnabledModules((prev) => {
        const next = new Set(prev);
        if (enabled) next.add(code);
        else next.delete(code);
        return next;
      });

      return { success: true };
    } catch (err: any) {
      console.error('Module toggle database error:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <ModuleContext.Provider
      value={{
        modules: SYSTEM_MODULES,
        entitledModules,
        enabledModules,
        isModuleEnabled,
        isModuleEntitled,
        toggleModule,
        subscription,
        loading,
        error,
        refreshModules: loadData,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
};

export const useModules = (): ModuleContextType => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
};
