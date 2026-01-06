import { useState, useRef, useEffect, useCallback } from 'react'

interface Mark {
    id: number
    x: number
    y: number
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

const ImageBox = () => {
    // 状态管理
    const [imageSrc, setImageSrc] = useState<string>('')
    const [marks, setMarks] = useState<Mark[]>([])
    const [selectedMarkId, setSelectedMarkId] = useState<number | null>(null)
    const [userScale, setUserScale] = useState(1)
    const [adjustMode, setAdjustMode] = useState(false)
    const [sliderLocked, setSliderLocked] = useState(true)
    const [textStore, setTextStore] = useState<Map<number, string>>(new Map())
    const [currentTextId, setCurrentTextId] = useState<number | null>(null)
    const [status, setStatus] = useState<{ text: string; type: 'info' | 'success' | 'error'; visible: boolean }>({
        text: '',
        type: 'info',
        visible: false,
    })
    const [popoverMarkId, setPopoverMarkId] = useState<number | null>(null)
    const [popoverPosition, setPopoverPosition] = useState<{ left: number; top: number } | null>(null)

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
    const txRef = useRef(0) // translate x
    const tyRef = useRef(0) // translate y
    const nextIdRef = useRef(1)
    const boxIndexRef = useRef(0)
    const isInitializingRef = useRef(false) // 标记是否正在初始化图片
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

    // 拖拽状态
    const isDraggingRef = useRef(false)
    const isPanningRef = useRef(false)
    const isMarkDraggingRef = useRef(false)
    const isPinchingRef = useRef(false)
    const lastXRef = useRef(0)
    const lastYRef = useRef(0)
    const lastDistanceRef = useRef(0)
    const lastScaleRef = useRef(1)
    const frameRequestedRef = useRef(false)
    const longPressTimerRef = useRef<Map<number, number>>(new Map())

    // 工具函数：显示状态提示
    const showStatus = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info') => {
        setStatus({ text, type, visible: true })
        setTimeout(() => {
            setStatus(prev => ({ ...prev, visible: false }))
        }, 1800)
    }, [])

    // 文件上传处理
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!ALLOWED_TYPES.includes(file.type)) {
            showStatus('不支持的图片格式', 'error')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        if (file.size > MAX_FILE_SIZE) {
            showStatus('图片文件过大（＜10MB）', 'error')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        showStatus('加载中…', 'info')
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            setImageSrc(result)
        }
        reader.onerror = () => {
            showStatus('上传失败', 'error')
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
        reader.readAsDataURL(file)
    }, [showStatus])

    // 更新滑条位置
    const updateSliderByScale = useCallback(() => {
        if (!sliderRef.current || !knobRef.current) return
        const trackHeight = 160
        const knobHeight = 16
        const min = 1
        const max = 3
        const t = (userScale - min) / (max - min)
        const y = (1 - t) * (trackHeight - knobHeight) + knobHeight / 2
        knobRef.current.style.top = `${y}px`
    }, [userScale])

    // 应用边界限制的变换
    const applyClampedTransform = useCallback(() => {
        if (!imageBoxRef.current || !imageRef.current || !imageSrc) return

        const rect = imageBoxRef.current.getBoundingClientRect()
        const cw = rect.width
        const ch = rect.height
        const scale = baseScaleRef.current * userScale
        const sw = nwRef.current * scale
        const sh = nhRef.current * scale
        const centerTx = (cw - sw) / 2
        const centerTy = (ch - sh) / 2

        const buffer = 12
        let minX, maxX, minY, maxY
        if (sw <= cw) {
            minX = maxX = centerTx
        } else {
            minX = cw - sw - buffer
            maxX = buffer
        }
        if (sh <= ch) {
            minY = maxY = centerTy
        } else {
            minY = ch - sh - buffer
            maxY = buffer
        }

        let finalX = centerTx + txRef.current
        let finalY = centerTy + tyRef.current
        finalX = Math.max(minX, Math.min(maxX, finalX))
        finalY = Math.max(minY, Math.min(maxY, finalY))
        txRef.current = finalX - centerTx
        tyRef.current = finalY - centerTy

        if (imageRef.current) {
            imageRef.current.style.transform = `translate(${finalX}px, ${finalY}px) scale(${scale})`
        }
    }, [imageSrc, userScale])

    // 更新图片变换
    const updateTransform = useCallback(() => {
        if (!imageBoxRef.current || !imageRef.current || !imageSrc) return

        const rect = imageBoxRef.current.getBoundingClientRect()
        const cw = rect.width
        const ch = rect.height
        const scale = baseScaleRef.current * userScale
        const sw = nwRef.current * scale
        const sh = nhRef.current * scale
        const centerTx = (cw - sw) / 2
        const centerTy = (ch - sh) / 2
        const finalX = centerTx + txRef.current
        const finalY = centerTy + tyRef.current

        imageRef.current.style.transform = `translate3d(${finalX}px, ${finalY}px, 0) scale(${scale})`
        applyClampedTransform()
    }, [imageSrc, userScale, applyClampedTransform])

    // 计算两点之间的距离
    const getDistance = (touch1: { clientX: number; clientY: number }, touch2: { clientX: number; clientY: number }) => {
        const dx = touch1.clientX - touch2.clientX
        const dy = touch1.clientY - touch2.clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    const handlePanMove = useCallback((e: MouseEvent | TouchEvent) => {
        // 双指缩放
        if ('touches' in e && e.touches.length === 2 && isPinchingRef.current) {
            e.preventDefault()
            e.stopPropagation()
            if (!imageBoxRef.current || sliderLocked) return
            
            const distance = getDistance(e.touches[0], e.touches[1])
            const scaleChange = distance / lastDistanceRef.current
            let newScale = lastScaleRef.current * scaleChange
            
            const min = 1
            const max = 3
            newScale = Math.max(min, Math.min(max, Number(newScale.toFixed(2))))
            
            if (newScale !== userScale) {
                const rect = imageBoxRef.current.getBoundingClientRect()
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
                
                const prevScale = baseScaleRef.current * userScale
                const newScaleValue = baseScaleRef.current * newScale
                
                const centerTx = (rect.width - nwRef.current * prevScale) / 2
                const centerTy = (rect.height - nhRef.current * prevScale) / 2
                const imgX = (centerX - centerTx - txRef.current) / prevScale
                const imgY = (centerY - centerTy - tyRef.current) / prevScale
                
                txRef.current += imgX * (prevScale - newScaleValue)
                tyRef.current += imgY * (prevScale - newScaleValue)
                
                if (newScale === 1) {
                    txRef.current = 0
                    tyRef.current = 0
                }
                
                setUserScale(newScale)
            }
            return
        }
        
        // 单指平移
        if (!isPanningRef.current) return
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
        const dx = clientX - lastXRef.current
        const dy = clientY - lastYRef.current
        lastXRef.current = clientX
        lastYRef.current = clientY
        txRef.current += dx
        tyRef.current += dy

        if (!frameRequestedRef.current) {
            frameRequestedRef.current = true
            requestAnimationFrame(() => {
                applyClampedTransform()
                frameRequestedRef.current = false
            })
        }
    }, [userScale, sliderLocked, applyClampedTransform])

    const handlePanEnd = useCallback(() => {
        isPanningRef.current = false
        isPinchingRef.current = false
        lastDistanceRef.current = 0
        if (imageBoxRef.current) {
            imageBoxRef.current.style.cursor = adjustMode ? 'grab' : 'pointer'
        }
    }, [adjustMode])

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // 图片加载完成处理
    useEffect(() => {
        const img = imageRef.current
        if (!img || !imageSrc) return

        const handleLoad = () => {
            if (!img.naturalWidth || !img.naturalHeight) return
            
            isInitializingRef.current = true
            nwRef.current = img.naturalWidth
            nhRef.current = img.naturalHeight

            if (!imageBoxRef.current) {
                isInitializingRef.current = false
                return
            }
            const rect = imageBoxRef.current.getBoundingClientRect()
            const cw = rect.width
            const ch = rect.height

            baseScaleRef.current = Math.min(cw / nwRef.current, ch / nhRef.current)
            txRef.current = 0
            tyRef.current = 0
            
            const sw = nwRef.current * baseScaleRef.current
            const sh = nhRef.current * baseScaleRef.current
            const centerTx = (cw - sw) / 2
            const centerTy = (ch - sh) / 2

            img.style.transform = `translate3d(${centerTx}px, ${centerTy}px, 0) scale(${baseScaleRef.current})`
            
            updateSliderByScale()
            setUserScale(1)
            setAdjustMode(true)
            setSliderLocked(false)
            showStatus('上传成功', 'success')
            if (overlayRef.current) {
                overlayRef.current.style.pointerEvents = 'none'
            }
            
            setTimeout(() => {
                isInitializingRef.current = false
            }, 100)
        }

        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
            requestAnimationFrame(() => {
                requestAnimationFrame(handleLoad)
            })
        } else {
            img.addEventListener('load', handleLoad)
            return () => img.removeEventListener('load', handleLoad)
        }
    }, [imageSrc, updateSliderByScale, showStatus])

    useEffect(() => {
        if (isInitializingRef.current) return
        if (imageSrc && nwRef.current > 0 && nhRef.current > 0) {
            updateTransform()
            updateSliderByScale()
        }
    }, [userScale, imageSrc, updateTransform, updateSliderByScale])

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
            showStatus('请点击"调整图片"按钮启用调整模式', 'info')
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

    const handlePanStart = (e: React.MouseEvent) => {
        if (!imageSrc) return
        if (!adjustMode && userScale <= 1) return
        isPanningRef.current = true
        isPinchingRef.current = false
        lastXRef.current = e.clientX
        lastYRef.current = e.clientY
        if (imageBoxRef.current) {
            imageBoxRef.current.style.cursor = 'grabbing'
        }
    }

    useEffect(() => {
        const viewport = viewportRef.current
        if (!viewport) return

        const handleMouseMove = (e: MouseEvent) => handlePanMove(e)
        const handleMouseUp = () => handlePanEnd()
        
        const handleTouchStart = (e: TouchEvent) => {
            if (!imageSrc) return
            
            if (e.touches.length === 2) {
                e.preventDefault()
                e.stopPropagation()
                if (sliderLocked) {
                    showStatus('请点击"调整图片"按钮启用调整模式', 'info')
                    return
                }
                isPinchingRef.current = true
                isPanningRef.current = false
                const distance = getDistance(e.touches[0], e.touches[1])
                lastDistanceRef.current = distance
                lastScaleRef.current = userScale
            } else if (e.touches.length === 1) {
                if (!adjustMode && userScale <= 1) return
                isPanningRef.current = true
                isPinchingRef.current = false
                const t = e.touches[0]
                lastXRef.current = t.clientX
                lastYRef.current = t.clientY
                if (imageBoxRef.current) {
                    imageBoxRef.current.style.cursor = 'grabbing'
                }
            }
        }
        
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 || isPinchingRef.current) {
                e.preventDefault()
                e.stopPropagation()
            }
            handlePanMove(e)
        }
        
        const handleTouchEnd = () => handlePanEnd()

        viewport.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        viewport.addEventListener('touchstart', handleTouchStart, { passive: false })
        viewport.addEventListener('touchmove', handleTouchMove, { passive: false })
        viewport.addEventListener('touchend', handleTouchEnd, { passive: true })
        viewport.addEventListener('touchcancel', handleTouchEnd, { passive: true })

        return () => {
            viewport.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            viewport.removeEventListener('touchstart', handleTouchStart)
            viewport.removeEventListener('touchmove', handleTouchMove)
            viewport.removeEventListener('touchend', handleTouchEnd)
            viewport.removeEventListener('touchcancel', handleTouchEnd)
        }
    }, [adjustMode, userScale, imageSrc, sliderLocked, handlePanEnd, handlePanMove, showStatus])

    useEffect(() => {
        const imageBox = imageBoxRef.current
        if (!imageBox) return

        const handleWheel = (e: WheelEvent) => {
            if (!imageSrc || sliderLocked) {
                if (sliderLocked) {
                    showStatus('请点击"调整图片"按钮启用调整模式', 'info')
                }
                return
            }
            e.preventDefault()
            e.stopPropagation()

            const rect = imageBox.getBoundingClientRect()
            const px = e.clientX - rect.left
            const py = e.clientY - rect.top
            const prevUserScale = userScale
            const prevScale = baseScaleRef.current * prevUserScale
            const min = 1
            const max = 3
            let nextUserScale = prevUserScale + (-e.deltaY) * 0.001 * (max - min)
            nextUserScale = Math.max(min, Math.min(max, Number(nextUserScale.toFixed(2))))
            if (nextUserScale === prevUserScale) return
            if (nextUserScale === 1) {
                txRef.current = 0
                tyRef.current = 0
            }

            const newScale = baseScaleRef.current * nextUserScale
            const centerTx = (rect.width - nwRef.current * prevScale) / 2
            const centerTy = (rect.height - nhRef.current * prevScale) / 2
            const imgX = (px - centerTx - txRef.current) / prevScale
            const imgY = (py - centerTy - tyRef.current) / prevScale
            txRef.current += imgX * (prevScale - newScale)
            tyRef.current += imgY * (prevScale - newScale)
            setUserScale(nextUserScale)
            updateSliderByScale()
            updateTransform()
        }

        imageBox.addEventListener('wheel', handleWheel, { passive: false })
        return () => imageBox.removeEventListener('wheel', handleWheel)
    }, [imageSrc, sliderLocked, userScale, updateSliderByScale, updateTransform, showStatus])

    // 双击添加标记点
    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (adjustMode) {
            showStatus('请先切换到锁定状态才能添加标记点', 'info')
            return
        }
        if (!imageBoxRef.current || marks.length >= 8) {
            showStatus('数量已达上限', 'error')
            return
        }
        const rect = imageBoxRef.current.getBoundingClientRect()
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
    }

    // 标记点点击
    const handleMarkClick = (id: number) => {
        setSelectedMarkId(id)
        setCurrentTextId(id)
    }

    // 标记点删除
    const handleDeleteMark = (id: number) => {
        const filteredMarks = marks.filter(m => m.id !== id)
        setMarks(filteredMarks)
        setSelectedMarkId(null)
        setCurrentTextId(null)

        const newTextStore = new Map(textStore)
        newTextStore.delete(id)
        setTextStore(newTextStore)
        closeDeletePopover()
    }

    // 显示删除菜单
    const showDeletePopover = (markId: number, markX: number, markY: number) => {
        if (adjustMode) {
            showStatus('请先切换到锁定状态才能删除标记点', 'info')
            return
        }
        setPopoverMarkId(markId)
        setPopoverPosition({
            left: markX + 20,
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
        return () => document.removeEventListener('click', handleClickOutside, true)
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
        }

        window.addEventListener('mousemove', handleDragMove)
        window.addEventListener('mouseup', handleDragEnd, { once: true })
    }

    const ensureTextAreaForId = (id: number) => {
        if (textStore.has(id)) return
        const newStore = new Map(textStore)
        newStore.set(id, '')
        setTextStore(newStore)
    }

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

    const handleDelete = () => {
        if (!imageSrc) return
        if (imageRef.current) {
            imageRef.current.src = ''
            imageRef.current.style.transform = ''
        }
        setImageSrc('')
        setSelectedMarkId(null)
        setCurrentTextId(null)
        setUserScale(1)
        txRef.current = 0
        tyRef.current = 0
        setAdjustMode(false)
        setSliderLocked(true)
        showStatus('已清除图片，标记点已保留', 'success')
    }

    useEffect(() => {
        const key = `textStore-${boxIndexRef.current}`
        try {
            const obj: Record<string, string> = {}
            textStore.forEach((v, k) => {
                obj[k.toString()] = v
            })
            localStorage.setItem(key, JSON.stringify(obj))
        } catch (e) {
            console.error('Failed to save text store:', e)
        }
    }, [textStore])

    return (
        <div className="relative flex flex-col items-center w-full max-w-[820px] mx-auto">
            {/* 主容器：图片框 + 文字面板和序列条 */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start w-full px-4 md:px-0">
                {/* 左侧：缩放滑条 + 图片框 */}
                <div className="relative flex-shrink-0 w-full md:w-auto flex flex-row items-center">
                    {/* 缩放滑条 */}
                    <div
                        ref={sliderRef}
                        className="hidden md:block absolute right-full mr-4 md:mr-8 w-2 md:w-2.5 h-40 md:h-48 rounded-full bg-gradient-to-b from-gray-200 to-gray-300 shadow-inner cursor-pointer"
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
                            className="absolute left-1/2 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-blue-600 shadow-lg cursor-ns-resize hover:bg-blue-700 transition-colors"
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

                    {/* 图片框 */}
                    <div
                        ref={imageBoxRef}
                        className="relative w-full md:w-[500px] h-[250px] md:h-[300px] bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow flex-grow"
                        onDoubleClick={handleDoubleClick}
                        style={{ 
                            cursor: adjustMode ? 'grab' : 'pointer',
                            touchAction: 'none'
                        }}
                    >
                        {!imageSrc && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/55 backdrop-blur-sm text-gray-600 text-xs md:text-sm user-select-none pointer-events-none z-0 px-4 text-center">
                                上传图片 &lt; 10MB (PNG/JPG/WEBP)
                            </div>
                        )}

                        <div
                            ref={viewportRef}
                            className="absolute inset-0 pointer-events-auto"
                            style={{
                                display: 'grid',
                                placeItems: 'center',
                                willChange: 'transform',
                                background: 'transparent',
                                zIndex: 1
                            }}
                            onMouseDown={imageSrc ? handlePanStart : undefined}
                        >
                            {imageSrc && (
                                <img
                                    ref={imageRef}
                                    src={imageSrc}
                                    alt=""
                                    draggable={false}
                                    className="max-w-none max-h-none select-none pointer-events-auto"
                                    style={{
                                        transformOrigin: 'top left',
                                        transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
                                        willChange: 'transform',
                                        backfaceVisibility: 'hidden',
                                        WebkitUserSelect: 'none',
                                        userSelect: 'none',
                                    }}
                                />
                            )}
                        </div>

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
                                        const timer = window.setTimeout(() => {
                                            showDeletePopover(mark.id, mark.x, mark.y)
                                        }, 500)
                                        longPressTimerRef.current.set(mark.id, timer)
                                    }}
                                    onTouchEnd={(e) => {
                                        e.stopPropagation()
                                        const timer = longPressTimerRef.current.get(mark.id)
                                        if (timer) {
                                            clearTimeout(timer)
                                            longPressTimerRef.current.delete(mark.id)
                                        }
                                    }}
                                    onTouchCancel={(e) => {
                                        e.stopPropagation()
                                        const timer = longPressTimerRef.current.get(mark.id)
                                        if (timer) {
                                            clearTimeout(timer)
                                            longPressTimerRef.current.delete(mark.id)
                                        }
                                    }}
                                >
                                    <span className={`text-[10px] md:text-xs font-bold ${selectedMarkId === mark.id ? 'text-white' : 'text-black'}`}>
                                        {displayIndex}
                                    </span>
                                </div>
                            )})}
                        </div>

                        {popoverMarkId && popoverPosition && (
                            <div
                                className="delete-popover absolute bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1.5 text-xs text-gray-800 z-30 flex items-center"
                                style={{
                                    left: `${popoverPosition.left}px`,
                                    top: `${popoverPosition.top}px`,
                                    transform: 'translateY(-50%)',
                                }}
                            >
                                <button
                                    className="min-w-[64px] h-7 rounded-md bg-white border border-red-500 text-red-500 text-xs cursor-pointer transition-all hover:opacity-85 active:scale-[0.97]"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteMark(popoverMarkId)
                                    }}
                                >
                                    删除
                                </button>
                            </div>
                        )}

                        {status.visible && (
                            <div className={`absolute left-2.5 bottom-2.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-white shadow-md backdrop-blur-sm z-20 ${status.type === 'info' ? 'bg-gray-700/90' : status.type === 'success' ? 'bg-teal-700/90' : 'bg-red-700/90'}`}>
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
                </div>

                {/* 移动端操作按钮 */}
                <div className="flex md:hidden flex-wrap gap-2 w-full justify-center px-4">
                    <button
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${adjustMode ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}
                        onClick={handleAdjustToggle}
                    >
                        {adjustMode ? '调整图片' : '锁定状态'}
                    </button>
                    <button
                        className="px-3 py-1.5 rounded text-xs font-medium bg-white text-green-600 border border-green-600"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        新增/替换
                    </button>
                    <button
                        className="px-3 py-1.5 rounded text-xs font-medium bg-white text-red-600 border border-red-600 disabled:opacity-50"
                        onClick={handleDelete}
                        disabled={!imageSrc}
                    >
                        删除
                    </button>
                </div>

                {/* 文字面板 */}
                <div className="flex gap-3 md:gap-5 flex-1 w-full md:w-auto relative">
                    <div
                        ref={textPanelRef}
                        className="flex-grow md:flex-initial"
                        style={{ height: windowWidth < 768 ? '150px' : '300px', width: windowWidth < 768 ? '100%' : '200px' }}
                    >
                        <textarea
                            className="w-full h-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            placeholder={currentTextId ? `输入标记 ${marks.findIndex(m => m.id === currentTextId) + 1} 的文字说明...` : '选择标记点输入说明'}
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
                        style={{ height: windowWidth < 768 ? '150px' : '224px' }}
                    >
                        {marks.map((mark, index) => (
                            <div
                                key={mark.id}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all mx-auto ${selectedMarkId === mark.id ? 'bg-blue-500 border-blue-500 text-white' : 'bg-transparent border-green-700 text-black'}`}
                                onClick={() => handleMarkClick(mark.id)}
                            >
                                {index + 1}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 桌面端操作按钮 */}
            <div className="hidden md:flex gap-2 mt-4 w-full max-w-[500px] justify-between ml-0 md:ml-[-200px]">
                <button
                    className={`px-4 py-2 rounded text-sm font-medium transition-all ${adjustMode ? 'bg-green-500 text-white border border-green-500' : 'bg-gray-400 text-white border border-gray-400'}`}
                    onClick={handleAdjustToggle}
                >
                    {adjustMode ? '调整图片' : '锁定状态'}
                </button>
                <button
                    className="px-4 py-2 rounded text-sm font-medium bg-white text-green-600 border border-green-600 hover:bg-green-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    新增/替换
                </button>
                <button
                    className="px-4 py-2 rounded text-sm font-medium bg-white text-red-600 border border-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleDelete}
                    disabled={!imageSrc}
                >
                    删除
                </button>
            </div>
        </div>
    )
}

export default ImageBox
