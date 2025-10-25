import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, Form, Select, message } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import './AdminList.css';

const { Option } = Select;
const { Search } = Input;

const AdminList = () => {
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [form] = Form.useForm();

  // 角色选项
  const roleOptions = [
    { label: '超级管理员', value: 'super_admin' },
    { label: '普通管理员', value: 'admin' },
    { label: '编辑', value: 'editor' }
  ];

  // 加载管理员列表
  const loadAdmins = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      // const response = await axios.get('/api/admin/admins/list');
      
      // 模拟数据
      const mockAdmins = [
        { id: 1, username: 'admin1', email: 'admin1@example.com', phone: '13800138001', role: 'super_admin', status: 1, createdAt: '2024-01-01 10:00:00' },
        { id: 2, username: 'admin2', email: 'admin2@example.com', phone: '13800138002', role: 'admin', status: 1, createdAt: '2024-01-02 10:00:00' },
        { id: 3, username: 'editor1', email: 'editor1@example.com', phone: '13800138003', role: 'editor', status: 1, createdAt: '2024-01-03 10:00:00' }
      ];
      
      setAdmins(mockAdmins);
    } catch (error) {
      console.error('Load admins error:', error);
      message.error('加载管理员列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // 搜索功能
  const handleSearch = (value) => {
    setSearchText(value);
    // 这里可以实现搜索逻辑
  };

  // 打开添加管理员模态框
  const handleAdd = () => {
    setIsEditMode(false);
    setSelectedAdmin(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑管理员模态框
  const handleEdit = (record) => {
    setIsEditMode(true);
    setSelectedAdmin(record);
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      phone: record.phone,
      role: record.role
    });
    setIsModalVisible(true);
  };

  // 删除管理员
  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个管理员吗？',
      onOk: async () => {
        try {
          // 模拟API调用
          // await axios.delete(`/api/admin/admins/${id}`);
          setAdmins(admins.filter(admin => admin.id !== id));
          message.success('删除成功');
        } catch (error) {
          console.error('Delete admin error:', error);
          message.error('删除失败');
        }
      }
    });
  };

  // 保存管理员信息
  const handleSave = async (values) => {
    try {
      if (isEditMode) {
        // 编辑模式
        // await axios.put(`/api/admin/admins/${selectedAdmin.id}`, values);
        setAdmins(admins.map(admin => 
          admin.id === selectedAdmin.id ? { ...admin, ...values } : admin
        ));
        message.success('更新成功');
      } else {
        // 添加模式
        // await axios.post('/api/admin/admins/create', values);
        const newAdmin = {
          id: Date.now(),
          ...values,
          status: 1,
          createdAt: new Date().toLocaleString('zh-CN')
        };
        setAdmins([...admins, newAdmin]);
        message.success('添加成功');
      }
      setIsModalVisible(false);
    } catch (error) {
      console.error('Save admin error:', error);
      message.error(isEditMode ? '更新失败' : '添加失败');
    }
  };

  // 表格列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleMap = {
          super_admin: '超级管理员',
          admin: '普通管理员',
          editor: '编辑'
        };
        return roleMap[role] || role;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={status === 1 ? 'status-active' : 'status-inactive'}>
          {status === 1 ? '启用' : '禁用'}
        </span>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
            size="small"
          >
            编辑
          </Button>
          <Button 
            type="link" 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)} 
            size="small"
            danger
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="admin-list">
      <div className="admin-list-header">
        <h2>管理员管理</h2>
        <div className="header-actions">
          <Search
            placeholder="搜索用户名"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 250, marginRight: 16 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加管理员
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={admins}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="admin-table"
      />

      {/* 管理员编辑模态框 */}
      <Modal
        title={isEditMode ? '编辑管理员' : '添加管理员'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          {!isEditMode && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roleOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {isEditMode ? '更新' : '添加'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminList;