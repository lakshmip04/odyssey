import { motion } from 'framer-motion'
import { MapPin, Star, Plus, Check, BookOpen } from 'lucide-react'
import { HeritageSite } from '../lib/placesApi'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface HeritageSiteCardProps {
  site: HeritageSite
  onAddToItinerary?: (site: HeritageSite) => void
  onMarkAsVisited?: (site: HeritageSite) => void
  isInItinerary?: boolean
  index?: number
}

const HeritageSiteCard = ({ 
  site, 
  onAddToItinerary,
  onMarkAsVisited,
  isInItinerary = false,
  index = 0 
}: HeritageSiteCardProps) => {
  const getHeritageBadgeColor = (type?: string) => {
    switch (type) {
      case 'UNESCO':
        return 'bg-gradient-to-r from-amber-500 to-orange-500'
      case 'National':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500'
      case 'Regional':
        return 'bg-gradient-to-r from-green-500 to-emerald-500'
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
        <div className="relative">
          {/* Heritage Badge */}
          {site.heritageType && (
            <div className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-white text-xs font-semibold ${getHeritageBadgeColor(site.heritageType)}`}>
              {site.heritageType}
            </div>
          )}
          
          {/* Placeholder Image */}
          <div className="h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
            <MapPin className="w-16 h-16 text-primary/40" />
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-1">{site.name}</h3>
              {site.category && (
                <p className="text-sm text-muted-foreground mb-2">{site.category}</p>
              )}
            </div>
            {site.rating && (
              <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold">{site.rating}</span>
              </div>
            )}
          </div>

          {site.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {site.description}
            </p>
          )}

          {site.address && (
            <div className="flex items-start gap-2 mb-4 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{site.address}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => onAddToItinerary?.(site)}
              disabled={isInItinerary}
              className={`flex-1 ${
                isInItinerary
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
              }`}
              size="sm"
            >
              {isInItinerary ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Itinerary
                </>
              )}
            </Button>
            {onMarkAsVisited && (
              <Button
                onClick={() => onMarkAsVisited(site)}
                variant="outline"
                size="sm"
                className="bg-[#BEF265] hover:bg-[#A3E635] text-green-900 border-[#BEF265]"
              >
                <BookOpen className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default HeritageSiteCard

