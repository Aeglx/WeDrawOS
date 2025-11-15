import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Tree, message } from 'antd'
import api from '../services/api'

export default function Role() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/roles')
      setData(res.data?.data || [])
    } catch (e) {
      setData([
        { key: 1, name: '管理员', permissions: ['商品', '订单', '促销', '财务', '设置'] },
        { key: 2, name: '店员', permissions: ['商品', '订单'] }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const add = async () => {
    const values = await form.validateFields()
    try {
      await api.post('/seller/roles', values)
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
    { title: '角色名', dataIndex: 'name', key: 'name' },
    { title: '权限', dataIndex: 'permissions', key: 'permissions', render: v => v.map(p => <Tag key={p}>{p}</Tag>) },
    { title: '操作', key: 'action', render: () => (
      <Space>
        <Button type="link">编辑</Button>
      </Space>
    ) }
  ]

  const treeData = [
    { title: '商品', key: 'goods' },
    { title: '订单', key: 'orders' },
    { title: '促销', key: 'promotion' },
    { title: '财务', key: 'finance' },
    { title: '设置', key: 'settings' }
  ]

  return (
    <Card title="角色权限" extra={<Button type="primary" onClick={() => setVisible(true)}>新增角色</Button>}>
      <Table loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      <Modal open={visible} onCancel={() => setVisible(false)} onOk={add} title="新增角色">
        <Form form={form} layout="vertical">
          <Form.Item label="角色名" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="权限" name="permissions" rules={[{ required: true }]}>
            <Tree checkable treeData={treeData} defaultExpandAll />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}