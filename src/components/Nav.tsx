import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useUser, SignInButton, UserButton } from '@clerk/clerk-react'

const Nav = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const { isSignedIn, user } = useUser()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href')
    if (href && href.startsWith('#')) {
      e.preventDefault()
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      setIsMobileMenuOpen(false)
    }
  }

  const handleDownloadClick = () => {
    const downloadSection = document.getElementById('download')
    if (downloadSection) {
      downloadSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      // 如果找不到下载区域，滚动到页面底部
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  const navLinks = [
    { to: '/', label: 'Why SeeLayer?', isHash: false },
    { href: '#main', label: 'Have a try', isHash: true },
    { href: '#features2', label: 'Price', isHash: true },
    { href: '#footer', label: 'About us', isHash: true },
  ]

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 max-w-full overflow-x-hidden ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 max-w-full">
          <div className="flex items-center justify-between h-20 min-w-0">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <img
                src="/images/logo.png"
                alt="Logo"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6 flex-shrink-0 ml-4">
              {navLinks.map((link, index) =>
                link.isHash ? (
                  <a
                    key={index}
                    href={link.href}
                    onClick={handleLinkClick}
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 whitespace-nowrap text-sm xl:text-base"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={index}
                    to={link.to!}
                    className={`font-medium transition-colors duration-200 whitespace-nowrap text-sm xl:text-base ${
                      location.pathname === link.to
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}
              {isSignedIn ? (
                <div className="flex items-center space-x-2">
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8",
                        userButtonPopoverCard: "shadow-lg",
                      }
                    }}
                  />
                  {user && (
                    <span className="text-gray-700 text-xs xl:text-sm hidden xl:block">
                      {user.firstName || user.emailAddresses[0]?.emailAddress}
                    </span>
                  )}
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 whitespace-nowrap text-xs xl:text-sm cursor-pointer">
                    <span className="block">Tiger Token</span>
                    <span className="block text-gray-500 text-xs">Sign in/Sign up</span>
                  </button>
                </SignInButton>
              )}
              {/* <button 
                onClick={handleDownloadClick}
                className="px-4 xl:px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap text-sm xl:text-base"
              >
                开启透明之旅
              </button> */}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 animate-slide-up">
            <div className="container mx-auto px-4 py-4 space-y-4 max-w-full">
              {navLinks.map((link, index) =>
                link.isHash ? (
                  <a
                    key={index}
                    href={link.href}
                    onClick={(e) => {
                      handleLinkClick(e)
                      toggleMobileMenu()
                    }}
                    className="block py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={index}
                    to={link.to!}
                    onClick={toggleMobileMenu}
                    className="block py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              )}
              <div className="w-full mt-4 space-y-3">
                {isSignedIn ? (
                  <div className="flex items-center justify-center space-x-2 py-2">
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8",
                        }
                      }}
                    />
                    {user && (
                      <span className="text-gray-700 text-sm">
                        {user.firstName || user.emailAddresses[0]?.emailAddress}
                      </span>
                    )}
                  </div>
                ) : (
                  <SignInButton mode="modal">
                    <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors">
                      注册登录
                    </button>
                  </SignInButton>
                )}
                <button 
                  onClick={handleDownloadClick}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
                >
                  开启透明之旅
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}

export default Nav
