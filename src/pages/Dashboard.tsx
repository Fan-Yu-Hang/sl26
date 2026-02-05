import { useState, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useClerkSupabase } from '@/hooks/useClerkSupabase'

/** Dashboard 列表项：来自 layer_box，按 clerk_id 筛当前用户，layer_title 为项目标题 */
interface DashboardItem {
  id: string
  title: string
  createdAt: string
  image_url: string
}

const Dashboard = () => {
  const { isSignedIn, isLoaded, user } = useUser()
  const navigate = useNavigate()
  const supabase = useClerkSupabase()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<DashboardItem[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    try {
      const { error } = await supabase
        .from('layer_box')
        .delete()
        .eq('id', deleteId)
      
      if (error) throw error
      setFiles(prev => prev.filter(f => f.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  useEffect(() => {
    const fetchFiles = async () => {
      if (!isLoaded || !user) return
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('layer_box')
          .select('id, layer_title, image_url, created_at')
          .eq('clerk_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching files:', error)
        } else if (data) {
          const formattedFiles: DashboardItem[] = data.map(item => ({
            id: String(item.id),
            title: (item as { layer_title?: string }).layer_title || 'Untitled Project',
            createdAt: new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            image_url: item.image_url
          }))
          setFiles(formattedFiles)
        }
      } catch (err) {
        console.error('Unexpected error fetching files:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded && isSignedIn) {
      fetchFiles()
    }
  }, [isLoaded, isSignedIn, user, supabase])

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-teal-500 animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-500 mb-8 text-lg">Sign in to your account to access your workspace and projects.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-teal-600 text-white rounded-2xl font-semibold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 active:scale-[0.98]"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const filteredFiles = files.filter(file =>
    file.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div 
            className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-teal-100 cursor-pointer"
            onClick={() => navigate('/')}
          >
            SL
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">SeeLayer</span>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {[
            { id: 'all', label: 'All Projects', icon: 'M4 6h16M4 12h16M4 18h7' },
            { id: 'recent', label: 'Recent', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'favorites', label: 'Favorites', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === item.id 
                  ? 'bg-teal-50 text-teal-700' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-gray-50">
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-12 pr-4 bg-gray-50 border-transparent rounded-xl text-sm transition-all focus:bg-white focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500/30 outline-none"
              />
            </div>
          </div>
          
          <button
            onClick={() => navigate('/imagebox')}
            className="ml-6 px-6 h-11 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center gap-2 flex-shrink-0 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New
          </button>
        </header>

        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-teal-600 font-bold text-xs uppercase tracking-widest mb-2">Projects</p>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Your Workspace</h1>
              </div>
              <p className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-100">
                {filteredFiles.length} {filteredFiles.length === 1 ? 'Project' : 'Projects'}
              </p>
            </div>

            {filteredFiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="group bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    <div 
                      className="relative grow aspect-[4/3] bg-gray-50 cursor-pointer overflow-hidden border-b border-gray-50"
                      onClick={() => navigate(`/imagebox/${file.id}`)}
                    >
                      {file.image_url ? (
                        <img src={file.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 
                          className="font-bold text-gray-900 truncate hover:text-teal-600 transition-colors cursor-pointer"
                          onClick={() => navigate(`/imagebox/${file.id}`)}
                        >
                          {file.title}
                        </h3>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/imagebox/${file.id}`)
                            }}
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteId(file.id)
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{file.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[32px] border-2 border-dashed border-gray-100 p-20 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {searchQuery ? 'No results found' : 'Start your first project'}
                </h3>
                <p className="text-gray-500 mb-10 max-w-sm mx-auto text-lg leading-relaxed">
                  {searchQuery ? `We couldn't find anything matching "${searchQuery}"` : 'Upload an image and start adding interactive marks to create your first visual layer.'}
                </p>
                <button
                  onClick={() => navigate('/imagebox')}
                  className="px-10 py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 flex items-center gap-3 mx-auto active:scale-[0.98]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Project
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modern Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 ease-out">
            <div className="p-8">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Delete Project?</h3>
              <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                Are you sure delete the Layer? Image and texts cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl transition-all active:scale-[0.98]"
                >
                  Keep Project
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-red-200"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
