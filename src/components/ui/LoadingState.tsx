import React from 'react';

export interface LoadingStateProps {
  rows?: number;
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  rows = 4,
  message = 'Loading records...',
}) => {
  return (
    <div className="w-full space-y-3 p-4 animate-pulse">
      <div className="flex items-center justify-between pb-2 border-b border-slate-850">
        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        <div className="h-4 bg-slate-800 rounded w-16"></div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 py-2">
          <div className="h-8 w-8 bg-slate-800 rounded-full shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-800 rounded w-3/4"></div>
            <div className="h-2.5 bg-slate-850 rounded w-1/2"></div>
          </div>
          <div className="h-3 bg-slate-800 rounded w-20"></div>
        </div>
      ))}
      <p className="text-center text-xs text-slate-500 pt-2">{message}</p>
    </div>
  );
};
