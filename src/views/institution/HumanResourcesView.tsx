import React from 'react';
import { Users, Building2, Briefcase, Plus, Shield } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { tenantStore } from '../../services/tenantStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const HumanResourcesView: React.FC = () => {
  const { activeInstitution, campuses } = useTenant();
  const terminology = activeInstitution.terminology_config;

  const departments = tenantStore.getDepartments(activeInstitution.id);
  const staff = tenantStore.getStaff(activeInstitution.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Human Resources, Faculty & Staff Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Independent institutional workforce architecture: departments, contracts, credentials, and campus allocations.
          </p>
        </div>
      </div>

      {/* Departments Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map((dept) => {
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
        })}
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
              {staff.map((stf) => {
                const camp = campuses.find((c) => c.id === stf.campus_id);
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
                      {stf.department?.name || 'General Admin'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 text-[11px]">
                      {camp?.name.split('(')[0] || 'Main Campus'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Badge variant="success">Active</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
