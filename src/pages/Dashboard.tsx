import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

interface LayerFile {
  id: string
  name: string
  createdAt: string
}

const Dashboard = () => {
  const { isSignedIn, isLoaded } = useUser()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  
  // 模拟数据 - 实际使用时从 Supabase 获取
  const [files, setFiles] = useState<LayerFile[]>([
    { id: '1', name: 'Vecel 说明书', createdAt: '2026-01-12' },
  ])

  // 如果还在加载中
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // 如果未登录，跳转到首页
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to access your dashboard</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // 添加新 Layer
  const handleAddNewLayer = () => {
    const newFile: LayerFile = {
      id: Date.now().toString(),
      name: `New Layer ${files.length + 1}`,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setFiles([newFile, ...files])
    // 跳转到 ImageBox 页面
    navigate('/imagebox')
  }

  // 过滤文件
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 左侧边栏 - 只有 Logo */}
      <aside className="w-24 bg-white border-r border-gray-200 min-h-screen flex flex-col items-center pt-8">
        <div 
          className="w-14 h-14 bg-gradient-to-br from-teal-400 to-purple-400 rounded-xl flex items-center justify-center text-white font-bold text-xs leading-tight shadow-md cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="text-center">
            <div>SEE</div>
            <div>LAYER</div>
          </div>
        </div>
      </aside>

      {/* 中间主内容区 */}
      <main className="flex-1 p-8 pt-6">
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Recent Files</h1>
          <button
            onClick={handleAddNewLayer}
            className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            Add New Layer
          </button>
        </div>

        {/* 文件列表表头 */}
        <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b border-gray-300 text-sm font-medium text-gray-500">
          <div>Name</div>
          <div>Time Created</div>
        </div>

        {/* 文件列表 */}
        <div className="divide-y divide-gray-100">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <div
                key={file.id}
                className="grid grid-cols-2 gap-4 px-4 py-4 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => navigate('/imagebox')}
              >
                <div className="text-gray-800">{file.name}</div>
                <div className="text-gray-400">{file.createdAt}</div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-400">
              {searchQuery ? 'No files found' : 'No files yet. Click "Add New Layer" to create one.'}
            </div>
          )}
        </div>
      </main>

      {/* 右侧教程区 */}
      <aside className="w-80 border-l border-gray-200 p-6 pt-6 min-h-screen bg-white">
        {/* 搜索图标 - 右对齐 */}
        <div className="flex justify-end mb-6">
          {showSearch ? (
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setShowSearch(false)}
                autoFocus
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={() => { setSearchQuery(''); setShowSearch(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-6">Tutorial</h2>
        
        <div className="space-y-5 text-gray-700 text-sm leading-relaxed">
          <p>
            - Click Add, upload an image, adjust the image, zoom in or drag
          </p>
          <p>
            - Click Adjust, double click the image, you'll have label numbers (at most 8)
          </p>
          <p>
            - Now you can type text
          </p>
          <p>
            - Move these labels with drag, delete the label with right click
          </p>
          <p className="text-gray-500 italic">
            *refresh the web, your image and text will be deleted
          </p>
        </div>
      </aside>
    </div>
  )
}

export default Dashboard
