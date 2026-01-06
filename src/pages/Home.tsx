import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ImageBox from '../components/ImageBox'
import { 
  scrollFadeInUp, 
  staggerFadeInUp, 
  scrollScaleIn,
  hover3DTilt,
  cleanupScrollTriggers 
} from '../utils/animations'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Home = () => {
  const featuresSectionRef = useRef<HTMLDivElement>(null)
  const featuresTitleRef = useRef<HTMLHeadingElement>(null)
  const featuresCardsRef = useRef<HTMLDivElement[]>([])
  const mainSectionRef = useRef<HTMLDivElement>(null)
  const features2SectionRef = useRef<HTMLDivElement>(null)
  const features2CardsRef = useRef<HTMLDivElement[]>([])
  const casesTitleRef = useRef<HTMLHeadingElement>(null)
  const casesCardsRef = useRef<HTMLDivElement[]>([])
  const numberRefs = useRef<HTMLSpanElement[]>([])
  const [currentSlide, setCurrentSlide] = useState(1) // 默认显示中间的（索引1，对应第2个）
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    // Handle resize for responsive carousel
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    
    // Handle anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href^="#"]')
      if (anchor) {
        const href = anchor.getAttribute('href')
        if (href && href !== '#') {
          e.preventDefault()
          const element = document.querySelector(href)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      }
    }

    document.addEventListener('click', handleAnchorClick)

    // GSAP 滚动动画 - 使用 setTimeout 确保 DOM 已渲染
    const cleanupFunctions: Array<() => void> = []
    
    const timer = setTimeout(() => {
      // Features Section 标题
      if (featuresTitleRef.current) {
        scrollFadeInUp(featuresTitleRef.current)
      }

      // Features Section 卡片 - 使用交错缩放动画
      const featuresCards = featuresCardsRef.current.filter(Boolean)
      if (featuresCards.length > 0) {
        staggerFadeInUp(featuresCards, 0.2)
        // 为卡片添加3D倾斜效果
        featuresCards.forEach((card) => {
          if (card) {
            const cleanup = hover3DTilt(card)
            if (cleanup) {
              cleanupFunctions.push(cleanup)
            }
          }
        })
      }

      // Main Section - 使用缩放动画
      if (mainSectionRef.current) {
        scrollScaleIn(mainSectionRef.current)
      }

      // Features2 Section 标题
      if (features2SectionRef.current) {
        const title = features2SectionRef.current.querySelector('h2')
        if (title) {
          scrollFadeInUp(title)
        }
      }

      // Features2 Section 卡片 - 使用交错缩放动画
      const features2Cards = features2CardsRef.current.filter(Boolean)
      if (features2Cards.length > 0) {
        staggerFadeInUp(features2Cards, 0.2)
        // 为卡片添加3D倾斜效果
        features2Cards.forEach((card) => {
          if (card) {
            const cleanup = hover3DTilt(card)
            if (cleanup) {
              cleanupFunctions.push(cleanup)
            }
          }
        })
      }

      // Cases Section 标题
      if (casesTitleRef.current) {
        scrollFadeInUp(casesTitleRef.current)
      }

      // Cases Section 卡片 - 使用交错缩放动画
      const casesCards = casesCardsRef.current.filter(Boolean)
      if (casesCards.length > 0) {
        staggerFadeInUp(casesCards, 0.15)
        // 为卡片添加3D倾斜效果
        casesCards.forEach((card) => {
          if (card) {
            const cleanup = hover3DTilt(card)
            if (cleanup) {
              cleanupFunctions.push(cleanup)
            }
          }
        })
      }

      // 数字递增动画
      const numberElements = numberRefs.current.filter(Boolean)
      numberElements.forEach((element, index) => {
        if (element) {
          const targetNumber = parseInt(element.getAttribute('data-target') || '0')
          const duration = 2
          const delay = index * 0.2
          const obj = { value: 0 }
          
          gsap.to(obj, {
            value: targetNumber,
            duration: duration,
            delay: delay,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
            onUpdate: function() {
              const currentValue = Math.floor(obj.value)
              if (element) {
                element.textContent = currentValue.toString().padStart(2, '0')
              }
            },
          })
        }
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleAnchorClick)
      cleanupScrollTriggers()
      // 清理所有hover效果
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }, [])

  const features = [
    {
      image: '/images/img1.jpg',
      title: '半透明界面，方便观看',
      description:
        '如果是笔记本用户，在学习教程的时候，不得不频繁在视频、操作软件之间切换，SeeLayer 的教程是半透明',
    },
    {
      image: '/images/img2.jpg',
      title: '全透明界面，鼠标穿透',
      description: '鼠标穿透，不影响操作',
    },
    {
      image: '/images/img3.jpg',
      title: '动态调整，实时更新',
      description:
        '对厂商来说，每次软件更新了内容，会有一堆人追着问如何操作，之前的功能演示视频，反而成了待更新的错误信息，透见 SeeLayer 的核心俩功能之一，就是实时更新动动鼠标，文字随动',
    },
  ]

  const pricingFeatures = [
    {
      image: '/images/img4.jpg',
      title: 'To C',
      subtitle: '优秀的产品体验',
      description:
        '目前只有文字功能，之后会加入语音，如果文字标记演示不便，加一段能吐槽的语音，穿透体验比视频来说要好太多，可以留下邮箱，我们会把优先名额，放给排队的用户~',
    },
    {
      image: '/images/img5.jpg',
      title: 'To Ad',
      subtitle: '自由的广告发布',
      description:
        '开启定位权限，可发布找搭子的扩列广告，别害羞推销自己，十几亿人，多小众的爱好都有当然，我们更推荐，发布自己的工作流广告，找到正在受苦受难的的远程伙伴，不断交流经验，工作效率提升，工资也能有提升',
    },
    {
      image: '/images/img6.jpg',
      title: 'To B',
      subtitle: '便捷的实时更新',
      description:
        '对厂商来说，每次软件更新了内容，会有一堆人追着问如何操作，之前的功能演示视频，反而成了待更新的错误信息，透见 SeeLayer 的核心俩功能之一，就是实时更新动动鼠标，文字随动',
    },
  ]

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden" style={{ backgroundColor: '#EFEFE9' }}>
      <Header showHero={true} />

      {/* Features Section */}
      <section id="features" ref={featuresSectionRef} className="py-20 bg-white scroll-mt-20 mb-5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 ref={featuresTitleRef} className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 opacity-0">
              软件导航——职场容易忽视的盲区
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              透见 SeeLayer，发明灵感来源于硬件工作的繁琐，软件的更新，视频/图片的教程，遮盖原来的界面？
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                ref={(el) => {
                  if (el) featuresCardsRef.current[index] = el
                }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 opacity-0"
                style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Section */}
      <section id="main" ref={mainSectionRef} className="py-20 bg-white scroll-mt-20 my-5 opacity-0">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
             操作文档
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            鲜有领导意识到，公司内部缺少学习机制很多工具，员工需要花很大精力去了解如何操作，如何嵌入现有的工作流我们要自己
            向上管理！
          </p>
        </div>
      </section>

      {/* Image Boxes Section - 从 HTML 文件提取的功能 */}
      <section className="py-10 md:py-20 bg-gradient-to-b from-gray-50 to-white my-5 overflow-hidden">
        <div className="container mx-auto px-4 md:px-0">
          <div className="w-full mx-auto flex justify-center" style={{ maxWidth: '1600px' }}>
            {/* Swiper 容器 */}
            <div className="relative" style={{ height: windowWidth < 768 ? 'auto' : '400px', width: '100%', overflow: 'visible' }}>
              <div 
                className="flex items-center transition-transform duration-500 ease-out h-full"
                style={{
                  transform: `translateX(calc(50% - ${(windowWidth < 768 ? windowWidth * 0.85 : 820) / 2}px - ${currentSlide} * ${(windowWidth < 768 ? windowWidth * 0.85 : 820) + (windowWidth < 768 ? 20 : 112)}px))`
                }}
              >
                {[1, 2, 3].map((boxIndex, index) => (
                  <div
                    key={boxIndex}
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: windowWidth < 768 ? '85vw' : '820px',
                      marginRight: index < 2 ? (windowWidth < 768 ? '20px' : '112px') : '0',
                      transform: index === currentSlide ? 'scale(1)' : 'scale(0.85)',
                      opacity: index === currentSlide ? 1 : 0.5,
                      transition: 'transform 0.5s ease-out, opacity 0.5s ease-out'
                    }}
                  >
                    <ImageBox />
                  </div>
                ))}
              </div>
              
              {/* 导航按钮 */}
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 md:p-3 shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentSlide === 0}
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentSlide(Math.min(2, currentSlide + 1))}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 md:p-3 shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentSlide === 2}
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Carousel */}
      {/* <div className="my-5">
        <Carousel items={carouselItems} />
      </div> */}

      {/* Cases Section - 案例汇聚 */}
      {/* <section id="cases" ref={casesSectionRef} className="py-20 bg-gradient-to-b from-white to-gray-50 scroll-mt-20 my-5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 ref={casesTitleRef} className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 opacity-0">
              案例汇聚
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              汇聚各行业成功应用案例，展示 SeeLayer 在不同场景下的创新应用
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="mb-2">
                  <span
                    ref={(el) => {
                      if (el) {
                        numberRefs.current[index] = el
                        el.setAttribute('data-target', stat.value.toString())
                      }
                    }}
                    className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  >
                    00
                  </span>
                  <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.suffix}
                  </span>
                </div>
                <p className="text-gray-600 text-sm md:text-base font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cases.map((caseItem, index) => (
              <div
                key={caseItem.id}
                ref={(el) => {
                  if (el) casesCardsRef.current[index] = el
                }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 opacity-0 group"
                style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={caseItem.image}
                    alt={caseItem.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-sm font-bold text-blue-600">{caseItem.number}</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-xs font-semibold text-white">{caseItem.category}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl font-bold text-gray-300 mr-3">{caseItem.number}</span>
                    <h3 className="text-xl font-bold text-gray-900 flex-1">
                      {caseItem.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {caseItem.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                      {caseItem.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Features2 Section */}
      <section id="features2" ref={features2SectionRef} className="py-20 bg-white scroll-mt-20 mt-5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 opacity-0">
              基本不花钱！嘿嘿嘿 想不到吧
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed opacity-0" style={{ opacity: 1 }}>
              <span className="block">透见 SeeLayer 的 90% 功能，免费注册就能实现</span>
              <span className="block mt-2">"按日计价"意味着，会员时间只算实际打开的天数，并非 365 天计价</span>
              <span className="block mt-2">比如年初充值成为会员，但是全年实际只使用了 100 天，第二年会员权益还剩 265 天</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingFeatures.map((feature, index) => (
              <div
                key={index}
                ref={(el) => {
                  if (el) {
                    features2CardsRef.current[index] = el
                  }
                }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 opacity-0"
                style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-blue-600 font-semibold mb-4">
                    {feature.subtitle}
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home
