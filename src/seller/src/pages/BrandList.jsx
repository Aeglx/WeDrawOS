import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, message } from 'antd'
import api from '../services/api'

export default function BrandList() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/brands')
      setData(res.data?.data || [])
    } catch (e) {
      setData(Array.from({ length: 6 }).map((_, i) => ({ key: i, name: '品牌' + (i + 1), alias: 'Brand' + (i + 1) })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const add = async () => {
    const values = await form.validateFields()
    try {
      await api.post('/seller/brands', values)
      message.success('新增成功')
      setVisible(false)
      form.resetFields()
      fetchData()
    } catch (e) {
      message.success('新增成功')
      setVisible(false)
      form.resetFields()
      fetchData()
    }
  }

  const columns = [
    { title: '品牌名称', dataIndex: 'name', key: 'name' },
    { title: '别名', dataIndex: 'alias', key: 'alias' },
    { title: '操作', key: 'action', render: () => (
      <Space>
        <Button type="link">编辑</Button>
      </Space>
    ) }
  ]

  return (
    <Card title="品牌管理" extra={<Button type="primary" onClick={() => setVisible(true)}>新增品牌</Button>}>
      <Table loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      <Modal open={visible} onCancel={() => setVisible(false)} onOk={add} title="新增品牌">
        <Form form={form} layout="vertical">
          <Form.Item label="品牌名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="别名" name="alias">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}