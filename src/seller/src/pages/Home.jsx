import React from 'react'
import { Row, Col, Card, Statistic, Button, Tag, Tabs, List, Space, Progress, Avatar } from 'antd'

const scoreData = [
  { label: '服务评分', value: 4.95, color: '#f5a623' },
  { label: '交易评分', value: 4.95, color: '#8ea6ff' },
  { label: '评价评分', value: 4.94, color: '#7d7aff' }
]

const todoSections = [
  { title: '交易前', items: [{ label: '待付款', count: 0 }] },
  { title: '交易中', items: [{ label: '待发货', count: 534 }, { label: '待收货', count: 0 }] },
  { title: '交易后', items: [{ label: '退货', count: 0 }, { label: '待评价', count: 3467 }] },
  { title: '投诉', items: [{ label: '待处理', count: 3 }] },
  { title: '商品', items: [{ label: '库存预警', count: 2 }, { label: '审核中', count: 6 }] },
  { title: '其他', items: [{ label: '秒杀活动', count: 0 }, { label: '等待对账', count: 0 }] }
]

const metrics = [
  { title: '上架商品数量', value: 17691 },
  { title: '今日订单总额', value: '¥0.00' },
  { title: '今日订单数量', value: 0 },
  { title: '今日访客数量', value: 29 }
]

const notices = [
  { title: '店铺入驻协议' },
  { title: '证照信息' },
  { title: '隐私' },
  { title: '消费者权益保障细则说明' }
]

export default function Home() {
  return (
    <div>
      <Row gutter={16}>
        <Col span={16}>
          <Card styles={{ body: { padding: 20 } }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar size={80} src="https://via.placeholder.com/80" />
                <Space direction="vertical">
                  <div style={{ fontSize: 20, fontWeight: 600 }}>Hi, GOODS</div>
                  <div>店铺名称：杂货铺</div>
                  <div>店铺状态：开店中</div>
                  <Button type="primary" style={{ background: '#ff7a45', borderColor: '#ff7a45', width: 140 }}>点击联系客服</Button>
                </Space>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                {scoreData.map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <Progress type="circle" percent={Math.round((s.value / 5) * 100)} width={120} strokeColor={s.color} format={() => `${s.value}分`} />
                    <div style={{ marginTop: 8 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="平台公告">
            <List
              dataSource={notices}
              renderItem={n => (
                <List.Item>
                  <Button type="link">{n.title}</Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="待办事项" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          {todoSections.slice(0, 3).map(sec => (
            <Col span={8} key={sec.title}>
              <div style={{ background: '#f7f7f7', borderRadius: 8, padding: 16 }}>
                <div style={{ color: '#ccc', marginBottom: 8, fontWeight: 600 }}>{sec.title}</div>
                <Row>
                  {sec.items.map(it => (
                    <Col span={12} key={it.label} style={{ textAlign: 'center', marginBottom: 12 }}>
                      <div style={{ color: '#f5222d', fontSize: 18 }}>{it.count}</div>
                      <div style={{ color: '#666' }}>{it.label}</div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>
          ))}
        </Row>
        <Row gutter={16} style={{ marginTop: 12 }}>
          {todoSections.slice(3).map(sec => (
            <Col span={8} key={sec.title}>
              <div style={{ background: '#f7f7f7', borderRadius: 8, padding: 16 }}>
                <div style={{ color: '#ccc', marginBottom: 8, fontWeight: 600 }}>{sec.title}</div>
                <Row>
                  {sec.items.map(it => (
                    <Col span={12} key={it.label} style={{ textAlign: 'center', marginBottom: 12 }}>
                      <div style={{ color: '#f5222d', fontSize: 18 }}>{it.count}</div>
                      <div style={{ color: '#666' }}>{it.label}</div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="统计数据" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          {metrics.map((m, i) => (
            <Col span={6} key={m.title}>
              <div style={{ height: 96, borderRadius: 8, padding: 16, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: ['#ff8f6b', '#8fb3ff', '#7fb0a9', '#9aa3af'][i] }}>
                <div style={{ fontSize: 16 }}>{m.title}</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{m.value}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="常用功能" style={{ marginTop: 16 }}>
        <Tabs
          items={[
            { key: '1', label: '商品', children: (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Button type="primary">发布商品</Button>
                <Button>商品列表</Button>
                <Button>品牌管理</Button>
                <Button>分类管理</Button>
              </div>
            ) },
            { key: '2', label: '订单', children: (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Button>订单列表</Button>
                <Button>售后服务</Button>
              </div>
            ) },
            { key: '3', label: '促销', children: (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Button>优惠券</Button>
                <Button>秒杀</Button>
                <Button>满减</Button>
              </div>
            ) }
          ]}
        />
      </Card>
    </div>
  )
}