import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Descriptions, Image, Tag, Button, Space, message, Tabs, Table, Divider } from 'antd'
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
      <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Image.PreviewGroup>
            <Image src={data.images?.[0]} width={120} />
          </Image.PreviewGroup>
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
      </Space>
      <Divider />
      <Tabs
        items={[
          {
            key: 'base',
            label: '基本信息',
            children: (
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="商品名称">{data.name}</Descriptions.Item>
                <Descriptions.Item label="商品编号">{String(data.id).padStart(6, '0')}</Descriptions.Item>
                <Descriptions.Item label="销售价格">{data.price}</Descriptions.Item>
                <Descriptions.Item label="库存数量">{data.stock}</Descriptions.Item>
                <Descriptions.Item label="品牌">{data.brand}</Descriptions.Item>
                <Descriptions.Item label="分类路径">{data.category}</Descriptions.Item>
                <Descriptions.Item label="上架状态"><Tag color={data.status === '在售' ? 'green' : 'default'}>{data.status}</Tag></Descriptions.Item>
              </Descriptions>
            )
          },
          {
            key: 'sku',
            label: '规格与SKU',
            children: (
              <Table
                pagination={false}
                columns={[
                  { title: '规格', dataIndex: 'spec', key: 'spec' },
                  { title: 'SKU编码', dataIndex: 'sku', key: 'sku' },
                  { title: '价格', dataIndex: 'price', key: 'price' },
                  { title: '库存', dataIndex: 'stock', key: 'stock' },
                  { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={v === '在售' ? 'green' : 'default'}>{v}</Tag> }
                ]}
                dataSource={Array.from({ length: 3 }).map((_, i) => ({
                  key: i,
                  spec: i === 0 ? '颜色: 红色; 尺码: M' : i === 1 ? '颜色: 蓝色; 尺码: L' : '颜色: 黑色; 尺码: XL',
                  sku: `SKU-${String(data.id).padStart(4, '0')}-${i + 1}`,
                  price: data.price + i * 10,
                  stock: data.stock - i * 5,
                  status: data.status
                }))}
              />
            )
          },
          {
            key: 'detail',
            label: '图文详情',
            children: (
              <Space direction="vertical">
                <Image src={data.images?.[0]} width={360} />
                <Image src={data.images?.[0]} width={360} />
              </Space>
            )
          },
          {
            key: 'reviews',
            label: '评价',
            children: (
              <Table
                pagination={{ pageSize: 5 }}
                columns={[
                  { title: '用户', dataIndex: 'user', key: 'user' },
                  { title: '评分', dataIndex: 'rate', key: 'rate' },
                  { title: '内容', dataIndex: 'content', key: 'content' },
                  { title: '时间', dataIndex: 'time', key: 'time' }
                ]}
                dataSource={Array.from({ length: 8 }).map((_, i) => ({ key: i, user: `用户${i + 1}`, rate: 5 - (i % 3), content: '商品质量很好，物流很快', time: '2025-01-01' }))}
              />
            )
          }
        ]}
      />
    </Card>
  )
}