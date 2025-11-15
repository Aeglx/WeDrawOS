import React, { useState } from 'react'
import { Card, Row, Col, Statistic, Radio } from 'antd'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const weekData = [
  { name: 'Mon', uv: 12 },
  { name: 'Tue', uv: 18 },
  { name: 'Wed', uv: 9 },
  { name: 'Thu', uv: 20 },
  { name: 'Fri', uv: 16 },
  { name: 'Sat', uv: 22 },
  { name: 'Sun', uv: 14 }
]
const monthData = Array.from({ length: 30 }).map((_, i) => ({ name: `${i + 1}`, uv: 10 + Math.round(Math.random() * 25) }))
const quarterData = Array.from({ length: 13 }).map((_, i) => ({ name: `W${i + 1}`, uv: 12 + Math.round(Math.random() * 30) }))

export default function OrderStats() {
  const [range, setRange] = useState('week')
  const data = range === 'week' ? weekData : range === 'month' ? monthData : quarterData
  return (
    <div>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="订单数" value={286} /></Card></Col>
        <Col span={6}><Card><Statistic title="成交额" value={128640} prefix="¥" /></Card></Col>
        <Col span={6}><Card><Statistic title="客单价" value={225.6} prefix="¥" /></Card></Col>
        <Col span={6}><Card><Statistic title="退款率" value={2.1} suffix="%" /></Card></Col>
      </Row>
      <Card title="趋势" style={{ marginTop: 16 }} extra={<Radio.Group value={range} onChange={e => setRange(e.target.value)} options={[{ label: '近7天', value: 'week' }, { label: '近30天', value: 'month' }, { label: '近90天', value: 'quarter' }]} optionType="button" />}>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="uv" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}