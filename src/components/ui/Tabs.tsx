import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800 rounded-lg overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-slate-800 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={`text-[11px] tabular-nums px-1.5 py-0.2 rounded-sm ${
                isActive ? 'bg-slate-700 text-slate-100' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
