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
  const dividerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showHero) {
      // 标题动画
      if (titleRef.current) {
        fadeInUp(titleRef.current, 0.2)
      }
      // 分隔线动画
      if (dividerRef.current) {
        fadeIn(dividerRef.current, 0.6)
      }
      // 描述文本动画
      if (textRef.current) {
        fadeInUp(textRef.current, 0.8)
      }
      // 按钮动画
      if (buttonsRef.current) {
        fadeInUp(buttonsRef.current, 1.2)
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
                <span className="whitespace-nowrap flex-shrink-0">世界上第一款透明的</span>
                <div className="rotating-text mx-0.5 sm:mx-1 md:mx-2 flex-shrink-0">
                  <span className="rotating-item">网页</span>
                  <span className="rotating-item">应用</span>
                  <span className="rotating-item">软件</span>
                </div>
                <span className="whitespace-nowrap flex-shrink-0">导航</span>
              </Link>
            </h1>
            
            <div 
              ref={dividerRef}
              className="w-24 h-1 bg-gray-400 mx-auto my-8 opacity-0"
            ></div>
            
            <p 
              ref={textRef}
              className="text-base sm:text-lg md:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed text-gray-700 opacity-0"
            >
              <span className="block">笔记本只有单屏幕？视频/图片的教程，遮盖原来的界面？</span>
              <span className="block md:inline md:whitespace-nowrap md:ml-2">透见 SeeLayer 具备透明的界面，鼠标可以"穿透"操作；更新教程也是自动完成</span>
              <span className="block md:inline md:ml-2">哪里不会改哪里，老板再也不用担心我的学习，So easy~</span>
            </p>
            
            <div 
              ref={buttonsRef}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0"
            >
              <button
                onClick={(e) => {
                  e.preventDefault()
                  const downloadSection = document.getElementById('download')
                  if (downloadSection) {
                    downloadSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  } else {
                    // 如果找不到下载区域，滚动到页面底部
                    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
                  }
                }}
                className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                开启透明之旅 免费呦
              </button>
              <button
                onClick={() =>
                  window.open(
                    'https://space.bilibili.com/363820921/upload/video',
                    '_blank'
                  )
                }
                className="px-6 py-4 bg-white text-gray-700 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 border-2 border-gray-300"
              >
                &gt; 观看教程 <span className="text-gray-600">&nbsp;1分钟</span>
              </button>
            </div>
          </div>
        </header>
      )}
    </>
  )
}

export default Header
