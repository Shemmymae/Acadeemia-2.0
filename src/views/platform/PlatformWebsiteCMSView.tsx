import React, { useState } from 'react';
import { Globe, Save, ExternalLink, Check, Eye } from 'lucide-react';
import { tenantStore } from '../../services/tenantStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { PlatformWebsiteConfig } from '../../types';

export interface PlatformWebsiteCMSViewProps {
  onPreviewPublicPortal: () => void;
}

export const PlatformWebsiteCMSView: React.FC<PlatformWebsiteCMSViewProps> = ({
  onPreviewPublicPortal,
}) => {
  const [websiteConfig, setWebsiteConfig] = useState<PlatformWebsiteConfig>(() =>
    tenantStore.getPlatformWebsite()
  );
  const [heroTitle, setHeroTitle] = useState(websiteConfig.hero_title);
  const [heroSubtitle, setHeroSubtitle] = useState(websiteConfig.hero_subtitle);
  const [domain, setDomain] = useState(websiteConfig.domain);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = tenantStore.updatePlatformWebsite({
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      domain,
    });
    setWebsiteConfig(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            ACADEEMIA Public Website & CMS Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage the global public SaaS portal: solutions, product marketing copy, packages, and thought leadership articles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Eye className="w-4 h-4" />}
            onClick={onPreviewPublicPortal}
          >
            Preview Live Public Website
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Site Settings */}
        <Card padding="md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Hero Section & Positioning</h2>
              <p className="text-xs text-slate-400 mt-0.5">Headline and value proposition displayed on acadeemia.com</p>
            </div>
            <Badge variant="success">Published & Live</Badge>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Primary Domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">CMS Status</label>
                <div className="py-2 text-xs text-slate-300 font-mono">
                  Production Cluster · SSL Active
                </div>
              </div>
            </div>

            <Input
              label="Primary Hero Headline"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Hero Subheading / Value Narrative
              </label>
              <textarea
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                rows={3}
                className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 text-sm rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
            {isSaved ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Changes published live to acadeemia.com!
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-mono">Unpublished changes will reflect immediately upon saving.</span>
            )}
            <Button size="sm" variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
              Publish Changes
            </Button>
          </div>
        </Card>

        {/* Public Marketing Articles & Thought Leadership */}
        <Card padding="md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Featured Thought Leadership Articles</h2>
              <p className="text-xs text-slate-400 mt-0.5">Articles visible in the public resources directory</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {websiteConfig.blog_articles.map((art, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-start justify-between gap-4 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{art.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{art.summary}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">Slug: /{art.slug} · {art.date}</div>
                </div>
                <Badge variant="neutral">Published</Badge>
              </div>
            ))}
          </div>
        </Card>
      </form>
    </div>
  );
};
