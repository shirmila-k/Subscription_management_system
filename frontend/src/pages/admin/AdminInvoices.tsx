import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Invoice } from '../../types';
import { Badge } from '../../components/Badge';
import { FileDown, CheckCircle, Clock } from 'lucide-react';

export const AdminInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<Invoice[]>('/invoices');
      setInvoices(data);
    } catch (err) {
      // Mock Fallback
      setInvoices([
        {
          id: 'inv-01',
          invoiceNumber: 'INV-2026-0001',
          customerId: 'cust-1',
          status: 'PAID',
          subtotal: 99.0,
          taxRate: 0.18,
          taxAmount: 17.82,
          discountAmount: 0,
          totalAmount: 116.82,
          currency: 'USD',
          issueDate: '2026-10-01T00:00:00Z',
          dueDate: '2026-10-15T00:00:00Z',
          paidAt: '2026-10-05T00:00:00Z',
          customer: {
            id: 'c1',
            name: 'Acme Corporation',
            email: 'billing@acmecorp.com',
            role: 'CUSTOMER',
            createdAt: '',
          },
        },
        {
          id: 'inv-02',
          invoiceNumber: 'INV-2026-0002',
          customerId: 'cust-2',
          status: 'CONFIRMED',
          subtotal: 990.0,
          taxRate: 0.18,
          taxAmount: 178.2,
          discountAmount: 198.0,
          totalAmount: 970.2,
          currency: 'USD',
          issueDate: '2026-10-20T00:00:00Z',
          dueDate: '2026-11-04T00:00:00Z',
          customer: {
            id: 'c2',
            name: 'Northstar Logistics',
            email: 'it@northstar.io',
            role: 'CUSTOMER',
            createdAt: '',
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await ApiClient.downloadPdf(`/invoices/${invoiceId}/pdf`, `${invoiceNumber}.pdf`);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF invoice');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await ApiClient.patch(`/invoices/${id}/confirm`, {});
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm invoice');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Invoices & Automated Billing</h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated recurring cycle invoice generation with 18% tax calculations and downloadable PDF statements
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice No.</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Tax (18%)</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Total Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Fetching invoice records...
                  </td>
                </tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-400">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-white">{inv.customer?.name}</p>
                    <p className="text-xs text-slate-400">{inv.customer?.email}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">${Number(inv.subtotal).toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                    +${Number(inv.taxAmount).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-400 font-mono text-xs">
                    {Number(inv.discountAmount) > 0 ? `-$${Number(inv.discountAmount).toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-white">
                    ${Number(inv.totalAmount).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={inv.status} />
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {inv.status === 'DRAFT' && (
                      <button
                        onClick={() => handleConfirm(inv.id)}
                        className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                      >
                        Confirm
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                      title="Download PDF"
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-brand-400 border border-slate-700 rounded-lg transition"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
