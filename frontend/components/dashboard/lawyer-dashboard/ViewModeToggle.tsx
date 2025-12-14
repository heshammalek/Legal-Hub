import React from 'react';
import { Grid, List, Calendar } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'grid' | 'list' | 'timeline';
  onViewModeChange: (mode: 'grid' | 'list' | 'timeline') => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ 
  viewMode, 
  onViewModeChange 
}) => {
  const buttons = [
    { mode: 'grid' as const, icon: Grid, label: 'شبكة' },
    { mode: 'list' as const, icon: List, label: 'قائمة' },
    { mode: 'timeline' as const, icon: Calendar, label: 'زمني' }
  ];

  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      {buttons.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode)}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === mode
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Icon className="w-4 h-4 ml-1" />
          {label}
        </button>
      ))}
    </div>
  );
};