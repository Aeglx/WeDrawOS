import React, { useState } from 'react'
import { Card, Row, Col, Statistic, Radio } from 'antd'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const weekData = [
  { name: 'Mon', pv: 120 },
  { name: 'Tue', pv: 180 },
  { name: 'Wed', pv: 90 },
  { name: 'Thu', pv: 200 },
  { name: 'Fri', pv: 160 },
  { name: 'Sat', pv: 220 },
  { name: 'Sun', pv: 140 }
]
const monthData = Array.from({ length: 30 }).map((_, i) => ({ name: `${i + 1}`, pv: 80 + Math.round(Math.random() * 150) }))
const quarterData = Array.from({ length: 13 }).map((_, i) => ({ name: `W${i + 1}`, pv: 100 + Math.round(Math.random() * 180) }))

export default function MemberStats() {
  const [range, setRange] = useState('week')
  const data = range === 'week' ? weekData : range === 'month' ? monthData : quarterData
  return (
    <div>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="新增会员" value={86} /></Card></Col>
        <Col span={6}><Card><Statistic title="活跃会员" value={420} /></Card></Col>
        <Col span={6}><Card><Statistic title="会员增长率" value={12.4} suffix="%" /></Card></Col>
        <Col span={6}><Card><Statistic title="复购率" value={28.6} suffix="%" /></Card></Col>
      </Row>
      <Card title="趋势" style={{ marginTop: 16 }} extra={<Radio.Group value={range} onChange={e => setRange(e.target.value)} options={[{ label: '近7天', value: 'week' }, { label: '近30天', value: 'month' }, { label: '近90天', value: 'quarter' }]} optionType="button" />}>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="pv" stroke="#8884d8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}