import React, { useState } from 'react'
import { Drawer, Button } from 'antd'
import { MenuOutlined } from '@ant-design/icons'

const NAV_LINKS = [
  { key: 'home', label: '首页', href: '#home' },
  { key: 'product', label: '产品', href: '#product' },
  { key: 'services', label: '服务', href: '#services' },
  { key: 'about', label: '关于', href: '#about' },
  { key: 'contact', label: '联系', href: '#contact' }
]

interface NavbarProps {
  /** 当前激活菜单项key */
  activeKey?: string
  /** 切换菜单项事件 */
  onMenuClick?: (key: string) => void
  /** Logo文字 */
  logoText?: string
}

const Navbar: React.FC<NavbarProps> = ({
  activeKey = 'home',
  onMenuClick,
  logoText = '企业品牌LOGO'
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLinkClick = (key: string, href: string) => {
    if (onMenuClick) onMenuClick(key)
    setDrawerOpen(false)
    // 页面锚点平滑滚动
    if (href.startsWith('#')) {
      const target = document.querySelector(href)
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 120)
      }
    }
  }

  return (
    <nav className="site-navbar" id="site-navbar">
      <div className="site-max-width" style={{ display: 'flex', alignItems: 'center', height: 64, justifyContent: 'space-between' }}>
        <div className="logo" onClick={() => handleLinkClick('home', '#home')} tabIndex={0} aria-label="返回首页" role="button">
          <span aria-hidden="true" style={{ marginRight: 8 }}>🌐</span>{logoText}
        </div>
        <div className="menu" aria-label="主导航菜单">
          {NAV_LINKS.map(link => (
            <a
              key={link.key}
              href={link.href}
              className={activeKey === link.key ? 'active' : ''}
              onClick={e => {
                e.preventDefault()
                handleLinkClick(link.key, link.href)
              }}
              tabIndex={0}
              aria-current={activeKey === link.key}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="mobile-toggle" aria-label="展开菜单" onClick={() => setDrawerOpen(true)} tabIndex={0}>
          <MenuOutlined />
        </div>
      </div>
      <Drawer
        className="side-menu-drawer"
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        bodyStyle={{ padding: 0 }}
        width={220}
        aria-label="移动端菜单"
      >
        <div style={{ padding: 18 }}>
          {NAV_LINKS.map(link => (
            <Button
              key={link.key}
              type="text"
              block
              style={{
                textAlign: 'left',
                fontWeight: activeKey === link.key ? 600 : undefined,
                color: activeKey === link.key ? 'var(--brand-color)' : '#222',
                marginBottom: 8
              }}
              onClick={() => handleLinkClick(link.key, link.href)}
              tabIndex={0}
              aria-current={activeKey === link.key}
            >
              {link.label}
            </Button>
          ))}
        </div>
      </Drawer>
    </nav>
  )
}

export default Navbar