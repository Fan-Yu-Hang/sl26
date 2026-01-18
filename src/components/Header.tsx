import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Nav from './Nav'
import OrbBackground from './OrbBackground'
import { fadeInUp, fadeIn } from '../utils/animations'

interface HeaderProps {
  showHero?: boolean
}

const Header = ({ showHero = false }: HeaderProps) => {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showHero) {
      // 标题动画
      if (titleRef.current) {
        fadeInUp(titleRef.current, 0.2)
      }
      // 步骤列表动画
      if (stepsRef.current) {
        fadeInUp(stepsRef.current, 0.6)
      }
      // 视频占位符动画
      if (videoRef.current) {
        fadeIn(videoRef.current, 0.8)
      }
    }
  }, [showHero])

  return (
    <>
      <Nav />
      {showHero && (
        <header className="relative min-h-[90vh] flex items-center justify-center overflow-hidden mt-20" style={{ backgroundColor: '#EFEFE9' }}>
          <OrbBackground />
          <div className="relative z-10 container mx-auto px-2 sm:px-4 py-20 text-center">
            <h1 
              ref={titleRef}
              className="text-base sm:text-xl md:text-3xl lg:text-5xl xl:text-7xl font-bold mb-6 leading-tight text-gray-900 opacity-0"
            >
              <Link to="/" className="hover:opacity-90 transition-opacity text-gray-900 inline-flex items-center flex-nowrap justify-center w-full max-w-full">
                <span className="whitespace-nowrap flex-shrink-0">You need a <span className='text-[#4B9755]'>dynamic</span></span>
                <div className="rotating-text mx-0.5 sm:mx-1 md:mx-2 flex-shrink-0">
                  <span className="rotating-item">Web</span>
                  <span className="rotating-item">Software</span>
                  <span className="rotating-item">App</span>
                </div>
                <span className="whitespace-nowrap flex-shrink-0 text-[#4B9755]">tutorial</span>
              </Link>
            </h1>
            
            {/* 步骤列表和视频占位符布局 */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center max-w-7xl mx-auto mt-12">
              {/* 左侧：步骤列表 */}
              <div 
                ref={stepsRef}
                className="flex-1 lg:flex-none lg:w-80 opacity-0"
              >
                <ul className="space-y-6">
                  <li className="text-lg md:text-xl font-medium text-gray-900 text-start">
                    1-3 Upload the screenshot
                  </li>
                  <li className="text-lg md:text-xl font-medium text-gray-900 text-start">
                    2-3 Label the intro
                  </li>
                  <li className="text-lg md:text-xl font-medium text-[#888888] text-start">
                    3-3 Add Al voice (waitlist...)
                  </li>
                </ul>
              </div>

              {/* 右侧：视频占位符 */}
              <div 
                ref={videoRef}
                className="flex-1 w-full lg:w-auto opacity-0"
              >
                <div className="relative w-full aspect-video bg-gray-300 rounded-lg overflow-hidden flex items-center justify-center">
                  {/* 视频占位符 - 暂时使用灰色背景 */}
                  <span className="text-gray-500 text-lg">视频占位符</span>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}
    </>
  )
}

export default Header
