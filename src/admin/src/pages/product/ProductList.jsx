import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, Modal, Form, Select, message } from 'antd';
import { SearchOutlined, FilterOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import './ProductList.css';

const { Search } = Input;
const { Option } = Select;

const ProductList = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // 加载商品列表
  const loadProducts = async () => {
    setLoading(true);
    try {
      // 模拟数据
      const mockProducts = [
        { id: 1, name: '产品1', price: 99.99, stock: 100, category: 'electronics', status: 1, sales: 150, createdAt: '2024-01-01 10:00:00' },
        { id: 2, name: '产品2', price: 199.99, stock: 50, category: 'clothing', status: 1, sales: 89, createdAt: '2024-01-02 10:00:00' },
        { id: 3, name: '产品3', price: 299.99, stock: 200, category: 'electronics', status: 0, sales: 230, createdAt: '2024-01-03 10:00:00' },
        { id: 4, name: '产品4', price: 49.99, stock: 300, category: 'books', status: 1, sales: 420, createdAt: '2024-01-04 10:00:00' },
        { id: 5, name: '产品5', price: 249.99, stock: 80, category: 'clothing', status: 1, sales: 67, createdAt: '2024-01-05 10:00:00' },
      ];
      
      setProducts(mockProducts);
    } catch (error) {
      console.error('Load products error:', error);
      message.error('加载商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // 搜索功能
  const handleSearch = (value) => {
    setSearchText(value);
    // 这里可以实现搜索逻辑
  };

  // 分类筛选
  const handleCategoryFilter = (value) => {
    setCategoryFilter(value);
  };

  // 状态筛选
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
  };

  // 添加商品
  const handleAdd = () => {
    message.info('添加商品功能开发中');
  };

  // 编辑商品
  const handleEdit = (record) => {
    message.info('编辑商品功能开发中');
  };

  // 删除商品
  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      onOk: async () => {
        try {
          setProducts(products.filter(product => product.id !== id));
          message.success('删除成功');
        } catch (error) {
          console.error('Delete product error:', error);
          message.error('删除失败');
        }
      }
    });
  };

  // 切换商品状态
  const toggleStatus = (id, currentStatus) => {
    Modal.confirm({
      title: '确认操作',
      content: currentStatus === 1 ? '确定要下架这个商品吗？' : '确定要上架这个商品吗？',
      onOk: () => {
        setProducts(products.map(product => 
          product.id === id ? { ...product, status: currentStatus === 1 ? 0 : 1 } : product
        ));
        message.success(currentStatus === 1 ? '下架成功' : '上架成功');
      }
    });
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
      title: '商品名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${price.toFixed(2)}`
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => {
        const categoryMap = {
          electronics: '电子产品',
          clothing: '服装',
          books: '图书'
        };
        return categoryMap[category] || category;
      }
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <>
          <Tag color={status === 1 ? 'success' : 'default'}>
            {status === 1 ? '上架' : '下架'}
          </Tag>
          <Button
            type="link"
            size="small"
            style={{ marginLeft: 8 }}
            onClick={() => toggleStatus(record.id, status)}
          >
            {status === 1 ? '下架' : '上架'}
          </Button>
        </>
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
    <div className="product-list">
      <div className="product-list-header">
        <h2>商品管理</h2>
        <div className="header-actions">
          <Select
            placeholder="分类筛选"
            style={{ width: 120, marginRight: 16 }}
            value={categoryFilter}
            onChange={handleCategoryFilter}
          >
            <Option value="all">全部</Option>
            <Option value="electronics">电子产品</Option>
            <Option value="clothing">服装</Option>
            <Option value="books">图书</Option>
          </Select>
          <Select
            placeholder="状态筛选"
            style={{ width: 120, marginRight: 16 }}
            value={statusFilter}
            onChange={handleStatusFilter}
          >
            <Option value="all">全部</Option>
            <Option value="active">上架</Option>
            <Option value="inactive">下架</Option>
          </Select>
          <Search
            placeholder="搜索商品名称"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300, marginRight: 16 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加商品
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="product-table"
      />
    </div>
  );
};

export default ProductList;