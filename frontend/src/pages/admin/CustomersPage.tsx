import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services';

interface CustomerItem {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone?: string;
  industryCity: string;
  gstin: string;
  plansCount: string;
  totalRevenue: number;
  balance: number;
  status: 'Active' | 'Dunning Risk' | 'Inactive';
  initials: string;
  isKeyAccount?: boolean;
}

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<CustomerItem[]>([
    {
      id: 'cust-01',
      name: 'FinEdge Technologies',
      contactName: 'Rohan Mehra',
      email: 'rohan@finedge.io',
      phone: '+91 98450 12345',
      industryCity: 'Fintech • Bangalore',
      gstin: '29AABCB3456F2Z3',
      plansCount: '2 Plans',
      totalRevenue: 1840000,
      balance: 84000,
      status: 'Dunning Risk',
      initials: 'FE',
      isKeyAccount: true,
    },
    {
      id: 'cust-02',
      name: 'Acme Cloud Labs',
      contactName: 'Sunita Rao',
      email: 'sunita@acmelabs.in',
      phone: '+91 98200 54321',
      industryCity: 'Cloud Infrastructure • Mumbai',
      gstin: '27AACCA1244E1ZL',
      plansCount: '1 Enterprise',
      totalRevenue: 2450000,
      balance: 0,
      status: 'Active',
      initials: 'AC',
      isKeyAccount: true,
    },
    {
      id: 'cust-03',
      name: 'DataWeave Analytics',
      contactName: 'Karthik Iyer',
      email: 'karthik@dataweave.co',
      phone: '+91 98401 99887',
      industryCity: 'Big Data • Hyderabad',
      gstin: '36AADCD9823M1Z5',
      plansCount: '3 Plans',
      totalRevenue: 1290000,
      balance: 0,
      status: 'Active',
      initials: 'DW',
    },
    {
      id: 'cust-04',
      name: 'HyperLogix India',
      contactName: 'Tanya Sen',
      email: 't.sen@hyperlogix.in',
      phone: '+91 98110 33445',
      industryCity: 'Logistics Tech • Delhi NCR',
      gstin: '07AAGCH4421P1ZP',
      plansCount: '1 Custom',
      totalRevenue: 820000,
      balance: 36500,
      status: 'Active',
      initials: 'HL',
    },
    {
      id: 'cust-05',
      name: 'NexaHealth Solutions',
      contactName: 'Dr. Aris Varghese',
      email: 'aris@nexahealth.org',
      phone: '+91 94440 88776',
      industryCity: 'Healthcare SaaS • Chennai',
      gstin: '33AABCN7765Q1Z8',
      plansCount: '2 Plans',
      totalRevenue: 1510000,
      balance: 0,
      status: 'Active',
      initials: 'NH',
    },
    {
      id: 'cust-06',
      name: 'BlueStream Media',
      contactName: 'Vivek Kapoor',
      email: 'vivek@bluestream.media',
      phone: '+91 98220 77112',
      industryCity: 'Digital Content • Pune',
      gstin: '27AACPB5511D1ZK',
      plansCount: '1 Plan',
      totalRevenue: 680000,
      balance: 0,
      status: 'Inactive',
      initials: 'BM',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [segmentFilter, setSegmentFilter] = useState('All Customers');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [industryCity, setIndustryCity] = useState('');
  const [gstin, setGstin] = useState('');

  useEffect(() => {
    const fetchBackendCustomers = async () => {
      try {
        const data = await customerService.getAll();
        if (data && data.length > 0) {
          const mapped: CustomerItem[] = data.map((c: any) => ({
            id: c.id,
            name: c.companyName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email,
            contactName: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Billing Admin',
            email: c.email,
            phone: c.phone || '+91 98000 00000',
            industryCity: c.city ? `Enterprise • ${c.city}` : 'Technology • India',
            gstin: c.gstin || '29AABCB0000F1Z1',
            plansCount: `${c._count?.subscriptions || 1} Plan(s)`,
            totalRevenue: Number(c.totalRevenue || 500000),
            balance: Number(c.outstandingBalance || 0),
            status: c.isActive === false ? 'Inactive' : 'Active',
            initials: (c.companyName || c.email || 'CU').substring(0, 2).toUpperCase(),
          }));
          setCustomers(mapped);
        }
      } catch (err) {
        console.info('Backend customer fetch fallback to Stitch demo dataset');
      }
    };
    fetchBackendCustomers();
  }, []);

  const handleAddCustomer = async () => {
    if (!companyName || !contactEmail) return;

    try {
      await customerService.create({
        companyName,
        firstName: contactPerson.split(' ')[0] || contactPerson,
        lastName: contactPerson.split(' ').slice(1).join(' ') || '',
        email: contactEmail,
        phone: contactPhone,
        gstin,
        city: industryCity,
      });
    } catch (e) {
      console.info('Backend customer create fallback');
    }

    const newCust: CustomerItem = {
      id: `cust-${Date.now()}`,
      name: companyName,
      contactName: contactPerson || 'Authorized Officer',
      email: contactEmail,
      phone: contactPhone || '+91 98000 00000',
      industryCity: industryCity || 'Technology • India',
      gstin: gstin || '29AABCB9999F1Z1',
      plansCount: '1 Plan',
      totalRevenue: 0,
      balance: 0,
      status: 'Active',
      initials: companyName.substring(0, 2).toUpperCase(),
    };

    setCustomers([newCust, ...customers]);
    setIsModalOpen(false);
    setCompanyName('');
    setContactPerson('');
    setContactEmail('');
    setContactPhone('');
    setGstin('');
    setIndustryCity('');
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.gstin.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' ? true : c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-[#1f1924] tracking-tight">Customers</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#f5eaf9] text-[#6D286F] text-xs font-semibold">
              1,420 Records
            </span>
          </div>
          <p className="text-sm text-[#81737e]">
            Directory of enterprise clients, billing contacts, and subscription ledgers.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => alert('Exporting customer registry to CSV...')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#EAE5EC] hover:bg-[#FAF9FB] text-xs font-medium text-[#1f1924] shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[18px] text-[#81737e]">file_download</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6D286F] hover:bg-[#530D57] text-white text-xs font-semibold shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Customers */}
        <div className="p-5 rounded-xl bg-white border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#81737e]">
              Total Customers
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF9FB] flex items-center justify-center text-[#6D286F]">
              <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#1f1924]">1,420</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-[#81737e]">
              <span className="material-symbols-outlined text-[16px] text-[#6D286F]">verified</span>
              <span>Enterprise registered accounts</span>
            </div>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="p-5 rounded-xl bg-white border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#81737e]">
              Active Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF9FB] flex items-center justify-center text-[#6D286F]">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#1f1924]">1,315</span>
              <span className="text-xs text-[#81737e] font-medium">(92.6%)</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Healthy recurring billing cycle</span>
            </div>
          </div>
        </div>

        {/* New This Month */}
        <div className="p-5 rounded-xl bg-white border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#81737e]">
              New This Month
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF9FB] flex items-center justify-center text-[#6D286F]">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#1f1924]">48</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#f5eaf9] text-[#6D286F] text-xs font-semibold">
                +14% MoM
              </span>
            </div>
            <div className="mt-1 text-xs text-[#81737e]">22 closed via sales pipeline</div>
          </div>
        </div>

        {/* Outstanding Balances */}
        <div className="p-5 rounded-xl bg-white border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#81737e]">
              Outstanding Balances
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FDF0F2] text-[#C53B4B] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#1f1924] tabular-nums">₹6,42,800</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#B7791F]">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Across 34 customer accounts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Segment Nav Pills & Search / Filters */}
      <div className="p-5 rounded-xl bg-white border border-[#EAE5EC] shadow-xs space-y-4">
        {/* Segment Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#EAE5EC]">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['All Customers', 'Enterprise Tier', 'Mid-Market', 'SMB'].map((seg) => (
              <button
                key={seg}
                onClick={() => setSegmentFilter(seg)}
                type="button"
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  segmentFilter === seg
                    ? 'bg-[#6D286F] text-white shadow-xs'
                    : 'bg-[#FAF9FB] text-[#1f1924] hover:bg-[#f5eaf9] border border-[#EAE5EC]'
                }`}
              >
                {seg}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#81737e]">
            Showing {filteredCustomers.length} of 1,420 accounts
          </span>
        </div>

        {/* Toolbar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#81737e] text-[18px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-[#1f1924] placeholder:text-[#81737e] text-xs outline-none focus:border-[#6D286F]"
              placeholder="Search customers by company, contact name, email, GSTIN, or city..."
              type="text"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#1f1924] outline-none"
            >
              <option value="All">Status: All</option>
              <option value="Active">Status: Active</option>
              <option value="Dunning Risk">Status: Dunning Risk</option>
              <option value="Inactive">Status: Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF9FB] text-[#81737e] uppercase tracking-wider font-semibold border-b border-[#EAE5EC]">
              <tr>
                <th className="py-3 px-6">Customer &amp; Contact</th>
                <th className="py-3 px-4">Industry / GSTIN</th>
                <th className="py-3 px-4 text-center">Subscriptions</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5EC] text-[#1f1924]">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-[#FAF9FB] transition group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#6D286F] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {cust.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#1f1924] flex items-center gap-1.5 truncate">
                          <span>{cust.name}</span>
                          {cust.isKeyAccount && (
                            <span
                              className="material-symbols-outlined text-[14px] text-[#6D286F]"
                              title="Key Account"
                            >
                              star
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#81737e] truncate">
                          {cust.contactName} • {cust.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-medium text-[#1f1924]">{cust.industryCity}</div>
                    <div className="text-[10px] text-[#81737e] font-mono">{cust.gstin}</div>
                  </td>
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-[#f5eaf9] text-[#6D286F] font-semibold text-[11px]">
                      {cust.plansCount}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-bold tabular-nums whitespace-nowrap">
                    ₹{cust.totalRevenue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 px-4 text-right tabular-nums whitespace-nowrap">
                    {cust.balance > 0 ? (
                      <span className="text-[#B7791F] font-bold bg-[#FEF6E9] px-2 py-0.5 rounded">
                        ₹{cust.balance.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-[#81737e]">₹0</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        cust.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : cust.status === 'Dunning Risk'
                          ? 'bg-[#FEF6E9] text-[#B7791F]'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          cust.status === 'Active'
                            ? 'bg-emerald-600'
                            : cust.status === 'Dunning Risk'
                            ? 'bg-amber-600'
                            : 'bg-slate-500'
                        }`}
                      />
                      {cust.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 text-[#81737e]">
                      <button
                        type="button"
                        onClick={() => navigate('/admin/subscriptions')}
                        className="p-1.5 rounded hover:text-[#6D286F] hover:bg-[#f5eaf9] transition"
                        title="View Subscriptions"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/quotations')}
                        className="p-1.5 rounded hover:text-[#6D286F] hover:bg-[#f5eaf9] transition"
                        title="Create Quotation"
                      >
                        <span className="material-symbols-outlined text-[18px]">post_add</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#FAF9FB] border-b border-[#EAE5EC] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1f1924]">Register New Enterprise Customer</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#81737e] hover:text-[#1f1924]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1f1924] pb-1">
                  Company / Entity Name <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs font-medium text-[#1f1924]"
                  placeholder="e.g. Apex Systems India Ltd."
                  type="text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1f1924] pb-1">
                    Contact Person Name
                  </label>
                  <input
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs text-[#1f1924]"
                    placeholder="e.g. Ananya Rao"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1f1924] pb-1">
                    Email Address <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs text-[#1f1924]"
                    placeholder="billing@apexsystems.in"
                    type="email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1f1924] pb-1">Phone Number</label>
                  <input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs text-[#1f1924]"
                    placeholder="+91 98765 43210"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1f1924] pb-1">GSTIN Number</label>
                  <input
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs font-mono uppercase text-[#1f1924]"
                    placeholder="29AABCA1234F1Z5"
                    type="text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1f1924] pb-1">
                  Industry &amp; City Location
                </label>
                <input
                  value={industryCity}
                  onChange={(e) => setIndustryCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs text-[#1f1924]"
                  placeholder="e.g. SaaS / Cloud • Bengaluru"
                  type="text"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-[#FAF9FB] border-t border-[#EAE5EC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-[#EAE5EC] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomer}
                className="px-4 py-2 rounded-lg bg-[#6D286F] text-white hover:bg-[#530D57] text-xs font-semibold shadow-xs"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
