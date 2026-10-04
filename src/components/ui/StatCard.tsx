import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  indicator?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  indicator,
  icon,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
          {value}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {indicator && (
            <span
              className={`font-semibold tabular-nums ${
                indicator.isPositive ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {indicator.value}
            </span>
          )}
          {subtext && <span className="text-slate-400">{subtext}</span>}
        </div>
      </div>
    </div>
  );
};
