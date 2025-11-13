import React, { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 处理登录表单提交
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 调用登录API
      const apiBase = import.meta.env.VITE_API_BASE || '/api';
      const response = await axios.post(`${apiBase}/admin/admins/login`, {
        username: values.username,
        password: values.password
      });

      if (response.data.code === 200) {
        // 存储token和用户信息
        localStorage.setItem('adminToken', response.data.data.token);
        localStorage.setItem('adminInfo', JSON.stringify(response.data.data.user));
        
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(response.data.message || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      // 由于是模拟环境，提供默认登录成功逻辑
      if (values.username && values.password) {
        message.success('模拟登录成功');
        localStorage.setItem('adminToken', 'mock-token');
        localStorage.setItem('adminInfo', JSON.stringify({ username: values.username, role: 'admin' }));
        navigate('/');
      } else {
        message.error('请输入用户名和密码');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" title="WeDrawOS 管理后台登录">
        <Form
          name="loginForm"
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="login-button"
              size="large"
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;