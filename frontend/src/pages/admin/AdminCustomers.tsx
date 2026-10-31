import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { User } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { SearchInput } from '../../components/SearchInput';
import { formatINR, formatDate } from '../../utils/format';
import { Users, Plus, Mail, Building, Phone, Clock, ShieldCheck, ChevronRight } from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // In production API fetch customers
      const data = await ApiClient.get<any[]>('/users?role=CUSTOMER');
      setCustomers(data);
    } catch (err) {
      // Mock Fallback matching Stitch Design
      setCustomers([
        {
          id: 'cust-1',
          name: 'Rajesh Sharma',
          email: 'billing@acmecloud.com',
          companyName: 'Acme Cloud Dynamics Ltd',
          phone: '+91 98200 12345',
          address: 'Bandra Kurla Complex, Mumbai, Maharashtra',
          activeSubscriptionsCount: 3,
          totalSpent: 495000,
          createdAt: '2025-11-12T00:00:00Z',
          status: 'ACTIVE',
        },
        {
          id: 'cust-2',
          name: 'Priya Iyer',
          email: 'finance@induslogistics.in',
          companyName: 'Indus Logistics Pvt Ltd',
          phone: '+91 97110 54321',
          address: 'Whitefield Tech Zone, Bengaluru, Karnataka',
          activeSubscriptionsCount: 1,
          totalSpent: 825000,
          createdAt: '2026-02-18T00:00:00Z',
          status: 'ACTIVE',
        },
        {
          id: 'cust-3',
          name: 'Amit Patel',
          email: 'accounts@bharatretail.com',
          companyName: 'Bharat Retail Solutions',
          phone: '+91 99099 87654',
          address: 'GIDC Electronic City, Gandhinagar, Gujarat',
          activeSubscriptionsCount: 2,
          totalSpent: 320000,
          createdAt: '2026-04-10T00:00:00Z',
          status: 'ACTIVE',
        },
        {
          id: 'cust-4',
          name: 'Kavita Menon',
          email: 'admin@apexindustrial.in',
          companyName: 'Apex Industrial Systems',
          phone: '+91 94470 11223',
          address: 'Infopark Phase 2, Kochi, Kerala',
          activeSubscriptionsCount: 1,
          totalSpent: 180000,
          createdAt: '2026-06-01T00:00:00Z',
          status: 'ACTIVE',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.post('/auth/register', {
        name,
        email,
        password: 'Password@2026', // Default seed password meeting password requirements
        companyName,
        phone,
        address,
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setCompanyName('');
      setPhone('');
      setAddress('');
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#27212B] tracking-tight">
            Customer Directory
          </h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Manage subscriber accounts, lifetime contract values, and billing contacts
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Customer
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by customer name, company, or email..."
          className="w-full max-w-md"
        />
        <span className="text-xs text-[#817986] font-medium hidden sm:block">
          Showing {filtered.length} client(s)
        </span>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5EC] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#27212B]">
            <thead className="text-[11px] uppercase tracking-wider bg-[#FAF9FB] text-[#817986] border-b border-[#EAE5EC]">
              <tr>
                <th className="py-3.5 px-5">Customer & Company</th>
                <th className="py-3.5 px-5">Contact Details</th>
                <th className="py-3.5 px-5">Active Plans</th>
                <th className="py-3.5 px-5">Member Since</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Lifetime Billed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5EC]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#817986]">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D286F]" />
                    Fetching customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#817986]">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#FAF9FB] transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F3EAF5] text-[#6D286F] font-extrabold flex items-center justify-center text-xs border border-[#E5D1E8]">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#27212B]">{customer.companyName || customer.name}</p>
                          <p className="text-xs text-[#817986]">{customer.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-xs">
                      <p className="text-[#27212B] flex items-center gap-1.5 font-medium">
                        <Mail className="w-3.5 h-3.5 text-[#817986]" />
                        {customer.email}
                      </p>
                      {customer.phone && (
                        <p className="text-[#817986] flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-[#817986]" />
                          {customer.phone}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-[#27212B]">
                        {customer.activeSubscriptionsCount || 1} Active Contract(s)
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#817986]">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status="ACTIVE" size="sm" />
                    </td>
                    <td className="py-3.5 px-5 text-right font-extrabold text-[#27212B]">
                      {formatINR(customer.totalSpent || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating Customer */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Customer Account" maxWidth="md">
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Company / Organization Name</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Cloud Dynamics Ltd"
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Contact Person Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Billing Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@acmecloud.com"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Billing Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. BKC Commercial Hub, Mumbai"
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE5EC]">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCustomers;
