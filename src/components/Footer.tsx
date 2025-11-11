const Footer = () => {
  const footerLinks = [
    {
      title: 'To B——让软件开发没有难做的生意',
      href: 'https://ndpcdq918n.feishu.cn/docx/ZvR4dyTa5oJiuVx8chLcf2sAnYd',
    },
    {
      title: 'To C——图片、地图动态标注',
      href: 'https://ndpcdq918n.feishu.cn/docx/OqgYduWgBopQVPxagZMcQFJKn0d',
    },
    {
      title: '关于我们——透见SeeLayer',
      href: 'https://ndpcdq918n.feishu.cn/docx/TR89dcBeToSB2hxRsoxckhzsnjg',
    },
  ]

  const downloads = [
    {
      name: 'Mac',
      href: 'https://seelayer.oss-cn-beijing.aliyuncs.com/updates/SeeLayer-Mac-Installer.dmg',
    },
    {
      name: 'Win',
      href: 'https://seelayer.oss-cn-beijing.aliyuncs.com/updates/SeeLayer-Windows-Setup.exe',
    },
  ]

  const socialLinks = [
    {
      name: '小红书',
      image: '/images/xhs.jpg',
      href: 'https://www.xiaohongshu.com/user/profile/5a60a57111be1037f5aee4a1?xsec_token=YBasSrG6grAhtYWapyR--Y6gVnb3MsmUMovGQhFfBtxvE=&xsec_source=app_share&xhsshare=CopyLink&appuid=607fbeb7000000000100b873&apptime=1749662523&share_id=49037dad9bb346f4aced542ae47dcad3',
    },
    {
      name: 'Bilibili',
      image: '/images/bi.jpg',
      href: 'https://space.bilibili.com/363820921/upload/video',
    },
  ]

  return (
    <footer className="text-gray-300" style={{ backgroundColor: '#EFEFE9' }}>
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Documentation Links */}
          <div>
            <div className="mb-6">
              <img
                src="/images/feishu.png"
                alt="Feishu"
                className="h-12 w-auto object-contain"
              />
            </div>
            <ul className="space-y-4">
              {footerLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 transition-colors duration-200 block py-2"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Downloads */}
          <div id="download" className="scroll-mt-20">
            <div className="mb-6">
              <img
                src="/images/logo.png"
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
            <ul className="space-y-4">
              {downloads.map((download, index) => (
                <li key={index}>
                  <a
                    href={download.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 transition-colors duration-200 block py-2 font-semibold"
                  >
                    {download.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-6">关注我们</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity duration-200"
                >
                  <img
                    src={social.image}
                    alt={social.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Seelayer. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
