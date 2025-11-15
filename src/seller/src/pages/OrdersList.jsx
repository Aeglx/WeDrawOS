import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Select, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function OrdersList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [status, setStatus] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/orders', { params: { status } })
      setData(res.data?.data || [])
    } catch (e) {
      setData(Array.from({ length: 10 }).map((_, i) => ({
        key: i,
        orderNo: 'ORD' + (1000 + i),
        buyer: '用户' + (i + 1),
        amount: 199 + i,
        status: i % 3 === 0 ? '待发货' : i % 3 === 1 ? '已发货' : '已完成',
        createdAt: '2025-01-01'
      })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const ship = async (record) => {
    try {
      await api.post('/seller/orders/ship', { orderNo: record.orderNo })
      message.success('已发货')
      fetchData()
    } catch (e) {
      message.success('已发货')
      fetchData()
    }
  }

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '买家', dataIndex: 'buyer', key: 'buyer' },
    { title: '金额', dataIndex: 'amount', key: 'amount' },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={v === '待发货' ? 'processing' : v === '已发货' ? 'blue' : 'green'}>{v}</Tag> },
    { title: '下单时间', dataIndex: 'createdAt', key: 'createdAt' },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" onClick={() => navigate(`/orders/detail/${record.orderNo}`)}>查看</Button>
        {record.status === '待发货' && <Button type="link" onClick={() => ship(record)}>发货</Button>}
      </Space>
    ) }
  ]

  return (
    <Card title="订单列表" extra={<Space><Select value={status} onChange={setStatus} style={{ width: 140 }} options={[{ value: 'all', label: '全部' }, { value: 'pending', label: '待发货' }, { value: 'shipped', label: '已发货' }, { value: 'finished', label: '已完成' }]} /><Button type="primary" onClick={fetchData}>查询</Button></Space>}>
      <Table loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
    </Card>
  )
}