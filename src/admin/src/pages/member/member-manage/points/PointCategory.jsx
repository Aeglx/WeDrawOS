import React, { useState } from 'react';
import { Button, Table, Input, Modal, Form, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import './PointCategory.css';

const PointCategory = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' 或 'edit'
  const [currentCategory, setCurrentCategory] = useState(null);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]); // 初始数据为空

  // 打开添加模态框
  const handleAdd = () => {
    setModalType('add');
    setCurrentCategory(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑模态框
  const handleEdit = (category) => {
    setModalType('edit');
    setCurrentCategory(category);
    form.setFieldsValue({
      name: category.name
    });
    setIsModalVisible(true);
  };

  // 处理删除
  const handleDelete = (categoryId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个积分分类吗？',
      onOk: () => {
        setCategories(categories.filter(cat => cat.id !== categoryId));
        message.success('删除成功');
      }
    });
  };

  // 处理表单提交
  const handleFormSubmit = () => {
    form.validateFields().then(values => {
      if (modalType === 'add') {
        // 添加新分类
        const newId = Math.max(...categories.map(c => c.id), 0) + 1;
        const newCategory = {
          id: newId,
          name: values.name
        };
        setCategories([...categories, newCategory]);
        message.success('添加成功');
      } else {
        // 编辑现有分类
        setCategories(categories.map(cat => 
          cat.id === currentCategory.id 
            ? { ...cat, name: values.name }
            : cat
        ));
        message.success('编辑成功');
      }
      setIsModalVisible(false);
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      width: '80%'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <span>
          <Button 
            type="text" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ color: '#666', marginRight: '16px' }}
          >
            编辑
          </Button>
          <Button 
            type="text" 
            size="small" 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            style={{ color: '#ff0000' }}
          >
            删除
          </Button>
        </span>
      ),
      align: 'right'
    }
  ];

  return (
    <div className="point-category-container">
      {/* 头部按钮区域 */}
      <div className="header-section">
        <h2>积分分类</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ backgroundColor: '#ff0000', borderColor: '#ff0000' }}
        >
          添加积分分类
        </Button>
      </div>

      {/* 表格区域 */}
      <div className="table-section">
        <Table
          columns={columns}
          dataSource={categories}
          pagination={false}
          rowKey="id"
          locale={{
            emptyText: '暂无数据'
          }}
          className="point-category-table"
        />
      </div>

      {/* 添加/编辑模态框 */}
      <Modal
        title={modalType === 'add' ? '添加积分分类' : '编辑积分分类'}
        open={isModalVisible}
        onOk={handleFormSubmit}
        onCancel={() => setIsModalVisible(false)}
        okButtonProps={{ style: { backgroundColor: '#ff0000', borderColor: '#ff0000' } }}
        cancelButtonProps={{ style: { color: '#666' } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="分类名称"
            name="name"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PointCategory;