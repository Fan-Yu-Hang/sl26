import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// 注册 ScrollTrigger 插件
gsap.registerPlugin(ScrollTrigger)

// 淡入向上动画 - 增强版，带旋转和模糊
export const fadeInUp = (element: HTMLElement | string, delay = 0) => {
  gsap.fromTo(
    element,
    {
      opacity: 0,
      y: 60,
      rotationX: -15,
      filter: 'blur(10px)',
    },
    {
      opacity: 1,
      y: 0,
      rotationX: 0,
      filter: 'blur(0px)',
      duration: 1.2,
      delay,
      ease: 'power4.out',
    }
  )
}

// 淡入动画 - 增强版，带缩放
export const fadeIn = (element: HTMLElement | string, delay = 0) => {
  gsap.fromTo(
    element,
    {
      opacity: 0,
      scale: 0.95,
    },
    {
      opacity: 1,
      scale: 1,
      duration: 1,
      delay,
      ease: 'power3.out',
    }
  )
}

// 滚动触发动画 - 淡入向上，增强版
export const scrollFadeInUp = (element: HTMLElement | string) => {
  gsap.fromTo(
    element,
    {
      opacity: 0,
      y: 80,
      rotationX: -10,
      filter: 'blur(8px)',
    },
    {
      opacity: 1,
      y: 0,
      rotationX: 0,
      filter: 'blur(0px)',
      duration: 1.2,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        end: 'top 50%',
        toggleActions: 'play none none reverse',
        markers: false,
      },
    }
  )
}

// 滚动触发动画 - 淡入，增强版
export const scrollFadeIn = (element: HTMLElement | string) => {
  gsap.fromTo(
    element,
    {
      opacity: 0,
      scale: 0.9,
    },
    {
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        end: 'top 50%',
        toggleActions: 'play none none reverse',
      },
    }
  )
}

// 滚动触发 - 缩放进入
export const scrollScaleIn = (element: HTMLElement | string) => {
  gsap.fromTo(
    element,
    {
      opacity: 0,
      scale: 0.7,
      rotation: -5,
    },
    {
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: 1,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        end: 'top 50%',
        toggleActions: 'play none none reverse',
      },
    }
  )
}

// 为多个元素创建交错动画 - 增强版
export const staggerFadeInUp = (
  elements: HTMLElement[] | string,
  staggerDelay = 0.15
) => {
  // 如果 elements 是数组且为空，直接返回
  if (Array.isArray(elements) && elements.length === 0) {
    return
  }
  
  // 如果 elements 是数组，使用第一个元素作为 trigger
  const trigger = Array.isArray(elements) && elements.length > 0 
    ? (elements[0].parentElement || elements[0])
    : elements
    
  gsap.fromTo(
    elements,
    {
      opacity: 0,
      y: 80,
      rotationX: -10,
      filter: 'blur(8px)',
      scale: 0.9,
    },
    {
      opacity: 1,
      y: 0,
      rotationX: 0,
      filter: 'blur(0px)',
      scale: 1,
      duration: 1,
      stagger: staggerDelay,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: trigger,
        start: 'top 85%',
        end: 'top 50%',
        toggleActions: 'play none none reverse',
      },
    }
  )
}

// 鼠标悬浮动画 - 3D倾斜效果
export const hover3DTilt = (element: HTMLElement) => {
  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateX = ((y - centerY) / centerY) * -10
    const rotateY = ((x - centerX) / centerX) * 10
    
    gsap.to(element, {
      rotationX: rotateX,
      rotationY: rotateY,
      transformPerspective: 1000,
      duration: 0.3,
      ease: 'power2.out',
    })
  }
  
  const handleMouseLeave = () => {
    gsap.to(element, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.5,
      ease: 'power2.out',
    })
  }
  
  element.addEventListener('mousemove', handleMouseMove)
  element.addEventListener('mouseleave', handleMouseLeave)
  
  return () => {
    element.removeEventListener('mousemove', handleMouseMove)
    element.removeEventListener('mouseleave', handleMouseLeave)
  }
}

// 清理 ScrollTrigger 实例
export const cleanupScrollTriggers = () => {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
}

