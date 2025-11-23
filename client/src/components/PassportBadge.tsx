interface PassportBadgeProps {
  country: string
  visited: boolean
  onClick?: () => void
}

const PassportBadge = ({ country, visited, onClick }: PassportBadgeProps) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        visited
          ? 'bg-green-50 border-green-500 hover:bg-green-100'
          : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-800">{country}</span>
        {visited && (
          <span className="text-green-600 text-sm font-medium">✓ Visited</span>
        )}
      </div>
    </div>
  )
}

export default PassportBadge

