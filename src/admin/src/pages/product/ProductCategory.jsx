import React, { useState } from 'react';
import { Table, Button, Dropdown, Menu, Space, Tag, Modal, Form, Input, Select, message } from 'antd';
import { DownOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './ProductCategory.css';

// 模拟分类数据
const mockCategories = [
  { id: 1, name: '数码办公', status: '正常启用', commission: '5.00%', children: [] },
  { id: 2, name: '家用电器', status: '正常启用', commission: '5.00%', children: [] },
  { id: 3, name: '服装鞋帽', status: '正常启用', commission: '5.00%', children: [] },
  { id: 4, name: '食品饮料', status: '正常启用', commission: '5.00%', children: [] },
  { id: 5, name: '礼品箱包', status: '正常启用', commission: '5.00%', children: [] },
  { id: 6, name: '个护化妆', status: '正常启用', commission: '5.00%', children: [] },
  { id: 7, name: '厨房餐饮', status: '正常启用', commission: '5.00%', children: [] },
  { id: 8, name: '家居家装', status: '正常启用', commission: '5.00%', children: [] },
  { id: 9, name: '汽车用品', status: '正常启用', commission: '5.00%', children: [] },
  { id: 10, name: '玩具乐器', status: '正常启用', commission: '5.00%', children: [] },
];

// 商品分类页面组件
const ProductCategory = () => {
  const [categories, setCategories] = useState(mockCategories);
  const [expandedKeys, setExpandedKeys] = useState([]);

    // 状态管理
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
      commission: record.commission.replace('%', ''),
    });
    setModalType('edit');
    setCurrentCategory(record);
    setIsModalVisible(true);
  };

  // 处理启用/禁用分类
  const handleToggleStatus = (record) => {
    const newStatus = record.status === '正常启用' ? '已禁用' : '正常启用';
    const newCategories = categories.map(cat => {
      if (cat.id === record.id) {
        return { ...cat, status: newStatus };
      }
      // 处理子分类
      if (cat.children && cat.children.length > 0) {
        return {
          ...cat,
          children: cat.children.map(child => 
            child.id === record.id ? { ...child, status: newStatus } : child
          )
        };
      }
      return cat;
    });
    setCategories(newCategories);
    message.success(`分类${newStatus}成功`);
  };

  // 处理删除分类
  const handleDeleteCategory = (record) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
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
        // 从展开的keys中移除
        setExpandedKeys(expandedKeys.filter(key => key !== record.id));
        message.success('分类删除成功');
      },
    });
  };

  // 处理展开/折叠 - 修复状态更新问题
  const handleExpand = (expanded, record) => {
    setExpandedKeys(prevKeys => {
      if (expanded) {
        return [...prevKeys, record.id];
      } else {
        return prevKeys.filter(key => key !== record.id);
      }
    });
  };

  // 操作下拉菜单
  const getMenu = (record) => (
    <Menu
      items={[
        {
          key: 'edit',
          label: '编辑',
          icon: <EditOutlined />,
          onClick: () => handleEditCategory(record)
        },
        {
          key: 'status',
          label: record.status === '正常启用' ? '禁用' : '启用',
          onClick: () => handleToggleStatus(record)
        },
        {
          key: 'delete',
          label: '删除',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDeleteCategory(record)
        }
      ]}
    />
  );

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
            status: '正常启用',
            commission: `${values.commission}%`,
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
                  status: '正常启用',
                  commission: `${values.commission}%`
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
            return { ...cat, name: values.name, commission: `${values.commission}%` };
          }
          // 处理子分类编辑
          if (cat.children && cat.children.length > 0) {
            return {
              ...cat,
              children: cat.children.map(child => 
                child.id === currentCategory.id 
                  ? { ...child, name: values.name, commission: `${values.commission}%` } 
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
      width: '30%',
      render: (name, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '8px', cursor: 'pointer' }} onClick={() => handleExpand(!expandedKeys.includes(record.id), record)}>
            <PlusOutlined 
              style={{ 
                fontSize: '12px', 
                transform: expandedKeys.includes(record.id) ? 'rotate(45deg)' : 'none',
                transition: 'transform 0.3s'
              }} 
            />
          </span>
          <span style={{ fontSize: '12px' }}>{name}</span>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: '20%',
      render: (status) => (
        <Tag color="success" style={{ fontSize: '12px' }}>{status}</Tag>
      ),
    },
    {
      title: '佣金',
      dataIndex: 'commission',
      key: 'commission',
      width: '20%',
      render: (commission) => (
        <span style={{ fontSize: '12px', color: '#ff0000' }}>{commission}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: '30%',
      render: (_, record) => (
        <Space size={[0, 8]}>
          <Dropdown menu={getMenu(record)}>
            <Button 
              style={{ fontSize: '12px', height: '24px', padding: '0 8px' }}
              type="text"
            >
              <span>操作 <DownOutlined style={{ fontSize: '12px' }} /></span>
            </Button>
          </Dropdown>
          <Button 
            type="primary" 
            style={{ 
              fontSize: '12px', 
              height: '24px', 
              padding: '0 8px',
              backgroundColor: '#ff0000',
              borderColor: '#ff0000'
            }}
            onClick={() => handleAddSubCategory(record)}
          >
            + 添加子分类
          </Button>
        </Space>
      ),
    },
  ];

  // 构建树形数据
  const buildTreeData = () => {
    return categories.map(cat => ({
      ...cat,
      key: cat.id,
      children: cat.children.length > 0 ? cat.children.map(child => ({ ...child, key: child.id })) : null
    }));
  };

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
            commission: '5.00'
          }}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" style={{ fontSize: '12px' }} />
          </Form.Item>
          
          <Form.Item
            name="commission"
            label="佣金比例"
            rules={[{ required: true, message: '请输入佣金比例' }]}
          >
            <Input 
              placeholder="请输入佣金比例" 
              style={{ fontSize: '12px' }}
              addonAfter="%"
            />
          </Form.Item>
          
          <Form.Item style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => setIsModalVisible(false)}
                style={{ fontSize: '12px', height: '32px' }}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                style={{ 
                  fontSize: '12px', 
                  height: '32px',
                  backgroundColor: '#ff0000',
                  borderColor: '#ff0000'
                }}
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
    <div className="product-category">
      {/* 顶部按钮区域 */}
      <div className="category-header">
        <Button 
          type="primary" 
          style={{ 
            fontSize: '12px', 
            height: '32px',
            backgroundColor: '#ff0000',
            borderColor: '#ff0000'
          }}
          onClick={handleAddTopCategory}
        >
          + 添加一级分类
        </Button>
      </div>

      {/* 分类表格 */}
      <Table
        columns={columns}
        dataSource={buildTreeData()}
        rowKey="id"
        pagination={false}
        expandable={{
          expandedRowRender: (record) => (
            <div className="sub-category-table">
              {record.children && record.children.length > 0 ? (
                <Table
                  columns={columns}
                  dataSource={record.children}
                  pagination={false}
                  rowKey="id"
                  size="small"
                  style={{ fontSize: '12px' }}
                />
              ) : (
                <div style={{ padding: '16px', fontSize: '12px', color: '#666' }}>暂无子分类</div>
              )}
            </div>
          ),
          rowExpandable: (record) => true, // 始终允许展开，以便显示子分类添加功能
          expandedRowKeys: expandedKeys,
          onExpand: handleExpand
        }}
        size="middle"
        style={{ fontSize: '12px' }}
      />
      
      {/* 分类表单弹窗 */}
      {renderModal()}
    </div>
  );
};

export default ProductCategory;