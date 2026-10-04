import React, { useState } from 'react';
import { Globe, Eye, Save, Check, ExternalLink, Link2, FileText, CheckCircle2 } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { tenantStore } from '../../services/tenantStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { InstitutionWebsiteConfig } from '../../types';

export interface InstitutionWebsiteCMSViewProps {
  onPreviewWebsite: () => void;
}

export const InstitutionWebsiteCMSView: React.FC<InstitutionWebsiteCMSViewProps> = ({
  onPreviewWebsite,
}) => {
  const { activeInstitution } = useTenant();
  const [config, setConfig] = useState<InstitutionWebsiteConfig>(() =>
    tenantStore.getInstitutionWebsite(activeInstitution.id)
  );

  const [siteTitle, setSiteTitle] = useState(config.site_title);
  const [tagline, setTagline] = useState(config.tagline || '');
  const [heroHeading, setHeroHeading] = useState(config.hero_heading || '');
  const [heroSubheading, setHeroSubheading] = useState(config.hero_subheading || '');
  const [customDomain, setCustomDomain] = useState(config.custom_domain || '');
  const [isPublished, setIsPublished] = useState(config.is_published);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = tenantStore.updateInstitutionWebsite(activeInstitution.id, {
      site_title: siteTitle,
      tagline,
      hero_heading: heroHeading,
      hero_subheading: heroSubheading,
      custom_domain: customDomain,
      is_published: isPublished,
    });
    setConfig(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Institution Website & CMS Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dedicated school website directly bound to your SIS Admissions, Faculty directory, and Calendar modules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Eye className="w-4 h-4" />}
            onClick={onPreviewWebsite}
          >
            Preview Live School Website
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Site Settings */}
        <Card padding="md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Hero Section & Visual Identity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Public portal front-page text and branding</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Site Published</span>
              </label>
              <Badge variant={isPublished ? 'success' : 'neutral'}>
                {isPublished ? 'Live on Web' : 'Draft Mode'}
              </Badge>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Website Title"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                required
              />
              <Input
                label="Custom School Domain"
                placeholder="www.schoolname.edu"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
              />
            </div>

            <Input
              label="Institution Tagline / Motto"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />

            <Input
              label="Hero Headline Banner"
              value={heroHeading}
              onChange={(e) => setHeroHeading(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Hero Subheading / Welcome Narrative
              </label>
              <textarea
                value={heroSubheading}
                onChange={(e) => setHeroSubheading(e.target.value)}
                rows={3}
                className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 text-sm rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
            {isSaved ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Published to school domain successfully!
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-mono">
                Changes propagate immediately without site rebuild.
              </span>
            )}
            <Button size="sm" variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
              Save Website Configuration
            </Button>
          </div>
        </Card>

        {/* Live Module Data Bindings Matrix */}
        <Card padding="md">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100">Live ACADEEMIA Module Bindings</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Information on the public website is piped directly from your operational modules, eliminating double data entry.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-850 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admissions Inquiries Form</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Web visitors submitting prospective applications are written directly into the Admissions & Inquiries database table.
              </p>
              <div className="text-[10px] font-mono text-emerald-400 pt-1">
                ✓ Active Pipeline Bound
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-850 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Faculty Directory</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Public staff profiles, subject specializations, and departmental heads are synced automatically from the Human Resources module.
              </p>
              <div className="text-[10px] font-mono text-emerald-400 pt-1">
                ✓ Synced from HR
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-850 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Institution Calendar</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Upcoming academic events, sports tournaments, and parent seminars feed live into the website events widget.
              </p>
              <div className="text-[10px] font-mono text-emerald-400 pt-1">
                ✓ Synced from Events
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};
