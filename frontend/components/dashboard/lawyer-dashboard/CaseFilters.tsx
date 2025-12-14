import React, { useState } from 'react';
import { Filter, X, Search } from 'lucide-react';

interface CaseFiltersProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

export const CaseFilters: React.FC<CaseFiltersProps> = ({ 
  filters, 
  onFiltersChange 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const statusOptions = [
    { value: 'draft', label: 'مسودة' },
    { value: 'active', label: 'نشطة' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'in_session', label: 'قيد الجلسة' },
    { value: 'closed', label: 'منتهية' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'منخفضة' },
    { value: 'medium', label: 'متوسطة' },
    { value: 'high', label: 'عالية' },
    { value: 'urgent', label: 'عاجلة' }
  ];

  const caseTypeOptions = [
    { value: 'مدنية', label: 'مدنية' },
    { value: 'تجارية', label: 'تجارية' },
    { value: 'جنائية', label: 'جنائية' },
    { value: 'أحوال شخصية', label: 'أحوال شخصية' },
    { value: 'عمل', label: 'عمل' },
    { value: 'إدارية', label: 'إدارية' }
  ];

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
    setSearchTerm('');
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchTerm;

  return (
    <div className="relative">
      {/* زر الفلاتر الرئيسي */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          hasActiveFilters
            ? 'bg-blue-100 text-blue-600 border border-blue-200'
            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-4 h-4 ml-1" />
        الفلاتر
        {hasActiveFilters && (
          <span className="mr-1 w-2 h-2 bg-blue-600 rounded-full"></span>
        )}
      </button>

      {/* نافذة الفلاتر */}
      {showFilters && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            {/* رأس الفلاتر */}
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-800">تصفية القضايا</h4>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    مسح الكل
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* البحث */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البحث
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث في القضايا..."
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* فلاتر الحالة */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <div className="space-y-2">
                {statusOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={filters.status === option.value}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="mr-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* فلاتر الأولوية */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الأولوية
              </label>
              <div className="space-y-2">
                {priorityOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="priority"
                      value={option.value}
                      checked={filters.priority === option.value}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="mr-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* فلاتر نوع القضية */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع القضية
              </label>
              <select
                value={filters.case_type || ''}
                onChange={(e) => handleFilterChange('case_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الأنواع</option>
                {caseTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* فلتر المحكمة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المحكمة
              </label>
              <input
                type="text"
                value={filters.court || ''}
                onChange={(e) => handleFilterChange('court', e.target.value)}
                placeholder="اسم المحكمة..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* تطبيق الفلاتر */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                تطبيق الفلاتر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* غطاء للنقر خارج النافذة */}
      {showFilters && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowFilters(false)}
        />
      )}
    </div>
  );
};