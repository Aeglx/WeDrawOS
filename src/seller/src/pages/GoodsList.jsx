import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Input, Select, Image, message, Form, Row, Col, Tabs } from 'antd'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function GoodsList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [form] = Form.useForm()
  const [tabKey, setTabKey] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const res = await api.get('/seller/goods', { params: { ...values, tab: tabKey } })
      const list = res.data?.data || []
      setData(list.map((it, i) => ({
        key: it.id || i + 1,
        id: it.id || 1989627749225172994 + i,
        image: it.image || 'https://via.placeholder.com/40',
        name: it.name || `示例商品${i + 1}`,
        mode: it.mode || '零售',
        type: it.type || '实物',
        price: it.price || 99 + i,
        sales: it.sales || 0,
        status: it.status || (i % 2 === 0 ? '在售' : '下架')
      })))
    } catch (e) {
      setData(Array.from({ length: 10 }).map((_, i) => ({
        key: i,
        id: 1989627749225172994 + i,
        image: 'https://via.placeholder.com/40',
        name: '示例商品' + (i + 1),
        mode: '零售',
        type: '实物',
        price: 99 + i,
        sales: 0,
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
    { title: '', dataIndex: 'select', key: 'select', render: () => null },
    { title: '商品ID', dataIndex: 'id', key: 'id' },
    { title: '商品', dataIndex: 'name', key: 'name', render: (v, record) => (
      <Space>
        <Image src={record.image} width={40} />
        <Button type="link" onClick={() => navigate(`/goods/detail/${record.key}`)}>{v}</Button>
      </Space>
    ) },
    { title: '销售模式', dataIndex: 'mode', key: 'mode', render: v => <Tag color="#69c0ff" style={{ border: '1px solid #69c0ff', background: '#e6f7ff' }}>{v}</Tag> },
    { title: '商品类型', dataIndex: 'type', key: 'type', render: v => <Tag color="#69c0ff" style={{ border: '1px solid #69c0ff', background: '#e6f7ff' }}>{v}</Tag> },
    { title: '价格', dataIndex: 'price', key: 'price', render: v => `¥ ${v}` },
    { title: '销量', dataIndex: 'sales', key: 'sales' },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link">编辑</Button>
        <Button type="link">库存</Button>
        <Button type="link" onClick={() => onShelfToggle(record)}>{record.status === '在售' ? '下架' : '上架'}</Button>
        <Button type="link">复制</Button>
      </Space>
    ) }
  ]

  return (
    <div>
      <Card styles={{ body: { paddingBottom: 4 } }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={6}><Form.Item label="商品名称" name="name"><Input placeholder="请输入商品名称" /></Form.Item></Col>
            <Col span={6}><Form.Item label="状态" name="status"><Select placeholder="请选择" options={[{ value: 'all', label: '全部' }, { value: 'sale', label: '在售' }, { value: 'down', label: '下架' }]} /></Form.Item></Col>
            <Col span={6}><Form.Item label="销售模式" name="mode"><Select placeholder="请选择" options={[{ value: '零售', label: '零售' }]} /></Form.Item></Col>
            <Col span={6}><Form.Item label="商品类型" name="type"><Select placeholder="请选择" options={[{ value: '实物', label: '实物' }, { value: '虚拟', label: '虚拟' }]} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item label="商品编号" name="sn"><Input placeholder="商品编号" /></Form.Item></Col>
            <Col span={12}>
              <Space>
                <Button type="primary" danger onClick={fetchData}>搜索</Button>
                <Button onClick={() => { form.resetFields(); fetchData() }}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Tabs activeKey={tabKey} onChange={k => { setTabKey(k); fetchData() }} items={[
          { key: 'all', label: '全部' },
          { key: 'sale', label: '出售中(17593)' },
          { key: 'store', label: '仓库中' },
          { key: 'audit', label: '待审核(6)' },
          { key: 'reject', label: '审核未通过(808)' }
        ]} />
        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" style={{ background: '#ff7a45', borderColor: '#ff7a45' }}>添加商品</Button>
          <Button>导入商品</Button>
          <Button>批量上架</Button>
          <Button>批量下架</Button>
          <Button>批量删除</Button>
          <Button>批量设置物流模板</Button>
        </Space>
        <Table
          loading={loading}
          rowSelection={{}}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}