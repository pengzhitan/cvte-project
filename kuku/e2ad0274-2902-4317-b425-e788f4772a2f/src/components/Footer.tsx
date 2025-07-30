import React from 'react'
import {
  HomeOutlined,
  MailOutlined,
  PhoneOutlined,
  WechatOutlined,
  LinkedinOutlined,
  GithubOutlined
} from '@ant-design/icons'

const SOCIALS = [
  {
    key: 'wechat',
    icon: <WechatOutlined />,
    label: '微信',
    url: 'https://weixin.qq.com/',
    aria: '企业微信'
  },
  {
    key: 'linkedin',
    icon: <LinkedinOutlined />,
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/',
    aria: 'LinkedIn'
  },
  {
    key: 'github',
    icon: <GithubOutlined />,
    label: 'GitHub',
    url: 'https://github.com/',
    aria: 'GitHub'
  }
]

const QUICK_LINKS = [
  { key: 'privacy', label: '隐私政策', url: '#' },
  { key: 'terms', label: '服务条款', url: '#' }
]

export interface FooterProps {
  logoText?: string
  desc?: string
  phone?: string
  email?: string
  address?: string
  socials?: typeof SOCIALS
  quickLinks?: typeof QUICK_LINKS
  copyright?: string
}

const Footer: React.FC<FooterProps> = ({
  logoText = '企业品牌LOGO',
  desc = '致力于为企业提供领先的数字化解决方案，助力创新与成长。',
  phone = '400-820-0000',
  email = 'contact@enterprise.com',
  address = '上海市浦东新区张江高科技园区',
  socials = SOCIALS,
  quickLinks = QUICK_LINKS,
  copyright
}) => (
  <footer className="site-footer" id="contact" aria-label="网站底部联系信息">
    <div className="site-footer-main">
      <div>
        <div className="footer-logo">
          <span aria-hidden="true" style={{ marginRight: 6 }}>🌐</span>{logoText}
        </div>
        <div className="footer-desc">{desc}</div>
      </div>
      <div>
        <div className="footer-contact">
          <PhoneOutlined style={{ marginRight: 6 }} />
          <a href={`tel:${phone.replace(/[^0-9\-]/g, '')}`} aria-label="拨打电话">{phone}</a>
        </div>
        <div className="footer-contact">
          <MailOutlined style={{ marginRight: 6 }} />
          <a href={`mailto:${email}`} aria-label="发送邮件">{email}</a>
        </div>
        <div className="footer-contact">
          <HomeOutlined style={{ marginRight: 6 }} />
          {address}
        </div>
      </div>
      <div>
        <div className="footer-social" aria-label="社交媒体">
          {socials.map(s => (
            <a href={s.url} key={s.key} title={s.label} aria-label={s.aria}
               rel="noopener noreferrer" target="_blank" tabIndex={0}>
              {s.icon}
            </a>
          ))}
        </div>
      </div>
      <div>
        <div className="footer-links" aria-label="快速链接">
          {quickLinks.map(link => (
            <a href={link.url} key={link.key} tabIndex={0}>{link.label}</a>
          ))}
        </div>
      </div>
    </div>
    <div className="site-footer-copyright">
      {copyright || `©${new Date().getFullYear()} 企业品牌. 保留所有权利。`}
    </div>
  </footer>
)

export default Footer