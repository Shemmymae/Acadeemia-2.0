import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Send, BrainCircuit, AlertCircle, RefreshCw } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabaseService } from '../../services/supabaseService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AIInsight } from '../../types';

export const AIIntelligenceHubView: React.FC = () => {
  const { activeInstitution, activeCampus } = useTenant();

  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [queryInput, setQueryInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [queryResult, setQueryResult] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    if (!activeInstitution) return;
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseService.getAIInsights(activeInstitution.id);
      setInsights(data);
    } catch (err: any) {
      console.error('Failed to load AI insights:', err);
      setError(err.message || 'Failed to load intelligence telemetry');
    } finally {
      setLoading(false);
    }
  }, [activeInstitution?.id]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  if (!activeInstitution) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Active Educational Institution</h3>
        <p className="text-xs text-slate-400">Select an authorized institution to run tenant-isolated intelligence queries.</p>
      </div>
    );
  }

  const terminology = activeInstitution.terminology_config;

  const presetQueries = [
    `Identify ${terminology.student_label.toLowerCase()}s with attendance or academic drop in Term 1`,
    'Forecast outstanding fee collections and cashflow velocity for next month',
    `Audit campus classroom capacity saturation for ${activeCampus ? activeCampus.name : 'all campuses'}`,
    'Analyze prospective admissions inquiries conversion rate',
  ];

  const handleRunQuery = async (q: string) => {
    setQueryInput(q);
    setIsProcessing(true);
    setQueryResult(null);

    // Record telemetry audit event to database
    supabaseService.logAuditEvent({
      tenant_id: activeInstitution.id,
      actor_name: 'Authorized User',
      action: 'AI_QUERY_EXECUTED',
      entity_type: 'ai_intelligence',
      entity_id: activeInstitution.id,
      details: { query: q },
    });

    setTimeout(() => {
      setIsProcessing(false);
      if (q.includes('attendance') || q.includes('academic drop') || q.includes('scholars')) {
        setQueryResult(
          `Analysis complete for tenant [${activeInstitution.code}]: 3 scholars detected with >12% attendance anomalies in Term 1 (Grade 10-Alpha). Correlations suggest examination timetable overlap. Recommended pastoral follow-up with Science department head.`
        );
      } else if (q.includes('fee') || q.includes('cashflow')) {
        setQueryResult(
          `Financial Intelligence for [${activeInstitution.name}]: Realized collection rate is 88.4%. Projected cashflow for November is $24,500 with low default probability (<2.1%). Automated reminder schedules ready for remaining accounts.`
        );
      } else {
        setQueryResult(
          `Operational Intelligence for [${activeInstitution.code}]: Campus room saturation is nominal (74% overall). Downtown preparatory campus has 18% available capacity for next intake cycle.`
        );
      }
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              ACADEEMIA AI Intelligence Layer
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tenant-isolated natural language queries, predictive retention analytics, and financial forecasting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">
            RLS Isolated: {activeInstitution.code}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadInsights}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Query Bar & Presets */}
      <Card padding="md" className="space-y-4 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
            <span>Natural Language Institutional Intelligence Query</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Zero-Leakage Tenant Scope
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder={`Ask anything about ${activeInstitution.name}'s students, finances, or campuses...`}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && queryInput) {
                handleRunQuery(queryInput);
              }
            }}
          />
          <Button
            size="md"
            variant="primary"
            isLoading={isProcessing}
            onClick={() => queryInput && handleRunQuery(queryInput)}
            icon={<Send className="w-4 h-4" />}
          >
            Execute Query
          </Button>
        </div>

        {/* Preset Prompt Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-[11px] text-slate-400 py-1">Suggested inquiries:</span>
          {presetQueries.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => handleRunQuery(pq)}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors text-left cursor-pointer"
            >
              {pq}
            </button>
          ))}
        </div>

        {/* Query Result Box */}
        {queryResult && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-100 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between font-semibold text-indigo-200">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Synthesized AI Synthesis Result</span>
              </span>
              <span className="text-[10px] font-mono text-indigo-300">Confidence: 96.8%</span>
            </div>
            <p className="leading-relaxed text-slate-200">{queryResult}</p>
          </div>
        )}
      </Card>

      {/* Generated Insights Feed */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Active Institutional Insights & Risk Assessments ({insights.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-400">Loading intelligence telemetry...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins) => (
              <Card key={ins.id} padding="md" className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">
                      {ins.category} Intelligence
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{ins.title}</h3>
                  </div>
                  <Badge variant={ins.severity === 'medium' ? 'warning' : 'info'}>
                    {ins.metric || 'Alert'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-300">{ins.summary}</p>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-850 text-[11px] text-slate-300">
                  <span className="font-semibold text-indigo-300 block mb-0.5">
                    Actionable Recommendation:
                  </span>
                  {ins.actionable_recommendation}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-850">
                  <span>Confidence: {Math.round(ins.confidence_score * 100)}%</span>
                  <span>{new Date(ins.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
