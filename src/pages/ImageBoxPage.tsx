import { useRef, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ImageBox, { ImageBoxHandle } from '@/components/ImageBox'
import { useClerkSupabase } from '@/hooks/useClerkSupabase'
import { useUser } from '@clerk/clerk-react'

/** 详情页：从 layer_box 按 id 拉取，所有人可看；仅所有者可编辑/发布。表列：clerk_id, layer_title */
const ImageBoxPage = () => {
    const { id } = useParams()
    const imageBoxRef = useRef<ImageBoxHandle>(null)
    const supabase = useClerkSupabase()
    const { user, isLoaded } = useUser()
    const [initialData, setInitialData] = useState<{
        image_url: string;
        title: string;
        marks: any[];
        text_store: Record<number, string>;
        user_scale?: number;
        tx?: number;
        ty?: number;
        clerk_id?: string | null;
        audio_url?: string | null;
    } | null>(null)
    const [loading, setLoading] = useState(!!id)
    const [notFound, setNotFound] = useState(false)

    const isOwner = Boolean(id && user && initialData?.clerk_id === user.id)

    useEffect(() => {
        async function loadData() {
            if (!id || !isLoaded) {
                setLoading(false)
                return
            }
            try {
                setLoading(true)
                setNotFound(false)
                const { data, error } = await supabase
                    .from('layer_box')
                    .select('id, layer_title, image_url, marks, text_store, user_scale, tx, ty, clerk_id, audio_url')
                    .eq('id', id)
                    .single()

                if (error) {
                    console.error('Error fetching file:', error)
                    setNotFound(true)
                    setInitialData(null)
                } else if (data) {
                    setInitialData({
                        image_url: data.image_url ?? '',
                        title: data.layer_title ?? '',
                        marks: Array.isArray(data.marks) ? data.marks : [],
                        text_store: data.text_store && typeof data.text_store === 'object' ? (data.text_store as Record<string, string>) : {},
                        user_scale: data.user_scale ?? 1,
                        tx: data.tx ?? 0,
                        ty: data.ty ?? 0,
                        clerk_id: data.clerk_id ?? null,
                        audio_url: data.audio_url ?? null
                    })
                    setNotFound(false)
                } else {
                    setNotFound(true)
                    setInitialData(null)
                }
            } catch (err) {
                console.error('Failed to load data:', err)
                setNotFound(true)
                setInitialData(null)
            } finally {
                setLoading(false)
            }
        }

        if (id && isLoaded) {
            loadData()
        } else {
            setInitialData(null)
            setNotFound(false)
            setLoading(false)
        }
    }, [id, isLoaded, supabase])

    // 编辑已有项目时，用接口返回的 audio_url 初始化播放地址与上传状态
    useEffect(() => {
        if (id && initialData?.audio_url) {
            setAudioUrl(initialData.audio_url)
            setAudioUploadStatus('uploaded')
        }
    }, [id, initialData?.audio_url])

    const navigate = useNavigate()
    const [isSaving, setIsSaving] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    /** 上传到 Supabase Storage 后的路径，如 layer/audio/{uuid}.mp3 */
    const [audioStoragePath, setAudioStoragePath] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioUploading, setAudioUploading] = useState(false)
    /** 音频上传状态：idle | loading | uploaded | failed */
    const [audioUploadStatus, setAudioUploadStatus] = useState<'idle' | 'loading' | 'uploaded' | 'failed'>('idle')
    const audioRef = useRef<HTMLAudioElement>(null)
    const audioInputRef = useRef<HTMLInputElement>(null)
    const uploadStatusResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const formatTime = (seconds: number) => {
        if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
        const m = Math.floor(seconds / 60)
        const s = Math.floor(seconds % 60)
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    const [audioCurrentTime, setAudioCurrentTime] = useState(0)
    const [audioDuration, setAudioDuration] = useState(0)

    const togglePlay = () => {
        const el = audioRef.current
        if (!el) return
        if (el.paused) {
            el.play().catch(() => {})
            setIsPlaying(true)
        } else {
            el.pause()
            setIsPlaying(false)
        }
    }

    const skipBack10 = () => {
        const el = audioRef.current
        if (el) el.currentTime = Math.max(0, el.currentTime - 10)
    }
    const skipForward10 = () => {
        const el = audioRef.current
        if (el) el.currentTime = Math.min(el.duration || 0, el.currentTime + 10)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const el = audioRef.current
        if (!el) return
        const v = parseFloat(e.target.value)
        if (Number.isFinite(v)) {
            el.currentTime = v
            setAudioCurrentTime(v)
        }
    }
    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        e.target.value = ''

        const ext = (file.name.split('.').pop()?.toLowerCase() || file.type.split('/').pop() || 'mp3').replace(/[^a-z0-9]/gi, '') || 'mp3'
        const allowedExt = ['mp3', 'wav', 'm4a']
        const finalExt = allowedExt.includes(ext) ? ext : 'mp3'
        const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const storagePath = `layer/audio/${uuid}.${finalExt}`

        if (uploadStatusResetTimerRef.current) {
            clearTimeout(uploadStatusResetTimerRef.current)
            uploadStatusResetTimerRef.current = null
        }
        setAudioUploading(true)
        setAudioUploadStatus('loading')
        try {
            const { data, error } = await supabase.storage
                .from('audio')
                .upload(storagePath, file, { contentType: file.type || `audio/${finalExt}`, upsert: true })

            if (error) {
                console.error('Audio upload failed:', error)
                setAudioUploadStatus('failed')
                uploadStatusResetTimerRef.current = setTimeout(() => setAudioUploadStatus('idle'), 3000)
                return
            }
            setAudioStoragePath(data.path)
            const { data: urlData } = supabase.storage.from('audio').getPublicUrl(data.path)
            if (audioUrl) URL.revokeObjectURL(audioUrl)
            setAudioUrl(urlData.publicUrl)
            setIsPlaying(false)
            setAudioUploadStatus('uploaded')
            uploadStatusResetTimerRef.current = setTimeout(() => setAudioUploadStatus('idle'), 3000)
        } finally {
            setAudioUploading(false)
        }
    }
    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl)
        }
    }, [audioUrl])

    useEffect(() => {
        return () => {
            if (uploadStatusResetTimerRef.current) clearTimeout(uploadStatusResetTimerRef.current)
        }
    }, [])

    useEffect(() => {
        const el = audioRef.current
        if (!el) return
        const onTimeUpdate = () => setAudioCurrentTime(el.currentTime)
        const onLoadedMetadata = () => setAudioDuration(el.duration)
        const onDurationChange = () => setAudioDuration(el.duration)
        const onEnded = () => {
            setAudioCurrentTime(0)
            setIsPlaying(false)
        }
        el.addEventListener('timeupdate', onTimeUpdate)
        el.addEventListener('loadedmetadata', onLoadedMetadata)
        el.addEventListener('durationchange', onDurationChange)
        el.addEventListener('ended', onEnded)
        if (el.duration && Number.isFinite(el.duration)) setAudioDuration(el.duration)
        return () => {
            el.removeEventListener('timeupdate', onTimeUpdate)
            el.removeEventListener('loadedmetadata', onLoadedMetadata)
            el.removeEventListener('durationchange', onDurationChange)
            el.removeEventListener('ended', onEnded)
        }
    }, [audioUrl])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!audioUrl || !audioRef.current) return
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                skipBack10()
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                skipForward10()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [audioUrl])

    const handleSave = async () => {
        if (isSaving) return
        setIsSaving(true)
        const success = await imageBoxRef.current?.save()
        if (success) {
            // 延迟 1.5 秒跳转，给用户看一眼“Saved successfully”提示
            setTimeout(() => {
                navigate('/dashboard')
            }, 1500)
        } else {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-teal-500 animate-spin" />
            </div>
        )
    }

    if (id && notFound) {
        return (
            <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
                    <p className="text-gray-500 mb-8">This project does not exist or you don’t have access to it.</p>
                    <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-semibold hover:bg-teal-700">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FBFBFC]">
            <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-500 hover:text-gray-900 group">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Back</h1>
                </div>

                {(!id || isOwner) ? (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-8 h-12 font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center active:scale-[0.98] ${isSaving ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-100'}`}
                    >
                        {isSaving ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>) : 'Save'}
                    </button>
                ) : (
                    <p className="text-sm text-gray-500">View only · Sign in as owner to edit</p>
                )}
            </header>

            <main className="py-12 px-4">
                <div className="max-w-[1000px] mx-auto">
                    <div className="flex justify-center bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                        <ImageBox
                            key={id || 'new'}
                            ref={imageBoxRef}
                            initialTitle={initialData?.title || ""}
                            initialImageSrc={initialData?.image_url || ""}
                            initialMarks={initialData?.marks || []}
                            initialTextStore={initialData?.text_store || {}}
                            initialUserScale={initialData?.user_scale ?? 1}
                            initialTx={initialData?.tx ?? 0}
                            initialTy={initialData?.ty ?? 0}
                            id={id}
                            audioUrl={audioUrl}
                            slotBetweenTitleAndImage={
                                <div
                                    className="flex items-center justify-between bg-gray-100 rounded-xl border border-gray-200 px-3 w-full md:w-[500px] mb-2"
                                    style={{ height: 50 }}
                                >
                                    <button
                                        type="button"
                                        onClick={togglePlay}
                                        disabled={!audioUrl}
                                        className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                                        title={isPlaying ? '暂停' : '播放'}
                                    >
                                        {isPlaying ? (
                                            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        )}
                                    </button>

                                    <div className="flex-1 flex flex-col items-center justify-center min-w-0 mx-2">
                                        <span className="text-xs font-medium text-gray-600 tabular-nums mb-0.5">
                                            {formatTime(audioCurrentTime)} / {formatTime(audioDuration)}
                                        </span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={audioDuration > 0 ? audioDuration : 100}
                                            step={0.1}
                                            value={audioDuration > 0 ? audioCurrentTime : 0}
                                            onChange={handleSeek}
                                            disabled={!audioUrl}
                                            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                    </div>

                                    <input
                                        ref={audioInputRef}
                                        type="file"
                                        accept="audio/*,.mp3,.m4a,.wav"
                                        onChange={handleAudioUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => audioInputRef.current?.click()}
                                        disabled={audioUploading}
                                        className="ml-4 px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0 min-w-[120px] max-w-[120px]"
                                    >
                                        {audioUploadStatus === 'loading' && (
                                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />loading</>
                                        )}
                                        {audioUploadStatus === 'uploaded' && 'uploaded'}
                                        {audioUploadStatus === 'failed' && 'failed'}
                                        {audioUploadStatus === 'idle' && (
                                            <><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Upload Audio</>
                                        )}
                                    </button>
                                </div>
                            }
                        />
                    </div>
                    {audioUrl && <audio ref={audioRef} src={audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />}
                </div>
            </main>
        </div>
    )
}

export default ImageBoxPage
