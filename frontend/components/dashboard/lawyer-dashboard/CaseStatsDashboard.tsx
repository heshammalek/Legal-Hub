import React, { useMemo } from 'react';
import { JudicialCase } from '@/types/index';
import { FolderOpen, Calendar, FileText, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface CaseStatsDashboardProps {
  cases: JudicialCase[];
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center mt-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className="p-2 rounded-full bg-white">
          {icon}
        </div>
      </div>
    </div>
  );
};

export const CaseStatsDashboard: React.FC<CaseStatsDashboardProps> = ({ cases }) => {
  const stats = useMemo(() => {
    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.status === 'active').length;
    const pendingCases = cases.filter(c => c.status === 'pending').length;
    const urgentCases = cases.filter(c => c.priority === 'urgent').length;
    const highPriorityCases = cases.filter(c => c.priority === 'high').length;
    const closedCases = cases.filter(c => c.status === 'closed').length;
    
    const thisWeekSessions = cases.reduce((count, caseItem) => {
      const weekSessions = caseItem.sessions?.filter(session => {
        const sessionDate = new Date(session.date);
        const now = new Date();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        return sessionDate.getTime() - now.getTime() <= oneWeek;
      }).length || 0;
      return count + weekSessions;
    }, 0);

    const pendingDocuments = cases.reduce((count, caseItem) => {
      return count + (caseItem.documents?.filter(doc => !doc.upload_date).length || 0);
    }, 0);

    const successRate = totalCases > 0 
      ? Math.round((closedCases / totalCases) * 100)
      : 0;

    return {
      totalCases,
      activeCases,
      pendingCases,
      urgentCases,
      highPriorityCases,
      thisWeekSessions,
      pendingDocuments,
      successRate,
      closedCases
    };
  }, [cases]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="إجمالي القضايا"
        value={stats.totalCases}
        icon={<FolderOpen className="w-6 h-6" />}
        color="blue"
        trend={{ value: 12, isPositive: true }}
      />
      
      <StatCard
        title="القضايا النشطة"
        value={stats.activeCases}
        icon={<CheckCircle className="w-6 h-6" />}
        color="green"
      />
      
      <StatCard
        title="جلسات هذا الأسبوع"
        value={stats.thisWeekSessions}
        icon={<Calendar className="w-6 h-6" />}
        color="orange"
        trend={{ value: 5, isPositive: false }}
      />
      
      <StatCard
        title="مستندات معلقة"
        value={stats.pendingDocuments}
        icon={<FileText className="w-6 h-6" />}
        color="red"
      />
      
      <StatCard
        title="قضايا عاجلة"
        value={stats.urgentCases}
        icon={<AlertTriangle className="w-6 h-6" />}
        color="red"
      />
      
      <StatCard
        title="قضايا عالية الأولوية"
        value={stats.highPriorityCases}
        icon={<TrendingUp className="w-6 h-6" />}
        color="orange"
      />
      
      <StatCard
        title="قضايا منتظرة"
        value={stats.pendingCases}
        icon={<FileText className="w-6 h-6" />}
        color="purple"
      />
      
      <StatCard
        title="معدل الإنجاز"
        value={`${stats.successRate}%`}
        icon={<TrendingUp className="w-6 h-6" />}
        color="green"
      />
    </div>
  );
};