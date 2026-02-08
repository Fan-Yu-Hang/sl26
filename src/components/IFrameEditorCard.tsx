import { useState } from 'react'
import type { RefObject, MouseEvent, ChangeEvent, CSSProperties } from 'react'

export interface IFrameEditorMark {
    id: number
    x: number
    y: number
}

export interface IFrameEditorCardProps {
    sliderRef: RefObject<HTMLDivElement>
    knobRef: RefObject<HTMLDivElement>
    imageBoxRef: RefObject<HTMLDivElement>
    viewportRef: RefObject<HTMLDivElement>
    imageRef: RefObject<HTMLImageElement>
    overlayRef: RefObject<HTMLDivElement>
    fileInputRef: RefObject<HTMLInputElement>
    textPanelRef: RefObject<HTMLDivElement>
    seqBarRef: RefObject<HTMLDivElement>
    imageSrc: string
    marks: IFrameEditorMark[]
    selectedMarkId: number | null
    userScale: number
    adjustMode: boolean
    status: { text: string; type: 'info' | 'success' | 'error'; visible: boolean }
    popoverMarkId: number | null
    popoverPosition: { left: number; top: number } | null
    textStore: Map<number, string>
    currentTextId: number | null
    longPressTimerRef: RefObject<Map<number, number>>
    onSliderMouseDown: (e: MouseEvent<HTMLDivElement>) => void
    onSliderClick: (e: MouseEvent<HTMLDivElement>) => void
    onImageDoubleClick: (e: MouseEvent<HTMLDivElement>) => void
    onMarkClick: (id: number) => void
    onMarkDragStart: (e: MouseEvent<HTMLDivElement>, markId: number) => void
    onMarkContextMenu: (markId: number, markX: number, markY: number) => void
    onDeleteMarkPopover: (markId: number) => void
    onDeleteImage: () => void
    onAdjustToggle: () => void
    onReplaceImageClick: () => void
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void
    onTextChange: (value: string) => void
    /** 可选：点击删除卡片并确认后调用，用于移除整张卡片 */
    onDeleteCard?: () => void
}

