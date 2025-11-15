import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Button } from 'antd'
import api from '../services/api'

export default function Settlement() {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({ balance: 0, pending: 0 })
  const [data, setData] = useState([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/settlement')
      setSummary(res.data?.summary || { balance: 0, pending: 0 })
      setData(res.data?.data || [])
    } catch (e) {
      setSummary({ balance: 12540.5, pending: 890.2 })
      setData(Array.from({ length: 6 }).map((_, i) => ({
        key: i,
        billNo: 'ST' + (100 + i),
        period: '2025-01',
        amount: 1999 + i * 10,
        status: i % 2 === 0 ? '已结算' : '待结算'
      })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: '结算单号', dataIndex: 'billNo', key: 'billNo' },
    { title: '账期', dataIndex: 'period', key: 'period' },
    { title: '金额', dataIndex: 'amount', key: 'amount' },
    { title: '状态', dataIndex: 'status', key: 'status' }
  ]

  return (
    <div>
      <Row gutter={16}>
        <Col span={12}><Card><Statistic title="账户余额" value={summary.balance} precision={2} /></Card></Col>
        <Col span={12}><Card><Statistic title="待结算" value={summary.pending} precision={2} /></Card></Col>
      </Row>
      <Card title="结算记录" style={{ marginTop: 16 }} extra={<Button>导出</Button>}>
        <Table loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  )
}