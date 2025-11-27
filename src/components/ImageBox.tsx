import { useState, useRef } from 'react'

const ImageBox = () => {
    const [imageSrc, setImageSrc] = useState<string>('')
    const [marks, setMarks] = useState<Array<{ id: number; x: number; y: number }>>([])
    const [selectedMarkId, setSelectedMarkId] = useState<number | null>(null)
    const [userScale, setUserScale] = useState(1)
    const [adjustMode, setAdjustMode] = useState(false)
    const [textStore, setTextStore] = useState<Map<number, string>>(new Map())
    const [currentTextId, setCurrentTextId] = useState<number | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageBoxRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const sliderRef = useRef<HTMLDivElement>(null)
    const knobRef = useRef<HTMLDivElement>(null)
    const nextIdRef = useRef<number>(1)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) {
            console.log('没有选择文件')
            return
        }

        console.log('选择的文件:', file.name, file.type, file.size)

        // 检查文件类型
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            alert(`不支持的图片格式: ${file.type}\n支持的格式: PNG, JPG, JPEG, WebP`)
            // 重置文件输入
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            return
        }

        // 检查文件大小
        if (file.size > 10 * 1024 * 1024) {
            alert(`图片文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB\n最大支持: 10MB`)
            // 重置文件输入
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            return
        }

        console.log('开始读取文件...')
        const reader = new FileReader()
        reader.onload = () => {
            console.log('文件读取成功')
            setImageSrc(reader.result as string)
            setAdjustMode(true)
            setMarks([])
            nextIdRef.current = 1
        }
        reader.onerror = () => {
            console.error('文件读取失败')
            alert('文件读取失败，请重试')
            // 重置文件输入
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
        reader.readAsDataURL(file)
    }

    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageBoxRef.current || marks.length >= 8) {
            alert('数量已达上限')
            return
        }
        const rect = imageBoxRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const newMark = {
            id: nextIdRef.current++,
            x: Math.max(10, Math.min(rect.width - 10, x - 10)),
            y: Math.max(10, Math.min(rect.height - 10, y - 10)),
        }
        setMarks([...marks, newMark])
        setSelectedMarkId(newMark.id)
        setCurrentTextId(newMark.id)
    }

    const handleMarkClick = (id: number) => {
        setSelectedMarkId(id)
        setCurrentTextId(id)
    }

    const handleDeleteMark = (id: number) => {
        const newMarks = marks.filter(m => m.id !== id).map((m, idx) => ({
            ...m,
            id: idx + 1,
        }))
        setMarks(newMarks)
        setSelectedMarkId(null)
        setCurrentTextId(null)
        nextIdRef.current = newMarks.length + 1
        // 重新索引文本存储
        const newTextStore = new Map<number, string>()
        marks.forEach((m, idx) => {
            if (m.id !== id && textStore.has(m.id)) {
                newTextStore.set(idx + 1, textStore.get(m.id)!)
            }
        })
        setTextStore(newTextStore)
    }

    const isDraggingRef = useRef(false)

    const updateScaleFromPosition = (clientY: number) => {
        if (!sliderRef.current) return
        
        const rect = sliderRef.current.getBoundingClientRect()
        const y = clientY - rect.top
        const trackHeight = 160
        const knobHeight = 16
        const min = 1
        const max = 3
        const clampedY = Math.max(knobHeight / 2, Math.min(trackHeight - knobHeight / 2, y))
        const t = 1 - (clampedY - knobHeight / 2) / (trackHeight - knobHeight)
        const scale = min + t * (max - min)
        setUserScale(Number(scale.toFixed(2)))
    }

    const handleSliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!adjustMode) {
            alert('请先点击"锁定模式"按钮启用调整模式')
            return
        }
        e.preventDefault()
        e.stopPropagation()
        isDraggingRef.current = true
        updateScaleFromPosition(e.clientY)

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return
            updateScaleFromPosition(e.clientY)
        }

        const handleMouseUp = () => {
            isDraggingRef.current = false
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    }

    return (
        <div className="relative flex flex-col items-center w-full">
            {/* 主容器：图片框 + 文字面板和序列条 */}
            <div className="flex flex-col md:flex-row gap-6 items-start w-full">
                {/* 左侧：缩放滑条 + 图片框 */}
                <div className="relative flex-shrink-0">
                    {/* 缩放滑条 */}
                    <div
                        ref={sliderRef}
                        className="absolute right-full mr-4 w-2.5 h-40 rounded-full bg-gradient-to-b from-gray-200 to-gray-300 shadow-inner cursor-pointer"
                        style={{ transform: 'translateY(-50%)', top: '50%' }}
                        onMouseDown={handleSliderMouseDown}
                        onClick={(e) => {
                            // 点击滑条轨道也可以调整
                            if (adjustMode) {
                                updateScaleFromPosition(e.clientY)
                            }
                        }}
                    >
                        <div
                            ref={knobRef}
                            className="absolute left-1/2 w-4 h-4 rounded-full bg-blue-600 shadow-lg cursor-ns-resize hover:bg-blue-700 transition-colors"
                            style={{
                                transform: `translate(-50%, -50%)`,
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
                        className="relative w-full md:w-96 h-56 bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        onDoubleClick={handleDoubleClick}
                    >
                {!imageSrc ? (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-gray-50/55 backdrop-blur-sm text-gray-600 text-sm hover:bg-gray-100/75 transition-colors cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation()
                            fileInputRef.current?.click()
                        }}
                    >
                        点击上传图片 &lt; 10MB（PNG / JPG / JPEG / WebP）
                    </div>
                ) : (
                    <>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <img
                                ref={imageRef}
                                src={imageSrc}
                                alt=""
                                className="max-w-none max-h-none select-none pointer-events-auto"
                                style={{
                                    transform: `scale(${userScale})`,
                                    transformOrigin: 'center center',
                                }}
                            />
                        </div>
                        {/* 标记点覆盖层 */}
                        <div ref={overlayRef} className="absolute inset-0 pointer-events-none">
                            {marks.map((mark) => (
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
                                        pointerEvents: adjustMode ? 'none' : 'auto',
                                    }}
                                    onClick={() => handleMarkClick(mark.id)}
                                    onContextMenu={(e) => {
                                        e.preventDefault()
                                        if (confirm('确定要删除这个标记吗？')) {
                                            handleDeleteMark(mark.id)
                                        }
                                    }}
                                >
                                    <span
                                        className={`text-xs font-bold ${selectedMarkId === mark.id ? 'text-white' : 'text-black'
                                            }`}
                                    >
                                        {mark.id}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>

                    {/* 操作按钮 - 放在图片框下面 */}
                    <div className="flex gap-2 mt-4 w-full justify-center">
                        <button
                            className={`px-4 py-2 rounded text-sm font-medium transition-all ${adjustMode
                                    ? 'bg-green-500 text-white border border-green-500'
                                    : 'bg-gray-200 text-gray-700 border border-gray-300'
                                }`}
                            onClick={() => setAdjustMode(!adjustMode)}
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
                            onClick={() => {
                                setImageSrc('')
                                setMarks([])
                                setSelectedMarkId(null)
                                setCurrentTextId(null)
                                setTextStore(new Map())
                                nextIdRef.current = 1
                            }}
                            disabled={!imageSrc}
                        >
                            删除
                        </button>
                    </div>
                </div>

                {/* 右侧：文字面板和序列条 */}
                <div className="flex gap-5 flex-1 w-full md:w-auto mt-4 md:mt-0">
                    <div className="flex-1 min-w-0">
                        <textarea
                            className="w-full h-56 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            placeholder={currentTextId ? `输入标记 ${currentTextId} 的文字说明...` : '选择一个标记点来输入文字说明'}
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
                    <div className="w-8 flex flex-col gap-1 overflow-y-auto max-h-56 flex-shrink-0">
                        {marks.map((mark) => (
                            <div
                                key={mark.id}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all mx-auto ${selectedMarkId === mark.id
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : 'bg-transparent border-green-700 text-black'
                                    }`}
                                onClick={() => handleMarkClick(mark.id)}
                            >
                                {mark.id}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ImageBox

