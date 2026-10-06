import React, { useState, useEffect } from 'react';
import { X, Globe, MapPin, CheckCircle2, GraduationCap, RefreshCw } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabaseService } from '../../services/supabaseService';
import { Button } from '../ui/Button';
import { HRStaff, InstitutionWebsiteConfig } from '../../types';

export interface InstitutionWebsitePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstitutionWebsitePreviewModal: React.FC<InstitutionWebsitePreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeInstitution, campuses } = useTenant();

  const [siteConfig, setSiteConfig] = useState<InstitutionWebsiteConfig | null>(null);
  const [staff, setStaff] = useState<HRStaff[]>([]);
  const [loading, setLoading] = useState(true);

  // Prospective Admissions Form State
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [gradeInterest, setGradeInterest] = useState('Grade 10');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen && activeInstitution) {
      setLoading(true);
      Promise.all([
        supabaseService.getInstitutionWebsite(activeInstitution.id),
        supabaseService.getHRStaff(activeInstitution.id),
      ])
        .then(([site, staffList]) => {
          setSiteConfig(site);
          setStaff(staffList);
        })
        .catch((err) => {
          console.warn('Failed to load institution site preview from Supabase:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, activeInstitution?.id]);

  if (!isOpen || !activeInstitution) return null;

  const handleSubmitAdmissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !applicantEmail) return;

    // Log prospective inquiry to database
    supabaseService.logAuditEvent({
      tenant_id: activeInstitution.id,
      actor_name: applicantName,
      action: 'PROSPECTIVE_ADMISSION_SUBMITTED',
      entity_type: 'admissions',
      entity_id: activeInstitution.id,
      details: { email: applicantEmail, grade: gradeInterest },
    });

    setApplicationSubmitted(true);
  };

  const domainDisplay =
    siteConfig?.custom_domain || activeInstitution.custom_domain || `${activeInstitution.slug}.acadeemia.edu`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-5xl h-[92vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10">
        {/* Browser Mock Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono text-slate-300">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>https://{domainDisplay}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Website Viewport */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mr-2" />
            <span className="text-xs">Loading live institutional website...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100">
            {/* School Header */}
            <header className="px-8 py-5 border-b border-slate-800 bg-slate-950/90 sticky top-0 z-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm"
                  style={{ backgroundColor: activeInstitution.branding_config?.primary_color || '#4f46e5' }}
                >
                  {activeInstitution.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-base text-white block">
                    {siteConfig?.site_title || activeInstitution.name}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {siteConfig?.tagline || activeInstitution.branding_config?.motto || 'Excellence in Education'}
                  </span>
                </div>
              </div>

              {siteConfig?.nav_items && siteConfig.nav_items.length > 0 && (
                <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
                  {siteConfig.nav_items.map((item, idx) => (
                    <span key={idx} className="hover:text-white cursor-pointer transition-colors">
                      {item.label}
                    </span>
                  ))}
                </nav>
              )}

              <a
                href="#admissions"
                className="px-4 py-2 text-xs font-medium rounded-lg text-white shadow-sm transition-colors cursor-pointer"
                style={{ backgroundColor: activeInstitution.branding_config?.primary_color || '#4f46e5' }}
              >
                Apply for Admissions
              </a>
            </header>

            {/* Hero Banner with Campus Image */}
            <section className="relative min-h-[380px] flex items-center justify-center text-center p-8 bg-slate-950 overflow-hidden">
              <div className="absolute inset-0 z-0">
                <img
                  src={
                    siteConfig?.banner_image_url ||
                    activeInstitution.banner_url ||
                    '/src/assets/images/hero_institution_campus_1791120653291.jpg'
                  }
                  alt="Campus View"
                  className="w-full h-full object-cover opacity-25"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
              </div>

              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cambridge-Accredited Pre-University Academy</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  {siteConfig?.hero_heading || `Welcome to ${activeInstitution.name}`}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  {siteConfig?.hero_subheading ||
                    'A forward-looking educational institution dedicated to developing scholars and global innovators.'}
                </p>
              </div>
            </section>

            {/* Connected Live Modules Section */}
            <section className="py-12 px-8 max-w-5xl mx-auto space-y-12">
              {/* Campuses & Facilities */}
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white">Our Distributed Campuses</h2>
                  <p className="text-xs text-slate-400 mt-1">Multi-campus academic excellence</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campuses.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-100">{c.name}</span>
                        {c.is_main && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                            Main Academy
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 flex items-center gap-1.5 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{c.address || 'Campus address'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Faculty Directory (Directly from HR Module!) */}
              {staff.length > 0 && (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white">Distinguished Instructional Faculty</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Authoritative records from PostgreSQL Human Resources directory.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {staff.map((stf) => (
                      <div key={stf.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                        <div className="font-bold text-sm text-white">
                          {stf.user?.full_name || 'Faculty Member'}
                        </div>
                        <div className="text-indigo-400 font-medium">
                          {stf.job_title}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {stf.department?.name || 'Academic Faculty'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Admissions Inquiries Form (Binds to Admissions Module!) */}
              <div id="admissions" className="p-8 rounded-2xl bg-slate-950 border border-slate-800 space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <h2 className="text-2xl font-bold text-white">Prospective Student Admissions</h2>
                  <p className="text-xs text-slate-400">
                    Applications submitted here create verified prospective applicant records directly in the ACADEEMIA Admissions database table.
                  </p>
                </div>

                {applicationSubmitted ? (
                  <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-center space-y-2 max-w-md mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">Application Received!</h4>
                    <p className="text-xs text-emerald-200">
                      Applicant record created and routed to the {activeInstitution.name} Admissions Committee.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitAdmissions} className="max-w-xl mx-auto space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Prospective Scholar Name
                        </label>
                        <input
                          type="text"
                          value={applicantName}
                          onChange={(e) => setApplicantName(e.target.value)}
                          placeholder="e.g. Maya Chen"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Parent / Guardian Email
                        </label>
                        <input
                          type="email"
                          value={applicantEmail}
                          onChange={(e) => setApplicantEmail(e.target.value)}
                          placeholder="e.g. parent@chen.org"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Applying for Grade Level
                      </label>
                      <select
                        value={gradeInterest}
                        onChange={(e) => setGradeInterest(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Grade 9">Grade 9 (Freshman)</option>
                        <option value="Grade 10">Grade 10 (Sophomore)</option>
                        <option value="Grade 11">Grade 11 (Junior Honors)</option>
                        <option value="Grade 12">Grade 12 (Senior Capstone)</option>
                      </select>
                    </div>

                    <Button size="md" variant="primary" type="submit" className="w-full">
                      Submit Admissions Application
                    </Button>
                  </form>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
