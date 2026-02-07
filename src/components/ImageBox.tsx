import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useClerkSupabase } from '@/hooks/useClerkSupabase'
import { useUser } from '@clerk/clerk-react'

interface Mark {
    id: number
    x: number
    y: number
}

interface ImageBoxProps {
    initialImageSrc?: string
    initialTitle?: string
    initialMarks?: Mark[]
    initialTextStore?: Map<number, string> | Record<number, string>
    initialUserScale?: number
    initialTx?: number
    initialTy?: number
    id?: string
    /** 当前录音的公开地址，保存时会写入 layer_box.audio_url */
    audioUrl?: string | null
    /** 插槽：渲染在 Enter title 和 image 框之间 */
    slotBetweenTitleAndImage?: React.ReactNode
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
// Supabase Storage bucket 名称，需要和 Supabase 控制台中一致
// 如果上传失败提示 "Bucket not found"，请检查 Supabase Dashboard → Storage → Buckets 里的实际名称
const SUPABASE_BUCKET = 'SL_images'

function formatSupabaseErrorMessage(err: any) {
  const msg = (err?.message || err?.error_description || err?.error || '').toString().trim()
  if (!msg) return 'Unknown error'
  // 避免 toast 太长
  return msg.length > 120 ? `${msg.slice(0, 117)}...` : msg
}

function getExtFromFile(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName) return fromName
  const fromType = file.type.split('/').pop()?.toLowerCase()
  return fromType || 'png'
}

function makeStoragePath(file: File) {
  const ext = getExtFromFile(file)
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `uploads/${new Date().toISOString().slice(0, 10)}/${id}.${ext}`
}

export interface ImageBoxHandle {
    save: () => Promise<boolean>;
}

