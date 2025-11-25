import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MapPin, FileText, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card } from './ui/card'
import { HeritageSite } from '../lib/placesApi'

interface SaveTripDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    location: string
    start_date?: string
    end_date?: string
    description?: string
    is_smart_planned: boolean
  }) => Promise<void>
  location: string
  items: HeritageSite[]
  isLoading?: boolean
}

const SaveTripDialog = ({
  isOpen,
  onClose,
  onSave,
  location,
  items,
  isLoading = false,
}: SaveTripDialogProps) => {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [isSmartPlanned, setIsSmartPlanned] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Trip name is required')
      return
    }

    if (items.length === 0) {
      setError('Please add at least one site to your itinerary')
      return
    }

    try {
      await onSave({
        name: name.trim(),
        location,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        description: description.trim() || undefined,
        is_smart_planned: isSmartPlanned,
      })
      
      // Reset form
      setName('')
      setStartDate('')
      setEndDate('')
      setDescription('')
      setIsSmartPlanned(true)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trip')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl"
        >
          <Card className="p-6 bg-background border-2 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Save Your Trip</h2>
                  <p className="text-sm text-muted-foreground">
                    {items.length} {items.length === 1 ? 'site' : 'sites'} in itinerary
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-3">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Trip Name *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Varanasi Heritage Tour"
                  required
                  className="h-11"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={location}
                  disabled
                  className="h-11 bg-muted"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes about your trip..."
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <input
                  type="checkbox"
                  id="smartPlanned"
                  checked={isSmartPlanned}
                  onChange={(e) => setIsSmartPlanned(e.target.checked)}
                  className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                />
                <Label htmlFor="smartPlanned" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-semibold">Smart Plan Itinerary</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically optimize the route order for the most efficient travel
                  </p>
                </Label>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  {isLoading ? 'Saving...' : 'Save Trip'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default SaveTripDialog

