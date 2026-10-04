import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  dot = true,
  className = '',
}) => {
  const dotColors = {
    neutral: 'bg-slate-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-sky-400',
  };

  const textColors = {
    neutral: 'text-slate-300',
    success: 'text-emerald-300',
    warning: 'text-amber-300',
    danger: 'text-rose-300',
    info: 'text-sky-300',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColors[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
};
