const Footer = () => {
  return (
    <footer className="text-gray-900" style={{ backgroundColor: '#EFEFE9' }} id="footer">
      <div className="container mx-auto px-4 py-16">
        {/* About SeeLayer's Team Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-8">
            About SeeLayer's Team
          </h2>
          
          <p className="text-lg md:text-xl text-left mb-8">
            Our team has 5 members, we graduated from Hongkong Baptist University and Tsinghua University, welcome to join, and welcome to invest this start-up~
          </p>

          {/* Team Members List */}
          <ul className="space-y-4 text-left mb-12">
            <li className="text-lg md:text-xl">
              1-5 Mr.Fan, PM (CEO) <span className="text-gray-500">Hongkong Baptist University</span>
            </li>
            <li className="text-lg md:text-xl">
              2-5 Mr.Qian, front-end
            </li>
            <li className="text-lg md:text-xl">
              3-5 Mr.Guo, back-end
            </li>
            <li className="text-lg md:text-xl">
              4-5 Dr.He, gamification designer <span className="text-gray-500">Tsinghua University</span>
            </li>
            <li className="text-lg md:text-xl">
              5-5 Mr.Wang, graphic designer <span className="text-gray-500">Tsinghua University</span>
            </li>
          </ul>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-300 pt-[200px]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
            {/* Company Name - Bottom Left */}
            <p className="text-sm md:text-base text-gray-700">
              HangZhou ProtonFly IoT Inc.
            </p>

            {/* Social Media Links - Bottom Center */}
            <div className="flex gap-[54px] items-center absolute left-0 right-0 bottom-0 top-0 m-auto px-[64px] py-[44px] w-max bg-[#CCCCCC] rounded-[45px]">
              <a
                href="https://x.com/SeeLayer"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12  rounded-lg flex items-center justify-center transition-colors"
                aria-label="X (Twitter)"
              >
               <img src="/images/x.png" alt="" />
              </a>
              <a
                href="https://www.youtube.com/@SeeLayer2024"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12  rounded-lg flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
               <img src="/images/youtube.png" alt="" />
              </a>
              <a
                href="https://www.xiaohongshu.com/user/profile/5a60a57111be1037f5aee4a1?xsec_token=ABPBDMvdTOBXC8MsXST824t-aF7UFIQY92MKJCG2ETT14%3D&xsec_source=pc_search"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12  rounded-lg flex items-center justify-center transition-colors"
                aria-label="小红书"
              >
                <img src="/images/xhs.png" alt="" />
              </a>
              <a
                href="https://space.bilibili.com/363820921?spm_id_from=333.337.0.0"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12  rounded-lg flex items-center justify-center transition-colors"
                aria-label="bilibili"
              >
                <img src="/images/bi.png" alt="" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
