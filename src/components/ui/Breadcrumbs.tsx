import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
            {item.onClick && !isLast ? (
              <button
                onClick={item.onClick}
                className="hover:text-slate-200 transition-colors cursor-pointer truncate max-w-[160px]"
              >
                {item.label}
              </button>
            ) : (
              <span className={`truncate max-w-[200px] ${isLast ? 'text-slate-200 font-semibold' : ''}`}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
