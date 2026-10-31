import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string | React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none gap-1.5';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 h-8',
    md: 'text-sm px-4 py-2 h-10',
    lg: 'text-base px-5 py-2.5 h-12',
  };

  const variantClasses = {
    primary:
      'bg-[#6D286F] hover:bg-[#530D57] active:bg-[#421747] text-white shadow-sm',
    secondary:
      'bg-[#F3EAF5] hover:bg-[#EADFEE] text-[#421747] font-semibold',
    outline:
      'bg-white hover:bg-[#FAF9FB] text-[#27212B] border border-[#EAE5EC] shadow-sm',
    danger:
      'bg-[#C53B4B] hover:bg-[#A92A39] text-white shadow-sm',
    ghost:
      'bg-transparent hover:bg-[#FAF9FB] text-[#817986] hover:text-[#27212B]',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && typeof icon === 'string' ? (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : (
        icon
      )}
      {children && <span>{children}</span>}
    </button>
  );
};

export default Button;
