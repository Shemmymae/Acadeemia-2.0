import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Phone, Shield, Save, CheckCircle2, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../services/supabaseService';

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { authUser, appProfile, platformMembership, institutionMemberships } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && authUser) {
      setFullName(appProfile?.full_name || '');
      setPhone(appProfile?.phone || '');
      setAvatarUrl(appProfile?.avatar_url || '');
      setSaveSuccess(false);
      setErrorMessage(null);

      // Fetch fresh profile from database
      supabaseService.getUserProfile(authUser.id).then((fresh) => {
        if (fresh) {
          setFullName(fresh.full_name || '');
          setPhone(fresh.phone || '');
          setAvatarUrl(fresh.avatar_url || '');
        }
      }).catch((e) => {
        console.warn('Failed to fetch fresh profile:', e);
      });
    }
  }, [isOpen, authUser, appProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      await supabaseService.updateUserProfile(authUser.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setErrorMessage(err.message || 'Database rejected profile update');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Identity & Profile"
      subtitle="Manage your personal profile in ACADEEMIA 2.0 PostgreSQL database"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {saveSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Profile successfully updated in public.users database!</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/60 text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Read-Only Account Identity */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
            <span>Account UUID</span>
            <span className="text-slate-200 select-all">{authUser?.id || 'Anonymous'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Auth Email</span>
            <span className="text-indigo-300 font-medium">{authUser?.email || 'N/A'}</span>
          </div>
          {platformMembership && (
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Platform Role</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-mono border border-purple-800/40">
                {platformMembership.role}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Active Institutions</span>
            <span className="text-slate-200">{institutionMemberships.length} associated</span>
          </div>
        </div>

        {/* Editable Profile Fields */}
        <div className="space-y-3 pt-2">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Dr. Jane Doe"
            required
          />

          <Input
            label="Contact Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +1 555-0199"
          />

          <Input
            label="Avatar Photo URL"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSaving}
            icon={isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          >
            {isSaving ? 'Saving to Database...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
