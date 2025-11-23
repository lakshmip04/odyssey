import { useRef } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ThreeDPhotoCarousel from '../components/ThreeDPhotoCarousel'
import { RetroGrid } from '../components/ui/retro-grid'
import TrueFocus from '../components/TrueFocus'
import BoxCarousel, { type BoxCarouselRef, type CarouselItem } from '../components/fancy/carousel/box-carousel'
import useScreenSize from '../hooks/use-screen-size'

const Landing = () => {
  const screenSize = useScreenSize()
  const planTripCarouselRef = useRef<BoxCarouselRef>(null)
  const travelGuideCarouselRef = useRef<BoxCarouselRef>(null)
  const trackVisitsCarouselRef = useRef<BoxCarouselRef>(null)

  // Responsive dimensions
  const getCarouselDimensions = () => {
    if (screenSize.lessThan('md')) {
      return { width: 200, height: 150 }
    }
    return { width: 300, height: 200 }
  }

  const { width, height } = getCarouselDimensions()

  // Plan Your Trip images - extracted from provided Unsplash URLs
  const planTripItems: CarouselItem[] = [
    {
      id: '1',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&auto=format',
      alt: 'Planning trip with laptop and maps',
    },
    {
      id: '2',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=600&fit=crop&auto=format',
      alt: 'Person holding map',
    },
    {
      id: '3',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop&auto=format',
      alt: 'Travel planning text',
    },
  ]

  // Travel Guide images - extracted from provided Unsplash URLs
  const travelGuideItems: CarouselItem[] = [
    {
      id: '1',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop&auto=format',
      alt: 'Travel guide on phone',
    },
    {
      id: '2',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&auto=format',
      alt: 'Woman with camera and clipboard',
    },
    {
      id: '3',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop&auto=format',
      alt: 'Person holding phone',
    },
    {
      id: '4',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop&auto=format',
      alt: 'Compass app in desert',
    },
  ]

  // Track Visits images - extracted from provided Unsplash URLs
  const trackVisitsItems: CarouselItem[] = [
    {
      id: '1',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop&auto=format',
      alt: 'Person with phone tracking visits',
    },
    {
      id: '2',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&auto=format',
      alt: 'Map, camera and watch on table',
    },
    {
      id: '3',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop&auto=format',
      alt: 'Trip planning with map',
    },
  ]

  return (
    <div className="w-full bg-[#efefef] items-center justify-center h-full overflow-auto">
      {/* Main content - relative positioning with higher z-index */}
      <div className="relative w-full h-dvh z-10 bg-background">
        <div className="relative z-20">
          <Navbar />
        </div>
        <RetroGrid />
        <div className="relative flex flex-col items-center justify-center h-full py-8 md:py-12">
          {/* Title Section */}
          <div className="text-center px-4 mb-0 mt-8 md:mt-12 z-30">
            <div className="mb-0 mt-16 md:mt-24">
              <TrueFocus
                sentence="Welcome to|Odyssey"
                separator="|"
                manualMode={false}
                blurAmount={5}
                borderColor="#3b82f6"
                animationDuration={2}
                pauseBetweenAnimations={0.5}
              />
            </div>
            <p className="text-sm md:text-lg text-gray-600 dark:text-gray-300 mb-0 max-w-2xl mx-auto mt-1">
              Plan your perfect journey, track your adventures, and share your
              travel stories with the world.
            </p>
          </div>
          
          {/* 3D Photo Carousel */}
          <div className="w-full px-4 mb-4 md:mb-6 z-30 -mt-16 md:-mt-24">
            <ThreeDPhotoCarousel />
          </div>

          {/* Scroll Down Indicator */}
          {/* <div className="text-2xl md:text-4xl font-bold uppercase flex justify-center items-center text-gray-600 dark:text-gray-400 mt-8 z-30">
            Scroll down ↓
          </div> */}
        </div>
      </div>

      {/* Sticky footer - lower z-index, sticky position, bottom-0 */}
      <div className="sticky z-0 bottom-0 left-0 w-full min-h-screen bg-[#1F2937] flex justify-center items-center">
        <div className="relative overflow-hidden w-full h-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Plan Your Trip */}
              <div className="text-center p-6 rounded-lg">
                <div className="flex justify-center mb-4">
                  <BoxCarousel
                    ref={planTripCarouselRef}
                    items={planTripItems}
                    width={width}
                    height={height}
                    direction="right"
                    autoPlay
                    autoPlayInterval={1500}
                    enableDrag
                    perspective={1000}
                  />
                </div>
                <div className="text-4xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold mb-2 text-white">Plan Your Trip</h3>
                <p className="text-gray-300">
                  Create detailed itineraries and explore destinations on an
                  interactive map.
                </p>
              </div>

              {/* Travel Guide */}
              <div className="text-center p-6 rounded-lg">
                <div className="flex justify-center mb-4">
                  <BoxCarousel
                    ref={travelGuideCarouselRef}
                    items={travelGuideItems}
                    width={width}
                    height={height}
                    direction="right"
                    autoPlay
                    autoPlayInterval={1500}
                    enableDrag
                    perspective={1000}
                  />
                </div>
                <div className="text-4xl mb-4">📖</div>
                <h3 className="text-xl font-semibold mb-2 text-white">Travel Guide</h3>
                <p className="text-gray-300">
                  Access comprehensive travel guides, tips, and recommendations
                  from experienced travelers.
                </p>
              </div>

              {/* Track Visits */}
              <div className="text-center p-6 rounded-lg">
                <div className="flex justify-center mb-4">
                  <BoxCarousel
                    ref={trackVisitsCarouselRef}
                    items={trackVisitsItems}
                    width={width}
                    height={height}
                    direction="right"
                    autoPlay
                    autoPlayInterval={1500}
                    enableDrag
                    perspective={1000}
                  />
                </div>
                <div className="text-4xl mb-4">✈️</div>
                <h3 className="text-xl font-semibold mb-2 text-white">Track Visits</h3>
                <p className="text-gray-300">
                  Build your travel passport and keep track of places you've
                  visited.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Landing

