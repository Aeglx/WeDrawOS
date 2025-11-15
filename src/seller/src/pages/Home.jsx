import React from 'react'
import { Row, Col, Card, Statistic, Button, Table, Tag, Tabs, List, Space, Progress } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

const stats = [
  { title: '今日订单', value: 128, suffix: '', trend: 'up', percent: 12, color: '#3f8600' },
  { title: '今日支付', value: 96, suffix: '', trend: 'up', percent: 8, color: '#3f8600' },
  { title: '今日访客', value: 1520, suffix: '', trend: 'down', percent: 3, color: '#cf1322' },
  { title: '转化率', value: 6.2, suffix: '%', trend: 'up', percent: 0.6, color: '#1677ff' }
]

const salesTrend = [
  { name: '09:00', val: 12 },
  { name: '10:00', val: 18 },
  { name: '11:00', val: 9 },
  { name: '12:00', val: 20 },
  { name: '13:00', val: 16 },
  { name: '14:00', val: 22 },
  { name: '15:00', val: 14 }
]

const tasks = [
  { key: 1, name: '待发货订单', count: 12, type: 'processing' },
  { key: 2, name: '售后待处理', count: 3, type: 'warning' },
  { key: 3, name: '库存告警商品', count: 7, type: 'error' },
  { key: 4, name: '待审核商品', count: 5, type: 'processing' }
]

const goodsColumns = [
  { title: '商品', dataIndex: 'name', key: 'name' },
  { title: '价格', dataIndex: 'price', key: 'price' },
  { title: '销量', dataIndex: 'sales', key: 'sales' },
  { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={v === '在售' ? 'green' : 'default'}>{v}</Tag> }
]

const goodsData = Array.from({ length: 5 }).map((_, i) => ({
  key: i,
  name: `示例商品${i + 1}`,
  price: 99 + i,
  sales: 200 - i * 10,
  status: i % 2 === 0 ? '在售' : '下架'
}))

const notices = [
  { title: '系统升级通知', desc: '本周六凌晨将进行系统升级维护。' },
  { title: '拼团活动上线', desc: '新促销功能拼团已上线，欢迎体验。' },
  { title: '商家学习资料', desc: '运营手册与平台规则已更新。' }
]

export default function Home() {
  return (
    <div>
      <Row gutter={16}>
        {stats.map(s => (
          <Col span={6} key={s.title}>
            <Card bodyStyle={{ padding: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Statistic
                  title={s.title}
                  value={s.value}
                  suffix={s.suffix}
                  valueStyle={{ color: s.color }}
                  prefix={s.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#999' }}>较昨日 {s.trend === 'up' ? '+' : '-'}{s.percent}%</span>
                  {s.title === '转化率' ? (
                    <Progress percent={Math.round(Number(s.value) * 10) / 10} size="small" strokeColor="#1677ff" style={{ width: 120 }} />
                  ) : (
                    <div style={{ width: 120 }} />
                  )}
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="待办事项" extra={<Button type="link">查看全部</Button>}>
            <List
              dataSource={tasks}
              renderItem={item => (
                <List.Item>
                  <span>{item.name}</span>
                  <Tag color={item.type} style={{ marginLeft: 'auto' }}>{item.count}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="公告" extra={<Button type="link">更多</Button>}>
            <List
              dataSource={notices}
              renderItem={n => (
                <List.Item>
                  <div>
                    <div style={{ fontWeight: 500 }}>{n.title}</div>
                    <div style={{ color: '#999' }}>{n.desc}</div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="商品概况" extra={<Button type="link">前往管理</Button>}>
            <Table columns={goodsColumns} dataSource={goodsData} pagination={false} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="销售趋势">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesTrend}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="val" stroke="#1677ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
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
        </Col>
      </Row>
    </div>
  )
}