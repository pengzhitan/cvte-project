import React from 'react'
import { Button } from 'antd'
import { DownOutlined } from '@ant-design/icons'

export interface BannerProps {
  /** 主标题 */
  title: string
  /** 副标题 */
  subtitle?: string
  /** CTA按钮文字 */
  ctaText?: string
  /** CTA点击事件 */
  onCTAClick?: () => void
  /** 背景图片URL，可选 */
  backgroundUrl?: string
  /** 是否显示下拉箭头 */
  showArrow?: boolean
}

const Banner: React.FC<BannerProps> = ({
  title,
  subtitle,
  ctaText = '立即体验',
  onCTAClick,
  backgroundUrl,
  showArrow = true
}) => {
  return (
    <section
      className="site-banner"
      id="home"
      role="banner"
      aria-label="企业首页Banner"
      style={backgroundUrl ? {
        background: `linear-gradient(120deg, #e0e7ff 0%, #f8fafc 100%), url(${backgroundUrl}) center/cover no-repeat`
      } : undefined}
    >
      <div className="banner-content" data-testid="banner-content">
        <h1 className="banner-title">{title}</h1>
        {subtitle && <div className="banner-sub">{subtitle}</div>}
        <Button
          className="banner-cta"
          type="primary"
          size="large"
          onClick={onCTAClick}
          aria-label={ctaText}
        >
          {ctaText}
        </Button>
      </div>
      {showArrow && (
        <div
          className="banner-arrow"
          tabIndex={0}
          aria-label="向下滚动"
          onClick={() => {
            const next = document.getElementById('services')
            if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        >
          <DownOutlined />
        </div>
      )}
    </section>
  )
}

export default Banner