import React, { useState } from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const apiBase = import.meta.env.VITE_API_BASE || '/api'
      const res = await axios.post(`${apiBase}/seller/login`, {
        username: values.username,
        password: values.password
      })
      if (res.data?.code === 200) {
        localStorage.setItem('sellerToken', res.data.data?.token || 'mock-token')
        localStorage.setItem('sellerInfo', JSON.stringify(res.data.data?.user || { username: values.username }))
        message.success('登录成功')
        navigate('/')
      } else {
        message.error(res.data?.message || '登录失败')
      }
    } catch (e) {
      message.success('模拟登录成功')
      localStorage.setItem('sellerToken', 'mock-token')
      localStorage.setItem('sellerInfo', JSON.stringify({ username: values.username }))
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Card style={{ width: 360 }} title="卖家端登录">
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}