import React, { createContext, useContext, useState, useEffect } from 'react';
import { ModuleDefinition, Subscription } from '../types';
import { SYSTEM_MODULES } from '../services/moduleRegistry';
import { tenantStore } from '../services/tenantStore';
import { useTenant } from './TenantContext';

interface ModuleContextType {
  modules: ModuleDefinition[];
  enabledModules: Set<string>;
  isModuleEnabled: (code: string) => boolean;
  toggleModule: (code: string, enabled: boolean) => void;
  subscription?: Subscription;
  refreshModules: () => void;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const ModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeInstitution } = useTenant();
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
  const [subscription, setSubscription] = useState<Subscription | undefined>(undefined);

  const loadData = () => {
    if (!activeInstitution) return;
    const instModules = tenantStore.getInstitutionModules(activeInstitution.id);
    const enabledSet = new Set(instModules.filter((im) => im.is_enabled).map((im) => im.module_code));
    setEnabledModules(enabledSet);

    const sub = tenantStore.getSubscription(activeInstitution.id);
    setSubscription(sub);
  };

  useEffect(() => {
    loadData();
  }, [activeInstitution.id]);

  const isModuleEnabled = (code: string): boolean => {
    return enabledModules.has(code);
  };

  const toggleModule = (code: string, enabled: boolean) => {
    tenantStore.toggleModule(activeInstitution.id, code, enabled);
    setEnabledModules((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(code);
      else next.delete(code);
      return next;
    });
  };

  return (
    <ModuleContext.Provider
      value={{
        modules: SYSTEM_MODULES,
        enabledModules,
        isModuleEnabled,
        toggleModule,
        subscription,
        refreshModules: loadData,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
};

export const useModules = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
};
