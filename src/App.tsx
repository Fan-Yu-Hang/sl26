import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import Home from './pages/Home'
import { useClerkSupabaseSync } from './hooks/useClerkSupabaseSync'

// 从环境变量获取 Clerk Publishable Key
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  console.warn('⚠️ VITE_CLERK_PUBLISHABLE_KEY is missing. Please add it to your .env file.')
}

// 内部组件：用于在 ClerkProvider 内部使用 Hook
function AppContent() {
  // 同步 Clerk 用户到 Supabase
  useClerkSupabaseSync()

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </div>
  )
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey || ''}>
      <AppContent />
    </ClerkProvider>
  )
}

export default App

