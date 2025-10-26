import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, Modal, Select, message, DatePicker, Row, Col } from 'antd';
import { SearchOutlined, FilterOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import './OrderList.css';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const OrderList = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [originalOrders, setOriginalOrders] = useState([]); // 保存原始订单数据
  const [activeTab, setActiveTab] = useState('all');
  
  // 搜索参数状态
  const [searchParams, setSearchParams] = useState({
    orderId: '',
    memberName: '',
    productName: '',
    consignee: '',
    orderSource: '',
    paymentMethod: '',
    dateRange: null
  });

  // 生成模拟数据
  const generateMockOrders = () => {
    const sources = ['移动端', 'PC端', '微信小程序', '移动端应用'];
    const types = ['普通订单', '预售订单', '秒杀订单'];
    const statuses = [
      { text: '待付款', value: 'pending', color: 'orange' },
      { text: '已付款', value: 'paid', color: 'blue' },
      { text: '待发货', value: 'processing', color: 'cyan' },
      { text: '部分发货', value: 'partial', color: 'purple' },
      { text: '待收货', value: 'shipping', color: 'lime' },
      { text: '待核销', value: 'verification', color: 'geekblue' },
      { text: '已完成', value: 'completed', color: 'green' },
      { text: '已取消', value: 'cancelled', color: 'gray' }
    ];
    const paymentMethods = ['微信支付', '支付宝', '货到付款'];
    
    const mockOrders = [];
    
    for (let i = 0; i < 50; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const hasPayment = ['pending', 'cancelled'].indexOf(status.value) === -1;
      
      mockOrders.push({
        id: `O${202505100000000000 + i}`,
        source: sources[Math.floor(Math.random() * sources.length)],
        type: types[Math.floor(Math.random() * types.length)],
        buyerName: `user${Math.floor(Math.random() * 10000)}@example.com`,
        memberId: `1${Math.random().toString().slice(2, 12)}`,
        storeName: '京东商城',
        amount: Math.random() * 1000,
        paymentMethod: hasPayment ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : '',
        status: status.value,
        statusText: status.text,
        statusColor: status.color,
        createdAt: new Date(2025, 4, Math.floor(Math.random() * 30) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toLocaleString('zh-CN')
      });
    }
    
    return mockOrders;
  };

  // 加载订单列表
  const loadOrders = async () => {
    setLoading(true);
    try {
      // 模拟数据
      const mockOrders = generateMockOrders();
      setOrders(mockOrders);
      setOriginalOrders(mockOrders); // 保存原始订单数据
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
  const handleSearch = () => {
    setLoading(true);
    
    // 模拟搜索延迟
    setTimeout(() => {
      try {
        let filteredOrders = [...originalOrders];
        
        // 根据订单号搜索
        if (searchParams.orderId) {
          filteredOrders = filteredOrders.filter(order => 
            order.id.toLowerCase().includes(searchParams.orderId.toLowerCase())
          );
        }
        
        // 根据会员名称搜索
        if (searchParams.memberName) {
          filteredOrders = filteredOrders.filter(order => 
            order.buyerName.toLowerCase().includes(searchParams.memberName.toLowerCase())
          );
        }
        
        // 根据商品名称搜索（在模拟数据中我们通过订单号模糊匹配模拟）
        if (searchParams.productName) {
          // 注意：在实际项目中，这里应该基于实际的商品名称字段进行搜索
          filteredOrders = filteredOrders.filter(order => 
            order.id.toLowerCase().includes(searchParams.productName.toLowerCase())
          );
        }
        
        // 根据收货人搜索（在模拟数据中我们通过买家名称模糊匹配模拟）
        if (searchParams.consignee) {
          // 注意：在实际项目中，这里应该基于实际的收货人字段进行搜索
          filteredOrders = filteredOrders.filter(order => 
            order.buyerName.toLowerCase().includes(searchParams.consignee.toLowerCase())
          );
        }
        
        // 根据订单来源搜索
        if (searchParams.orderSource) {
          const sourceMapping = {
            'mobile': '移动端',
            'pc': 'PC端',
            'wechat': '微信小程序'
          };
          const sourceText = sourceMapping[searchParams.orderSource] || searchParams.orderSource;
          filteredOrders = filteredOrders.filter(order => 
            order.source.includes(sourceText)
          );
        }
        
        // 根据支付方式搜索
        if (searchParams.paymentMethod) {
          const paymentMapping = {
            'wechat': '微信支付',
            'alipay': '支付宝',
            'cod': '货到付款'
          };
          const paymentText = paymentMapping[searchParams.paymentMethod] || searchParams.paymentMethod;
          filteredOrders = filteredOrders.filter(order => 
            order.paymentMethod.includes(paymentText)
          );
        }
        
        // 根据日期范围搜索
        if (searchParams.dateRange && searchParams.dateRange.length === 2) {
          const [startDate, endDate] = searchParams.dateRange;
          filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startDate && orderDate <= endDate;
          });
        }
        
        // 如果当前有激活的状态标签，需要同时考虑状态筛选
        if (activeTab !== 'all') {
          filteredOrders = filteredOrders.filter(order => order.status === activeTab);
        }
        
        setOrders(filteredOrders);
        message.success(`找到 ${filteredOrders.length} 条订单`);
      } catch (error) {
        console.error('搜索订单失败:', error);
        message.error('搜索订单失败，请重试');
        setOrders(originalOrders); // 出错时显示全部订单
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // 重置搜索条件
  const handleReset = () => {
    setSearchParams({
      orderId: '',
      memberName: '',
      productName: '',
      consignee: '',
      orderSource: '',
      paymentMethod: '',
      dateRange: null
    });
    setActiveTab('all');
    loadOrders();
  };

  // 切换状态标签并筛选订单
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setLoading(true);
    
    try {
      // 简单直接的状态筛选逻辑
      if (tabKey === 'all') {
        // 如果有搜索参数，应用搜索条件
        let hasSearchParams = false;
        Object.values(searchParams).forEach(value => {
          if (value && (typeof value === 'string' || Array.isArray(value))) {
            hasSearchParams = true;
          }
        });
        
        if (hasSearchParams) {
          handleSearch(); // 调用搜索函数应用搜索条件
        } else {
          setOrders(originalOrders); // 显示所有订单
        }
      } else {
        // 只根据状态筛选，忽略其他搜索条件
        const filteredOrders = originalOrders.filter(order => order.status === tabKey);
        setOrders(filteredOrders);
        message.success(`找到 ${filteredOrders.length} 条${getStatusText(tabKey)}订单`);
      }
    } catch (error) {
      console.error('状态筛选失败:', error);
      message.error('筛选订单失败，请重试');
      setOrders(originalOrders);
    } finally {
      setLoading(false);
    }
  };
  
  // 根据状态值获取状态文本
  const getStatusText = (status) => {
    const statusMap = {
      pending: '未付款',
      paid: '已付款',
      processing: '待发货',
      partial: '部分发货',
      shipping: '待收货',
      verification: '待核销',
      completed: '已完成',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  };

  // 查看订单详情
  const handleView = (record) => {
    message.info(`查看订单 ${record.id} 详情`);
  };

  // 表格列配置
  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 180
    },
    {
      title: '订单来源',
      dataIndex: 'source',
      key: 'source',
      width: 100
    },
    {
      title: '订单类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '买家名称',
      dataIndex: 'buyerName',
      key: 'buyerName',
      width: 150
    },
    {
      title: '会员ID',
      dataIndex: 'memberId',
      key: 'memberId',
      width: 130
    },
    {
      title: '店铺名称',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 100
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => `¥${amount.toFixed(2)}`,
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100
    },
    {
      title: '订单状态',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={record.statusColor}>{record.statusText}</Tag>
      )
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleView(record)} 
          >
            查看
          </Button>
        </Space>
      )
    }
  ];

  // 计算各状态订单数量
  const getStatusCounts = () => {
    const counts = {
      all: originalOrders.length,
      pending: 0,
      paid: 0,
      processing: 0,
      partial: 0,
      shipping: 0,
      verification: 0,
      completed: 0,
      cancelled: 0
    };
    
    originalOrders.forEach(order => {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status]++;
      }
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  
  // 状态标签配置
  const statusTabs = [
    { key: 'all', label: '全部', count: null },
    { key: 'pending', label: '未付款', count: statusCounts.pending },
    { key: 'paid', label: '已付款', count: statusCounts.paid },
    { key: 'processing', label: '待发货', count: statusCounts.processing },
    { key: 'partial', label: '部分发货', count: statusCounts.partial },
    { key: 'shipping', label: '待收货', count: statusCounts.shipping },
    { key: 'verification', label: '待核销', count: statusCounts.verification },
    { key: 'completed', label: '已完成', count: statusCounts.completed },
    { key: 'cancelled', label: '已取消', count: statusCounts.cancelled }
  ];

  return (
    <div className="order-list">
      {/* 搜索区域 */}
      <div className="search-area">
        <Row gutter={16}>
          <Col span={5}>
            <Input 
              placeholder="订单号" 
              value={searchParams.orderId} 
              onChange={(e) => setSearchParams({...searchParams, orderId: e.target.value})} 
            />
          </Col>
          <Col span={5}>
            <Input 
              placeholder="会员名称" 
              value={searchParams.memberName} 
              onChange={(e) => setSearchParams({...searchParams, memberName: e.target.value})} 
            />
          </Col>
          <Col span={5}>
            <Input 
              placeholder="商品名称" 
              value={searchParams.productName} 
              onChange={(e) => setSearchParams({...searchParams, productName: e.target.value})} 
            />
          </Col>
          <Col span={5}>
            <Input 
              placeholder="收货人" 
              value={searchParams.consignee} 
              onChange={(e) => setSearchParams({...searchParams, consignee: e.target.value})} 
            />
          </Col>
        </Row>
        
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={5}>
            <Select 
              placeholder="订单来源" 
              value={searchParams.orderSource} 
              onChange={(value) => setSearchParams({...searchParams, orderSource: value})}
              allowClear
            >
              <Option value="mobile">移动端</Option>
              <Option value="pc">PC端</Option>
              <Option value="wechat">微信小程序</Option>
            </Select>
          </Col>
          <Col span={5}>
            <Select 
              placeholder="支付方式" 
              value={searchParams.paymentMethod} 
              onChange={(value) => setSearchParams({...searchParams, paymentMethod: value})}
              allowClear
            >
              <Option value="wechat">微信支付</Option>
              <Option value="alipay">支付宝</Option>
              <Option value="cod">货到付款</Option>
            </Select>
          </Col>
          <Col span={8}>
            <RangePicker 
              placeholder={['开始时间', '结束时间']}
              value={searchParams.dateRange}
              onChange={(dates) => setSearchParams({...searchParams, dateRange: dates})}
            />
          </Col>
          <Col span={2}>
            <Button type="primary" onClick={handleSearch} style={{ width: '100%' }}>
              搜索
            </Button>
          </Col>
          <Col span={2}>
            <Button onClick={handleReset} style={{ width: '100%' }}>
              重置
            </Button>
          </Col>
        </Row>
      </div>

      {/* 状态标签区域 */}
      <div className="status-tabs">
        <Space size="middle">
          {statusTabs.map(tab => (
            <Button
              key={tab.key}
              type={activeTab === tab.key ? 'primary' : 'default'}
              onClick={() => handleTabChange(tab.key)}
              className="status-tab-btn"
              size="middle"
              style={{
                borderRadius: '16px',
                borderColor: activeTab === tab.key ? '#ff4d4f' : '#d9d9d9',
                backgroundColor: activeTab === tab.key ? '#ff4d4f' : '#fff',
                color: activeTab === tab.key ? '#fff' : '#333',
                padding: '4px 16px',
                fontSize: '14px'
              }}
            >
              {tab.label}
              {tab.count !== null && <span className="tab-count" style={{marginLeft: '4px', fontSize: '12px'}}>({tab.count})</span>}
            </Button>
          ))}
        </Space>
      </div>

      {/* 表格区域 */}
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        className="order-table"
      />
    </div>
  );
};

export default OrderList;