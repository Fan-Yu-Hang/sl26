import { useEffect, useRef, useState } from 'react'
import { scrollFadeIn } from '../utils/animations'

interface CarouselItem {
  id: number
  image: string
  title: string
  description: string
}

interface CarouselProps {
  items: CarouselItem[]
}

const Carousel = ({ items }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setIsLoaded(true)
    
    // GSAP 滚动动画
    const timer = setTimeout(() => {
      if (sectionRef.current) {
        scrollFadeIn(sectionRef.current)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return

    const cardWidth = 320
    const gap = 24
    const scrollAmount = cardWidth + gap

    if (direction === 'left') {
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      setCurrentIndex((prev) => Math.max(0, prev - 1))
    } else {
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))
    }
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  return (
    <section ref={sectionRef} className="py-20 bg-white opacity-0">
      <div className="container mx-auto px-4">
        <div className="relative">
          {/* Navigation Buttons */}
          {!isMobile && (
            <>
              <button
                onClick={() => scroll('left')}
                disabled={currentIndex === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
                aria-label="Previous"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={currentIndex >= items.length - 1}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
                aria-label="Next"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Carousel Container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`flex-shrink-0 w-80 bg-white rounded-2xl shadow-lg overflow-hidden snap-center transition-all duration-500 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                } hover:shadow-2xl transform hover:-translate-y-2`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Scrollbar Indicator (Mobile) */}
          {isMobile && (
            <div className="flex justify-center mt-4 space-x-2">
              {items.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-8 bg-blue-600'
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

    </section>
  )
}

export default Carousel
