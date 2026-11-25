import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

const Alert = ({ type = 'info', children, className = '', onClose }) => {
  const types = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/15',
      border: 'border-emerald-300 dark:border-emerald-400/30',
      text: 'text-emerald-900 dark:text-emerald-200',
      icon: CheckCircle,
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-500/15',
      border: 'border-rose-300 dark:border-rose-400/30',
      text: 'text-rose-900 dark:text-rose-200',
      icon: XCircle,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-500/15',
      border: 'border-amber-300 dark:border-amber-400/30',
      text: 'text-amber-900 dark:text-amber-200',
      icon: AlertCircle,
    },
    info: {
      bg: 'bg-sky-50 dark:bg-sky-500/15',
      border: 'border-sky-300 dark:border-sky-400/30',
      text: 'text-sky-900 dark:text-sky-200',
      icon: Info,
    },
  };

  const { bg, border, text, icon: Icon } = types[type] || types.info;

  return (
    <div
      className={`${bg} ${border} ${text} px-4 py-3 rounded-xl border flex items-start backdrop-blur-sm ${className}`}
    >
      <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
      <div className="flex-1 text-sm">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-3 opacity-75 hover:opacity-100 transition-opacity"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