export default function IFrameEditorCard({
    sliderRef,
    knobRef,
    imageBoxRef,
    viewportRef,
    imageRef,
    overlayRef,
    fileInputRef,
    textPanelRef,
    seqBarRef,
    imageSrc,
    marks,
    selectedMarkId,
    userScale,
    adjustMode,
    status,
    popoverMarkId,
    popoverPosition,
    textStore,
    currentTextId,
    longPressTimerRef,
    onSliderMouseDown,
    onSliderClick,
    onImageDoubleClick,
    onMarkClick,
    onMarkDragStart,
    onMarkContextMenu,
    onDeleteMarkPopover,
    onDeleteImage,
    onAdjustToggle,
    onReplaceImageClick,
    onFileChange,
    onTextChange,
    onDeleteCard
}: IFrameEditorCardProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleConfirmDelete = () => {
        setShowDeleteConfirm(false)
        onDeleteCard?.()
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 pl-[72px] md:pl-[72px] w-full max-w-[820px] relative">
            {onDeleteCard != null && (
                <>
                    <button
                        type="button"
                        title="Delete Card"
                        className="absolute top-4 right-4 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white cursor-pointer z-20 transition-colors"
                        style={{ width: 20, height: 20 }}
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowDeleteConfirm(true)
                        }}
                        aria-label="Delete Card"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2L2 10" /></svg>
                    </button>
                    {showDeleteConfirm && (
                        <div className="absolute inset-0 flex items-center justify-center z-30 rounded-2xl bg-black/20" onClick={() => setShowDeleteConfirm(false)}>
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 min-w-[240px] max-w-[320px]" onClick={e => e.stopPropagation()}>
                                <p className="text-gray-800 font-medium mb-4">Are you sure you want to delete?</p>
                                <div className="flex justify-end gap-3">
                                    <button type="button" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setShowDeleteConfirm(false)}>No</button>
                                    <button type="button" className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600" onClick={handleConfirmDelete}>Yes</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
            <div className="flex flex-col md:flex-row gap-6 items-start w-full">
                {/* 左侧：缩放滑条 + 图片框 + 三个按钮 */}
                <div className="relative flex-shrink-0">
                    <div
                        ref={sliderRef}
                        className="absolute right-full mr-8 w-2.5 h-[300px] rounded-full bg-gradient-to-b from-gray-200 to-gray-300 shadow-inner cursor-pointer"
                        style={{ top: 0 }}
                        onMouseDown={onSliderMouseDown}
                        onClick={onSliderClick}
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
                                onSliderMouseDown(e)
                            }}
                        />
                    </div>

                    <div
                        ref={imageBoxRef}
                        className="relative w-full md:w-[500px] h-[300px] bg-gradient-to-b from-white to-gray-100 border border-gray-200 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        onDoubleClick={onImageDoubleClick}
                        style={{
                            cursor: adjustMode ? 'grab' : 'pointer',
                            touchAction: 'none',
                        }}
                    >
                        {!imageSrc && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/55 backdrop-blur-sm text-gray-600 text-sm user-select-none pointer-events-none z-0">
                                Click Add to Upload Image &lt; 10MB (PNG / JPG / JPEG / WebP)
                            </div>
                        )}
                        <div
                            ref={viewportRef}
                            className="absolute inset-0 pointer-events-auto"
                            style={{ willChange: 'transform', background: 'transparent', zIndex: 1 }}
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
                                        userSelect: 'none',
                                        ...({ WebkitUserDrag: 'none', userDrag: 'none' } as CSSProperties),
                                    }}
                                />
                            )}
                        </div>
                        <div
                            ref={overlayRef}
                            className="absolute inset-0 pointer-events-none z-10"
                            style={{ pointerEvents: adjustMode ? 'none' : 'auto' }}
                        >
                            {marks.map((mark) => {
                                const displayIndex = marks.findIndex((m) => m.id === mark.id) + 1
                                return (
                                    <div
                                        key={mark.id}
                                        className={`absolute w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                                            selectedMarkId === mark.id ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-green-700'
                                        }`}
                                        style={{
                                            left: `${mark.x}px`,
                                            top: `${mark.y}px`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onMarkClick(mark.id)
                                        }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation()
                                            onMarkDragStart(e, mark.id)
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            onMarkContextMenu(mark.id, mark.x, mark.y)
                                        }}
                                        onTouchStart={(e) => {
                                            e.stopPropagation()
                                            const timer = window.setTimeout(() => onMarkContextMenu(mark.id, mark.x, mark.y), 500)
                                            longPressTimerRef.current?.set(mark.id, timer)
                                        }}
                                        onTouchEnd={(e) => {
                                            e.stopPropagation()
                                            const timer = longPressTimerRef.current?.get(mark.id)
                                            if (timer) {
                                                clearTimeout(timer)
                                                longPressTimerRef.current?.delete(mark.id)
                                            }
                                        }}
                                        onTouchCancel={(e) => {
                                            e.stopPropagation()
                                            const timer = longPressTimerRef.current?.get(mark.id)
                                            if (timer) {
                                                clearTimeout(timer)
                                                longPressTimerRef.current?.delete(mark.id)
                                            }
                                        }}
                                    >
                                        <span className={`text-xs font-bold ${selectedMarkId === mark.id ? 'text-white' : 'text-black'}`}>
                                            {displayIndex}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                        {popoverMarkId != null && popoverPosition && (
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
                                        onDeleteMarkPopover(popoverMarkId)
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                        {status.visible && (
                            <div
                                className={`absolute left-2.5 bottom-2.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-white shadow-md backdrop-blur-sm z-20 ${
                                    status.type === 'info' ? 'bg-gray-700/90' : status.type === 'success' ? 'bg-teal-700/90' : 'bg-red-700/90'
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
                            onChange={onFileChange}
                        />
                    </div>

                    <div className="flex gap-2 mt-4 w-full justify-between">
                        <button
                            type="button"
                            className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                                adjustMode ? 'bg-green-500 text-white border border-green-500' : 'bg-gray-400 text-white border border-gray-400'
                            }`}
                            onClick={onAdjustToggle}
                        >
                            {adjustMode ? 'Adjust' : 'LOCK'}
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="px-4 py-2 rounded text-sm font-medium bg-white text-red-600 border border-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={onDeleteImage}
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
                                    onReplaceImageClick()
                                }}
                            >
                                Add/Replace
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-5 flex-1 w-full md:w-auto relative items-stretch" style={{ height: '300px' }}>
                    <div ref={textPanelRef} className="min-w-0 flex-shrink-0" style={{ height: '300px', width: '200px' }}>
                        <textarea
                            className="w-full h-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            placeholder={
                                currentTextId
                                    ? `Type text for label ${marks.findIndex((m) => m.id === currentTextId) + 1 || currentTextId}...`
                                    : 'Double click the image area after click left-botton Adjust'
                            }
                            value={currentTextId ? (textStore.get(currentTextId) || '') : ''}
                            onChange={(e) => onTextChange(e.target.value)}
                            disabled={!currentTextId}
                        />
                    </div>
                    <div ref={seqBarRef} className="w-8 flex flex-col gap-1 overflow-y-auto flex-shrink-0 self-stretch" style={{ height: '300px' }}>
                        {marks.map((mark, index) => (
                            <div
                                key={mark.id}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all mx-auto ${
                                    selectedMarkId === mark.id ? 'bg-blue-500 border-blue-500 text-white' : 'bg-transparent border-green-700 text-black'
                                }`}
                                onClick={() => onMarkClick(mark.id)}
                            >
                                {index + 1}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
