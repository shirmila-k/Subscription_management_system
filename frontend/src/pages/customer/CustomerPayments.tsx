import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services';
import { Payment } from '../../types';

export const CustomerPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCustomerPayments = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await paymentService.getAll();
      setPayments(data || []);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to retrieve your payment history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerPayments();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#7B2082] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Customer Self-Service</span>
            <span>•</span>
            <span>Settlement History</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1926] tracking-tight">Payment Receipts &amp; Ledger</h1>
          <p className="text-sm text-[#736B7C] mt-0.5">
            Verified electronic fund transfers, gateway settlements, and reconciled subscription debits.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={loadCustomerPayments} className="text-xs font-semibold uppercase underline">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E7E2EC] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-[#736B7C]">
            <span className="material-symbols-outlined animate-spin text-[32px] text-[#7B2082] mb-2">
              progress_activity
            </span>
            <p className="text-sm">Loading verified payment settlements...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-[#736B7C]">
            <span className="material-symbols-outlined text-[48px] text-[#C2BDC9] mb-2">payments</span>
            <p className="text-base font-semibold text-[#1E1926]">No payments on record</p>
            <p className="text-xs text-[#736B7C] max-w-sm mx-auto mt-1">
              Your payments and transaction receipts will be displayed here once processed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FAF9FB] border-b border-[#E7E2EC]">
                <tr>
                  <th className="py-2.5 px-5 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Receipt Ref
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Invoice No.
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Bank Reference / UTR
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Date &amp; Time
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-right">
                    Amount Paid
                  </th>
                  <th className="py-2.5 px-5 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#1E1926] divide-y divide-[#E7E2EC]">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF9FB] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#7B2082] font-mono">{p.paymentNumber}</td>
                    <td className="py-3.5 px-4 text-[#7B2082] font-semibold font-mono">
                      {p.invoice?.invoiceNumber || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-medium">{p.paymentMethod}</td>
                    <td className="py-3.5 px-4 font-mono text-[#736B7C]">
                      {p.transactionReference || 'Direct debit'}
                    </td>
                    <td className="py-3.5 px-4 text-[#736B7C]">
                      {new Date(p.paymentDate).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#1E1926]">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'REFUNDED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
