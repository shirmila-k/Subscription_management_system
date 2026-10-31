import React, { useState } from 'react';

interface CustPayment {
  id: string;
  paymentRef: string;
  invoiceNo: string;
  method: string;
  transactionRef: string;
  date: string;
  amount: number;
  status: 'SUCCESS' | 'PROCESSING';
}

const CUSTOMER_PAYMENTS: CustPayment[] = [
  {
    id: 'pay-1',
    paymentRef: 'PAY-2024-8841',
    invoiceNo: 'INV-2024-1104',
    method: 'HDFC NetBanking e-Mandate',
    transactionRef: 'HD8820194821',
    date: '24 Oct 2024, 14:32 IST',
    amount: 420000,
    status: 'SUCCESS',
  },
  {
    id: 'pay-2',
    paymentRef: 'PAY-2024-8201',
    invoiceNo: 'INV-2024-1089',
    method: 'Corporate NetBanking',
    transactionRef: 'KKBK2489201192',
    date: '24 Sep 2024, 11:20 IST',
    amount: 420000,
    status: 'SUCCESS',
  },
  {
    id: 'pay-3',
    paymentRef: 'PAY-2024-7890',
    invoiceNo: 'INV-2024-1065',
    method: 'Corporate NetBanking',
    transactionRef: 'SBIN2401928341',
    date: '24 Aug 2024, 16:45 IST',
    amount: 420000,
    status: 'SUCCESS',
  },
];

export const CustomerPayments: React.FC = () => {
  const [payments] = useState<CustPayment[]>(CUSTOMER_PAYMENTS);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#84418A] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Customer Self-Service</span>
            <span>•</span>
            <span>Settlement History</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B] tracking-tight">Payment Receipts &amp; Ledger</h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Verified electronic fund transfers, gateway payouts, and reconciled subscription debits.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF9FB] border-b border-[#EAE5EC]">
              <tr>
                <th className="py-2.5 px-5 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Receipt Ref
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Invoice No.
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Bank Reference / UTR
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Date &amp; Time
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider text-right">
                  Amount Paid
                </th>
                <th className="py-2.5 px-5 text-[11px] font-semibold text-[#817986] uppercase tracking-wider text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#27212B] divide-y divide-[#EAE5EC]">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-[#FAF9FB] transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-[#6D286F] font-mono">{p.paymentRef}</td>
                  <td className="py-3.5 px-4 text-[#84418A] font-semibold font-mono">{p.invoiceNo}</td>
                  <td className="py-3.5 px-4 font-medium">{p.method}</td>
                  <td className="py-3.5 px-4 text-[#817986] font-mono">{p.transactionRef}</td>
                  <td className="py-3.5 px-4 text-[#817986]">{p.date}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#27212B] tabular-nums">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#16845B]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      Settled
                    </span>
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
