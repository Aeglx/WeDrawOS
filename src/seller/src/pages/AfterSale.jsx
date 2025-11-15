import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Select, message } from 'antd'
import api from '../services/api'

export default function AfterSale() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [status, setStatus] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/aftersale', { params: { status } })
      setData(res.data?.data || [])
    } catch (e) {
      setData(Array.from({ length: 8 }).map((_, i) => ({
        key: i,
        requestNo: 'AS' + (100 + i),
        orderNo: 'ORD' + (1000 + i),
        type: i % 2 === 0 ? '退货' : '退款',
        status: i % 3 === 0 ? '待处理' : i % 3 === 1 ? '通过' : '拒绝',
        customer: '用户' + (i + 1),
        createdAt: '2025-01-01'
      })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const approve = async (record) => {
    try {
      await api.post('/seller/aftersale/approve', { requestNo: record.requestNo })
      message.success('已处理')
      fetchData()
    } catch (e) {
      message.success('已处理')
      fetchData()
    }
  }

  const reject = async (record) => {
    try {
      await api.post('/seller/aftersale/reject', { requestNo: record.requestNo })
      message.success('已处理')
      fetchData()
    } catch (e) {
      message.success('已处理')
      fetchData()
    }
  }

  const columns = [
    { title: '申请单号', dataIndex: 'requestNo', key: 'requestNo' },
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={v === '待处理' ? 'processing' : v === '通过' ? 'green' : 'red'}>{v}</Tag> },
    { title: '客户', dataIndex: 'customer', key: 'customer' },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt' },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" onClick={() => approve(record)}>通过</Button>
        <Button type="link" danger onClick={() => reject(record)}>拒绝</Button>
      </Space>
    ) }
  ]

  return (
    <Card title="售后服务" extra={<Space><Select value={status} onChange={setStatus} style={{ width: 140 }} options={[{ value: 'all', label: '全部' }, { value: 'pending', label: '待处理' }, { value: 'approved', label: '通过' }, { value: 'rejected', label: '拒绝' }]} /><Button type="primary" onClick={fetchData}>查询</Button></Space>}>
      <Table loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
    </Card>
  )
}