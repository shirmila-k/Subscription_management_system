import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#6D286F] hover:bg-[#581F5A] text-white shadow-sm hover:shadow focus:ring-[#6D286F]',
    secondary:
      'bg-[#F3EAF5] hover:bg-[#E5D1E8] text-[#6D286F] focus:ring-[#6D286F]',
    outline:
      'bg-white border border-[#EAE5EC] hover:bg-[#FAF9FB] text-[#27212B] hover:border-[#D1ACD7] focus:ring-[#6D286F]',
    danger:
      'bg-[#C53B4B] hover:bg-[#A82B3A] text-white shadow-sm focus:ring-[#C53B4B]',
    ghost:
      'bg-transparent hover:bg-[#F3EAF5] text-[#27212B] hover:text-[#6D286F] focus:ring-[#6D286F]',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
