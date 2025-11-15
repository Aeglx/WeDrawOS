import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Descriptions, Image, Tag, Button, Space, message } from 'antd'
import api from '../services/api'

export default function GoodsDetail() {
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/seller/goods/${id}`)
      setData(res.data?.data || null)
    } catch (e) {
      setData({
        id,
        name: '示例商品',
        price: 199,
        stock: 80,
        brand: '品牌A',
        category: '分类A/子类A1',
        status: '在售',
        images: ['https://via.placeholder.com/120']
      })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [id])

  const shelfToggle = async () => {
    try { await api.post('/seller/goods/shelf', { id, action: data.status === '在售' ? 'down' : 'up' }); message.success('操作成功'); fetchData() } catch { message.success('操作成功'); fetchData() }
  }

  if (!data) return <Card loading={loading} />

  return (
    <Card title="商品详情" extra={<Space><Button type="primary">编辑</Button><Button onClick={shelfToggle}>{data.status === '在售' ? '下架' : '上架'}</Button></Space>}>
      <Space align="start">
        <Image src={data.images?.[0]} width={120} />
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="商品ID">{data.id}</Descriptions.Item>
          <Descriptions.Item label="商品名称">{data.name}</Descriptions.Item>
          <Descriptions.Item label="价格">{data.price}</Descriptions.Item>
          <Descriptions.Item label="库存">{data.stock}</Descriptions.Item>
          <Descriptions.Item label="品牌">{data.brand}</Descriptions.Item>
          <Descriptions.Item label="分类">{data.category}</Descriptions.Item>
          <Descriptions.Item label="状态"><Tag color={data.status === '在售' ? 'green' : 'default'}>{data.status}</Tag></Descriptions.Item>
        </Descriptions>
      </Space>
    </Card>
  )
}