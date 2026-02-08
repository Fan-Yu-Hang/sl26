import { useRef, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ImageBox, { ImageBoxHandle, ImageBoxSavePayload } from '@/components/ImageBox'
import { useClerkSupabase } from '@/hooks/useClerkSupabase'
import { useUser } from '@clerk/clerk-react'

/** iframes.marks 的 DB 格式 */
type IframeMarkRow = { tx: number; ty: number; text: string }

function iframeMarksToImageBox(rows: IframeMarkRow[] | null): { marks: { id: number; x: number; y: number }[]; text_store: Record<number, string> } {
    const arr = Array.isArray(rows) ? rows : []
    const marks = arr.map((m, i) => ({ id: i + 1, x: m.tx, y: m.ty }))
    const text_store: Record<number, string> = {}
    arr.forEach((m, i) => { text_store[i + 1] = m.text ?? '' })
    return { marks, text_store }
}

function imageBoxPayloadToIframeMarks(payload: ImageBoxSavePayload): IframeMarkRow[] {
    return payload.marks.map(m => ({
        tx: m.x,
        ty: m.y,
        text: payload.text_store[m.id] ?? ''
    }))
}

/** 单条 iframe 的展示数据（用于 ImageBox 初始与保存） */
type IframeItem = {
    id?: number;
    image_url: string;
    marks: { id: number; x: number; y: number }[];
    text_store: Record<number, string>;
    user_scale: number;
    tx: number;
    ty: number;
}

const blankIframe = (): IframeItem => ({
    image_url: '',
    marks: [],
    text_store: {},
    user_scale: 1,
    tx: 0,
    ty: 0
})

/** 详情页：从 layers + iframes 按 layer id 拉取；支持多 iframe，列表下方加号新增。 */
const ImageBoxPage = () => {
    const { id: layerId } = useParams()
    const imageBoxRefs = useRef<(ImageBoxHandle | null)[]>([])
    const supabase = useClerkSupabase()
    const supabaseRef = useRef(supabase)
    supabaseRef.current = supabase
    const { user, isLoaded } = useUser()
    /** 当前 layer 的元信息（有 layerId 时从接口拉取） */
    const [layerInfo, setLayerInfo] = useState<{
        layer_title: string;
        clerk_id: string | null;
        audio_url: string | null;
        iframe_ids: number[];
    } | null>(null)
    /** 当前页展示的 iframe 列表（含未落库的空白项）；初始一个空白便于新建时即有一块 */
    const [iframes, setIframes] = useState<IframeItem[]>(() => [blankIframe()])
    const [loading, setLoading] = useState(!!layerId)
    const [notFound, setNotFound] = useState(false)

    const isOwner = Boolean(layerId && user && layerInfo?.clerk_id === user.id)

    useEffect(() => {
        const client = supabaseRef.current
        async function loadData() {
            if (!layerId || !isLoaded) {
                setLoading(false)
                if (!layerId) setIframes([blankIframe()])
                return
            }
            try {
                setLoading(true)
                setNotFound(false)
                setIframes([])
                const { data: layer, error: layerError } = await client
                    .from('layers')
                    .select('id, layer_title, clerk_id, audio_url, iframe_ids')
                    .eq('id', layerId)
                    .single()

                if (layerError || !layer) {
                    setNotFound(true)
                    setLayerInfo(null)
                    setIframes([])
                    return
                }

                const iframeIds = (layer.iframe_ids as number[] | null) ?? []
                setLayerInfo({
                    layer_title: (layer.layer_title as string) ?? '',
                    clerk_id: (layer.clerk_id as string) ?? null,
                    audio_url: (layer.audio_url as string) ?? null,
                    iframe_ids: iframeIds
                })

                if (iframeIds.length === 0) {
                    setIframes([blankIframe()])
                    setNotFound(false)
                    return
                }

                const { data: rows, error: iframesError } = await client
                    .from('iframes')
                    .select('id, image_url, marks, image_scale, tx, ty')
                    .in('id', iframeIds)

                if (iframesError || !rows?.length) {
                    setIframes([blankIframe()])
                    setNotFound(false)
                    return
                }

                const orderMap = new Map<number, number>()
                iframeIds.forEach((id, idx) => orderMap.set(id, idx))
                const sorted = [...rows].sort((a, b) => (orderMap.get(a.id as number) ?? 0) - (orderMap.get(b.id as number) ?? 0))
                const list: IframeItem[] = sorted.map(row => {
                    const rawMarks = (row.marks as IframeMarkRow[] | null) ?? []
                    const { marks, text_store } = iframeMarksToImageBox(rawMarks)
                    return {
                        id: row.id as number,
                        image_url: (row.image_url as string) ?? '',
                        marks,
                        text_store,
                        user_scale: Number(row.image_scale) ?? 1,
                        tx: Number(row.tx) ?? 0,
                        ty: Number(row.ty) ?? 0
                    }
                })
                setIframes(list)
                setNotFound(false)
            } catch (err) {
                console.error('Failed to load data:', err)
                setNotFound(true)
                setLayerInfo(null)
                setIframes([])
            } finally {
                setLoading(false)
            }
        }

        if (layerId && isLoaded) {
            loadData()
        } else {
            if (!layerId) setIframes([blankIframe()])
            setLayerInfo(null)
            setNotFound(false)
            if (layerId) setIframes([])
            setLoading(false)
        }
    }, [layerId, isLoaded])

    useEffect(() => {
        if (layerId && layerInfo?.audio_url) {
            setAudioUrl(layerInfo.audio_url)
            setAudioUploadStatus('uploaded')
        }
    }, [layerId, layerInfo?.audio_url])

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

    const addIframe = async () => {
        if (layerId) {
            const { data: newRow, error } = await supabase
                .from('iframes')
                .insert({
                    layer_id: parseInt(layerId, 10),
                    image_url: '',
                    marks: [],
                    image_scale: 1,
                    tx: 0,
                    ty: 0
                })
                .select('id')
                .single()
            if (error || !newRow) {
                console.error('Error inserting iframe:', error)
                return
            }
            const newId = newRow.id as number
            const nextIds = [...(layerInfo?.iframe_ids ?? []), newId]
            await supabase
                .from('layers')
                .update({ iframe_ids: nextIds, updated_at: new Date().toISOString() })
                .eq('id', layerId)
            setLayerInfo(prev => prev ? { ...prev, iframe_ids: nextIds } : null)
            setIframes(prev => [...prev, { ...blankIframe(), id: newId }])
        } else {
            setIframes(prev => [...prev, blankIframe()])
        }
    }

    const removeIframe = (index: number) => {
        const idToRemove = iframes[index]?.id
        setIframes(prev => {
            const next = prev.filter((_, i) => i !== index)
            return next.length === 0 ? [blankIframe()] : next
        })
        if (idToRemove != null && layerInfo?.iframe_ids) {
            setLayerInfo(prev => prev ? { ...prev, iframe_ids: (prev.iframe_ids ?? []).filter(id => id !== idToRemove) } : null)
        }
    }

    const handleSave = async () => {
        if (isSaving) return
        const refs = imageBoxRefs.current
        const payloads: (ImageBoxSavePayload | null)[] = []
        for (let i = 0; i < iframes.length; i++) {
            const p = refs[i]?.getPayload?.() ?? null
            payloads.push(p)
        }
        const firstPayload = payloads[0]
        if (!firstPayload?.image_url && iframes.length === 1) {
            return
        }
        setIsSaving(true)
        try {
            const audioUrlValue = audioUrl?.trim() || null
            const clerkId = user?.id ?? null
            const layerTitle = firstPayload?.layer_title ?? layerInfo?.layer_title ?? ''

            if (layerId) {
                const newIds: number[] = []
                for (let i = 0; i < iframes.length; i++) {
                    const payload = payloads[i]
                    if (!payload) continue
                    if (iframes[i].id != null) {
                        newIds.push(iframes[i].id!)
                        await supabase
                            .from('iframes')
                            .update({
                                image_url: payload.image_url,
                                marks: imageBoxPayloadToIframeMarks(payload),
                                image_scale: payload.user_scale,
                                tx: payload.tx,
                                ty: payload.ty,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', iframes[i].id)
                    } else {
                        const { data: inserted, error } = await supabase
                            .from('iframes')
                            .insert({
                                layer_id: parseInt(layerId, 10),
                                image_url: payload.image_url,
                                marks: imageBoxPayloadToIframeMarks(payload),
                                image_scale: payload.user_scale,
                                tx: payload.tx,
                                ty: payload.ty
                            })
                            .select('id')
                            .single()
                        if (error || !inserted) continue
                        newIds.push(inserted.id as number)
                        setIframes(prev => {
                            const next = [...prev]
                            if (next[i]) next[i] = { ...next[i], id: inserted.id as number }
                            return next
                        })
                    }
                }
                await supabase
                    .from('layers')
                    .update({
                        layer_title: layerTitle,
                        audio_url: audioUrlValue,
                        clerk_id: clerkId,
                        iframe_ids: newIds,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', layerId)
                setLayerInfo(prev => prev ? { ...prev, layer_title: layerTitle, iframe_ids: newIds } : null)
            } else {
                const { data: newLayer, error: layerErr } = await supabase
                    .from('layers')
                    .insert({
                        clerk_id: clerkId,
                        layer_title: layerTitle,
                        audio_url: audioUrlValue,
                        iframe_ids: []
                    })
                    .select('id')
                    .single()
                if (layerErr || !newLayer) {
                    console.error('Error inserting layer:', layerErr)
                    setIsSaving(false)
                    return
                }
                const newLayerId = newLayer.id as number
                const newIds: number[] = []
                for (let i = 0; i < payloads.length; i++) {
                    const payload = payloads[i]
                    if (!payload) continue
                    const { data: inserted, error } = await supabase
                        .from('iframes')
                        .insert({
                            layer_id: newLayerId,
                            image_url: payload.image_url,
                            marks: imageBoxPayloadToIframeMarks(payload),
                            image_scale: payload.user_scale,
                            tx: payload.tx,
                            ty: payload.ty
                        })
                        .select('id')
                        .single()
                    if (error || !inserted) continue
                    newIds.push(inserted.id as number)
                }
                await supabase
                    .from('layers')
                    .update({ iframe_ids: newIds, updated_at: new Date().toISOString() })
                    .eq('id', newLayerId)
                setTimeout(() => navigate('/dashboard'), 1500)
                return
            }
            setTimeout(() => navigate('/dashboard'), 1500)
        } catch (e) {
            console.error(e)
        } finally {
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

    if (layerId && notFound) {
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

                {(!layerId || isOwner) ? (
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
                    <div className="flex flex-col items-center gap-10 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                        {iframes.map((iframe, i) => (
                            <div key={iframe.id ?? `new-${i}`} className="w-full flex flex-col items-center">
                                <ImageBox
                                    key={iframe.id ?? `new-${i}`}
                                    ref={el => {
                                        const r = imageBoxRefs.current
                                        while (r.length <= i) r.push(null)
                                        r[i] = el
                                    }}
                                    initialTitle={i === 0 ? (layerInfo?.layer_title ?? '') : ''}
                                    showLayerTitleInput={i === 0}
                                    initialImageSrc={iframe.image_url}
                                    initialMarks={iframe.marks}
                                    initialTextStore={iframe.text_store}
                                    initialUserScale={iframe.user_scale}
                                    initialTx={iframe.tx}
                                    initialTy={iframe.ty}
                                    audioUrl={i === 0 ? audioUrl : undefined}
                                    onDeleteCard={() => removeIframe(i)}
                                    slotBetweenTitleAndImage={i === 0 ? (
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
                                    ) : undefined}
                                />
                                {i === iframes.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={addIframe}
                                        className="mt-4 w-12 h-12 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50 transition-colors flex items-center justify-center flex-shrink-0"
                                        title="添加一张图"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {audioUrl && <audio ref={audioRef} src={audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />}
                </div>
            </main>
        </div>
    )
}

export default ImageBoxPage
