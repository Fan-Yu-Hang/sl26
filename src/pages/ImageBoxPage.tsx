import { useRef, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ImageBox, { ImageBoxHandle } from '@/components/ImageBox'
import { useClerkSupabase } from '@/hooks/useClerkSupabase'
import { useUser } from '@clerk/clerk-react'

/** 详情页公开访问：从 image_boxes 按 id 拉取，所有人（含未登录）可看图片和文字；仅所有者可编辑/发布 */
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
    } | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function loadData() {
            if (!isLoaded || !user || !id) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const { data, error } = await supabase
                    .from('image_boxes')
                    .select('*')
                    .eq('id', id)
                    .eq('user_id', user.id)
                    .single()

                if (error) {
                    console.error('Error fetching file:', error)
                } else if (data) {
                    setInitialData({
                        image_url: data.image_url,
                        title: data.title,
                        marks: data.marks || [],
                        text_store: data.text_store || {},
                        user_scale: data.user_scale,
                        tx: data.tx,
                        ty: data.ty
                    })
                }
            } catch (err) {
                console.error('Failed to load data:', err)
            } finally {
                setLoading(false)
            }
        }

        if (id && isLoaded) {
            loadData()
        } else {
            setInitialData(null)
            setLoading(false)
        }
    }, [id, isLoaded, user, supabase])

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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FBFBFC]">
            {/* Header Area */}
            <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-500 hover:text-gray-900 group"
                    >
                        <svg className="w-6 h-6 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">
                            {id ? 'Edit Project' : 'Create New Project'}
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-teal-600">Visual Layer Editor</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-8 h-12 font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2 active:scale-[0.98] ${isSaving
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-100'
                        }`}
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Publishing...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Publish Changes
                        </>
                    )}
                </button>
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
