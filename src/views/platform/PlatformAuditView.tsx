import React, { useState } from 'react';
import { ShieldCheck, Filter, Search, Terminal } from 'lucide-react';
import { tenantStore } from '../../services/tenantStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export const PlatformAuditView: React.FC = () => {
  const [filterQuery, setFilterQuery] = useState('');
  const logs = tenantStore.getAuditLogs();

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.actor_name?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Security & Compliance Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable log of system modifications, tenant isolation events, and administrative interventions.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Filter action, actor, or entity..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Timestamp (UTC)</th>
                <th className="px-6 py-3">Action Event</th>
                <th className="px-6 py-3">Actor / Principal</th>
                <th className="px-6 py-3">Entity Type & ID</th>
                <th className="px-6 py-3">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-mono">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-6 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 font-semibold text-slate-100 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{log.action}</span>
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-300">
                    {log.actor_name || 'System Process'}
                  </td>
                  <td className="px-6 py-3 text-slate-400 text-[11px]">
                    {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                  </td>
                  <td className="px-6 py-3 text-slate-400 text-[11px] max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
