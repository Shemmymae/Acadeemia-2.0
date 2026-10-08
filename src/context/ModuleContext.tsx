import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ModuleDefinition, Package, Subscription } from '../types';
import {
  SYSTEM_MODULES,
  DEFAULT_PACKAGES,
  CORE_MODULE_CODES,
  normalizeModuleCode,
  getModuleByCode,
} from '../services/moduleRegistry';
import { supabaseService } from '../services/supabaseService';
import { useTenant } from './TenantContext';
import { useAuth } from './AuthContext';
import { hasPermission } from '../services/permissionEngine';

export type ModuleAccessReason = 'allowed' | 'unlicensed' | 'disabled' | 'forbidden';

export interface ModuleAccessStatus {
  isEntitled: boolean;
  isEnabled: boolean;
  isAccessible: boolean;
  reason: ModuleAccessReason;
}

interface ModuleContextType {
  modules: ModuleDefinition[];
  packages: Package[];
  entitledModules: Set<string>;
  enabledModules: Set<string>;
  isModuleEntitled: (code: string) => boolean;
  isModuleEnabled: (code: string) => boolean;
  isModuleAccessible: (code: string, requiredRoles?: string[], requiredPermission?: string) => boolean;
  getModuleAccessStatus: (code: string, requiredRoles?: string[], requiredPermission?: string) => ModuleAccessStatus;
  toggleModule: (code: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  changeSubscriptionPackage: (packageId: string) => Promise<{ success: boolean; error?: string }>;
  addAddon: (moduleCode: string, priceCents?: number) => Promise<{ success: boolean; error?: string }>;
  removeAddon: (moduleCode: string) => Promise<{ success: boolean; error?: string }>;
  requestSubscriptionUpgrade: (targetTierOrModule: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  subscription?: Subscription | null;
  loading: boolean;
  error: string | null;
  refreshModules: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const ModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeInstitution, activeRole, activeMembership } = useTenant();
  const { isPlatformAdmin, isSandboxMode } = useAuth();

  const [modules, setModules] = useState<ModuleDefinition[]>(SYSTEM_MODULES);
  const [packages, setPackages] = useState<Package[]>(DEFAULT_PACKAGES);
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
  const [entitledModules, setEntitledModules] = useState<Set<string>>(new Set());
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load packages once
  useEffect(() => {
    async function loadPlatformPackages() {
      try {
        const pkgs = await supabaseService.getPackages();
        if (pkgs && pkgs.length > 0) {
          setPackages(pkgs);
        }
      } catch (err) {
        console.warn('Using default package catalog:', err);
      }
    }
    loadPlatformPackages();
  }, []);

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
      // 1. Fetch live catalog, subscription and enabled modules from Supabase
      const [mods, sub, instModules] = await Promise.all([
        supabaseService.getModules().catch(() => SYSTEM_MODULES),
        supabaseService.getSubscription(activeInstitution.id).catch(() => null),
        supabaseService.getInstitutionModules(activeInstitution.id).catch(() => []),
      ]);

      if (mods && mods.length > 0) {
        setModules(mods);
      }

      setSubscription(sub);

      // 2. Compute Entitled Modules (Core + Package Inclusions + Active Addons)
      const entitledSet = new Set<string>();

      // All core modules are unconditionally entitled
      CORE_MODULE_CODES.forEach((code) => entitledSet.add(code));

      // Modules included in active subscription package
      if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
        const pkgModules = sub.package?.included_modules || [];
        pkgModules.forEach((code) => {
          entitledSet.add(normalizeModuleCode(code));
        });

        // Active subscription add-ons
        const addonModules = sub.addons?.map((a) => a.module_code) || [];
        addonModules.forEach((code) => {
          entitledSet.add(normalizeModuleCode(code));
        });
      }

      setEntitledModules(entitledSet);

      // 3. Compute Enabled Modules: active records from institution_modules table
      const enabledSet = new Set<string>();

      instModules.forEach((im) => {
        const norm = normalizeModuleCode(im.module_code);
        // Only modules that are legitimately entitled AND marked is_enabled can be active
        if (im.is_enabled && entitledSet.has(norm)) {
          enabledSet.add(norm);
        }
      });

