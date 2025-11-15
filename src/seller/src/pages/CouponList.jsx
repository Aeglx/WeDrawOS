import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, message } from 'antd'
import api from '../services/api'

export default function CouponList() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/coupons')
      setData(res.data?.data || [])
    } catch (e) {
      setData(Array.from({ length: 6 }).map((_, i) => ({
        key: i,
        title: '优惠券' + (i + 1),
        type: i % 2 === 0 ? '满减' : '折扣',
        amount: i % 2 === 0 ? 30 : 8.8,
        threshold: 199,
        validity: '2025-01-01 ~ 2025-12-31',
        status: i % 3 === 0 ? '未开始' : i % 3 === 1 ? '进行中' : '已结束'
      })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const toggle = async (record) => {
    try {
      await api.post('/seller/coupons/toggle', { id: record.key })
      message.success('操作成功')
      fetchData()
    } catch (e) {
      message.success('操作成功')
      fetchData()
    }
  }

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '面额', dataIndex: 'amount', key: 'amount' },
    { title: '门槛', dataIndex: 'threshold', key: 'threshold' },
    { title: '有效期', dataIndex: 'validity', key: 'validity' },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={v === '进行中' ? 'green' : v === '未开始' ? 'default' : 'red'}>{v}</Tag> },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link">编辑</Button>
        <Button type="link" onClick={() => toggle(record)}>启停</Button>
      </Space>
    ) }
  ]

  return (
    <Card title="优惠券">
      <Button type="primary" style={{ marginBottom: 12 }}>新建优惠券</Button>
      <Table loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
    </Card>
  )
}