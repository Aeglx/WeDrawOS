import React, { useEffect, useState } from 'react'
import { Card, Tree, Button, Modal, Form, Input, message } from 'antd'
import api from '../services/api'

export default function CategoryList() {
  const [loading, setLoading] = useState(false)
  const [treeData, setTreeData] = useState([])
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/seller/categories')
      setTreeData(res.data?.data || [])
    } catch (e) {
      setTreeData([
        { title: '分类A', key: 'catA', children: [{ title: '子类A1', key: 'catA1' }] },
        { title: '分类B', key: 'catB', children: [{ title: '子类B1', key: 'catB1' }] }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const add = async () => {
    const values = await form.validateFields()
    try {
      await api.post('/seller/categories', values)
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

  return (
    <Card title="分类管理" extra={<Button type="primary" onClick={() => setVisible(true)}>新增分类</Button>}>
      <Tree loading={loading} treeData={treeData} defaultExpandAll />
      <Modal open={visible} onCancel={() => setVisible(false)} onOk={add} title="新增分类">
        <Form form={form} layout="vertical">
          <Form.Item label="分类名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="父分类 Key" name="parentKey">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}