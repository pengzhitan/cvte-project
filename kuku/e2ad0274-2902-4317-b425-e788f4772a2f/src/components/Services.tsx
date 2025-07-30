import React from 'react'
import { Button } from 'antd'
import {
  CloudOutlined,
  DatabaseOutlined,
  AuditOutlined
} from '@ant-design/icons'

export interface ServiceItem {
  key: string
  title: string
  desc: string
  icon: React.ReactNode
  onMore?: () => void
}

export interface ServicesProps {
  /** 服务列表 */
  services: ServiceItem[]
}

const Services: React.FC<ServicesProps> = ({ services }) => {
  return (
    <section className="site-services" id="services" aria-label="核心服务">
      <div className="site-max-width">
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, color: '#182848', marginBottom: 8 }}>
          核心服务
        </h2>
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '1.07rem', marginBottom: 18 }}>
          我们为企业数字化转型提供全方位支持
        </div>
        <div className="site-services-list">
          {services.map(item => (
            <div className="site-service-card" key={item.key} tabIndex={0} aria-label={item.title}>
              <div className="service-icon" aria-hidden="true">{item.icon}</div>
              <div className="service-title">{item.title}</div>
              <div className="service-desc">{item.desc}</div>
              <Button
                className="service-more"
                type="link"
                onClick={item.onMore}
                aria-label={`了解更多${item.title}`}
                tabIndex={0}
              >
                了解更多 &gt;
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// 默认导出带示例icon的服务
export const defaultServices: ServiceItem[] = [
  {
    key: 'custom-dev',
    title: '定制开发',
    desc: '为企业量身打造高效、灵活的信息化系统，支持多端集成。',
    icon: <AuditOutlined style={{ color: '#2563eb' }} />
  },
  {
    key: 'cloud-solution',
    title: '云解决方案',
    desc: '弹性云架构，助力业务无缝扩展，实现高可用与低成本。',
    icon: <CloudOutlined style={{ color: '#2563eb' }} />
  },
  {
    key: 'data-analytics',
    title: '数据分析',
    desc: '智能数据驱动决策，洞察业务趋势，提升核心竞争力。',
    icon: <DatabaseOutlined style={{ color: '#2563eb' }} />
  }
]

export default Services