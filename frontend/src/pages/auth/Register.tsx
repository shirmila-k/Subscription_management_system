import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
    role: 'CUSTOMER', // Strict requirement: Never allow users to grant themselves ADMIN or STAFF
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register({ ...formData, role: 'CUSTOMER' });
      navigate('/portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check the information entered.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-[#27212B]">Register Organization Account</h2>
        <p className="text-xs text-[#817986] mt-0.5">
          Access subscriber portal, automated invoicing, and self-service subscriptions.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-[#C53B4B]">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">First Name</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Rohan"
              className="w-full px-3 py-2 text-xs bg-[#FAF9FB] border border-[#EAE5EC] rounded-lg text-[#27212B] outline-none focus:border-[#6D286F]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Last Name</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Nambiar"
              className="w-full px-3 py-2 text-xs bg-[#FAF9FB] border border-[#EAE5EC] rounded-lg text-[#27212B] outline-none focus:border-[#6D286F]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#27212B] mb-1">Work Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="rohan@acmelabs.in"
            className="w-full px-3 py-2 text-xs bg-[#FAF9FB] border border-[#EAE5EC] rounded-lg text-[#27212B] outline-none focus:border-[#6D286F]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#27212B] mb-1">Company / Organization</label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="Acme Cloud Labs Pvt Ltd"
            className="w-full px-3 py-2 text-xs bg-[#FAF9FB] border border-[#EAE5EC] rounded-lg text-[#27212B] outline-none focus:border-[#6D286F]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#27212B] mb-1">Password</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Minimum 8 characters with 1 number"
            className="w-full px-3 py-2 text-xs bg-[#FAF9FB] border border-[#EAE5EC] rounded-lg text-[#27212B] outline-none focus:border-[#6D286F]"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-[#6D286F] hover:bg-[#530D57] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98 disabled:opacity-50 mt-2"
        >
          <span>{isSubmitting ? 'Creating Subscriber Account...' : 'Register Account'}</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </form>

      <div className="mt-5 text-center text-xs text-[#817986]">
        Already have an account?{' '}
        <Link to="/login" className="text-[#6D286F] font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};
