export default function StatsGrid({
  stats
}: {
  stats: Record<string, { label: string; value: number; color: string }>
}) {
  // ألوان ثابتة بدلاً من الديناميكية
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800', 
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    gold: 'bg-[#fef9c3] border-[#facc15] text-[#ca8a04]',
    navy: 'bg-[#f1f5f9] border-[#cbd5e1] text-[#0f172a]'
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Object.values(stats).map((s, idx) => (
        <div 
          key={idx} 
          className={`p-6 rounded-lg border-2 ${colorClasses[s.color as keyof typeof colorClasses] || colorClasses.blue}`}
        >
          <h3 className="text-lg font-medium mb-2">
            {s.label}
          </h3>
          <p className="text-3xl font-bold">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  )
}