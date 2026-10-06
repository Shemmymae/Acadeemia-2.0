import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Receipt, Plus, CheckCircle2, Clock, AlertTriangle, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabaseService } from '../../services/supabaseService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FeeStructure, FinanceInvoice, InvoiceStatus, Student } from '../../types';

export const FinanceBillingView: React.FC = () => {
  const { activeInstitution } = useTenant();

  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amountDollars, setAmountDollars] = useState('4850');
  const [dueDate, setDueDate] = useState('2026-11-15');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadFinanceData = useCallback(async () => {
    if (!activeInstitution) return;
    setLoading(true);
    setError(null);
    try {
      const [invoiceList, feeList, studentList] = await Promise.all([
        supabaseService.getInvoices(activeInstitution.id),
        supabaseService.getFeeStructures(activeInstitution.id),
        supabaseService.getStudents(activeInstitution.id),
      ]);
      setInvoices(invoiceList);
      setFeeStructures(feeList);
      setStudents(studentList);
      if (studentList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studentList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load finance data from Supabase:', err);
      setError(err.message || 'Failed to load billing ledgers from database');
    } finally {
      setLoading(false);
    }
  }, [activeInstitution?.id]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  if (!activeInstitution) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Active Educational Institution</h3>
        <p className="text-xs text-slate-400">Select an authorized institution to view billing ledgers.</p>
      </div>
    );
  }

  const terminology = activeInstitution.terminology_config;

  // Summary Metrics
  const totalBilled = invoices.reduce((sum, i) => sum + i.total_amount_cents, 0);
  const totalBalance = invoices.reduce((sum, i) => sum + i.balance_cents, 0);
  const totalCollected = totalBilled - totalBalance;

  // Authoritative Database Mutation
  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !amountDollars || !activeInstitution) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const amountCents = Math.round(parseFloat(amountDollars) * 100);
      const codePrefix = activeInstitution.code.substring(0, 3).toUpperCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${codePrefix}-${randomSuffix}`;

      // Omit ID: let PostgreSQL generate authoritative UUID
      const newInvoice = await supabaseService.createInvoice({
        institution_id: activeInstitution.id,
        student_id: selectedStudentId,
        invoice_number: invoiceNumber,
        total_amount_cents: amountCents,
        balance_cents: amountCents,
        status: 'issued',
        due_date: dueDate,
      });

      // Match student object for UI display
      const linkedStudent = students.find((s) => s.id === selectedStudentId);
      const invoiceWithStudent = { ...newInvoice, student: linkedStudent };

      setInvoices((prev) => [invoiceWithStudent, ...prev]);
      setModalOpen(false);
    } catch (err: any) {
      console.error('Invoice creation error from database:', err);
      setSubmitError(err.message || 'Database rejected invoice creation. Check Row Level Security permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Fully Paid</Badge>;
      case 'partially_paid':
        return <Badge variant="warning">Partially Paid</Badge>;
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>;
      default:
        return <Badge variant="neutral">Issued</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Fees Collection & Student Invoicing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authoritative billing ledgers, installment schedules, and PostgreSQL RLS-protected finance data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => loadFinanceData()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setSubmitError(null);
              setModalOpen(true);
            }}
          >
            Issue Student Invoice
          </Button>
        </div>
      </div>

      {/* Database Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => loadFinanceData()}>
            Retry
          </Button>
        </div>
      )}

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Billed This Term
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
            ${(totalBilled / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {invoices.length} invoices generated
          </div>
        </Card>

        <Card padding="md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Realized Collections
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            ${(totalCollected / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">
            {totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0}% realization velocity
          </div>
        </Card>

        <Card padding="md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Outstanding Arrears
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums mt-1">
            ${(totalBalance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Across active student accounts
          </div>
        </Card>
      </div>

      {/* Invoices List */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Student Invoices & Fee Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct billing records linked to institutional student accounts.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Invoice Number</th>
                <th className="px-6 py-3">{terminology.student_label}</th>
                <th className="px-6 py-3">Total Amount</th>
                <th className="px-6 py-3">Outstanding Balance</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading authoritative invoices from PostgreSQL...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    No fee invoices found in database for this institution.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const linkedStudent = inv.student || students.find((s) => s.id === inv.student_id);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-indigo-300 font-medium">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-100">
                          {linkedStudent ? `${linkedStudent.first_name} ${linkedStudent.last_name}` : 'Scholar'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {linkedStudent?.student_number}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-mono tabular-nums font-semibold text-white">
                        ${(inv.total_amount_cents / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 font-mono tabular-nums text-slate-300">
                        ${(inv.balance_cents / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-400 text-[11px]">
                        {inv.due_date}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {getStatusBadge(inv.status)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Issue Invoice Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Issue Student Fee Invoice"
        subtitle="Generates an authoritative invoice in PostgreSQL with database UUID."
      >
        <form onSubmit={handleIssueInvoice} className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <Select
            label={`Select ${terminology.student_label}`}
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            options={students.map((s) => ({
              value: s.id,
              label: `${s.first_name} ${s.last_name} (${s.student_number})`,
            }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount ($ USD)"
              type="number"
              step="0.01"
              value={amountDollars}
              onChange={(e) => setAmountDollars(e.target.value)}
              required
            />
            <Input
              label="Payment Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              icon={isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
            >
              {isSubmitting ? 'Issuing in Database...' : 'Issue Invoice'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
