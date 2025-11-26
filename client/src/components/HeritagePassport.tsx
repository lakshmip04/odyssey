import { motion } from 'framer-motion'
import { Award, Lock, Sparkles, Trophy, Star, BookOpen } from 'lucide-react'
import { Card } from './ui/card'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  maxProgress: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: Date
}

interface HeritagePassportProps {
  badges: Badge[]
}

const HeritagePassport = ({ badges }: HeritagePassportProps) => {
  const getRarityColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-300 bg-gray-50'
      case 'rare':
        return 'border-blue-300 bg-blue-50'
      case 'epic':
        return 'border-purple-300 bg-purple-50'
      case 'legendary':
        return 'border-amber-300 bg-amber-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  const getRarityIcon = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common':
        return <Star className="w-4 h-4 text-gray-500" />
      case 'rare':
        return <Award className="w-4 h-4 text-blue-500" />
      case 'epic':
        return <Sparkles className="w-4 h-4 text-purple-500" />
      case 'legendary':
        return <Trophy className="w-4 h-4 text-amber-500" />
      default:
        return <Star className="w-4 h-4 text-gray-500" />
    }
  }

  const unlockedBadges = badges.filter(b => b.unlocked)
  const lockedBadges = badges.filter(b => !b.unlocked)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Badges</p>
              <p className="text-2xl font-bold text-gray-900">{badges.length}</p>
            </div>
            <Award className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unlocked</p>
              <p className="text-2xl font-bold text-gray-900">{unlockedBadges.length}</p>
            </div>
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {badges.length > 0 ? Math.round((unlockedBadges.length / badges.length) * 100) : 0}%
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Unlocked Badges */}
      {unlockedBadges.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Unlocked Badges ({unlockedBadges.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-6 border-2 ${getRarityColor(badge.rarity)} relative overflow-hidden`}>
                  <div className="absolute top-2 right-2">
                    {getRarityIcon(badge.rarity)}
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                      {badge.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">{badge.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                      {badge.unlockedAt && (
                        <p className="text-xs text-gray-500">
                          Unlocked: {badge.unlockedAt.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" />
            Locked Badges ({lockedBadges.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 border-2 border-gray-200 bg-gray-50 relative overflow-hidden opacity-75">
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-2xl font-bold">
                      {badge.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-500 mb-1">{badge.name}</h4>
                      <p className="text-sm text-gray-400 mb-2">{badge.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{badge.progress}/{badge.maxProgress}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gray-400 h-2 rounded-full transition-all"
                            style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default HeritagePassport

