import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AcademicTerm, AcademicYear, Campus, Institution, InstitutionRole, InstitutionUser } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from './AuthContext';

export type EnvironmentMode = 'platform' | 'institution';

interface TenantContextType {
  mode: EnvironmentMode;
  setMode: (mode: EnvironmentMode) => void;
  activeInstitution: Institution | null;
  accessibleInstitutions: Institution[];
  institutions: Institution[];
  selectInstitution: (id: string) => boolean;
  activeMembership: InstitutionUser | null;
  activeRole: InstitutionRole | string;
  accessibleCampuses: Campus[];
  campuses: Campus[];
  activeCampus: Campus | null;
  selectCampus: (campusId: string | null) => boolean;
  academicYears: AcademicYear[];
  activeAcademicYear: AcademicYear | null;
  academicTerms: AcademicTerm[];
  activeAcademicTerm: AcademicTerm | null;
  refreshTenantData: () => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    authUser,
    isPlatformUser,
    isPlatformAdmin,
    institutionMemberships,
    isSandboxMode,
    sandboxActiveRole,
  } = useAuth();

  const [mode, setMode] = useState<EnvironmentMode>('institution');
  const [activeInstitutionId, setActiveInstitutionId] = useState<string>('');
  const [activeCampusId, setActiveCampusId] = useState<string | null>(null);

  const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(true);

  // Authoritative load of institutions from database
  const loadInstitutions = useCallback(async () => {
    try {
      const insts = await supabaseService.getInstitutions();
      setAllInstitutions(insts);
    } catch (err) {
      console.warn('Failed to load institutions:', err);
    }
  }, []);

  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  // Load campuses and academic structure when active institution changes
  const loadTenantDetails = useCallback(async (instId: string) => {
    if (!instId) {
      setCampuses([]);
      setAcademicYears([]);
      setAcademicTerms([]);
      return;
    }
    setLoading(true);
    try {
      const [cList, ayList] = await Promise.all([
        supabaseService.getCampuses(instId),
        supabaseService.getAcademicYears(instId),
      ]);
      setCampuses(cList);
      setAcademicYears(ayList);

      const currentYear = ayList.find((ay) => ay.is_current) || ayList[0];
      if (currentYear) {
        const atList = await supabaseService.getAcademicTerms(instId, currentYear.id);
        setAcademicTerms(atList);
      } else {
        setAcademicTerms([]);
      }
    } catch (err) {
      console.warn('Failed to load tenant details from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeInstitutionId) {
      loadTenantDetails(activeInstitutionId);
    }
  }, [activeInstitutionId, loadTenantDetails]);

  // Compute Accessible Institutions based strictly on authenticated identity & memberships
  const accessibleInstitutions = useMemo<Institution[]>(() => {
    if (isSandboxMode) {
      return allInstitutions;
    }
    if (!authUser) {
      return [];
    }
    if (isPlatformAdmin || isPlatformUser) {
      return allInstitutions;
    }
    const authorizedIds = new Set(institutionMemberships.map((m) => m.institution_id));
    return allInstitutions.filter((inst) => authorizedIds.has(inst.id));
  }, [authUser, isPlatformAdmin, isPlatformUser, institutionMemberships, isSandboxMode, allInstitutions]);

  // Sync active institution if current selection is invalid or unassigned
  useEffect(() => {
    if (accessibleInstitutions.length > 0) {
      const isCurrentValid = accessibleInstitutions.some((i) => i.id === activeInstitutionId);
      if (!isCurrentValid) {
        setActiveInstitutionId(accessibleInstitutions[0].id);
        setActiveCampusId(null);
      }
    } else {
      setActiveInstitutionId('');
      setActiveCampusId(null);
    }
  }, [accessibleInstitutions, activeInstitutionId]);

  const activeInstitution = accessibleInstitutions.find((i) => i.id === activeInstitutionId) || null;

  // Active membership for current institution
  const activeMembership = useMemo<InstitutionUser | null>(() => {
    if (!activeInstitution) return null;
    return institutionMemberships.find((m) => m.institution_id === activeInstitution.id) || null;
  }, [activeInstitution, institutionMemberships]);

  // Active role in current institution
  const activeRole = useMemo<InstitutionRole | string>(() => {
    if (isSandboxMode) {
      return sandboxActiveRole;
    }
    if (isPlatformAdmin) {
      return 'platform_admin';
    }
    return activeMembership?.role || 'student';
  }, [isSandboxMode, sandboxActiveRole, isPlatformAdmin, activeMembership]);

  // Accessible Campuses for current institution based on user's campus scope
  const accessibleCampuses = useMemo<Campus[]>(() => {
    if (!activeInstitution) return [];

    if (isSandboxMode || isPlatformAdmin || isPlatformUser) {
      return campuses;
    }

    if (activeMembership?.campus_id) {
      return campuses.filter((c) => c.id === activeMembership.campus_id);
    }

    // campus_id NULL means access across all campuses within that institution
    return campuses;
  }, [activeInstitution, isSandboxMode, isPlatformAdmin, isPlatformUser, activeMembership, campuses]);

  const activeCampus = accessibleCampuses.find((c) => c.id === activeCampusId) || null;

  const selectInstitution = (id: string): boolean => {
    const isAuthorized = accessibleInstitutions.some((i) => i.id === id);
    if (!isAuthorized && !isPlatformAdmin && !isSandboxMode) {
      console.warn(`[SECURITY REJECTION] Unauthorized attempt to switch to institution ${id}`);
      return false;
    }
    setActiveInstitutionId(id);
    setActiveCampusId(null);
    return true;
  };

  const selectCampus = (campusId: string | null): boolean => {
    if (campusId === null) {
      if (activeMembership?.campus_id && !isPlatformAdmin && !isSandboxMode) {
        return false;
      }
      setActiveCampusId(null);
      return true;
    }
    const isAuthorized = accessibleCampuses.some((c) => c.id === campusId);
    if (!isAuthorized) {
      console.warn(`[SECURITY REJECTION] Unauthorized attempt to switch to campus ${campusId}`);
      return false;
    }
    setActiveCampusId(campusId);
    return true;
  };

  const activeAcademicYear = academicYears.find((ay) => ay.is_current) || academicYears[0] || null;
  const activeAcademicTerm = academicTerms.find((at) => at.is_current) || academicTerms[0] || null;

  const refreshTenantData = () => {
    loadInstitutions();
    if (activeInstitutionId) {
      loadTenantDetails(activeInstitutionId);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        mode,
        setMode,
        activeInstitution,
        accessibleInstitutions,
        institutions: accessibleInstitutions,
        selectInstitution,
        activeMembership,
        activeRole,
        accessibleCampuses,
        campuses: accessibleCampuses,
        activeCampus,
        selectCampus,
        academicYears,
        activeAcademicYear,
        academicTerms,
        activeAcademicTerm,
        refreshTenantData,
        loading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
