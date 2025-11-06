import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import './ArticleCategory.css';

// 模拟文章分类数据
const mockCategories = [
  { id: 1, name: '市场资讯', sort: 1, children: [] },
  { id: 2, name: '星空艺术分类', sort: 1, children: [] },
  { id: 3, name: '产品知识', sort: 2, children: [] },
  { id: 4, name: '平台管理', sort: 2, children: [] },
  { id: 5, name: '关于我们', sort: 2, children: [] },
  { id: 6, name: '平台活动', sort: 2, children: [] },
  { id: 7, name: '市场介绍', sort: 6, children: [] },
  { id: 8, name: '隐私协议', sort: 10, children: [] }
];

const ArticleCategory = () => {
  const [categories, setCategories] = useState(mockCategories);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'addTop', 'addSub', 'edit'
  const [currentCategory, setCurrentCategory] = useState(null);
  const [form] = Form.useForm();

  // 处理添加一级分类
  const handleAddTopCategory = () => {
    form.resetFields();
    setModalType('addTop');
    setCurrentCategory(null);
    setIsModalVisible(true);
  };

  // 处理添加子分类
  const handleAddSubCategory = (record) => {
    form.resetFields();
    setModalType('addSub');
    setCurrentCategory(record);
    setIsModalVisible(true);
  };

  // 处理编辑分类
  const handleEditCategory = (record) => {
    form.setFieldsValue({
      name: record.name,
      sort: record.sort
    });
    setModalType('edit');
    setCurrentCategory(record);
    setIsModalVisible(true);
  };

  // 处理删除分类
  const handleDeleteCategory = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除分类"${record.name}"吗？`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        let newCategories;
        // 检查是否是子分类
        const isSubCategory = categories.some(cat => 
          cat.children && cat.children.some(child => child.id === record.id)
        );

        if (isSubCategory) {
          // 删除子分类
          newCategories = categories.map(cat => ({
            ...cat,
            children: cat.children ? cat.children.filter(child => child.id !== record.id) : []
          }));
        } else {
          // 删除一级分类
          newCategories = categories.filter(cat => cat.id !== record.id);
        }
        
        setCategories(newCategories);
        message.success('分类删除成功');
      },
    });
  };

  // 处理表单提交
  const handleFormSubmit = () => {
    form.validateFields().then(values => {
      let newCategories;
      const newId = Math.max(...categories.map(c => c.id), ...categories.flatMap(c => c.children ? c.children.map(ch => ch.id) : []), 0) + 1;
      
      if (modalType === 'addTop') {
        // 添加一级分类
        newCategories = [
          ...categories,
          {
            id: newId,
            name: values.name,
            sort: values.sort || 0,
            children: []
          }
        ];
        message.success('一级分类添加成功');
      } else if (modalType === 'addSub') {
        // 添加子分类
        newCategories = categories.map(cat => {
          if (cat.id === currentCategory.id) {
            return {
              ...cat,
              children: [
                ...cat.children,
                {
                  id: newId,
                  name: values.name,
                  sort: values.sort || 0
                }
              ]
            };
          }
          return cat;
        });
        message.success('子分类添加成功');
      } else if (modalType === 'edit') {
        // 编辑分类
        newCategories = categories.map(cat => {
          if (cat.id === currentCategory.id) {
            return { ...cat, name: values.name, sort: values.sort };
          }
          // 处理子分类编辑
          if (cat.children && cat.children.length > 0) {
            return {
              ...cat,
              children: cat.children.map(child => 
                child.id === currentCategory.id 
                  ? { ...child, name: values.name, sort: values.sort } 
                  : child
              )
            };
          }
          return cat;
        });
        message.success('分类编辑成功');
      }
      
      setCategories(newCategories);
      setIsModalVisible(false);
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      width: '50%',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: '20%',
    },
    {
      title: '操作',
      key: 'action',
      width: '30%',
      render: (_, record) => (
        <Space size={[0, 8]}>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditCategory(record)}
            className="edit-button"
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteCategory(record)}
            className="delete-button"
          >
            删除
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => handleAddSubCategory(record)}
            className="add-sub-button"
          >
            添加子分类
          </Button>
        </Space>
      ),
    },
  ];

  // 渲染分类表单
  const renderModal = () => {
    const isAddTop = modalType === 'addTop';
    const isAddSub = modalType === 'addSub';
    const isEdit = modalType === 'edit';
    
    return (
      <Modal
        title={
          isAddTop ? '添加一级分类' : 
          isAddSub ? `添加子分类 - ${currentCategory?.name}` : 
          '编辑分类'
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{
            sort: 0
          }}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          
          <Form.Item
            name="sort"
            label="排序值"
            rules={[{ required: true, message: '请输入排序值' }]}
          >
            <Input type="number" placeholder="请输入排序值" />
          </Form.Item>
          
          <Form.Item style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => setIsModalVisible(false)}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                className="submit-button"
              >
                {isEdit ? '保存' : '确认添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  return (
    <div className="article-category">
      {/* 顶部按钮区域 */}
      <div className="category-header">
        <Button 
          type="primary" 
          className="add-top-button"
          onClick={handleAddTopCategory}
        >
          + 添加一级分类
        </Button>
      </div>

      {/* 分类表格 */}
      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        pagination={false}
        size="middle"
      />
      
      {/* 分类表单弹窗 */}
      {renderModal()}
    </div>
  );
};

export default ArticleCategory;