'use client'

interface Consultation {
  id: string
  title: string
  status: string
  date: string
  lawyer_name?: string
}

export default function ConsultationsList({
  consultations
}: {
  consultations: Consultation[]
}) {
  if (!consultations || consultations.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12">
        لا توجد استشارات حتى الآن
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {consultations.map((c) => (
        <div
          key={c.id}
          className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:justify-between md:items-center"
        >
          <div>
            <h4 className="font-medium text-gray-900">{c.title}</h4>
            <p className="text-sm text-gray-600 mt-1">
              المحامي: {c.lawyer_name ?? 'غير محدد'}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-3 md:mt-0">
            <span
              className={`px-2 py-1 text-sm rounded-full ${
                c.status === 'مكتملة'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {c.status}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(c.date).toLocaleDateString('ar')}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
