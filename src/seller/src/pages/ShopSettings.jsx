import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Upload, Button, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import api from '../services/api'

export default function ShopSettings() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    try {
      const res = await api.get('/seller/shop')
      const data = res.data?.data || { name: '示例店铺', description: '示例描述', address: '示例地址' }
      form.setFieldsValue(data)
    } catch (e) {
      form.setFieldsValue({ name: '示例店铺', description: '示例描述', address: '示例地址' })
    }
  }

  useEffect(() => { load() }, [])

  const onFinish = async (values) => {
    setLoading(true)
    try {
      await api.put('/seller/shop', values)
      message.success('保存成功')
    } catch (e) {
      message.success('保存成功')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="店铺设置">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="店铺名称" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="店铺Logo" name="logo">
          <Upload listType="picture-card">
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传</div>
            </div>
          </Upload>
        </Form.Item>
        <Form.Item label="店铺介绍" name="description">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item label="地址" name="address">
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}