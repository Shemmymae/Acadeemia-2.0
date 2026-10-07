import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabaseService } from '../../services/supabaseService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Campus } from '../../types';

export const CampusesManagementView: React.FC = () => {
  const { activeInstitution, refreshTenantData, selectCampus, activeCampus } = useTenant();

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isMain, setIsMain] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [capacity, setCapacity] = useState(500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCampus, setDeletingCampus] = useState<Campus | null>(null);

  const loadCampuses = useCallback(async () => {
    if (!activeInstitution) return;
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseService.getCampuses(activeInstitution.id);
      setCampuses(data);
    } catch (err: any) {
      console.error('Failed to load campuses:', err);
      setError(err.message || 'Failed to load campuses from database');
    } finally {
      setLoading(false);
    }
  }, [activeInstitution?.id]);

  useEffect(() => {
    loadCampuses();
  }, [loadCampuses]);

  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !activeInstitution) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await supabaseService.createCampus({
        institution_id: activeInstitution.id,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        is_main: isMain,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        capacity: Number(capacity) || 500,
      });

      await loadCampuses();
      refreshTenantData();
      setCreateModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Campus creation error:', err);
      setFormError(err.message || 'Database rejected campus creation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampus || !name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await supabaseService.updateCampus(editingCampus.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        is_main: isMain,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        capacity: Number(capacity) || 500,
      });

      await loadCampuses();
      refreshTenantData();
      setEditModalOpen(false);
      setEditingCampus(null);
      resetForm();
    } catch (err: any) {
      console.error('Campus update error:', err);
      setFormError(err.message || 'Database rejected campus update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCampus = async () => {
    if (!deletingCampus) return;
    setIsSubmitting(true);
    try {
      await supabaseService.deleteCampus(deletingCampus.id);
      await loadCampuses();
      refreshTenantData();
      setDeleteModalOpen(false);
      setDeletingCampus(null);
    } catch (err: any) {
      console.error('Campus deletion error:', err);
      setError(err.message || 'Database rejected campus deletion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (c: Campus) => {
    setEditingCampus(c);
    setName(c.name);
    setCode(c.code);
    setIsMain(c.is_main);
    setAddress(c.address || '');
    setCity(c.city || '');
    setCountry(c.country || '');
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setCapacity(c.capacity || 500);
    setFormError(null);
    setEditModalOpen(true);
  };

  const openDeleteModal = (c: Campus) => {
    setDeletingCampus(c);
    setDeleteModalOpen(true);
  };

  const resetForm = () => {
    setName('');
    setCode('');
    setIsMain(false);
    setAddress('');
    setCity('');
    setCountry('');
    setPhone('');
    setEmail('');
    setCapacity(500);
    setFormError(null);
  };

  if (!activeInstitution) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Active Educational Institution</h3>
        <p className="text-xs text-slate-400">Select an authorized institution to manage physical campuses.</p>
      </div>
    );
  }

  const filteredCampuses = campuses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Campuses & Institutional Sites
            </h1>
            <Badge variant="info">{campuses.length} Campuses</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Physical branches and academic site management for <span className="text-slate-200 font-semibold">{activeInstitution.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadCampuses}
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
            New Campus
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
            placeholder="Search campuses by name or code..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Campus Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampuses.map((c) => {
          const isSelected = activeCampus?.id === c.id;
          return (
            <Card
              key={c.id}
              padding="none"
              className={`flex flex-col justify-between overflow-hidden transition-all border ${
                isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">{c.name}</h3>
                      {c.is_main && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                          Main Campus
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-indigo-400 font-semibold">{c.code}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-md transition-colors"
                      title="Edit Campus"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!c.is_main && (
                      <button
                        onClick={() => openDeleteModal(c)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="Delete Campus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  {c.address && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{c.address}{c.city ? `, ${c.city}` : ''}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-850">
                    <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Capacity: <strong className="text-slate-200">{c.capacity}</strong> students</span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-5 py-3 bg-slate-950/40 border-t border-slate-850 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {isSelected ? 'Active Scope' : 'Physical Node'}
                </span>
                <Button
                  size="sm"
                  variant={isSelected ? 'secondary' : 'ghost'}
                  onClick={() => selectCampus(isSelected ? null : c.id)}
                  className="text-xs"
                >
                  {isSelected ? 'Reset to All' : 'Filter Scope'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredCampuses.length === 0 && !loading && (
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20 space-y-2">
          <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No Campuses Found</h3>
          <p className="text-xs text-slate-400">Add physical campuses to manage multiple branches.</p>
        </div>
      )}

      {/* CREATE CAMPUS MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Physical Campus"
      >
        <form onSubmit={handleCreateCampus} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Campus Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Campus"
              required
            />
            <Input
              label="Code / Acronym *"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. NC"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Nairobi"
            />
            <Input
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Kenya"
            />
          </div>

          <Input
            label="Street Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 42 Academy Way, Karen"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 700 000 000"
            />
            <Input
              label="Contact Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="campus@academy.edu"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Student Capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              placeholder="500"
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isMainCreate"
                checked={isMain}
                onChange={(e) => setIsMain(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isMainCreate" className="text-xs text-slate-300 font-medium">
                Designate as Primary Campus
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating in PostgreSQL...' : 'Create Campus'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT CAMPUS MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Campus Details"
      >
        <form onSubmit={handleEditCampus} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Campus Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Code / Acronym *"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          <Input
            label="Street Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Contact Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Student Capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isMainEdit"
                checked={isMain}
                onChange={(e) => setIsMain(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isMainEdit" className="text-xs text-slate-300 font-medium">
                Designate as Primary Campus
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving to Database...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Campus Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Are you sure you want to delete campus{' '}
            <strong className="text-white">{deletingCampus?.name} ({deletingCampus?.code})</strong>?
          </p>
          <p className="text-xs text-amber-400/90 bg-amber-950/40 p-3 rounded-lg border border-amber-800/40">
            Note: PostgreSQL will prevent deletion if scholars, faculty, or classes are assigned to this campus node.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCampus}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Campus'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
