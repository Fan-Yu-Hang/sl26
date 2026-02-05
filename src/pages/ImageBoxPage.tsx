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
                    .select('id, layer_title, image_url, marks, text_store, user_scale, tx, ty, clerk_id')
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
                        clerk_id: data.clerk_id ?? null
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

    const navigate = useNavigate()
    const [isSaving, setIsSaving] = useState(false)

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

    const pageTitle = id ? (initialData?.title || 'Project Details') : 'Create New Project'

    return (
        <div className="min-h-screen bg-[#FBFBFC]">
            <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-500 hover:text-gray-900 group">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight truncate max-w-[280px]" title={pageTitle}>{pageTitle}</h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-teal-600">Visual Layer Editor</p>
                    </div>
                </div>

                {(!id || isOwner) ? (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-8 h-12 font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2 active:scale-[0.98] ${isSaving ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-100'}`}
                    >
                        {isSaving ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publishing...</>) : (<><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Publish Changes</>)}
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
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}

export default ImageBoxPage
