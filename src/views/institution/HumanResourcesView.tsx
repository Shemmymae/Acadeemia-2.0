import React, { useState, useEffect, useCallback } from 'react';
import { Users, Building2, Briefcase, Plus, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabaseService } from '../../services/supabaseService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { HRDepartment, HRStaff } from '../../types';

export const HumanResourcesView: React.FC = () => {
  const { activeInstitution, campuses } = useTenant();

  const [departments, setDepartments] = useState<HRDepartment[]>([]);
  const [staff, setStaff] = useState<HRStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHRData = useCallback(async () => {
    if (!activeInstitution) return;
    setLoading(true);
    setError(null);
    try {
      const [deptList, staffList] = await Promise.all([
        supabaseService.getHRDepartments(activeInstitution.id),
        supabaseService.getHRStaff(activeInstitution.id),
      ]);
      setDepartments(deptList);
      setStaff(staffList);
    } catch (err: any) {
      console.error('Failed to load HR data from Supabase:', err);
      setError(err.message || 'Failed to load workforce directory from database');
    } finally {
      setLoading(false);
    }
  }, [activeInstitution?.id]);

  useEffect(() => {
    loadHRData();
  }, [loadHRData]);

  if (!activeInstitution) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Active Educational Institution</h3>
        <p className="text-xs text-slate-400">Select an authorized institution to view personnel directories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Human Resources, Faculty & Staff Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authoritative institutional workforce records from PostgreSQL: departments, job titles, and campus assignments.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={() => loadHRData()}
          disabled={loading}
        >
          Refresh Directory
        </Button>
      </div>

      {/* Database Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => loadHRData()}>
            Retry
          </Button>
        </div>
      )}

      {/* Departments Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && departments.length === 0 ? (
          <div className="col-span-full p-6 text-center text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
            Querying departments from database...
          </div>
        ) : (
          departments.map((dept) => {
            const deptStaff = staff.filter((s) => s.department_id === dept.id);
            return (
              <Card key={dept.id} padding="md" className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-indigo-400 font-semibold">{dept.code}</span>
                  <span className="text-xs text-slate-400 font-mono">{deptStaff.length} Members</span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">{dept.name}</h3>
              </Card>
            );
          })
        )}
      </div>

      {/* Staff Directory Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Faculty & Administrative Personnel</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Certified teachers, academic directors, and operational staff.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Employee #</th>
                <th className="px-6 py-3">Personnel Name</th>
                <th className="px-6 py-3">Job Title / Role</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Assigned Campus</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading && staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading authoritative personnel records...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    No faculty or staff found in database for this institution.
                  </td>
                </tr>
              ) : (
                staff.map((stf) => {
                  const camp = campuses.find((c) => c.id === stf.campus_id);
                  const dept = departments.find((d) => d.id === stf.department_id);

                  return (
                    <tr key={stf.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-indigo-300 font-semibold">
                        {stf.employee_number}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-100">{stf.user?.full_name || 'Staff Member'}</div>
                        <div className="text-[11px] text-slate-400">{stf.user?.email}</div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-200 font-medium">
                        {stf.job_title}
                      </td>
                      <td className="px-6 py-3.5 text-slate-300">
                        {dept?.name || stf.department?.name || 'General Admin'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 text-[11px]">
                        {camp?.name.split('(')[0] || 'Main Campus'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Badge variant={stf.employment_status === 'active' ? 'success' : 'neutral'}>
                          {stf.employment_status || 'active'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
