import React from 'react'
import {
  SafetyCertificateOutlined,
  SyncOutlined,
  TeamOutlined,
  DashboardOutlined,
  LockOutlined,
  MonitorOutlined
} from '@ant-design/icons'

export interface FeatureItem {
  key: string
  icon: React.ReactNode
  stat?: string | number
  desc: string
}

export interface FeaturesProps {
  /** 产品特点列表 */
  features: FeatureItem[]
  /** 主标题 */
  title?: string
}

const Features: React.FC<FeaturesProps> = ({ features, title = '产品特点' }) => (
  <section className="site-features" id="product" aria-label="产品特点">
    <div className="site-max-width">
      <div className="site-features-title">{title}</div>
      <div className="site-features-list">
        {features.map(f => (
          <div className="site-feature-card" key={f.key} tabIndex={0} aria-label={f.desc}>
            <span className="feature-icon" aria-hidden="true">{f.icon}</span>
            {f.stat && <div className="feature-stat">{f.stat}</div>}
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

export const defaultFeatures: FeatureItem[] = [
  {
    key: 'high-availability',
    icon: <SafetyCertificateOutlined />,
    stat: '99.99%',
    desc: '高可用保障，业务连续无忧'
  },
  {
    key: 'scalable',
    icon: <SyncOutlined />,
    stat: '弹性扩展',
    desc: '支持多业务线灵活扩展'
  },
  {
    key: 'secure',
    icon: <LockOutlined />,
    stat: '安全合规',
    desc: '多重加密，数据安全可靠'
  },
  {
    key: 'monitor',
    icon: <MonitorOutlined />,
    stat: '智能监控',
    desc: '实时运营数据可视化'
  },
  {
    key: 'teamwork',
    icon: <TeamOutlined />,
    stat: '协同高效',
    desc: '多团队协作无缝对接'
  },
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    stat: '管理便捷',
    desc: '统一后台，操作直观易用'
  }
]

export default Features