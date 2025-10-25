import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, Modal, Select, message } from 'antd';
import { SearchOutlined, FilterOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import './OrderList.css';

const { Search } = Input;
const { Option } = Select;

const OrderList = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // 加载订单列表
  const loadOrders = async () => {
    setLoading(true);
    try {
      // 模拟数据
      const mockOrders = [
        { id: 'ORD20240101001', userId: 101, username: '张三', amount: 199.98, paymentStatus: 1, orderStatus: 2, createdAt: '2024-01-01 10:30:00', products: 2 },
        { id: 'ORD20240101002', userId: 102, username: '李四', amount: 299.99, paymentStatus: 1, orderStatus: 3, createdAt: '2024-01-01 11:15:00', products: 1 },
        { id: 'ORD20240101003', userId: 103, username: '王五', amount: 499.97, paymentStatus: 1, orderStatus: 4, createdAt: '2024-01-01 14:20:00', products: 3 },
        { id: 'ORD20240101004', userId: 104, username: '赵六', amount: 89.99, paymentStatus: 0, orderStatus: 1, createdAt: '2024-01-01 16:45:00', products: 1 },
        { id: 'ORD20240101005', userId: 105, username: '钱七', amount: 599.95, paymentStatus: 1, orderStatus: 5, createdAt: '2024-01-01 19:00:00', products: 5 },
      ];
      
      setOrders(mockOrders);
    } catch (error) {
      console.error('Load orders error:', error);
      message.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // 搜索功能
  const handleSearch = (value) => {
    setSearchText(value);
    // 这里可以实现搜索逻辑
  };

  // 订单状态筛选
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
  };

  // 支付状态筛选
  const handlePaymentFilter = (value) => {
    setPaymentFilter(value);
  };

  // 查看订单详情
  const handleView = (record) => {
    message.info('查看订单详情功能开发中');
  };

  // 取消订单
  const handleCancel = (id) => {
    Modal.confirm({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      onOk: async () => {
        try {
          setOrders(orders.map(order => 
            order.id === id ? { ...order, orderStatus: 0 } : order
          ));
          message.success('取消订单成功');
        } catch (error) {
          console.error('Cancel order error:', error);
          message.error('取消订单失败');
        }
      }
    });
  };

  // 发货
  const handleShip = (id) => {
    Modal.confirm({
      title: '确认发货',
      content: '确定要发货吗？',
      onOk: async () => {
        try {
          setOrders(orders.map(order => 
            order.id === id ? { ...order, orderStatus: 3 } : order
          ));
          message.success('发货成功');
        } catch (error) {
          console.error('Ship order error:', error);
          message.error('发货失败');
        }
      }
    });
  };

  // 订单状态渲染
  const renderOrderStatus = (status) => {
    const statusMap = {
      0: { text: '已取消', color: 'default' },
      1: { text: '待付款', color: 'warning' },
      2: { text: '待发货', color: 'processing' },
      3: { text: '已发货', color: 'blue' },
      4: { text: '已完成', color: 'success' },
      5: { text: '已退款', color: 'error' }
    };
    const statusInfo = statusMap[status] || { text: '未知', color: 'default' };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // 支付状态渲染
  const renderPaymentStatus = (status) => {
    return (
      <Tag color={status === 1 ? 'success' : 'default'}>
        {status === 1 ? '已支付' : '待支付'}
      </Tag>
    );
  };

  // 表格列配置
  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: '用户信息',
      key: 'user',
      render: (_, record) => `${record.username} (ID: ${record.userId})`
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${amount.toFixed(2)}`,
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: '商品数量',
      dataIndex: 'products',
      key: 'products'
    },
    {
      title: '支付状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: renderPaymentStatus
    },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: renderOrderStatus
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record)} 
            size="small"
          >
            详情
          </Button>
          {record.orderStatus === 1 && (
            <Button 
              type="link" 
              danger 
              onClick={() => handleCancel(record.id)} 
              size="small"
            >
              取消
            </Button>
          )}
          {record.orderStatus === 2 && (
            <Button 
              type="link" 
              onClick={() => handleShip(record.id)} 
              size="small"
            >
              发货
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="order-list">
      <div className="order-list-header">
        <h2>订单管理</h2>
        <div className="header-actions">
          <Select
            placeholder="订单状态"
            style={{ width: 120, marginRight: 16 }}
            value={statusFilter}
            onChange={handleStatusFilter}
          >
            <Option value="all">全部</Option>
            <Option value="pending">待付款</Option>
            <Option value="processing">待发货</Option>
            <Option value="shipped">已发货</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <Select
            placeholder="支付状态"
            style={{ width: 120, marginRight: 16 }}
            value={paymentFilter}
            onChange={handlePaymentFilter}
          >
            <Option value="all">全部</Option>
            <Option value="paid">已支付</Option>
            <Option value="unpaid">待支付</Option>
          </Select>
          <Search
            placeholder="搜索订单号或用户名"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
          />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="order-table"
      />
    </div>
  );
};

export default OrderList;