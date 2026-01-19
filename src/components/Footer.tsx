const Footer = () => {
  return (
    <footer className="text-gray-900" style={{ backgroundColor: '#EFEFE9' }} id="footer">
      <div className="container mx-auto px-4 md:px-8 py-8 md:py-16">
        {/* About SeeLayer's Team Section */}
        <div className="max-w-4xl mx-auto mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 md:mb-8">
            About SeeLayer's Team
          </h2>
          
          <p className="text-base md:text-lg lg:text-xl text-left mb-6 md:mb-8 px-2 md:px-0">
            Our team has 5 members, we graduated from Hongkong Baptist University and Tsinghua University, welcome to join, and welcome to invest this start-up~
          </p>

          {/* Team Members List */}
          <ul className="space-y-3 md:space-y-4 text-left mb-8 md:mb-12 px-2 md:px-0">
            <li className="text-base md:text-lg lg:text-xl">
              1-5 Mr.Fan, PM (CEO) <span className="text-gray-500 block sm:inline">Hongkong Baptist University</span>
            </li>
            <li className="text-base md:text-lg lg:text-xl">
              2-5 Mr.Qian, front-end
            </li>
            <li className="text-base md:text-lg lg:text-xl">
              3-5 Mr.Guo, back-end
            </li>
            <li className="text-base md:text-lg lg:text-xl">
              4-5 Dr.He, gamification designer <span className="text-gray-500 block sm:inline">Tsinghua University</span>
            </li>
            <li className="text-base md:text-lg lg:text-xl">
              5-5 Mr.Wang, graphic designer <span className="text-gray-500 block sm:inline">Tsinghua University</span>
            </li>
          </ul>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-300 pt-8 md:pt-16 lg:pt-[200px]">
          <div className="flex flex-col items-center gap-6 md:gap-8">
            {/* Social Media Links - Center */}
            <div className="flex gap-4 sm:gap-8 md:gap-[54px] items-center px-6 sm:px-10 md:px-[64px] py-6 sm:py-8 md:py-[44px] bg-[#CCCCCC] rounded-[24px] md:rounded-[45px]">
              <a
                href="https://x.com/SeeLayer"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors"
                aria-label="X (Twitter)"
              >
                <img src="/images/x.png" alt="" className="w-8 h-8 md:w-auto md:h-auto" />
              </a>
              <a
                href="https://www.youtube.com/@SeeLayer2024"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <img src="/images/youtube.png" alt="" className="w-8 h-8 md:w-auto md:h-auto" />
              </a>
              <a
                href="https://www.xiaohongshu.com/user/profile/5a60a57111be1037f5aee4a1?xsec_token=ABPBDMvdTOBXC8MsXST824t-aF7UFIQY92MKJCG2ETT14%3D&xsec_source=pc_search"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Xiaohongshu"
              >
                <img src="/images/xhs.png" alt="" className="w-8 h-8 md:w-auto md:h-auto" />
              </a>
              <a
                href="https://space.bilibili.com/363820921?spm_id_from=333.337.0.0"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors"
                aria-label="bilibili"
              >
                <img src="/images/bi.png" alt="" className="w-8 h-8 md:w-auto md:h-auto" />
              </a>
            </div>

            {/* Company Name - Bottom */}
            <p className="text-xs sm:text-sm md:text-base text-gray-700 text-center">
              HangZhou ProtonFly IoT Inc.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
