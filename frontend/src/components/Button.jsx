import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm',
    secondary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold',
    outline:
      'border border-emerald-700/25 dark:border-emerald-500/30 bg-white/80 dark:bg-slate-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 text-emerald-900 dark:text-emerald-100',
    ghost: 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
