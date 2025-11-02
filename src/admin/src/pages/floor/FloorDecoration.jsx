import React, { useState } from 'react';
import { Button, Table, Switch, message, Modal, Form, Input, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import './FloorDecoration.css';

const FloorDecoration = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState([
    { id: 1, name: '首页模板标题', status: false },
    { id: 2, name: '1', status: false },
    { id: 3, name: '7', status: false },
    { id: 4, name: '首页模板标题', status: false },
    { id: 5, name: '12', status: false },
    { id: 6, name: '111', status: false },
    { id: 7, name: '首页', status: false },
    { id: 8, name: 'aaa', status: false },
    { id: 9, name: '首页模板标题', status: false },
    { id: 10, name: '2222', status: false },
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [form] = Form.useForm();

  // 处理添加页面
  const handleAddPage = () => {
    setEditingPage(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 处理编辑页面
  const handleEdit = (record) => {
    setEditingPage(record);
    form.setFieldsValue({ name: record.name });
    setIsModalVisible(true);
  };

  // 处理装修页面
  const handleDecorate = (record) => {
    message.info(`进入页面「${record.name}」的装修模式`);
    // 跳转到装修设计页面，并传递页面ID
    navigate(`/operation/floor-decoration/pc/designer?id=${record.id}&name=${encodeURIComponent(record.name)}`);
  };

  // 处理删除页面
  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除页面「${record.name}」吗？`,
      onOk: () => {
        setPages(pages.filter(page => page.id !== record.id));
        message.success('页面删除成功');
      }
    });
  };

  // 处理状态切换
  const handleStatusChange = (checked, record) => {
    setPages(pages.map(page => 
      page.id === record.id ? { ...page, status: checked } : page
    ));
    message.success(`${checked ? '页面已启用' : '页面已禁用'}`);
  };

  // 处理表单提交
  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (editingPage) {
        // 编辑页面
        setPages(pages.map(page => 
          page.id === editingPage.id ? { ...page, name: values.name } : page
        ));
        message.success('页面名称更新成功');
      } else {
        // 添加新页面
        const newPage = {
          id: Date.now(),
          name: values.name,
          status: false
        };
        setPages([newPage, ...pages]);
        message.success('页面添加成功');
      }
      setIsModalVisible(false);
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '页面名称',
      dataIndex: 'name',
      key: 'name',
      width: '60%',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status, record) => (
        <Switch
          checked={status}
          onChange={(checked) => handleStatusChange(checked, record)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: '25%',
      render: (_, record) => (
        <Space size={[0, 12]} style={{ fontSize: '12px' }}>
          <Button
            type="text"
            className="edit-button"
            onClick={() => handleEdit(record)}
            style={{ color: '#1890ff', fontSize: '12px' }}
          >
            编辑
          </Button>
          <Button
            type="text"
            className="decorate-button"
            onClick={() => handleDecorate(record)}
            style={{ color: '#722ed1', fontSize: '12px' }}
          >
            装修
          </Button>
          <Button
            type="text"
            className="delete-button"
            danger
            onClick={() => handleDelete(record)}
            style={{ color: '#ff4d4f', fontSize: '12px' }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="floor-decoration-container">
      {/* 顶部操作栏 */}
      <div className="header-actions">
        <Button
          type="primary"
          className="add-page-button"
          onClick={handleAddPage}
          style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
        >
          添加页面
        </Button>
      </div>

      {/* 页面列表表格 */}
      <Table
        columns={columns}
        dataSource={pages}
        rowKey="id"
        pagination={false}
        className="page-table"
      />

      {/* 添加/编辑页面模态框 */}
      <Modal
        title={editingPage ? '编辑页面' : '添加页面'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okButtonProps={{ style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="页面名称"
            rules={[{ required: true, message: '请输入页面名称' }]}
          >
            <Input placeholder="请输入页面名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FloorDecoration;