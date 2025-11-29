
import React from 'react';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // En mode Dark, on applique les classes 'neon-button' définies dans index.html pour l'effet lumineux
  const variants = {
    primary: "bg-[var(--primary-color)] text-white hover:bg-[var(--primary-hover)] focus:ring-[var(--primary-color)] neon-button",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 neon-button-secondary",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-red-500/50 dark:shadow-red-900/50 dark:hover:shadow-red-500/50 dark:border dark:border-red-500/30",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-green-500/50 dark:shadow-green-900/50 dark:hover:shadow-green-500/50 dark:border dark:border-green-500/30",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 shadow-yellow-500/50 dark:shadow-yellow-900/50 dark:hover:shadow-yellow-500/50 dark:border dark:border-yellow-500/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <input
        className={`w-full px-3 py-2 border rounded-md shadow-sm transition-all duration-300
        bg-white text-gray-900 dark:bg-slate-900 dark:text-white dark:border-gray-600 dark:placeholder-gray-400
        ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]'} 
        ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <select
        className={`w-full px-3 py-2 border rounded-md shadow-sm transition-all duration-300
        bg-white text-gray-900 dark:bg-slate-900 dark:text-white dark:border-gray-600
        ${error ? 'border-red-500' : 'border-gray-300 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]'} 
        ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// Card Component
export const Card: React.FC<{ children: React.ReactNode; title?: React.ReactNode; className?: string; noPadding?: boolean }> = ({ children, title, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md dark:border dark:border-white/10 rounded-xl shadow-md overflow-hidden transition-all duration-300 ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white drop-shadow-sm">{title}</h3>
        </div>
      )}
      <div className={`${noPadding ? '' : 'p-6'} dark:text-gray-200`}>{children}</div>
    </div>
  );
};

// Modal Component
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 dark:bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-slate-900/90 dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col transition-all duration-300`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white drop-shadow-md">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 dark:text-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
};
