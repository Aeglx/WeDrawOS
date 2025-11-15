import React, { useState } from 'react'
import { Card, Row, Col, Statistic, Radio } from 'antd'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts'

const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042']
const weekDist = [
  { name: '直接', value: 400 },
  { name: '搜索', value: 300 },
  { name: '推荐', value: 300 },
  { name: '广告', value: 200 }
]
const monthDist = [
  { name: '直接', value: 520 },
  { name: '搜索', value: 460 },
  { name: '推荐', value: 340 },
  { name: '广告', value: 220 }
]
const quarterDist = [
  { name: '直接', value: 1280 },
  { name: '搜索', value: 980 },
  { name: '推荐', value: 720 },
  { name: '广告', value: 560 }
]

const weekTrend = [
  { name: 'Mon', pv: 120 },
  { name: 'Tue', pv: 180 },
  { name: 'Wed', pv: 90 },
  { name: 'Thu', pv: 200 },
  { name: 'Fri', pv: 160 },
  { name: 'Sat', pv: 220 },
  { name: 'Sun', pv: 140 }
]
const monthTrend = Array.from({ length: 30 }).map((_, i) => ({ name: `${i + 1}`, pv: 80 + Math.round(Math.random() * 180) }))
const quarterTrend = Array.from({ length: 13 }).map((_, i) => ({ name: `W${i + 1}`, pv: 100 + Math.round(Math.random() * 200) }))

export default function TrafficStats() {
  const [range, setRange] = useState('week')
  const dist = range === 'week' ? weekDist : range === 'month' ? monthDist : quarterDist
  const trend = range === 'week' ? weekTrend : range === 'month' ? monthTrend : quarterTrend
  const pv = dist.reduce((sum, i) => sum + i.value, 0)
  const uv = Math.round(pv * 0.65)
  const bounce = 38.6
  const avgTime = '02:36'
  return (
    <div>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="PV" value={pv} /></Card></Col>
        <Col span={6}><Card><Statistic title="UV" value={uv} /></Card></Col>
        <Col span={6}><Card><Statistic title="跳出率" value={bounce} suffix="%" /></Card></Col>
        <Col span={6}><Card><Statistic title="平均停留" value={avgTime} /></Card></Col>
      </Row>
      <Card title="来源分布" style={{ marginTop: 16 }} extra={<Radio.Group value={range} onChange={e => setRange(e.target.value)} options={[{ label: '近7天', value: 'week' }, { label: '近30天', value: 'month' }, { label: '近90天', value: 'quarter' }]} optionType="button" />}>
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie data={dist} cx="50%" cy="50%" outerRadius={120} dataKey="value">
              {dist.map((entry, index) => (
                <Cell key={`c-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
      <Card title="流量趋势" style={{ marginTop: 16 }}>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={trend}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="pv" stroke="#1677ff" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}