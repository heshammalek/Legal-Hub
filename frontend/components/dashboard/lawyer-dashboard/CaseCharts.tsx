import React, { useMemo } from 'react';
import { JudicialCase } from '@/types/index';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface CaseChartsProps {
  cases: JudicialCase[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// ✅ Move helper functions outside the component or declare them before useMemo
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'مسودة',
    active: 'نشطة',
    pending: 'قيد الانتظار',
    in_session: 'قيد الجلسة',
    closed: 'منتهية',
    archived: 'أرشيف'
  };
  return labels[status] || status;
};

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    urgent: 'عاجلة'
  };
  return labels[priority] || priority;
};

export const CaseCharts: React.FC<CaseChartsProps> = ({ cases }) => {
  const chartData = useMemo(() => {
    // توزيع القضايا حسب النوع
    const caseTypeData = cases.reduce((acc, caseItem) => {
      const type = caseItem.case_type || 'غير محدد';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // توزيع القضايا حسب الحالة
    const statusData = cases.reduce((acc, caseItem) => {
      acc[caseItem.status] = (acc[caseItem.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // توزيع القضايا حسب الأولوية
    const priorityData = cases.reduce((acc, caseItem) => {
      acc[caseItem.priority] = (acc[caseItem.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // النشاط الشهري
    const monthlyData = cases.reduce((acc, caseItem) => {
      const month = new Date(caseItem.created_at).toLocaleDateString('ar-EG', { 
        month: 'short', 
        year: 'numeric' 
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      caseType: Object.entries(caseTypeData).map(([name, value]) => ({ name, value })),
      status: Object.entries(statusData).map(([name, value]) => ({ 
        name: getStatusLabel(name), // ✅ Now this function is available
        value 
      })),
      priority: Object.entries(priorityData).map(([name, value]) => ({ 
        name: getPriorityLabel(name), // ✅ Now this function is available
        value 
      })),
      monthly: Object.entries(monthlyData).map(([name, value]) => ({ name, value }))
    };
  }, [cases]);

  if (cases.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      
      {/* توزيع القضايا حسب النوع */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="font-bold mb-4 text-gray-800">توزيع القضايا حسب النوع</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.caseType}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* توزيع القضايا حسب الحالة */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="font-bold mb-4 text-gray-800">توزيع القضايا حسب الحالة</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData.status}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${((percent as number) * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.status.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* توزيع القضايا حسب الأولوية */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="font-bold mb-4 text-gray-800">توزيع القضايا حسب الأولوية</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.priority}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {chartData.priority.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* النشاط الشهري */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="font-bold mb-4 text-gray-800">النشاط الشهري</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};