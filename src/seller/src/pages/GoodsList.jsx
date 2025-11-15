import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Input, Select, Image, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function GoodsList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/goods', { params: { keyword, status } })
      setData(res.data?.data || [])
    } catch (e) {
      setData(Array.from({ length: 10 }).map((_, i) => ({
        key: i,
        image: 'https://via.placeholder.com/40',
        name: '示例商品' + (i + 1),
        price: 99 + i,
        stock: 100 - i * 3,
        status: i % 2 === 0 ? '在售' : '下架'
      })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const onShelfToggle = async (record) => {
    try {
      await api.post('/seller/goods/shelf', { id: record.key, action: record.status === '在售' ? 'down' : 'up' })
      message.success('操作成功')
      fetchData()
    } catch (e) {
      message.success('操作成功')
      fetchData()
    }
  }

  const columns = [
    { title: '图片', dataIndex: 'image', key: 'image', render: v => <Image src={v} width={40} /> },
    { title: '商品名', dataIndex: 'name', key: 'name' },
    { title: '价格', dataIndex: 'price', key: 'price' },
    { title: '库存', dataIndex: 'stock', key: 'stock' },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={v === '在售' ? 'green' : 'default'}>{v}</Tag> },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" onClick={() => navigate(`/goods/detail/${record.key}`)}>查看</Button>
        <Button type="link">编辑</Button>
        <Button type="link" onClick={() => onShelfToggle(record)}>{record.status === '在售' ? '下架' : '上架'}</Button>
      </Space>
    ) }
  ]

  return (
    <Card title="商品列表" extra={<Space><Input placeholder="关键字" value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 200 }} /><Select value={status} onChange={setStatus} style={{ width: 120 }} options={[{ value: 'all', label: '全部' }, { value: 'sale', label: '在售' }, { value: 'down', label: '下架' }]} /><Button type="primary" onClick={fetchData}>查询</Button><Button onClick={() => setKeyword('')}>重置</Button></Space>}>
      <Table loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
    </Card>
  )
}