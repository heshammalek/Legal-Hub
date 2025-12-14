'use client'

interface Notification {
  id: string
  message: string
  read: boolean
  created_at: string
}

export default function NotificationsList({
  notifications
}: {
  notifications: Notification[]
}) {
  if (!notifications || notifications.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12">
        لا توجد إشعارات جديدة
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`border rounded-lg p-4 transition ${
            n.read
              ? 'border-gray-200 bg-gray-50'
              : 'border-blue-200 bg-blue-50'
          }`}
        >
          <p className="text-gray-900">{n.message}</p>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(n.created_at).toLocaleDateString('ar')}
          </p>
        </div>
      ))}
    </div>
  )
}
