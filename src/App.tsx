import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import Home from './pages/Home'

// 从环境变量获取 Clerk Publishable Key
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  console.warn('⚠️ VITE_CLERK_PUBLISHABLE_KEY is missing. Please add it to your .env file.')
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey || ''}>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden">
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </Router>
      </div>
    </ClerkProvider>
  )
}

export default App

