import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#421747]/40 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-white w-full ${maxWidthClass} rounded-2xl p-6 shadow-2xl border border-[#EAE5EC] transform transition-all max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-start justify-between pb-4 border-b border-[#EAE5EC]">
          <div>
            <h3 className="text-lg font-bold text-[#27212B]">{title}</h3>
            {subtitle && <p className="text-xs text-[#817986] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#817986] hover:text-[#27212B] hover:bg-[#F3EAF5] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4 text-[#27212B]">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
