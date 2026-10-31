import React from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#817986] text-[18px]">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-[#27212B] placeholder:text-[#817986] text-xs outline-none focus:bg-white focus:border-[#6D286F] focus:ring-1 focus:ring-[#6D286F] transition-all"
      />
    </div>
  );
};

export default SearchInput;