      // Core modules are permanently enabled for all institutions
      CORE_MODULE_CODES.forEach((coreCode) => {
        enabledSet.add(coreCode);
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

  /**
   * Check if an institution has commercial permission/license to use the module.
   */
  const isModuleEntitled = useCallback(
    (code: string): boolean => {
      const canonical = normalizeModuleCode(code);
      if (CORE_MODULE_CODES.has(canonical)) return true;
      return entitledModules.has(canonical);
    },
    [entitledModules]
  );

  /**
   * Check if the module is currently turned on/active in this institution's environment.
   */
  const isModuleEnabled = useCallback(
    (code: string): boolean => {
      const canonical = normalizeModuleCode(code);
      if (CORE_MODULE_CODES.has(canonical)) {
        return true;
      }
      return isModuleEntitled(canonical) && enabledModules.has(canonical);
    },
    [enabledModules, isModuleEntitled]
  );

  /**
   * Check if the current authenticated user can actually access the enabled module.
   * Enforces:
   * 1. Institution is Entitled
   * 2. Module is Enabled
   * 3. Current user has role / permission privileges for this module
   */
  const isModuleAccessible = useCallback(
    (code: string, requiredRoles?: string[], requiredPermission?: string): boolean => {
      const canonical = normalizeModuleCode(code);

      // Must be Entitled and Enabled
      if (!isModuleEnabled(canonical)) {
        return false;
      }

      // Root Platform Admins and Sandbox Admins have full access
      if (isPlatformAdmin || isSandboxMode) {
        return true;
      }

      // Institution Owners have executive access to all enabled modules
      if (activeRole === 'institution_owner') {
        return true;
      }

      // Check specific role requirements if provided
      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(activeRole as string)) {
          return false;
        }
      }

      // Check permission requirements
      if (requiredPermission) {
        return hasPermission(
          activeRole as any,
          activeMembership?.custom_permissions || [],
          requiredPermission,
          isPlatformAdmin
        );
      }

      // By default, check if user's role has any of the permissions provided by this module
      const modDef = getModuleByCode(canonical);
      if (!modDef || modDef.permissions_provided.length === 0) {
        return true;
      }

      return modDef.permissions_provided.some((perm) =>
        hasPermission(
          activeRole as any,
          activeMembership?.custom_permissions || [],
          perm,
          isPlatformAdmin
        )
      );
    },
    [isModuleEnabled, isPlatformAdmin, isSandboxMode, activeRole, activeMembership]
  );

  /**
   * Detailed access diagnostic status
   */
  const getModuleAccessStatus = useCallback(
    (code: string, requiredRoles?: string[], requiredPermission?: string): ModuleAccessStatus => {
      const canonical = normalizeModuleCode(code);
      const entitled = isModuleEntitled(canonical);

      if (!entitled) {
        return {
          isEntitled: false,
          isEnabled: false,
          isAccessible: false,
          reason: 'unlicensed',
        };
      }

      const enabled = isModuleEnabled(canonical);
      if (!enabled) {
        return {
          isEntitled: true,
          isEnabled: false,
          isAccessible: false,
          reason: 'disabled',
        };
      }

      const accessible = isModuleAccessible(canonical, requiredRoles, requiredPermission);
      if (!accessible) {
        return {
          isEntitled: true,
          isEnabled: true,
          isAccessible: false,
          reason: 'forbidden',
        };
      }

      return {
        isEntitled: true,
        isEnabled: true,
        isAccessible: true,
        reason: 'allowed',
      };
    },
    [isModuleEntitled, isModuleEnabled, isModuleAccessible]
  );

  /**
   * Authoritative toggle enforced by PostgreSQL RLS.
   * If the institution lacks commercial entitlement to an un-included module,
   * PostgreSQL RLS rejects the write and the UI reflects the rejection.
   */
  const toggleModule = async (
    code: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeInstitution) return { success: false, error: 'No active educational institution selected.' };

    const canonical = normalizeModuleCode(code);