const ImageBox = forwardRef<ImageBoxHandle, ImageBoxProps>(({ 
    initialImageSrc = '', 
    initialTitle = '', 
    initialMarks = [],
    initialTextStore,
    initialUserScale = 1,
    initialTx = 0,
    initialTy = 0,
    id,
    audioUrl = null,
    slotBetweenTitleAndImage
}: ImageBoxProps = {}, ref) => {
    // 状态管理
    const supabase = useClerkSupabase()
    const { user: clerkUser } = useUser()
    const [imageSrc, setImageSrc] = useState<string>(initialImageSrc)
    const [marks, setMarks] = useState<Mark[]>(initialMarks)
    const [selectedMarkId, setSelectedMarkId] = useState<number | null>(null)
    const [userScale, setUserScale] = useState(initialUserScale)
    const [adjustMode, setAdjustMode] = useState(false)
    const [sliderLocked, setSliderLocked] = useState(true)
    const [textStore, setTextStore] = useState<Map<number, string>>(() => {
        if (initialTextStore) {
            if (initialTextStore instanceof Map) {
                return new Map(initialTextStore)
            } else {
                return new Map(Object.entries(initialTextStore).map(([k, v]) => [Number(k), v]))
            }
        }
        return new Map()
    })
    const [currentTextId, setCurrentTextId] = useState<number | null>(null)
    const [status, setStatus] = useState<{ text: string; type: 'info' | 'success' | 'error'; visible: boolean }>({
        text: '',
        type: 'info',
        visible: false,
    })
    const [popoverMarkId, setPopoverMarkId] = useState<number | null>(null)
    const [popoverPosition, setPopoverPosition] = useState<{ left: number; top: number } | null>(null)
    const [title, setTitle] = useState<string>(initialTitle)

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageBoxRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const sliderRef = useRef<HTMLDivElement>(null)
    const knobRef = useRef<HTMLDivElement>(null)
    const viewportRef = useRef<HTMLDivElement>(null)
    const textPanelRef = useRef<HTMLDivElement>(null)
    const seqBarRef = useRef<HTMLDivElement>(null)

    // 图片状态
    const nwRef = useRef(0) // natural width
    const nhRef = useRef(0) // natural height
    const baseScaleRef = useRef(1)
    const txRef = useRef(initialTx) // translate x
    const tyRef = useRef(initialTy) // translate y
    const nextIdRef = useRef(1)
    const userScaleRef = useRef(initialUserScale) // 用于避免闭包问题
    const hasChangedImageRef = useRef(false) // 记录是否切换过图片
    const adjustModeRef = useRef(false) // 用于避免闭包问题
    const sliderLockedRef = useRef(true) // 用于避免闭包问题
    const justLoadedRef = useRef(false) // 防止加载后立即被 applyTransform 覆盖

  // 拖拽状态
  const isDraggingRef = useRef(false)
  const isPanningRef = useRef(false)
  const isMarkDraggingRef = useRef(false)
  const lastXRef = useRef(0)
  const lastYRef = useRef(0)
  const frameRequestedRef = useRef(false)
  const longPressTimerRef = useRef<Map<number, number>>(new Map())
  const applyTransformRef = useRef<() => void>(() => {})

  // 初始化：根据传入的初始值设置 nextIdRef
  useEffect(() => {
    if (initialMarks.length > 0) {
      const maxId = Math.max(...initialMarks.map(m => m.id))
      nextIdRef.current = maxId + 1
    }
  }, []) // 只在组件挂载时执行一次


    // 工具函数：显示状态提示
    const showStatus = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
        setStatus({ text, type, visible: true })
        setTimeout(() => {
            setStatus(prev => ({ ...prev, visible: false }))
        }, 1800)
    }

  // 文件上传处理：上传到 Supabase Storage (bucket: SL_images)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      showStatus('Unsupported image format', 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      showStatus('Oversized < 10MB', 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // 先本地预览，提升体验
    const localUrl = URL.createObjectURL(file)
    setImageSrc(localUrl)
    hasChangedImageRef.current = true
    showStatus('Uploading...', 'info')

    try {
      const path = makeStoragePath(file)
      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        const statusCode = (uploadError as any)?.statusCode
        const status = (uploadError as any)?.status
        const hint =
          statusCode === '404' || status === 404
            ? `Bucket "${SUPABASE_BUCKET}" not found`
            : statusCode === '403' || status === 403
              ? 'Permission denied (Storage policy/RLS)'
              : formatSupabaseErrorMessage(uploadError)
        showStatus(`Upload failed: ${hint}`, 'error')
        return
      }

      const { data: publicData } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(path)

      const publicUrl = publicData?.publicUrl
      if (!publicUrl) {
        showStatus('Uploaded, but no public URL', 'error')
        return
      }

      setImageSrc(publicUrl)
      showStatus('Uploaded', 'success')
    } catch (err: any) {
      console.error('Upload failed:', err)
      showStatus('Upload failed', 'error')
    } finally {
      // 清理本地预览 URL（延迟清理，确保图片已加载）
      setTimeout(() => {
        try {
          URL.revokeObjectURL(localUrl)
        } catch {}
      }, 1000)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 图片加载完成处理 - 简化版本
  useEffect(() => {
    const img = imageRef.current
    const box = imageBoxRef.current
    if (!img || !box || !imageSrc) return

    const handleLoad = () => {
      const nw = img.naturalWidth
      const nh = img.naturalHeight
      if (!nw || !nh) return
      
      // 保存尺寸
      nwRef.current = nw
      nhRef.current = nh
      
      // 获取容器尺寸
      const rect = box.getBoundingClientRect()
      const cw = rect.width
      const ch = rect.height
      
      // 计算缩放比例使图片适应容器
      const scale = Math.min(cw / nw, ch / nh)
      baseScaleRef.current = scale
      
      const isInitialImage = imageSrc === initialImageSrc && !hasChangedImageRef.current
      
      // 设置或恢复偏移和缩放
      if (isInitialImage) {
        txRef.current = initialTx
        tyRef.current = initialTy
        userScaleRef.current = initialUserScale
      } else {
        txRef.current = 0
        tyRef.current = 0
        userScaleRef.current = 1
      }
      
      const currentScale = scale * userScaleRef.current
      
      // 计算居中位置
      const sw = nw * currentScale
      const sh = nh * currentScale
      const centerX = (cw - sw) / 2
      const centerY = (ch - sh) / 2
      
      // 应用偏移
      const x = centerX + txRef.current
      const y = centerY + tyRef.current
      
      // 直接设置 transform 居中显示
      img.style.transition = 'none'
      img.style.transform = `translate(${x}px, ${y}px) scale(${currentScale})`
      
      // 设置标志，防止 useEffect 中的 applyTransform 覆盖位置
      justLoadedRef.current = true
      
      // 延迟恢复 transition 和更新状态
      requestAnimationFrame(() => {
        img.style.transition = 'transform 300ms ease-out'
        setUserScale(userScaleRef.current)
        setAdjustMode(true)
        setSliderLocked(false)
        if (overlayRef.current) {
          overlayRef.current.style.pointerEvents = 'none'
        }
        showStatus('Uploaded', 'success')
        
        // 下一帧后清除标志
        requestAnimationFrame(() => {
          justLoadedRef.current = false
        })
      })
    }

    // 监听加载事件
    if (img.complete && img.naturalWidth > 0) {
      handleLoad()
    } else {
      img.onload = handleLoad
      return () => { img.onload = null }
    }
  }, [imageSrc])

    // 应用图片变换（统一函数）
    const applyTransform = () => {
        const img = imageRef.current
        const box = imageBoxRef.current
        // 使用 ref 检查 src，避免 stale closure
        if (!img || !box || !img.src || !nwRef.current) return
        
        const currentScale = baseScaleRef.current * userScaleRef.current
        const rect = box.getBoundingClientRect()
        const cw = rect.width
        const ch = rect.height
        const sw = nwRef.current * currentScale
        const sh = nhRef.current * currentScale
        
        // 计算居中位置
        const centerX = (cw - sw) / 2
        const centerY = (ch - sh) / 2
        
        // 应用边界限制
        let finalX = centerX + txRef.current
        let finalY = centerY + tyRef.current
        
        const buffer = 12
        if (sw <= cw) {
            finalX = centerX
            txRef.current = 0
        } else {
            finalX = Math.max(cw - sw - buffer, Math.min(buffer, finalX))
            txRef.current = finalX - centerX
        }
        if (sh <= ch) {
            finalY = centerY
            tyRef.current = 0
        } else {
            finalY = Math.max(ch - sh - buffer, Math.min(buffer, finalY))
            tyRef.current = finalY - centerY
        }
        
        img.style.transform = `translate(${finalX}px, ${finalY}px) scale(${currentScale})`
    }

    // 更新 applyTransformRef
    useEffect(() => {
        applyTransformRef.current = applyTransform
    })

    // 同步 ref 值，避免闭包问题
    useEffect(() => {
        userScaleRef.current = userScale
        adjustModeRef.current = adjustMode
        sliderLockedRef.current = sliderLocked
        // 如果刚加载完图片，不调用 applyTransform，避免覆盖居中位置
        if (justLoadedRef.current) return
        if (imageSrc && nwRef.current > 0) {
            applyTransform()
        }
    }, [userScale, adjustMode, sliderLocked, imageSrc])

    // 缩放滑条处理
    const scaleFromPos = (y: number) => {
        const trackHeight = 160
        const knobHeight = 16
        const min = 1
        const max = 3
        const clampedY = Math.max(knobHeight / 2, Math.min(trackHeight - knobHeight / 2, y))
        const t = 1 - (clampedY - knobHeight / 2) / (trackHeight - knobHeight)
        return min + t * (max - min)
    }

    const handleSliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (sliderLocked) {
            showStatus('Click LOCK', 'info')
            return
        }
        e.preventDefault()
        e.stopPropagation()
        isDraggingRef.current = true

        if (sliderRef.current) {
            const rect = sliderRef.current.getBoundingClientRect()
            const y = e.clientY - rect.top
            const newScale = scaleFromPos(y)
            setUserScale(Number(newScale.toFixed(2)))
            if (newScale === 1) {
                txRef.current = 0
                tyRef.current = 0
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current || !sliderRef.current) return
            const rect = sliderRef.current.getBoundingClientRect()
            const y = e.clientY - rect.top
            const newScale = scaleFromPos(y)
            setUserScale(Number(newScale.toFixed(2)))
            if (newScale === 1) {
                txRef.current = 0
                tyRef.current = 0
            }
        }

        const handleMouseUp = () => {
            isDraggingRef.current = false
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    }

    // 图片平移和缩放处理 - 参考 index2.html 的简单模式
    // 只绑定一次事件监听器，使用 ref 存储所有状态
    useEffect(() => {
        const viewport = viewportRef.current
        const box = imageBoxRef.current
        if (!viewport || !box) return

        // 鼠标按下
        const onMouseDown = (e: MouseEvent) => {
            if (!imageRef.current?.src) return
            // 检查是否可以平移（调整模式 或 已放大）
            if (!adjustModeRef.current && userScaleRef.current <= 1) return
            isPanningRef.current = true
            lastXRef.current = e.clientX
            lastYRef.current = e.clientY
            box.style.cursor = 'grabbing'
        }

        // 鼠标移动
        const onMouseMove = (e: MouseEvent) => {
            if (!isPanningRef.current) return
            const dx = e.clientX - lastXRef.current
            const dy = e.clientY - lastYRef.current
            lastXRef.current = e.clientX
            lastYRef.current = e.clientY
            txRef.current += dx
            tyRef.current += dy
            if (!frameRequestedRef.current) {
                frameRequestedRef.current = true
                requestAnimationFrame(() => {
                    applyTransformRef.current()
                    frameRequestedRef.current = false
                })
            }
        }

        // 鼠标松开
        const onMouseUp = () => {
            isPanningRef.current = false
            box.style.cursor = 'pointer'
        }

        // 触摸开始 - 参考 index2.html，只处理单指平移
        const onTouchStart = (e: TouchEvent) => {
            if (!imageRef.current?.src) return
            const t = e.touches[0]
            isPanningRef.current = true
            lastXRef.current = t.clientX
            lastYRef.current = t.clientY
        }

        // 触摸移动 - 参考 index2.html
        const onTouchMove = (e: TouchEvent) => {
            if (!isPanningRef.current) return
            const t = e.touches[0]
            const dx = t.clientX - lastXRef.current
            const dy = t.clientY - lastYRef.current
            lastXRef.current = t.clientX
            lastYRef.current = t.clientY
            txRef.current += dx
            tyRef.current += dy
            if (!frameRequestedRef.current) {
                frameRequestedRef.current = true
                requestAnimationFrame(() => {
                    applyTransformRef.current()
                    frameRequestedRef.current = false
                })
            }
        }

        // 触摸结束
        const onTouchEnd = () => {
            isPanningRef.current = false
        }

        // 绑定事件 - 参考 index2.html，触摸使用 passive: true
        viewport.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        viewport.addEventListener('touchstart', onTouchStart, { passive: true })
        viewport.addEventListener('touchmove', onTouchMove, { passive: true })
        viewport.addEventListener('touchend', onTouchEnd, { passive: true })

        return () => {
            viewport.removeEventListener('mousedown', onMouseDown)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            viewport.removeEventListener('touchstart', onTouchStart)
            viewport.removeEventListener('touchmove', onTouchMove)
            viewport.removeEventListener('touchend', onTouchEnd)
        }
    }, []) // 空依赖数组，只绑定一次

    // 鼠标滚轮缩放（使用原生事件监听器，参考 index2.html）
    useEffect(() => {
        const imageBox = imageBoxRef.current
        if (!imageBox) return

        const handleWheel = (e: WheelEvent) => {
            // 使用 ref 检查状态，避免闭包问题
            if (!imageRef.current?.src || sliderLockedRef.current) {
                if (sliderLockedRef.current) {
                    showStatus('Click Adjust', 'info')
                }
                return
            }
            e.preventDefault()
            e.stopPropagation()

            const rect = imageBox.getBoundingClientRect()
            const px = e.clientX - rect.left
            const py = e.clientY - rect.top
            
            // 使用函数式更新避免依赖 userScale
            setUserScale(prevUserScale => {
                const prevScale = baseScaleRef.current * prevUserScale
                const min = 1
                const max = 3
                let nextUserScale = prevUserScale + (-e.deltaY) * 0.001 * (max - min)
                nextUserScale = Math.max(min, Math.min(max, Number(nextUserScale.toFixed(2))))
                
                if (nextUserScale === prevUserScale) return prevUserScale
                
                if (nextUserScale === 1) {
                    txRef.current = 0
                    tyRef.current = 0
                } else {
                    const newScale = baseScaleRef.current * nextUserScale
                    const centerTx = (rect.width - nwRef.current * prevScale) / 2
                    const centerTy = (rect.height - nhRef.current * prevScale) / 2
                    const imgX = (px - centerTx - txRef.current) / prevScale
                    const imgY = (py - centerTy - tyRef.current) / prevScale
                    txRef.current += imgX * (prevScale - newScale)
                    tyRef.current += imgY * (prevScale - newScale)
                }
                
                return nextUserScale
            })
        }

        // 使用 passive: false 确保可以调用 preventDefault
        imageBox.addEventListener('wheel', handleWheel, { passive: false })

        return () => {
            imageBox.removeEventListener('wheel', handleWheel)
        }
    }, []) // 空依赖数组，只绑定一次

    // 双击添加标记点
    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // 只有在锁定状态下才能新增序号
        if (adjustMode) {
            showStatus('Click LOCK', 'info')
            return
        }
        if (!imageBoxRef.current || marks.length >= 8) {
            showStatus('Maximum number', 'error')
            return
        }
        const rect = imageBoxRef.current.getBoundingClientRect()
        // 直接使用鼠标点击位置，标记点使用 translate(-50%, -50%) 居中
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const newMark: Mark = {
            id: nextIdRef.current++,
            x: Math.max(0, Math.min(rect.width, x)),
            y: Math.max(0, Math.min(rect.height, y)),
        }
        setMarks([...marks, newMark])
        setSelectedMarkId(newMark.id)
        setCurrentTextId(newMark.id)
        ensureTextAreaForId(newMark.id)
        syncSequence()
    }

    // 标记点点击
    const handleMarkClick = (id: number) => {
        setSelectedMarkId(id)
        setCurrentTextId(id)
    }

    // 标记点删除：只删掉该点，其它点位置不动，内部 id 不变
    const handleDeleteMark = (id: number) => {
        // 从列表中移除该标记，其它保持原样（位置和内部 id 都不改）
        const filteredMarks = marks.filter(m => m.id !== id)
        setMarks(filteredMarks)
        setSelectedMarkId(null)
        setCurrentTextId(null)

        // 删除对应 id 的文字，其他文字保持不变
        const newTextStore = new Map(textStore)
        newTextStore.delete(id)
        setTextStore(newTextStore)

        // 下一个 id 继续自增（不因为删除而回退），避免已有点的内部 id 改变
        // nextIdRef.current 保持不动

        syncSequence()
        // 关闭 popover
        closeDeletePopover()
    }

    // 显示删除菜单
    const showDeletePopover = (markId: number, markX: number, markY: number) => {
        // 只有在锁定状态下才能删除序号
        if (adjustMode) {
            showStatus('Click LOCK', 'info')
            return
        }
        setPopoverMarkId(markId)
        // 显示在标记点右边
        setPopoverPosition({
            left: markX + 20, // 标记点右边 20px
            top: markY
        })
    }

    // 关闭删除菜单
    const closeDeletePopover = () => {
        setPopoverMarkId(null)
        setPopoverPosition(null)
    }

    // 点击外部关闭 popover
    useEffect(() => {
        if (!popoverMarkId) return

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            const popover = document.querySelector('.delete-popover')
            if (popover && !popover.contains(target)) {
                closeDeletePopover()
            }
        }

        document.addEventListener('click', handleClickOutside, true)
        return () => {
            document.removeEventListener('click', handleClickOutside, true)
        }
    }, [popoverMarkId])

    // 标记点拖拽
    const handleMarkDragStart = (e: React.MouseEvent, markId: number) => {
        if (e.button !== 0) return
        isMarkDraggingRef.current = true
        const mark = marks.find(m => m.id === markId)
        if (!mark || !imageBoxRef.current) return

        const startX = e.clientX
        const startY = e.clientY
        const startLeft = mark.x
        const startTop = mark.y

        const handleDragMove = (e: MouseEvent) => {
            if (!isMarkDraggingRef.current || !imageBoxRef.current) return
            const nx = startLeft + (e.clientX - startX)
            const ny = startTop + (e.clientY - startY)
            const rect = imageBoxRef.current.getBoundingClientRect()
            const clampedX = Math.max(0, Math.min(rect.width - 20, nx))
            const clampedY = Math.max(0, Math.min(rect.height - 20, ny))

            const updatedMarks = marks.map(m =>
                m.id === markId ? { ...m, x: clampedX, y: clampedY } : m
            )
            setMarks(updatedMarks)
        }

        const handleDragEnd = () => {
            isMarkDraggingRef.current = false
            window.removeEventListener('mousemove', handleDragMove)
            window.removeEventListener('mouseup', handleDragEnd)
            syncSequence()
        }

        window.addEventListener('mousemove', handleDragMove)
        window.addEventListener('mouseup', handleDragEnd, { once: true })
    }

    // 确保文字区域存在
    const ensureTextAreaForId = (id: number) => {
        if (textStore.has(id)) return
        const newStore = new Map(textStore)
        newStore.set(id, '')
        setTextStore(newStore)
    }

    // 同步序列条
    const syncSequence = () => {
        // 序列条会通过 marks 状态自动更新
    }

    // 调整模式切换
    const handleAdjustToggle = () => {
        const newAdjustMode = !adjustMode
        setAdjustMode(newAdjustMode)
        setSliderLocked(!newAdjustMode)
        if (overlayRef.current) {
            overlayRef.current.style.pointerEvents = newAdjustMode ? 'none' : 'auto'
        }
        if (imageBoxRef.current) {
            imageBoxRef.current.style.cursor = newAdjustMode ? 'grab' : 'pointer'
        }
    }

    // 删除图片
    const handleDelete = () => {
        if (!imageSrc) return
        if (imageRef.current) {
            imageRef.current.src = ''
            imageRef.current.style.transform = ''
        }
        setImageSrc('')
        // 保留标记点和文字，不清空
        // setMarks([]) - 已移除，保留标记点
        // setTextStore(new Map()) - 已移除，保留文字
        // nextIdRef.current = 1 - 已移除，保留ID序列
        setSelectedMarkId(null)
        setCurrentTextId(null)
        setUserScale(1)
        txRef.current = 0
        tyRef.current = 0
        setAdjustMode(false)
        setSliderLocked(true)
        
        showStatus('Deleted', 'success')
    }

    // 保存到 Supabase
    const handleSave = async () => {
        if (!imageSrc) {
            showStatus('Upload image first', 'error')
            return false
        }

        try {
            showStatus('Saving...', 'info')
            
            // 将 Map 转换为对象以便存储为 JSONB
            const textStoreObj: Record<number, string> = {}
            textStore.forEach((value, key) => {
                textStoreObj[key] = value
            })

            let query = supabase.from('layer_box')
            let result;

            const audioUrlValue = audioUrl && audioUrl.trim() !== '' ? audioUrl.trim() : null
            if (id) {
                result = await query
                    .update({
                        layer_title: title,
                        image_url: imageSrc,
                        marks: marks,
                        text_store: textStoreObj,
                        clerk_id: clerkUser?.id ?? null,
                        user_scale: userScale,
                        tx: txRef.current,
                        ty: tyRef.current,
                        audio_url: audioUrlValue
                    })
                    .eq('id', parseInt(id))
            } else {
                result = await query.insert([
                    {
                        layer_title: title,
                        image_url: imageSrc,
                        marks: marks,
                        text_store: textStoreObj,
                        clerk_id: clerkUser?.id ?? null,
                        user_scale: userScale,
                        tx: txRef.current,
                        ty: tyRef.current,
                        audio_url: audioUrlValue
                    }
                ])
            }

            const { error } = result

            if (error) {
                console.error('Error saving to Supabase:', error)
                showStatus(formatSupabaseErrorMessage(error), 'error')
                return false
            } else {
                showStatus('Saved successfully', 'success')
                return true
            }
        } catch (err) {
            console.error('Unexpected error during save:', err)
            showStatus('Failed to save data', 'error')
            return false
        }
    }

    // 暴露保存方法给外部
    useImperativeHandle(ref, () => ({
        save: handleSave
    }))



    return (
        <div className="w-full max-w-[820px] relative flex flex-col items-center">
            {/* 主容器：图片框 + 文字面板和序列条 */}
            <div className="flex flex-col md:flex-row gap-6 items-start w-full">
                {/* 左侧：缩放滑条 + 图片框 */}
                <div className="relative flex-shrink-0">
                    {/* 缩放滑条 */}
                    <div
                        ref={sliderRef}
                        className="absolute right-full mr-8 w-2.5 h-48 rounded-full bg-gradient-to-b from-gray-200 to-gray-300 shadow-inner cursor-pointer"
                        style={{ transform: 'translateY(-50%)', top: '50%' }}
                        onMouseDown={handleSliderMouseDown}
                        onClick={(e) => {
                            if (!sliderLocked) {
                                const rect = sliderRef.current?.getBoundingClientRect()
                                if (rect) {
                                    const y = e.clientY - rect.top
                                    const newScale = scaleFromPos(y)
                                    setUserScale(Number(newScale.toFixed(2)))
                                    if (newScale === 1) {
                                        txRef.current = 0
                                        tyRef.current = 0
                                    }
                                }
                            }
                        }}
                    >
                        <div
                            ref={knobRef}
                            className="absolute left-1/2 w-4 h-4 rounded-full bg-blue-600 shadow-lg cursor-ns-resize hover:bg-blue-700 transition-colors"
                            style={{
                                transform: 'translate(-50%, -50%)',
                                top: `${(1 - (userScale - 1) / 2) * 100}%`,
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation()
                                handleSliderMouseDown(e)
                            }}
                        />
                    </div>

                    {/* Title 输入框 */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter title..."
                        className="w-full md:w-[500px] h-[40px] px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-2"
                    />

                    {slotBetweenTitleAndImage}

                    {/* 图片框 */}
                    <div
                        ref={imageBoxRef}
                        className="relative w-full md:w-[500px] h-[300px] bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        onDoubleClick={handleDoubleClick}
                        // wheel 事件在原生事件监听器中处理，避免 passive 事件监听器错误
                        style={{ 
                            cursor: adjustMode ? 'grab' : 'pointer',
                            touchAction: 'none' // 阻止默认触摸行为，防止页面缩放
                        }}
                    >
                        {/* 提示文字（无图片时显示） */}
                        {!imageSrc && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50/55 backdrop-blur-sm text-gray-600 text-sm user-select-none pointer-events-none z-0">
                                Click Add to Upload Image &lt; 10MB (PNG / JPG / JPEG / WebP)
                            </div>
                        )}

                        {/* Viewport - 参考 index2.html，不使用 CSS 居中，完全靠 transform 控制位置 */}
                        <div
                            ref={viewportRef}
                            className="absolute inset-0 pointer-events-auto"
                            style={{
                                willChange: 'transform',
                                background: 'transparent',
                                zIndex: 1
                            }}
                        >
                            {imageSrc && (
                                <img
                                    ref={imageRef}
                                    src={imageSrc}
                                    alt=""
                                    className="max-w-none max-h-none select-none pointer-events-auto"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        transformOrigin: 'top left',
                                        transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
                                        willChange: 'transform',
                                        backfaceVisibility: 'hidden',
                                        WebkitUserSelect: 'none',
                                        userSelect: 'none',
                                        // react CSSProperties typings 不包含这些非标准字段，这里用 any 兼容
                                        ...( { WebkitUserDrag: 'none', userDrag: 'none' } as any ),
                                    }}
                                />
                            )}
                        </div>

                        {/* 标记点覆盖层 - 始终显示 */}
                        <div
                            ref={overlayRef}
                            className="absolute inset-0 pointer-events-none z-10"
                            style={{ pointerEvents: adjustMode ? 'none' : 'auto' }}
                        >
                            {marks.map((mark, index) => {
                                const displayIndex = index + 1
                                return (
                                <div
                                    key={mark.id}
                                    className={`absolute w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${selectedMarkId === mark.id
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'bg-transparent border-green-700'
                                        }`}
                                    style={{
                                        left: `${mark.x}px`,
                                        top: `${mark.y}px`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleMarkClick(mark.id)
                                    }}
                                    onMouseDown={(e) => {
                                        e.stopPropagation()
                                        handleMarkDragStart(e, mark.id)
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        showDeletePopover(mark.id, mark.x, mark.y)
                                    }}
                                    onTouchStart={(e) => {
                                        e.stopPropagation()
                                        // 移动端长按触发删除菜单
                                        const timer = window.setTimeout(() => {
                                            showDeletePopover(mark.id, mark.x, mark.y)
                                        }, 500)
                                        longPressTimerRef.current.set(mark.id, timer)
                                    }}
                                    onTouchEnd={(e) => {
                                        e.stopPropagation()
                                        // 清除长按定时器
                                        const timer = longPressTimerRef.current.get(mark.id)
                                        if (timer) {
                                            clearTimeout(timer)
                                            longPressTimerRef.current.delete(mark.id)
                                        }
                                    }}
                                    onTouchCancel={(e) => {
                                        e.stopPropagation()
                                        // 清除长按定时器
                                        const timer = longPressTimerRef.current.get(mark.id)
                                        if (timer) {
                                            clearTimeout(timer)
                                            longPressTimerRef.current.delete(mark.id)
                                        }
                                    }}
                                >
                                    <span
                                        className={`text-xs font-bold ${selectedMarkId === mark.id ? 'text-white' : 'text-black'
                                            }`}
                                    >
                                        {displayIndex}
                                    </span>
                                </div>
                            )})}
                        </div>

                        {/* 删除菜单 Popover */}
                        {popoverMarkId && popoverPosition && (
                            <div
                                className="absolute bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1.5 text-xs text-gray-800 z-30 flex items-center"
                                style={{
                                    left: `${popoverPosition.left}px`,
                                    top: `${popoverPosition.top}px`,
                                    transform: 'translateY(-50%)',
                                }}
                            >
                                <button
                                    type="button"
                                    className="min-w-[64px] h-7 rounded-md bg-white border border-red-500 text-red-500 text-xs cursor-pointer transition-all hover:opacity-85 active:scale-[0.97]"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteMark(popoverMarkId)
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        )}

                        {/* 状态提示 */}
                        {status.visible && (
                            <div
                                className={`absolute left-2.5 bottom-2.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-white shadow-md backdrop-blur-sm z-20 ${status.type === 'info'
                                        ? 'bg-gray-700/90'
                                        : status.type === 'success'
                                            ? 'bg-teal-700/90'
                                            : 'bg-red-700/90'
                                    }`}
                            >
                                {status.text}
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 mt-4 w-full justify-between">
                        <button
                            type="button"
                            className={`px-4 py-2 rounded text-sm font-medium transition-all ${adjustMode
                                    ? 'bg-green-500 text-white border border-green-500'
                                    : 'bg-gray-400 text-white border border-gray-400'
                                }`}
                            onClick={handleAdjustToggle}
                        >
                            {adjustMode ? 'Adjust' : 'LOCK'}
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="px-4 py-2 rounded text-sm font-medium bg-white text-red-600 border border-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleDelete}
                                disabled={!imageSrc}
                            >
                                Delete
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 rounded text-sm font-medium bg-white text-green-600 border border-green-600 hover:bg-green-50 transition-colors"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    fileInputRef.current?.click()
                                }}
                            >
                                Add/Replace
                            </button>
                        </div>
                    </div>
                </div>

                {/* 右侧：文字面板和序列条，与图片框底对齐（上边距约 100px，使 300px 高文字框底与图片框底同一水平） */}
                <div className="flex gap-5 flex-1 w-full md:w-auto relative md:mt-[112px]">
                    <div
                        ref={textPanelRef}
                        className="min-w-0"
                        style={{ height: '300px', width: '200px' }}
                    >
                        <textarea
                            className="w-full h-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            placeholder={currentTextId ? (() => {
                                const markIndex = marks.findIndex(m => m.id === currentTextId)
                                const displayIndex = markIndex >= 0 ? markIndex + 1 : currentTextId
                                return `Type text for label ${displayIndex}...`
                            })() : 'Double click the image area after click left-botton Adjust'}
                            value={currentTextId ? (textStore.get(currentTextId) || '') : ''}
                            onChange={(e) => {
                                if (currentTextId) {
                                    const newStore = new Map(textStore)
                                    newStore.set(currentTextId, e.target.value)
                                    setTextStore(newStore)
                                }
                            }}
                            disabled={!currentTextId}
                        />
                    </div>
                    <div
                        ref={seqBarRef}
                        className="w-8 flex flex-col gap-1 overflow-y-auto flex-shrink-0"
                        style={{ height: '224px' }}
                    >
                        {marks.map((mark, index) => {
                            const displayIndex = index + 1
                            return (
                            <div
                                key={mark.id}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all mx-auto ${selectedMarkId === mark.id
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : 'bg-transparent border-green-700 text-black'
                                    }`}
                                onClick={() => handleMarkClick(mark.id)}
                            >
                                {displayIndex}
                            </div>
                        )})}
                    </div>
                </div>
            </div>
        </div>
    )
})

export default ImageBox