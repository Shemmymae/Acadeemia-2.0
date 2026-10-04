import React, { useState } from 'react';
import { BookOpen, Calendar, Layers, Users, Plus, CheckCircle2 } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { tenantStore } from '../../services/tenantStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const AcademicStructureView: React.FC = () => {
  const { activeInstitution, activeCampus, campuses } = useTenant();
  const terminology = activeInstitution.terminology_config;

  const academicYears = tenantStore.getAcademicYears(activeInstitution.id);
  const activeYear = academicYears.find((ay) => ay.is_current) || academicYears[0];
  const terms = activeYear ? tenantStore.getAcademicTerms(activeInstitution.id, activeYear.id) : [];
  const grades = tenantStore.getAcademicGrades(activeInstitution.id);
  const classes = tenantStore.getAcademicClasses(activeInstitution.id, activeCampus?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Academic Hierarchy & Curriculum Structure
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure Academic Sessions, {terminology.term_label} cycles, {terminology.grade_label} levels, and {terminology.class_label} cohorts.
          </p>
        </div>
      </div>

      {/* Academic Year & Terms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Academic Session
            </h3>
            <Badge variant="success">Current Year</Badge>
          </div>
          <div className="text-base font-bold text-white">
            {activeYear?.name || '2026-2027 Academic Session'}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {activeYear?.start_date} to {activeYear?.end_date}
          </div>
        </Card>

        {terms.map((t) => (
          <Card key={t.id} padding="md" className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {terminology.term_label}
              </h3>
              {t.is_current && <Badge variant="info">Active Session</Badge>}
            </div>
            <div className="text-base font-bold text-white">{t.name}</div>
            <div className="text-xs text-slate-400 font-mono">
              {t.start_date} to {t.end_date}
            </div>
          </Card>
        ))}
      </div>

      {/* Two Column Layout: Grades & Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grades / Forms */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100">
              {terminology.grade_label} Progression Levels
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configurable level naming without hardcoding Western K-12 or British systems.
            </p>
          </div>

          <div className="divide-y divide-slate-850">
            {grades.map((gr) => (
              <div key={gr.id} className="px-6 py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-slate-800 text-indigo-300 font-mono font-bold flex items-center justify-center text-[11px]">
                    {gr.sequence_order}
                  </span>
                  <span className="font-semibold text-slate-200">{gr.name}</span>
                </div>
                <span className="font-mono text-slate-500 uppercase">{gr.code}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Classes / Streams */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100">
              {terminology.class_label} Cohorts & Capacity Limits
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Specific sections linked to campuses with seat maximums.
            </p>
          </div>

          <div className="divide-y divide-slate-850">
            {classes.map((cls) => {
              const camp = campuses.find((c) => c.id === cls.campus_id);
              return (
                <div key={cls.id} className="px-6 py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{cls.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {camp?.name.split('(')[0]} · Code: {cls.code}
                    </div>
                  </div>
                  <div className="text-right font-mono text-slate-400">
                    <span className="text-slate-200 font-bold">{cls.capacity}</span> Max Capacity
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
