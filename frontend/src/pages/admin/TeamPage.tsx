import React, { useState } from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'BILLING_OPS';
  department: string;
  status: 'ACTIVE' | 'INVITED';
  lastActive: string;
}

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'usr-1',
    name: 'Priya Sharma',
    email: 'admin@brightloop.com',
    role: 'ADMIN',
    department: 'Revenue & Operations',
    status: 'ACTIVE',
    lastActive: 'Active now',
  },
  {
    id: 'usr-2',
    name: 'Rajesh Kumar',
    email: 'staff@brightloop.com',
    role: 'STAFF',
    department: 'Billing & Account Services',
    status: 'ACTIVE',
    lastActive: '24 mins ago',
  },
  {
    id: 'usr-3',
    name: 'Ananya Deshmukh',
    email: 'ananya.d@brightloop.com',
    role: 'STAFF',
    department: 'Customer Success',
    status: 'ACTIVE',
    lastActive: '2 hours ago',
  },
  {
    id: 'usr-4',
    name: 'Vikram Malhotra',
    email: 'v.malhotra@brightloop.com',
    role: 'BILLING_OPS',
    department: 'Treasury & Gateway Recon',
    status: 'INVITED',
    lastActive: 'Invite Sent',
  },
];

export const TeamPage: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'STAFF' | 'BILLING_OPS'>('STAFF');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      department: inviteRole === 'ADMIN' ? 'Executive Governance' : 'Operations',
      status: 'INVITED',
      lastActive: 'Invite Sent',
    };

    setTeam([...team, newMember]);
    setIsInviteOpen(false);
    setInviteName('');
    setInviteEmail('');
    showToast(`Invitation dispatched to ${newMember.email}`);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#421747] text-white px-4 py-3 rounded-xl shadow-lg border border-[#6D286F] animate-fade-in">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#84418A] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Access Governance</span>
            <span>•</span>
            <span>Role-Based Access Control</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B] tracking-tight">Team &amp; Operator Management</h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Manage administrative personnel, billing operators, and staff role permissions.
          </p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6D286F] hover:bg-[#530D57] text-white text-xs font-semibold shadow-xs self-start sm:self-auto transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Invite Team Member
        </button>
      </div>

      {/* Team Cards & Permissions Table */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#EAE5EC] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#27212B]">Active Administrators &amp; Staff ({team.length})</h2>
          <span className="text-xs text-[#817986]">Enterprise Role Guarding Active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF9FB] border-b border-[#EAE5EC]">
              <tr>
                <th className="py-2.5 px-5 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Member
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Role
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Department
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Status
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="py-2.5 px-5 text-[11px] font-semibold text-[#817986] uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#27212B] divide-y divide-[#EAE5EC]">
              {team.map((m) => (
                <tr key={m.id} className="hover:bg-[#FAF9FB] transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F3EAF5] text-[#6D286F] font-bold flex items-center justify-center text-xs">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#27212B]">{m.name}</p>
                        <p className="text-[11px] text-[#817986]">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        m.role === 'ADMIN'
                          ? 'bg-[#F3EAF5] text-[#6D286F]'
                          : m.role === 'STAFF'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#817986]">{m.department}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        m.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-[#16845B]'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          m.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      ></span>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#817986]">{m.lastActive}</td>
                  <td className="py-3 px-5 text-right">
                    <button
                      onClick={() => showToast(`Permissions configured for ${m.name}`)}
                      className="text-xs font-semibold text-[#6D286F] hover:underline"
                    >
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Matrix */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs">
        <h2 className="text-base font-bold text-[#27212B] mb-2">Role Permissions Matrix</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC]">
            <span className="text-xs font-bold text-[#6D286F] uppercase">ADMIN</span>
            <p className="text-xs text-[#817986] mt-1 mb-3">Full governance authority across billing and system</p>
            <ul className="text-xs text-[#27212B] space-y-1">
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                Create/Modify Products &amp; Plans
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                Issue Invoices &amp; Record Payments
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                Manage Team Access &amp; API Keys
              </li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC]">
            <span className="text-xs font-bold text-blue-700 uppercase">STAFF</span>
            <p className="text-xs text-[#817986] mt-1 mb-3">Operational customer and quote support</p>
            <ul className="text-xs text-[#27212B] space-y-1">
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                Draft &amp; Send Quotations
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                Pause/Resume Subscriptions
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-rose-500">close</span>
                No System Configuration Rights
              </li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC]">
            <span className="text-xs font-bold text-amber-700 uppercase">CUSTOMER</span>
            <p className="text-xs text-[#817986] mt-1 mb-3">Self-service portal subscriber account</p>
            <ul className="text-xs text-[#27212B] space-y-1">
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                View Subscriptions &amp; Invoices
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                Download Tax Invoices PDF
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-rose-500">close</span>
                No Administrative Oversight
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#EAE5EC] shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE5EC]">
              <h3 className="text-base font-bold text-[#27212B]">Invite Team Member</h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-[#817986] hover:text-[#27212B]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sonal Verma"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs outline-none focus:border-[#6D286F]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sonal.v@brightloop.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs outline-none focus:border-[#6D286F]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Role Assignment</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs outline-none focus:border-[#6D286F]"
                >
                  <option value="STAFF">STAFF (Operations &amp; Billing)</option>
                  <option value="BILLING_OPS">BILLING_OPS (Treasury &amp; Reconciliation)</option>
                  <option value="ADMIN">ADMIN (Full Authority)</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE5EC]">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#817986] hover:bg-[#FAF9FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#6D286F] text-white text-xs font-semibold hover:bg-[#530D57]"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
