import React, { useState } from 'react'
import Navbar from './components/Navbar'
import Banner from './components/Banner'
import Services, { defaultServices } from './components/Services'
import Features, { defaultFeatures } from './components/Features'
import Footer from './components/Footer'
import { message } from 'antd'

const App: React.FC = () => {
  // 激活菜单项状态
  const [activeKey, setActiveKey] = useState<string>('home')

  // 组件事件演示
  const handleServiceMore = (key: string) => {
    message.info(`即将跳转到「${defaultServices.find(s => s.key === key)?.title}」详情页`)
  }

  // 示例服务数据，加上弹窗事件
  const services = defaultServices.map(s => ({
    ...s,
    onMore: () => handleServiceMore(s.key)
  }))

  return (
    <div>
      {/* 导航栏 */}
      <Navbar
        activeKey={activeKey}
        onMenuClick={key => setActiveKey(key)}
        logoText="企业品牌LOGO"
      />
      {/* Banner */}
      <Banner
        title="赋能企业数字化转型"
        subtitle="用科技推动业务创新，助力企业高效成长"
        ctaText="立即联系我们"
        onCTAClick={() => {
          setActiveKey('contact')
          setTimeout(() => {
            const el = document.getElementById('contact')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }}
        showArrow
      />
      {/* 核心服务 */}
      <Services services={services} />
      {/* 产品特点 */}
      <Features features={defaultFeatures} />
      {/* 页脚 */}
      <Footer
        logoText="企业品牌LOGO"
        desc="致力于为企业提供领先的数字化解决方案，助力创新与成长。"
        phone="400-820-0000"
        email="contact@enterprise.com"
        address="上海市浦东新区张江高科技园区"
      />
    </div>
  )
}

export default App