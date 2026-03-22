export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">שלום 👋</h1>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'תורים היום', value: '0' },
          { label: 'תורים מחר', value: '0' },
          { label: 'לקוחות', value: '0' },
          { label: 'הכנסה החודש', value: '₪0' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-primary-600">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
