import React, { createContext, useContext, useState, useEffect } from 'react';
import { AcademicTerm, AcademicYear, Campus, Institution } from '../types';
import { tenantStore } from '../services/tenantStore';

export type EnvironmentMode = 'platform' | 'institution';

interface TenantContextType {
  mode: EnvironmentMode;
  setMode: (mode: EnvironmentMode) => void;
  activeInstitution: Institution;
  institutions: Institution[];
  selectInstitution: (id: string) => void;
  campuses: Campus[];
  activeCampus: Campus | null; // null represents all campuses in current institution
  selectCampus: (campusId: string | null) => void;
  academicYears: AcademicYear[];
  activeAcademicYear: AcademicYear | null;
  academicTerms: AcademicTerm[];
  activeAcademicTerm: AcademicTerm | null;
  refreshTenantData: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<EnvironmentMode>('institution');
  const [institutions, setInstitutions] = useState<Institution[]>(() => tenantStore.getInstitutions());
  const [activeInstitutionId, setActiveInstitutionId] = useState<string>(institutions[0]?.id || 'inst-st-jude');
  const [activeCampusId, setActiveCampusId] = useState<string | null>(null);

  const activeInstitution = institutions.find((i) => i.id === activeInstitutionId) || institutions[0];
  const campuses = tenantStore.getCampuses(activeInstitution.id);
  const activeCampus = campuses.find((c) => c.id === activeCampusId) || null;

  const academicYears = tenantStore.getAcademicYears(activeInstitution.id);
  const activeAcademicYear = academicYears.find((ay) => ay.is_current) || academicYears[0] || null;

  const academicTerms = activeAcademicYear
    ? tenantStore.getAcademicTerms(activeInstitution.id, activeAcademicYear.id)
    : [];
  const activeAcademicTerm = academicTerms.find((at) => at.is_current) || academicTerms[0] || null;

  const refreshTenantData = () => {
    const list = tenantStore.getInstitutions();
    setInstitutions(list);
  };

  const selectInstitution = (id: string) => {
    setActiveInstitutionId(id);
    setActiveCampusId(null); // Reset campus filter on tenant switch
  };

  const selectCampus = (campusId: string | null) => {
    setActiveCampusId(campusId);
  };

  return (
    <TenantContext.Provider
      value={{
        mode,
        setMode,
        activeInstitution,
        institutions,
        selectInstitution,
        campuses,
        activeCampus,
        selectCampus,
        academicYears,
        activeAcademicYear,
        academicTerms,
        activeAcademicTerm,
        refreshTenantData,
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
