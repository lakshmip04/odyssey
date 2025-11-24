import { motion } from 'framer-motion'
import { MapPin, GripVertical, X, Clock } from 'lucide-react'
import { HeritageSite } from '../lib/placesApi'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface ItineraryItemProps {
  site: HeritageSite
  index: number
  onRemove: (id: string) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
}

const ItineraryItem = ({ site, index, onRemove }: ItineraryItemProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-primary">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2 pt-1">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-lg text-foreground mb-1">
                  {site.name}
                </h4>
                {site.category && (
                  <p className="text-sm text-muted-foreground">{site.category}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(site.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {site.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {site.description}
              </p>
            )}

            {site.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{site.address}</span>
              </div>
            )}

            <div className="flex items-center gap-4 mt-3">
              {site.rating && (
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium">{site.rating}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>2-3 hours</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default ItineraryItem

