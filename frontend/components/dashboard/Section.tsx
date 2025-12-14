export default function Section({
  title,
  children
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      {title && (
        <h2 className="text-2xl font-semibold text-[#0f172a] mb-4">{title}</h2>
      )}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-[#e2e8f0]">
        {children}
      </div>
    </section>
  )
}