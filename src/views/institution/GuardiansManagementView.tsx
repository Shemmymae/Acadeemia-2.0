import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Shield,
  HeartPulse,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  Link as LinkIcon,
  GraduationCap,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabaseService } from '../../services/supabaseService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Guardian, Student } from '../../types';

export const GuardiansManagementView: React.FC = () => {
  const { activeInstitution } = useTenant();

  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Guardian Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [relationshipType, setRelationshipType] = useState('mother');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [isEmergencyContact, setIsEmergencyContact] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Link Guardian to Scholar Modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [targetGuardian, setTargetGuardian] = useState<Guardian | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [canPickup, setCanPickup] = useState(true);
  const [receivesBilling, setReceivesBilling] = useState(true);

  // Edit Guardian Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);

  // Delete Guardian Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingGuardian, setDeletingGuardian] = useState<Guardian | null>(null);

  const loadData = useCallback(async () => {
    if (!activeInstitution) return;
    setLoading(true);
    setError(null);
    try {
      const [gList, sList] = await Promise.all([
        supabaseService.getGuardians(activeInstitution.id),
        supabaseService.getStudents(activeInstitution.id),
      ]);
      setGuardians(gList);
      setStudents(sList);
    } catch (err: any) {
      console.error('Failed to load guardians:', err);
      setError(err.message || 'Failed to load guardians from database');
    } finally {
      setLoading(false);
    }
  }, [activeInstitution?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !activeInstitution) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await supabaseService.createGuardian({
        institution_id: activeInstitution.id,
        full_name: fullName.trim(),
        relationship_type: relationshipType,
        email: email.trim() || undefined,
        phone: phone.trim(),
        address: address.trim() || undefined,
        occupation: occupation.trim() || undefined,
        is_emergency_contact: isEmergencyContact,
      });

      await loadData();
      setCreateModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Guardian creation error:', err);
      setFormError(err.message || 'Database rejected guardian creation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuardian || !fullName.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await supabaseService.updateGuardian(editingGuardian.id, {
        full_name: fullName.trim(),
        relationship_type: relationshipType,
        email: email.trim() || undefined,
        phone: phone.trim(),
        address: address.trim() || undefined,
        occupation: occupation.trim() || undefined,
        is_emergency_contact: isEmergencyContact,
      });

      await loadData();
      setEditModalOpen(false);
      setEditingGuardian(null);
      resetForm();
    } catch (err: any) {
      console.error('Guardian update error:', err);
      setFormError(err.message || 'Database rejected guardian update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkScholar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetGuardian || !selectedStudentId) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await supabaseService.linkStudentGuardian({
        student_id: selectedStudentId,
        guardian_id: targetGuardian.id,
        is_primary: isPrimary,
        can_pickup: canPickup,
        receives_billing: receivesBilling,
      });

      await loadData();
      setLinkModalOpen(false);
      setTargetGuardian(null);
      setSelectedStudentId('');
    } catch (err: any) {
      console.error('Link scholar error:', err);
      setFormError(err.message || 'Database rejected guardian link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGuardian = async () => {
    if (!deletingGuardian) return;
    setIsSubmitting(true);
    try {
      await supabaseService.deleteGuardian(deletingGuardian.id);
      await loadData();
      setDeleteModalOpen(false);
      setDeletingGuardian(null);
    } catch (err: any) {
      console.error('Delete guardian error:', err);
      setError(err.message || 'Database rejected guardian deletion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (g: Guardian) => {
    setEditingGuardian(g);
    setFullName(g.full_name);
    setRelationshipType(g.relationship_type);
    setEmail(g.email || '');
    setPhone(g.phone);
    setAddress(g.address || '');
    setOccupation(g.occupation || '');
    setIsEmergencyContact(g.is_emergency_contact);
    setFormError(null);
    setEditModalOpen(true);
  };

  const openLinkModal = (g: Guardian) => {
    setTargetGuardian(g);
    setSelectedStudentId(students[0]?.id || '');
    setIsPrimary(true);
    setCanPickup(true);
    setReceivesBilling(true);
    setFormError(null);
    setLinkModalOpen(true);
  };

  const resetForm = () => {
    setFullName('');
    setRelationshipType('mother');
    setEmail('');
    setPhone('');
    setAddress('');
    setOccupation('');
    setIsEmergencyContact(true);
    setFormError(null);
  };

  if (!activeInstitution) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Active Educational Institution</h3>
        <p className="text-xs text-slate-400">Select an authorized institution to view guardian relationships.</p>
      </div>
    );
  }

  const filteredGuardians = guardians.filter((g) => {
    const q = searchQuery.toLowerCase();
    return (
      g.full_name.toLowerCase().includes(q) ||
      g.phone.toLowerCase().includes(q) ||
      (g.email && g.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Guardians & Family Contacts
            </h1>
            <Badge variant="info">{guardians.length} Guardians</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authoritative guardian registry, billing contacts, and emergency pickup authorizations for <span className="text-slate-200 font-semibold">{activeInstitution.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
          >
            New Guardian
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

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guardians by name, phone, or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Guardians Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Guardian Contact</th>
                <th className="px-6 py-3.5">Relationship</th>
                <th className="px-6 py-3.5">Phone & Email</th>
                <th className="px-6 py-3.5">Emergency Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredGuardians.map((g) => (
                <tr key={g.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {g.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{g.full_name}</div>
                        {g.occupation && (
                          <div className="text-[11px] text-slate-400">{g.occupation}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="capitalize font-medium text-slate-300 px-2 py-0.5 rounded bg-slate-850 border border-slate-800">
                      {g.relationship_type}
                    </span>
                  </td>

                  <td className="px-6 py-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {g.phone}
                    </div>
                    {g.email && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {g.email}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {g.is_emergency_contact ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                        <HeartPulse className="w-3 h-3" /> Emergency Contact
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Standard Contact</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openLinkModal(g)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="Link to Scholar"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(g)}
                        className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="Edit Guardian"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingGuardian(g);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="Delete Guardian"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredGuardians.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching guardians found in institutional database.
            </div>
          )}
        </div>
      </Card>

      {/* CREATE GUARDIAN MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register Guardian / Parent Contact"
      >
        <form onSubmit={handleCreateGuardian} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Helena Vance"
              required
            />
            <Select
              label="Relationship Type *"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              options={[
                { value: 'mother', label: 'Mother' },
                { value: 'father', label: 'Father' },
                { value: 'guardian', label: 'Legal Guardian' },
                { value: 'sponsor', label: 'Financial Sponsor' },
                { value: 'grandparent', label: 'Grandparent' },
                { value: 'relative', label: 'Other Family Relative' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary Phone Number *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 711 000 000"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="helena@example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Occupation / Employer"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Pediatric Physician"
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="emergencyCreate"
                checked={isEmergencyContact}
                onChange={(e) => setIsEmergencyContact(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="emergencyCreate" className="text-xs text-slate-300 font-medium">
                Designate as Emergency Contact
              </label>
            </div>
          </div>

          <Input
            label="Residential Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 104 Westlands Rd, Apt 4B"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register Guardian'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* LINK GUARDIAN TO SCHOLAR MODAL */}
      <Modal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="Link Guardian to Scholar"
      >
        <form onSubmit={handleLinkScholar} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
            <span className="text-slate-400">Guardian Contact:</span>
            <div className="font-bold text-white text-sm">
              {targetGuardian?.full_name} ({targetGuardian?.relationship_type})
            </div>
          </div>

          <Select
            label="Select Scholar / Student *"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            options={students.map((s) => ({
              value: s.id,
              label: `${s.first_name} ${s.last_name} (${s.student_number})`,
            }))}
            required
          />

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2.5 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Primary / Custodial Guardian</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={canPickup}
                onChange={(e) => setCanPickup(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Authorized for Campus Pickup</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={receivesBilling}
                onChange={(e) => setReceivesBilling(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Receives Tuition & Fee Billing Invoices</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Linking...' : 'Confirm Relationship Link'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT GUARDIAN MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Guardian Details"
      >
        <form onSubmit={handleEditGuardian} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Select
              label="Relationship Type *"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              options={[
                { value: 'mother', label: 'Mother' },
                { value: 'father', label: 'Father' },
                { value: 'guardian', label: 'Legal Guardian' },
                { value: 'sponsor', label: 'Financial Sponsor' },
                { value: 'grandparent', label: 'Grandparent' },
                { value: 'relative', label: 'Other Family Relative' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary Phone Number *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="emergencyEdit"
                checked={isEmergencyContact}
                onChange={(e) => setIsEmergencyContact(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="emergencyEdit" className="text-xs text-slate-300 font-medium">
                Designate as Emergency Contact
              </label>
            </div>
          </div>

          <Input
            label="Residential Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Remove Guardian Record"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Are you sure you want to delete guardian{' '}
            <strong className="text-white">{deletingGuardian?.full_name}</strong>?
          </p>
          <p className="text-xs text-amber-400 bg-amber-950/30 p-3 rounded-lg border border-amber-800/30">
            All student-guardian relationship linkages will be removed in accordance with PostgreSQL cascade rules.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGuardian} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete Guardian'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
