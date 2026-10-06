import React, { useState, useEffect } from 'react';
import { ShieldCheck, Filter, Search, Terminal, RefreshCw } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AuditLogEntry } from '../../types';

export const PlatformAuditView: React.FC = () => {
  const [filterQuery, setFilterQuery] = useState('');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.warn('Audit logs load warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

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
            Authoritative append-only log of system modifications and administrative interventions from PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => loadLogs()}
            disabled={loading}
          >
            Refresh Logs
          </Button>
          <div className="w-full sm:w-64">
            <Input
              placeholder="Filter action, actor, or entity..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
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
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1.5 text-indigo-400" />
                    Querying audit trail from PostgreSQL...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-6 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-100 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-300 whitespace-nowrap">
                      {log.actor_name || 'System Principal'}
                    </td>
                    <td className="px-6 py-3 text-slate-400 whitespace-nowrap">
                      <span className="text-slate-200">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="text-slate-500 block text-[10px] truncate max-w-[120px]">
                          {log.entity_id}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-400 text-[11px] font-sans truncate max-w-xs">
                      {typeof log.details === 'object'
                        ? JSON.stringify(log.details)
                        : String(log.details || '—')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
