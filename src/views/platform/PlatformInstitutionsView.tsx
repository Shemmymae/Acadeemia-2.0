import React, { useState } from 'react';
import { Building2, Plus, ExternalLink, MapPin, Globe, Users, Shield } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { tenantStore } from '../../services/tenantStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export interface PlatformInstitutionsViewProps {
  onEnterWorkspace: (instId: string) => void;
}

export const PlatformInstitutionsView: React.FC<PlatformInstitutionsViewProps> = ({
  onEnterWorkspace,
}) => {
  const { institutions, refreshTenantData } = useTenant();
  const [modalOpen, setModalOpen] = useState(false);

  // New institution form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [slug, setSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [currency, setCurrency] = useState('USD');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');

  const handleCreateInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    tenantStore.createInstitution({
      name,
      code: code.toUpperCase(),
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      custom_domain: customDomain || `${code.toLowerCase()}.acadeemia.edu`,
      status: 'active',
      timezone,
      currency,
      terminology_config: {
        grade_label: 'Grade',
        class_label: 'Class',
        term_label: 'Term',
        student_label: 'Student',
        teacher_label: 'Teacher',
      },
      branding_config: {
        primary_color: primaryColor,
        accent_color: '#06b6d4',
        font_family: 'Plus Jakarta Sans',
        motto: 'Excellence in Learning',
      },
    });

    refreshTenantData();
    setModalOpen(false);
    // Reset form
    setName('');
    setCode('');
    setSlug('');
    setCustomDomain('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Institutions & Campuses Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Provision independent educational organizations with isolated schemas, campuses, and branding.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setModalOpen(true)}
        >
          Provision New Institution
        </Button>
      </div>

      {/* Grid of Institutions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {institutions.map((inst) => {
          const campuses = tenantStore.getCampuses(inst.id);
          const students = tenantStore.getStudents(inst.id);
          const sub = tenantStore.getSubscription(inst.id);

          return (
            <Card key={inst.id} padding="md" className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm"
                      style={{ backgroundColor: inst.branding_config?.primary_color || '#4f46e5' }}
                    >
                      {inst.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{inst.name}</h3>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Code: <span className="text-slate-200">{inst.code}</span> · {inst.timezone}
                      </div>
                    </div>
                  </div>
                  <Badge variant="success">Active Tenant</Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-center">
                  <div>
                    <div className="text-xs text-slate-400">Campuses</div>
                    <div className="text-sm font-bold text-white font-mono tabular-nums mt-0.5">
                      {campuses.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Scholars</div>
                    <div className="text-sm font-bold text-white font-mono tabular-nums mt-0.5">
                      {students.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Package</div>
                    <div className="text-xs font-semibold text-indigo-300 mt-1 truncate">
                      {sub?.package?.name.split(' ')[0] || 'Standard'}
                    </div>
                  </div>
                </div>

                {/* Campuses List */}
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Campuses ({campuses.length})
                  </div>
                  {campuses.map((camp) => (
                    <div
                      key={camp.id}
                      className="flex items-center justify-between p-2 rounded-md bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-200 font-medium">{camp.name}</span>
                        {camp.is_main && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                            Main HQ
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 font-mono">{camp.code}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400 font-mono">
                  {inst.custom_domain || 'Default domain'}
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onEnterWorkspace(inst.id)}
                >
                  Enter Workspace
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Provision Institution Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Provision New Educational Institution"
        subtitle="Deploys an isolated multi-tenant instance with automatic campus seeding and RLS."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateInstitution} className="space-y-4">
          <Input
            label="Institution Name"
            placeholder="e.g. Oakridge Collegiate Institute"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!code) {
                setCode(e.target.value.substring(0, 4).toUpperCase() + '-01');
              }
            }}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tenant Code (Unique)"
              placeholder="e.g. OAKR-01"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <Input
              label="URL Slug"
              placeholder="oakridge-collegiate"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Custom Portal Domain"
              placeholder="portal.oakridge.edu"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
            />
            <Select
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={[
                { value: 'America/New_York', label: 'America/New_York (EST)' },
                { value: 'America/Chicago', label: 'America/Chicago (CST)' },
                { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
                { value: 'Europe/London', label: 'Europe/London (GMT)' },
                { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Base Billing Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'CAD', label: 'CAD ($)' },
              ]}
            />
            <Input
              label="Brand Accent Color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
          </div>

          <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 space-y-1">
            <div className="font-semibold">Automated Provisioning Includes:</div>
            <div>• Primary Academic Campus container with initial capacity</div>
            <div>• Core module suite with Row Level Security boundaries</div>
            <div>• Branded public website container with admissions form connection</div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Provision Tenant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
