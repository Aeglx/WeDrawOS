import React, { useState } from 'react'
import { Card, Row, Col, Statistic, Radio } from 'antd'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const weekData = [
  { name: 'Mon', pv: 120 },
  { name: 'Tue', pv: 180 },
  { name: 'Wed', pv: 90 },
  { name: 'Thu', pv: 200 },
  { name: 'Fri', pv: 160 },
  { name: 'Sat', pv: 220 },
  { name: 'Sun', pv: 140 }
]
const monthData = Array.from({ length: 30 }).map((_, i) => ({ name: `${i + 1}`, pv: 60 + Math.round(Math.random() * 160) }))
const quarterData = Array.from({ length: 13 }).map((_, i) => ({ name: `W${i + 1}`, pv: 80 + Math.round(Math.random() * 180) }))

export default function ProductStats() {
  const [range, setRange] = useState('week')
  const data = range === 'week' ? weekData : range === 'month' ? monthData : quarterData
  return (
    <div>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="上架商品" value={128} /></Card></Col>
        <Col span={6}><Card><Statistic title="在售商品" value={86} /></Card></Col>
        <Col span={6}><Card><Statistic title="缺货商品" value={12} /></Card></Col>
        <Col span={6}><Card><Statistic title="下架商品" value={30} /></Card></Col>
      </Row>
      <Card title="趋势" style={{ marginTop: 16 }} extra={<Radio.Group value={range} onChange={e => setRange(e.target.value)} options={[{ label: '近7天', value: 'week' }, { label: '近30天', value: 'month' }, { label: '近90天', value: 'quarter' }]} optionType="button" />}>
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="pv" stroke="#ffc658" fill="#ffe59e" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}