import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Shield,
  Building2,
  Mail,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { InstitutionRole, InstitutionUser } from '../../types';

const ROLE_OPTIONS: { value: InstitutionRole; label: string }[] = [
  { value: 'institution_admin', label: 'Institution Administrator' },
  { value: 'principal', label: 'Principal / Headmaster' },
  { value: 'school_admin', label: 'School Office Admin' },
  { value: 'teacher', label: 'Academic Faculty / Teacher' },
  { value: 'accountant', label: 'Bursar / Accountant' },
  { value: 'hr_manager', label: 'HR & Personnel Officer' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'transport_manager', label: 'Fleet & Transport Manager' },
  { value: 'hostel_manager', label: 'Hostel & Boarding Warden' },
  { value: 'receptionist', label: 'Front Office / Receptionist' },
];

export const InstitutionUsersView: React.FC = () => {
  const { activeInstitution, campuses } = useTenant();
  const { authUser, isPlatformAdmin } = useAuth();

  const [members, setMembers] = useState<InstitutionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Add Member Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<InstitutionRole>('teacher');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Member Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<InstitutionUser | null>(null);

  // Delete Member Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<InstitutionUser | null>(null);

  const loadMembers = useCallback(async () => {
    if (!activeInstitution) return;
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseService.getInstitutionUsers(activeInstitution.id);
      setMembers(data);
    } catch (err: any) {
      console.error('Failed to load institution users:', err);
      setError(err.message || 'Failed to load membership records from database');
    } finally {
      setLoading(false);
    }
  }, [activeInstitution?.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim() || !activeInstitution) return;

    setIsSubmitting(true);
    setFormError(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      let targetUserId: string | null = null;

      if (isSupabaseConfigured && supabase) {
        // 1. Look up if user already exists in public.users
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, email, full_name')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existingUser) {
          targetUserId = existingUser.id;
        } else if (isPlatformAdmin) {
          // Platform admin can create the user profile directly
          const newId = crypto.randomUUID();
          const { data: newUser, error: createErr } = await supabase
            .from('users')
            .insert({
              id: newId,
              email: cleanEmail,
              full_name: fullName.trim(),
            })
            .select()
            .single();

          if (createErr || !newUser) {
            throw new Error(createErr?.message || 'Failed to create user record');
          }
          targetUserId = newUser.id;
        } else {
          throw new Error(
            `No registered user found with email "${cleanEmail}". In ACADEEMIA 2.0, users must first register an account before an institution administrator can assign them a campus role.`
          );
        }
      } else {
        targetUserId = crypto.randomUUID();
      }

      if (!targetUserId) {
        throw new Error('Target user ID could not be determined');
      }

      await supabaseService.createInstitutionUser({
        institution_id: activeInstitution.id,
        user_id: targetUserId,
        campus_id: selectedCampusId || undefined,
        role: selectedRole,
        custom_permissions: [],
        is_active: true,
        user: {
          id: targetUserId,
          email: cleanEmail,
          full_name: fullName.trim(),
          is_platform_user: false,
          created_at: new Date().toISOString(),
        },
      });

      await loadMembers();
      setAddModalOpen(false);
      setEmail('');
      setFullName('');
      setSelectedRole('teacher');
      setSelectedCampusId('');
    } catch (err: any) {
      console.error('Add member error:', err);
      setFormError(err.message || 'Database rejected membership creation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await supabaseService.updateInstitutionUser(editingMember.id, {
        role: selectedRole,
        campus_id: selectedCampusId || undefined,
      });

      await loadMembers();
      setEditModalOpen(false);
      setEditingMember(null);
    } catch (err: any) {
      console.error('Update member error:', err);
      setFormError(err.message || 'Database rejected membership update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (m: InstitutionUser) => {
    try {
      await supabaseService.updateInstitutionUser(m.id, {
        is_active: !m.is_active,
      });
      await loadMembers();
    } catch (err: any) {
      console.error('Toggle status error:', err);
      setError(err.message || 'Failed to toggle membership status');
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setIsSubmitting(true);
    try {
      await supabaseService.deleteInstitutionUser(deletingMember.id);
      await loadMembers();
      setDeleteModalOpen(false);
      setDeletingMember(null);
    } catch (err: any) {
      console.error('Delete member error:', err);
      setError(err.message || 'Database rejected membership removal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (m: InstitutionUser) => {
    setEditingMember(m);
    setSelectedRole(m.role);
    setSelectedCampusId(m.campus_id || '');
    setFormError(null);
    setEditModalOpen(true);
  };

  const openDeleteModal = (m: InstitutionUser) => {
    setDeletingMember(m);
    setDeleteModalOpen(true);
  };

  if (!activeInstitution) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Active Educational Institution</h3>
        <p className="text-xs text-slate-400">Select an authorized institution to view member rosters.</p>
      </div>
    );
  }

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = m.user?.full_name?.toLowerCase().includes(q) || false;
    const emailMatch = m.user?.email?.toLowerCase().includes(q) || false;
    const roleMatch = roleFilter === 'all' || m.role === roleFilter;
    return (nameMatch || emailMatch) && roleMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Users & Role Governance
            </h1>
            <Badge variant="info">{members.length} Members</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authoritative institutional RBAC, faculty credentials, and campus scoping for <span className="text-slate-200 font-semibold">{activeInstitution.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadMembers}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setFormError(null);
              setAddModalOpen(true);
            }}
          >
            Add Member
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by full name or email address..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="w-full sm:w-60">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Role Categories' },
              ...ROLE_OPTIONS,
            ]}
          />
        </div>
      </div>

      {/* Members Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">User Identity</th>
                <th className="px-6 py-3.5">Institutional Role</th>
                <th className="px-6 py-3.5">Campus Scope</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredMembers.map((m) => {
                const campus = campuses.find((c) => c.id === m.campus_id);
                const isOwner = m.role === 'institution_owner';
                return (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {m.user?.full_name ? m.user.full_name.charAt(0) : 'U'}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-200">
                            {m.user?.full_name || 'Registered Account'}
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {m.user?.email || 'user@acadeemia.internal'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          isOwner
                            ? 'warning'
                            : m.role.includes('admin')
                            ? 'info'
                            : 'neutral'
                        }
                      >
                        {m.role.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    <td className="px-6 py-4">
                      {campus ? (
                        <span className="font-medium text-slate-300 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          {campus.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">
                          ★ All Campuses (Global)
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(m)}
                        disabled={isOwner}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                          m.is_active
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60'
                            : 'bg-red-950/60 text-red-300 border-red-800/40 hover:bg-red-900/60'
                        }`}
                        title={isOwner ? 'Cannot toggle owner status' : 'Toggle membership status'}
                      >
                        {m.is_active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {m.is_active ? 'Active' : 'Suspended'}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          title="Edit Permissions / Scope"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isOwner && (
                          <button
                            onClick={() => openDeleteModal(m)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            title="Revoke Membership"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredMembers.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching institutional users found.
            </div>
          )}
        </div>
      </Card>

      {/* ADD MEMBER MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Invite / Assign Institutional Member"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Full Name *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Dr. Arthur Pendelton"
            required
          />

          <Input
            label="Work Email Address *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. arthur@academy.edu"
            required
          />

          <Select
            label="Institutional Role Assignment *"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as InstitutionRole)}
            options={ROLE_OPTIONS}
            required
          />

          <Select
            label="Campus Authorization Scope"
            value={selectedCampusId}
            onChange={(e) => setSelectedCampusId(e.target.value)}
            options={[
              { value: '', label: 'All Campuses (Consolidated Institution-Wide)' },
              ...campuses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
            ]}
          />

          <p className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            Assigned roles strictly enforce PostgreSQL Row-Level Security. Campus-scoped users are barred from cross-campus student records.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Membership...' : 'Grant Access'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MEMBER MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modify Membership & Role Scope"
      >
        <form onSubmit={handleEditMember} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
            <span className="text-slate-400">Target Member:</span>
            <div className="font-bold text-white text-sm">
              {editingMember?.user?.full_name} ({editingMember?.user?.email})
            </div>
          </div>

          <Select
            label="Institutional Role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as InstitutionRole)}
            options={ROLE_OPTIONS}
            required
          />

          <Select
            label="Campus Authorization Scope"
            value={selectedCampusId}
            onChange={(e) => setSelectedCampusId(e.target.value)}
            options={[
              { value: '', label: 'All Campuses (Consolidated Institution-Wide)' },
              ...campuses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
            ]}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Changes...' : 'Update Member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Revoke Institutional Access"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Are you sure you want to revoke membership for{' '}
            <strong className="text-white">
              {deletingMember?.user?.full_name} ({deletingMember?.user?.email})
            </strong>?
          </p>
          <p className="text-xs text-red-400 bg-red-950/30 p-3 rounded-lg border border-red-800/30">
            This immediately invalidates their database credentials for {activeInstitution.name} and revokes all RLS permissions.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember} disabled={isSubmitting}>
              {isSubmitting ? 'Revoking...' : 'Revoke Access'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