    // Guard: Core modules cannot be disabled
    if (CORE_MODULE_CODES.has(canonical) && !enabled) {
      return {
        success: false,
        error: 'Core platform modules (SIS and Academics) are mandatory and cannot be deactivated.',
      };
    }

    // Guard: Unentitled modules cannot be enabled
    if (enabled && !isModuleEntitled(canonical)) {
      return {
        success: false,
        error: `Licensing restriction: Institution lacks commercial entitlement for module "${canonical}". Subscription upgrade or commercial add-on required.`,
      };
    }

    try {
      // Direct call to PostgreSQL via Supabase client (enforced by RLS)
      await supabaseService.toggleInstitutionModule(activeInstitution.id, canonical, enabled);

      // Only update local UI state AFTER database confirms success
      setEnabledModules((prev) => {
        const next = new Set(prev);
        if (enabled) next.add(canonical);
        else next.delete(canonical);
        return next;
      });

      return { success: true };
    } catch (err: any) {
      console.error('Module toggle database error:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Change subscription tier (Restricted to Platform Administrators)
   */
  const changeSubscriptionPackage = async (
    packageId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeInstitution) return { success: false, error: 'No active institution' };

    // Strictly enforce platform admin governance boundary
    if (!isPlatformAdmin && !isSandboxMode) {
      return {
        success: false,
        error: 'Authorization restriction: Only Platform Administrators can alter commercial package subscriptions. Institution administrators must submit an upgrade request.',
      };
    }

    try {
      const updated = await supabaseService.changeSubscriptionPackage(activeInstitution.id, packageId);
      setSubscription(updated);
      await loadData();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update subscription tier:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Add a module as a subscription add-on (Restricted to Platform Administrators)
   */
  const addAddon = async (
    moduleCode: string,
    priceCents = 0
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeInstitution) return { success: false, error: 'No active institution' };

    // Strictly enforce platform admin governance boundary
    if (!isPlatformAdmin && !isSandboxMode) {
      return {
        success: false,
        error: 'Authorization restriction: Only Platform Administrators can provision commercial add-ons. Institution administrators must submit an add-on request.',
      };
    }

    const canonical = normalizeModuleCode(moduleCode);

    try {
      const updated = await supabaseService.addSubscriptionAddon(activeInstitution.id, canonical, priceCents);
      setSubscription(updated);
      await loadData();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to add module add-on:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Remove an active subscription add-on (Restricted to Platform Administrators)
   */
  const removeAddon = async (
    moduleCode: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeInstitution) return { success: false, error: 'No active institution' };

    // Strictly enforce platform admin governance boundary
    if (!isPlatformAdmin && !isSandboxMode) {
      return {
        success: false,
        error: 'Authorization restriction: Only Platform Administrators can remove commercial add-ons.',
      };
    }

    const canonical = normalizeModuleCode(moduleCode);

    try {
      const updated = await supabaseService.removeSubscriptionAddon(activeInstitution.id, canonical);
      setSubscription(updated);
      await loadData();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to remove module add-on:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Submit an upgrade request from an Institution Administrator
   */
  const requestSubscriptionUpgrade = async (
    targetTierOrModule: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeInstitution) return { success: false, error: 'No active institution' };

    try {
      await supabaseService.logAuditEvent({
        tenant_id: activeInstitution.id,
        actor_name: activeRole || 'Institution Administrator',
        action: 'SUBSCRIPTION_UPGRADE_REQUESTED',
        entity_type: 'subscription_requests',
        entity_id: targetTierOrModule,
        details: {
          target: targetTierOrModule,
          notes: notes || 'Commercial upgrade requested from institution workspace',
          requested_at: new Date().toISOString(),
        },
      });
      return { success: true };
    } catch (err: any) {
      console.error('Failed to submit upgrade request:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <ModuleContext.Provider
      value={{
        modules,
        packages,
        entitledModules,
        enabledModules,
        isModuleEntitled,
        isModuleEnabled,
        isModuleAccessible,
        getModuleAccessStatus,
        toggleModule,
        changeSubscriptionPackage,
        addAddon,
        removeAddon,
        requestSubscriptionUpgrade,
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
