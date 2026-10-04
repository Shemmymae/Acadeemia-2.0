import React, { useState } from 'react';
import { DollarSign, Receipt, Plus, CheckCircle2, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { tenantStore } from '../../services/tenantStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { InvoiceStatus } from '../../types';

export const FinanceBillingView: React.FC = () => {
  const { activeInstitution } = useTenant();
  const terminology = activeInstitution.terminology_config;

  const [modalOpen, setModalOpen] = useState(false);
  const feeStructures = tenantStore.getFeeStructures(activeInstitution.id);
  const invoices = tenantStore.getInvoices(activeInstitution.id);
  const students = tenantStore.getStudents(activeInstitution.id);

  // New Invoice Form
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [amountDollars, setAmountDollars] = useState('4850');
  const [dueDate, setDueDate] = useState('2026-11-15');

  // Summary Metrics
  const totalBilled = invoices.reduce((sum, i) => sum + i.total_amount_cents, 0);
  const totalBalance = invoices.reduce((sum, i) => sum + i.balance_cents, 0);
  const totalCollected = totalBilled - totalBalance;

  const handleIssueInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !amountDollars) return;

    tenantStore.createInvoice(activeInstitution.id, {
      student_id: selectedStudentId,
      total_amount_cents: Math.round(parseFloat(amountDollars) * 100),
      balance_cents: Math.round(parseFloat(amountDollars) * 100),
      status: 'issued',
      due_date: dueDate,
    });

    setModalOpen(false);
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
            Modular fee structures, student ledgers, installment schedules, and real-time payment reconciliation.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setModalOpen(true)}
        >
          Issue Student Invoice
        </Button>
      </div>

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
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-indigo-300 font-medium">
                    {inv.invoice_number}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="font-semibold text-slate-100">
                      {inv.student ? `${inv.student.first_name} ${inv.student.last_name}` : 'Scholar'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {inv.student?.student_number}
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Issue Invoice Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Issue Student Fee Invoice"
        subtitle="Generates an official institutional billing statement."
      >
        <form onSubmit={handleIssueInvoice} className="space-y-4">
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
            <Button size="sm" variant="ghost" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Issue Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
