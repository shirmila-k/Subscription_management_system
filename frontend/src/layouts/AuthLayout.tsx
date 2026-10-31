import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FAF9FB] relative overflow-hidden">
      {/* Soft Ambient Plum Background Glows */}
      <div className="absolute top-1/6 left-1/4 w-96 h-96 bg-[#F3EAF5] rounded-full blur-3xl pointer-events-none opacity-80" />
      <div className="absolute bottom-1/6 right-1/4 w-96 h-96 bg-[#E5D1E8]/50 rounded-full blur-3xl pointer-events-none opacity-60" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6D286F] to-[#84418A] items-center justify-center shadow-lg text-white font-black text-2xl mb-4 border border-[#84418A]/30">
            BL
          </div>
          <h1 className="text-2xl font-extrabold text-[#27212B] tracking-tight">Brightloop Software</h1>
          <p className="text-sm text-[#817986] mt-1">Enterprise Subscription & Recurring Billing</p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-[#EAE5EC] shadow-cardHover">
          {children}
        </div>

        <p className="text-center text-xs text-[#817986] mt-6">
          &copy; {new Date().getFullYear()} Brightloop Software. White & Plum Design System.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
