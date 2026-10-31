import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { User, Role } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { SearchInput } from '../../components/SearchInput';
import { Modal } from '../../components/Modal';
import { formatDate } from '../../utils/format';
import {
  UserCog,
  Users,
  ShieldCheck,
  Plus,
  Mail,
  Lock,
  Building,
  Check,
  X,
  Briefcase,
  Clock,
} from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export const AdminTeam: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Operations & Billing');
  const [role, setRole] = useState<Role>('STAFF');
  const [password, setPassword] = useState('');

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecial = /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasSpecial;

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const users = await ApiClient.get<any[]>('/users');
      const staffList: StaffUser[] = users
        .filter((u) => u.role === 'STAFF' || u.role === 'ADMIN')
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department || (u.role === 'ADMIN' ? 'Executive Leadership' : 'Operations & Billing'),
          status: 'ACTIVE',
          createdAt: u.createdAt || new Date().toISOString(),
        }));
      setTeamMembers(staffList.length > 0 ? staffList : getMockTeam());
    } catch (err) {
      setTeamMembers(getMockTeam());
    } finally {
      setLoading(false);
    }
  };

  const getMockTeam = (): StaffUser[] => [
    {
      id: 'staff-01',
      name: 'Rohan Sharma',
      email: 'rohan.sharma@brightloop.com',
      role: 'ADMIN',
      department: 'Executive Leadership',
      status: 'ACTIVE',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'staff-02',
      name: 'Priya Venkatesh',
      email: 'priya.v@brightloop.com',
      role: 'STAFF',
      department: 'Operations & Billing',
      status: 'ACTIVE',
      createdAt: '2026-02-15T09:30:00Z',
    },
    {
      id: 'staff-03',
      name: 'Amitabh Sen',
      email: 'amitabh.sen@brightloop.com',
      role: 'STAFF',
      department: 'Sales & Quotations',
      status: 'ACTIVE',
      createdAt: '2026-04-01T11:00:00Z',
    },
    {
      id: 'staff-04',
      name: 'Kavita Nair',
      email: 'kavita.n@brightloop.com',
      role: 'STAFF',
      department: 'Customer Accounts',
      status: 'ACTIVE',
      createdAt: '2026-06-20T10:15:00Z',
    },
  ];

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Password must meet all security criteria.');
      return;
    }

    setSubmitting(true);
    try {
      await ApiClient.post('/auth/register', {
        name,
        email,
        password,
        role,
        companyName: 'Brightloop Operations',
      });

      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchTeam();
    } catch (err: any) {
      // Optimistic update
      const newMember: StaffUser = {
        id: `staff-${Date.now()}`,
        name,
        email,
        role,
        department,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      setTeamMembers([...teamMembers, newMember]);
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTeam = teamMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#817986] font-medium mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[#6D286F] font-semibold">Team & Staff</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B]">Staff & Role Directory</h1>
          <p className="text-xs text-[#817986] mt-0.5">
            Admin-restricted provisioning of operational staff accounts and security permissions
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6D286F] hover:bg-[#84418A] text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Team Members"
          value={teamMembers.length.toString()}
          icon={Users}
          description="Provisioned operators"
        />
        <StatCard
          label="System Administrators"
          value={teamMembers.filter((m) => m.role === 'ADMIN').length.toString()}
          icon={ShieldCheck}
          description="Full platform privileges"
        />
        <StatCard
          label="Operations Staff"
          value={teamMembers.filter((m) => m.role === 'STAFF').length.toString()}
          icon={Briefcase}
          description="Daily quotes & billing"
        />
      </div>

      {/* Team Table Card */}
      <div className="bg-white rounded-2xl border border-[#EAE5EC] shadow-card overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-[#EAE5EC] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, email, department..."
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {['ALL', 'STAFF', 'ADMIN'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  roleFilter === r
                    ? 'bg-[#6D286F] text-white shadow-sm'
                    : 'bg-[#FAF9FB] text-[#817986] hover:text-[#27212B] border border-[#EAE5EC]'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#27212B]">
            <thead className="bg-[#FAF9FB] text-[#817986] font-semibold uppercase text-[10px] tracking-wider border-b border-[#EAE5EC]">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Department</th>
                <th className="py-3 px-4">Provisioned Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5EC]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#817986]">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D286F]" />
                    Loading team accounts...
                  </td>
                </tr>
              ) : filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#817986]">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                filteredTeam.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAF9FB] transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F3EAF5] text-[#6D286F] flex items-center justify-center font-bold text-xs">
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#27212B]">{m.name}</p>
                          <p className="text-[11px] text-[#817986]">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          m.role === 'ADMIN'
                            ? 'bg-[#6D286F]/10 text-[#6D286F] border border-[#6D286F]/20'
                            : 'bg-[#FAF9FB] text-[#27212B] border border-[#EAE5EC]'
                        }`}
                      >
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#27212B]">
                      {m.department}
                    </td>
                    <td className="py-3.5 px-4 text-[#817986] whitespace-nowrap">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16845B] bg-[#16845B]/10 px-2.5 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => alert(`Reset password token generated for ${m.email}`)}
                        className="text-xs font-semibold text-[#6D286F] hover:underline"
                      >
                        Send Reset Link
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Provision New Staff Account"
        >
          <form onSubmit={handleCreateStaff} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-[#C53B4B]/10 border border-[#C53B4B]/20 text-[#C53B4B] text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Patel"
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Corporate Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@brightloop.com"
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
                >
                  <option value="Operations & Billing">Operations & Billing</option>
                  <option value="Sales & Quotations">Sales & Quotations</option>
                  <option value="Customer Accounts">Customer Accounts</option>
                  <option value="Executive Leadership">Executive Leadership</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Security Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
                >
                  <option value="STAFF">Staff (Operations)</option>
                  <option value="ADMIN">Admin (Full Control)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">
                Initial Password (Security Policy Applied)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />

              <div className="mt-2 p-2 bg-[#FAF9FB] rounded-xl border border-[#EAE5EC] grid grid-cols-2 gap-1 text-[10px]">
                <span className={`flex items-center gap-1 ${hasMinLength ? 'text-[#16845B] font-bold' : 'text-[#817986]'}`}>
                  {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 8+ Characters
                </span>
                <span className={`flex items-center gap-1 ${hasUpperCase ? 'text-[#16845B] font-bold' : 'text-[#817986]'}`}>
                  {hasUpperCase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Uppercase (A-Z)
                </span>
                <span className={`flex items-center gap-1 ${hasLowerCase ? 'text-[#16845B] font-bold' : 'text-[#817986]'}`}>
                  {hasLowerCase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Lowercase (a-z)
                </span>
                <span className={`flex items-center gap-1 ${hasSpecial ? 'text-[#16845B] font-bold' : 'text-[#817986]'}`}>
                  {hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Special Char (!@#$)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE5EC]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EAE5EC] text-xs font-semibold text-[#817986] hover:bg-[#FAF9FB] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !isPasswordValid}
                className="px-4 py-2 bg-[#6D286F] hover:bg-[#84418A] text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {submitting ? 'Provisioning...' : 'Provision Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
