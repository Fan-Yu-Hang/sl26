import { useEffect, useRef } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Carousel from '../components/Carousel'
import { 
  scrollFadeInUp, 
  staggerFadeInUp, 
  scrollFadeIn, 
  scrollScaleIn,
  hover3DTilt,
  cleanupScrollTriggers 
} from '../utils/animations'

const Home = () => {
  const featuresSectionRef = useRef<HTMLDivElement>(null)
  const featuresTitleRef = useRef<HTMLHeadingElement>(null)
  const featuresCardsRef = useRef<HTMLDivElement[]>([])
  const mainSectionRef = useRef<HTMLDivElement>(null)
  const features2SectionRef = useRef<HTMLDivElement>(null)
  const features2CardsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
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
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleAnchorClick)
      cleanupScrollTriggers()
      // 清理所有hover效果
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }, [])

  const carouselItems = [
    {
      id: 1,
      image: '/images/1.png',
      title: '【设计师】的 AI 工具',
      description:
        '如果是笔记本用户，在学习教程的时候，不得不频繁在视频、操作软件之间切换，SeeLayer 的教程是半透明',
    },
    {
      id: 2,
      image: '/images/2.png',
      title: '【猎头】的销售视频',
      description:
        '如果是笔记本用户，在学习教程的时候，不得不频繁在视频、操作软件之间切换，SeeLayer 的教程是半透明',
    },
    {
      id: 3,
      image: '/images/3.png',
      title: '【教师】的地图讲解',
      description:
        '如果是笔记本用户，在学习教程的时候，不得不频繁在视频、操作软件之间切换，SeeLayer 的教程是半透明',
    },
    {
      id: 4,
      image: '/images/4.png',
      title: '【程序员】的 AI 工具',
      description: '鼠标穿透，不影响操作',
    },
    {
      id: 5,
      image: '/images/5.png',
      title: '【秘书】的商务工具',
      description:
        '对厂商来说，每次软件更新了内容，会有一堆人追着问如何操作，之前的功能演示视频，反而成了待更新的错误信息，透见 SeeLayer 的核心俩功能之一，就是实时更新动动鼠标，文字随动',
    },
  ]

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
            案例汇聚 操作文档
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            鲜有领导意识到，公司内部缺少学习机制很多工具，员工需要花很大精力去了解如何操作，如何嵌入现有的工作流我们要自己
            向上管理！
          </p>
        </div>
      </section>

      {/* Carousel */}
      <div className="my-5">
        <Carousel items={carouselItems} />
      </div>

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
