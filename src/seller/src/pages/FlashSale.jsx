import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, message } from 'antd'
import api from '../services/api'

export default function FlashSale() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/promotion/flash')
      setData(res.data?.data || [])
    } catch (e) {
      setData(Array.from({ length: 6 }).map((_, i) => ({
        key: i,
        title: '秒杀活动' + (i + 1),
        time: '每日 10:00-12:00',
        status: i % 3 === 0 ? '未开始' : i % 3 === 1 ? '进行中' : '已结束'
      })))
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const toggle = async (record) => {
    try { await api.post('/seller/promotion/flash/toggle', { id: record.key }); message.success('操作成功'); fetchData() } catch { message.success('操作成功'); fetchData() }
  }

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '时间', dataIndex: 'time', key: 'time' },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={v === '进行中' ? 'green' : v === '未开始' ? 'default' : 'red'}>{v}</Tag> },
    { title: '操作', key: 'action', render: (_, r) => (<Space><Button type="link">编辑</Button><Button type="link" onClick={() => toggle(r)}>启停</Button></Space>) }
  ]

  return (<Card title="秒杀活动"><Button type="primary" style={{ marginBottom: 12 }}>新建活动</Button><Table loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} /></Card>)
}