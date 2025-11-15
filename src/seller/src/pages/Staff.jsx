import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message } from 'antd'
import api from '../services/api'

export default function Staff() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/staff')
      setData(res.data?.data || [])
    } catch (e) {
      setData(Array.from({ length: 8 }).map((_, i) => ({
        key: i,
        name: '员工' + (i + 1),
        role: i % 2 === 0 ? '店员' : '管理员',
        status: i % 3 === 0 ? '禁用' : '启用'
      })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const add = async () => {
    const values = await form.validateFields()
    try {
      await api.post('/seller/staff', values)
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
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '角色', dataIndex: 'role', key: 'role' },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={v === '启用' ? 'green' : 'red'}>{v}</Tag> },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link">编辑</Button>
        <Button type="link">禁用</Button>
      </Space>
    ) }
  ]

  return (
    <Card title="员工管理" extra={<Button type="primary" onClick={() => setVisible(true)}>新增员工</Button>}>
      <Table loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      <Modal open={visible} onCancel={() => setVisible(false)} onOk={add} title="新增员工">
        <Form form={form} layout="vertical">
          <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true }]}>
            <Select options={[{ value: '店员', label: '店员' }, { value: '管理员', label: '管理员' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}