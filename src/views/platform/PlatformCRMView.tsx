import React, { useState } from 'react';
import { TrendingUp, Mail, Phone, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface ProspectLead {
  id: string;
  institution_name: string;
  contact_person: string;
  role: string;
  email: string;
  phone: string;
  student_count: number;
  campuses: number;
  stage: 'lead' | 'demo_scheduled' | 'trial' | 'contract_sent' | 'onboarded';
  estimated_mrr: number;
  last_interaction: string;
}

const INITIAL_PROSPECTS: ProspectLead[] = [
  {
    id: 'lead-01',
    institution_name: 'St. Augustine Preparatory School',
    contact_person: 'Dr. Gregory Hayes',
    role: 'Headmaster',
    email: 'ghayes@staugustineprep.org',
    phone: '+1 (555) 321-9988',
    student_count: 850,
    campuses: 2,
    stage: 'demo_scheduled',
    estimated_mrr: 1200,
    last_interaction: 'Yesterday (Demo Call confirmed)',
  },
  {
    id: 'lead-02',
    institution_name: 'Pacific Heritage STEM Academy',
    contact_person: 'Elena Rostova',
    role: 'Director of Technology',
    email: 'elena.r@pacificheritage.edu',
    phone: '+1 (415) 777-1029',
    student_count: 1400,
    campuses: 3,
    stage: 'trial',
    estimated_mrr: 1950,
    last_interaction: '2 days ago (Trial workspace activated)',
  },
  {
    id: 'lead-03',
    institution_name: 'Geneva International Lyceum',
    contact_person: 'Jean-Luc Bernard',
    role: 'Managing Governor',
    email: 'jl.bernard@genevalyceum.ch',
    phone: '+41 22 555 4910',
    student_count: 620,
    campuses: 1,
    stage: 'contract_sent',
    estimated_mrr: 950,
    last_interaction: '3 days ago (Annual contract sent for signature)',
  },
];

export const PlatformCRMView: React.FC = () => {
  const [prospects] = useState<ProspectLead[]>(INITIAL_PROSPECTS);

  const stageBadge = (stage: ProspectLead['stage']) => {
    switch (stage) {
      case 'demo_scheduled':
        return <Badge variant="warning">Demo Scheduled</Badge>;
      case 'trial':
        return <Badge variant="info">Active Trial</Badge>;
      case 'contract_sent':
        return <Badge variant="success">Contract Sent</Badge>;
      default:
        return <Badge variant="neutral">Prospective Lead</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Platform CRM, Sales & Onboarding Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track prospective educational institutions from initial inquiry and demos through trial sandboxes to contracted onboarding.
          </p>
        </div>
      </div>

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="text-xs text-slate-400 font-semibold uppercase">Pipeline Value</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">$49,200 <span className="text-xs font-normal text-slate-400">ARR</span></div>
          <div className="text-xs text-emerald-400 mt-1">3 active institution trials</div>
        </Card>
        <Card padding="md">
          <div className="text-xs text-slate-400 font-semibold uppercase">Demo Conversion Rate</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">68.4%</div>
          <div className="text-xs text-slate-400 mt-1">From discovery to trial sandbox</div>
        </Card>
        <Card padding="md">
          <div className="text-xs text-slate-400 font-semibold uppercase">Avg. Onboarding Period</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">11.5 <span className="text-xs font-normal text-slate-400">Days</span></div>
          <div className="text-xs text-sky-400 mt-1">Multi-campus data migration</div>
        </Card>
      </div>

      {/* Prospects Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100">Active Prospective Institutions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Institution</th>
                <th className="px-6 py-3">Key Stakeholder</th>
                <th className="px-6 py-3">Capacity & Scope</th>
                <th className="px-6 py-3">Pipeline Stage</th>
                <th className="px-6 py-3">Est. MRR</th>
                <th className="px-6 py-3">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {prospects.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="font-semibold text-slate-100">{lead.institution_name}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="text-slate-200 font-medium">{lead.contact_person}</div>
                    <div className="text-[11px] text-slate-400">{lead.role} · {lead.email}</div>
                  </td>
                  <td className="px-6 py-3.5 font-mono tabular-nums text-slate-300">
                    {lead.student_count.toLocaleString()} Scholars · {lead.campuses} Campuses
                  </td>
                  <td className="px-6 py-3.5">
                    {stageBadge(lead.stage)}
                  </td>
                  <td className="px-6 py-3.5 font-mono tabular-nums font-semibold text-white">
                    ${lead.estimated_mrr}/mo
                  </td>
                  <td className="px-6 py-3.5 text-slate-400 text-[11px]">
                    {lead.last_interaction}
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
