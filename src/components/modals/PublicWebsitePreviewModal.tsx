import React, { useState, useEffect } from 'react';
import { X, Globe, Check, Sparkles, RefreshCw } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { Button } from '../ui/Button';
import { PlatformWebsiteConfig } from '../../types';

export interface PublicWebsitePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublicWebsitePreviewModal: React.FC<PublicWebsitePreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [website, setWebsite] = useState<PlatformWebsiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      supabaseService
        .getPlatformWebsite()
        .then((data) => {
          setWebsite(data);
        })
        .catch((err) => {
          console.warn('Failed to load public website config:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10">
        {/* Browser Mock Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono text-slate-300">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>https://{website?.domain || 'acadeemia.com'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Website Preview Viewport */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mr-2" />
            <span className="text-xs">Loading live portal preview...</span>
          </div>
        ) : website ? (
          <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100">
            {/* Public Navbar */}
            <header className="flex items-center justify-between px-8 py-5 border-b border-slate-900 sticky top-0 bg-slate-950/90 backdrop-blur-md z-20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                  A2
                </div>
                <span className="font-bold text-lg tracking-tight text-white">
                  ACADEEMIA <span className="text-indigo-400 font-normal">2.0</span>
                </span>
              </div>
              <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
                <span className="hover:text-white transition-colors cursor-pointer">Platform</span>
                <span className="hover:text-white transition-colors cursor-pointer">Solutions</span>
                <span className="hover:text-white transition-colors cursor-pointer">Modules</span>
                <span className="hover:text-white transition-colors cursor-pointer">Pricing</span>
                <span className="hover:text-white transition-colors cursor-pointer">Resources</span>
              </nav>
              <div className="flex items-center gap-3">
                <Button size="sm" variant="primary" onClick={onClose}>
                  Sign In to Console
                </Button>
              </div>
            </header>

            {/* Hero Section */}
            <section className="py-16 px-6 text-center max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-xs text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Multi-Tenant Education Operating System</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {website.hero_title}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                {website.hero_subtitle}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button size="md" variant="primary" onClick={onClose}>
                  Explore Institutional Portal
                </Button>
              </div>
            </section>

            {/* Pricing Plans Grid */}
            {website.pricing_plans && website.pricing_plans.length > 0 && (
              <section className="py-12 px-6 max-w-5xl mx-auto border-t border-slate-900">
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-white">Transparent, Modular Pricing</h2>
                  <p className="text-xs text-slate-400 mt-1">Scale from single academies to multi-campus university consortia.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {website.pricing_plans.map((plan, idx) => (
                    <div
                      key={idx}
                      className={`p-6 rounded-2xl border flex flex-col justify-between ${
                        idx === 1
                          ? 'bg-slate-900/90 border-indigo-600/80 shadow-xl shadow-indigo-950/30'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div>
                        <h3 className="font-bold text-sm text-white">{plan.name}</h3>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold font-mono text-white">{plan.price}</span>
                          <span className="text-xs text-slate-400">{plan.cadence}</span>
                        </div>
                        <div className="mt-6 space-y-2.5">
                          {plan.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-300">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-6 mt-6 border-t border-slate-850">
                        <Button
                          size="sm"
                          variant={idx === 1 ? 'primary' : 'outline'}
                          className="w-full"
                          onClick={onClose}
                        >
                          Select Plan
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400 text-xs">
            Portal configuration not available.
          </div>
        )}
      </div>
    </div>
  );
};
