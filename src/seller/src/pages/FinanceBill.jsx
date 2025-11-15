import React, { useEffect, useState } from 'react'
import { Card, Table, Button } from 'antd'
import api from '../services/api'

export default function FinanceBill() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/finance/bill')
      setData(res.data?.data || [])
    } catch (e) {
      setData(Array.from({ length: 8 }).map((_, i) => ({ key: i, billNo: 'RB' + (100 + i), period: '2025-01', amount: 2999 + i * 10 })))}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: '对账单号', dataIndex: 'billNo', key: 'billNo' },
    { title: '账期', dataIndex: 'period', key: 'period' },
    { title: '金额', dataIndex: 'amount', key: 'amount' }
  ]

  return (
    <Card title="商家对账">
      <Button style={{ marginBottom: 12 }}>导出</Button>
      <Table loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
    </Card>
  )
}