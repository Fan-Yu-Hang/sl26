import { useEffect, useRef } from 'react'
import { Renderer, Camera, Transform, Mesh, Program, Sphere } from 'ogl'

const OrbBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const sceneRef = useRef<Transform | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    let renderer: Renderer
    let scene: Transform
    let camera: Camera
    const orbs: Mesh[] = []

    // 初始化渲染器
    const dpr = Math.min(window.devicePixelRatio, 2)
    renderer = new Renderer({
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      dpr: dpr,
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    
    // 设置 Canvas 样式
    const canvas = renderer.gl.canvas as HTMLCanvasElement
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'none'
    container.appendChild(canvas)

    // 设置场景和相机
    scene = new Transform()
    camera = new Camera(renderer.gl, {
      fov: 50,
      aspect: container.clientWidth / container.clientHeight,
      near: 0.1,
      far: 3000,
    })
    camera.position.z = 1000

    // Vertex shader
    const vertex = `
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `

    // Fragment shader - 增强的发光 orb 效果
    const fragment = `
      precision highp float;
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uIntensity;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5);
        float dist = distance(uv, center);
        
        // 创建多层径向渐变，增强发光效果
        float innerGlow = 1.0 - smoothstep(0.0, 0.3, dist);
        float outerGlow = 1.0 - smoothstep(0.3, 0.7, dist);
        float gradient = innerGlow * 1.5 + outerGlow * 0.5;
        
        // 添加动态脉冲效果
        float pulse1 = sin(uTime * 0.8) * 0.15 + 0.85;
        float pulse2 = sin(uTime * 1.2 + 1.0) * 0.1 + 0.9;
        float pulse = (pulse1 + pulse2) * 0.5;
        
        // 添加波纹效果
        float ripple = sin(dist * 10.0 - uTime * 2.0) * 0.1 + 0.9;
        
        // 鼠标交互效果（如果提供了鼠标位置）
        float mouseInfluence = 0.0;
        if (uMouse.x > 0.0 && uMouse.y > 0.0) {
          // 将屏幕坐标转换为UV坐标
          vec2 mouseUV = vec2(uMouse.x / uResolution.x, 1.0 - (uMouse.y / uResolution.y));
          // 计算从球心到鼠标的距离（需要考虑球体的世界坐标）
          float mouseDist = distance(uv, mouseUV);
          mouseInfluence = exp(-mouseDist * 3.0) * 0.4;
        }
        
        // 增强颜色强度
        vec3 baseColor = uColor * uIntensity;
        vec3 finalColor = baseColor * gradient * pulse * ripple;
        finalColor += mouseInfluence * uColor;
        
        // 增强 alpha，让球体更明显
        float alpha = gradient * 0.6 * pulse + mouseInfluence * 0.2;
        alpha = min(alpha, 0.8);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `

    // 创建更多 orb，使用更丰富的颜色
    const orbColors = [
      [0.2, 0.6, 1.0],   // 亮蓝色
      [0.1, 0.8, 0.9],   // 青色
      [0.4, 0.5, 1.0],   // 靛蓝色
      [0.7, 0.4, 1.0],   // 紫色
      [0.3, 0.7, 0.95],  // 浅蓝色
      [0.5, 0.6, 1.0],   // 淡蓝色
      [0.25, 0.65, 0.98], // 天蓝色
      [0.15, 0.75, 0.92], // 青蓝色
    ]

    const orbPositions = [
      [-400, 250, -400],
      [400, 250, -500],
      [-400, -250, -400],
      [400, -250, -500],
      [0, 150, -600],
      [-500, 0, -450],
      [500, 0, -550],
      [0, -300, -700],
    ]

    const orbSizes = [250, 300, 280, 240, 350, 220, 260, 320]

    orbColors.forEach((color, i) => {
      const geometry = new Sphere(renderer.gl, {
        radius: orbSizes[i],
        widthSegments: 64,
        heightSegments: 64,
      })

      const program = new Program(renderer.gl, {
        vertex,
        fragment,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: color },
          uResolution: { value: [container.clientWidth, container.clientHeight] },
          uMouse: { value: [0, 0] },
          uIntensity: { value: 1.2 + Math.random() * 0.3 }, // 随机强度
        },
        transparent: true,
        depthTest: true,
        depthWrite: false,
      })

      const mesh = new Mesh(renderer.gl, { geometry, program })
      mesh.position.set(orbPositions[i][0], orbPositions[i][1], orbPositions[i][2])
      mesh.setParent(scene)
      orbs.push(mesh)
    })

    // 鼠标跟随效果
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      
      // 获取容器在页面中的位置
      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // 更新所有 orb 的鼠标位置 uniform（相对于容器）
      orbs.forEach((orb) => {
        if (orb.program.uniforms.uMouse) {
          orb.program.uniforms.uMouse.value = [mouseX, mouseY]
        }
      })
    }

    window.addEventListener('mousemove', handleMouseMove)

    // 动画循环
    let time = 0
    const animate = () => {
      time += 0.015

      // 更新 orb 位置和动画 - 更明显的运动
      orbs.forEach((orb, i) => {
        const speed = 0.3 + i * 0.15
        const radiusX = 150 + i * 30
        const radiusY = 120 + i * 25
        const baseX = orbPositions[i][0]
        const baseY = orbPositions[i][1]
        const baseZ = orbPositions[i][2]
        
        // 更复杂的运动轨迹
        orb.position.x = baseX + Math.sin(time * speed) * radiusX + Math.cos(time * speed * 0.6) * radiusX * 0.5
        orb.position.y = baseY + Math.cos(time * speed * 0.8) * radiusY + Math.sin(time * speed * 0.4) * radiusY * 0.5
        orb.position.z = baseZ + Math.sin(time * speed * 0.5) * 100
        
        // 更快的旋转
        orb.rotation.y += 0.01 + i * 0.002
        orb.rotation.x += 0.008 + i * 0.001
        orb.rotation.z += 0.005 + i * 0.001

        // 更新 shader uniform
        if (orb.program.uniforms.uTime) {
          orb.program.uniforms.uTime.value = time + i * 0.5
        }
      })

      // 轻微的相机移动，增强动态感
      camera.position.x = Math.sin(time * 0.1) * 50
      camera.position.y = Math.cos(time * 0.15) * 30

      camera.updateMatrixWorld()
      renderer.render({ scene, camera })
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    // 处理窗口大小变化
    const handleResize = () => {
      if (!container || !renderer || !camera) return
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      camera.perspective({
        aspect: width / height,
      })
      camera.updateMatrixWorld()
      orbs.forEach((orb) => {
        if (orb.program.uniforms.uResolution) {
          orb.program.uniforms.uResolution.value = [width, height]
        }
      })
    }

    window.addEventListener('resize', handleResize)

    // 保存引用
    rendererRef.current = renderer
    sceneRef.current = scene
    cameraRef.current = camera

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (container && renderer?.gl?.canvas) {
        container.removeChild(renderer.gl.canvas)
      }
      renderer = null as any
      scene = null as any
      camera = null as any
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

export default OrbBackground
