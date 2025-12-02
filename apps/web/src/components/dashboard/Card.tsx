/**
 * Reusable Glass Card Component
 * Sprint 11 - US-097
 * UX Redesign: Professional Glassmorphism Theme
 */

import { ReactNode } from 'react';

interface CardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  noPadding?: boolean;
}

export function Card({ title, subtitle, children, action, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group transition-colors"
          >
            {action.label}
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  );
}
