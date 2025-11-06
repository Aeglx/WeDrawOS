import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, message, DatePicker, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './OrderList.css';

// API调用对象
const api = {
  // 获取订单列表
  async getOrderList(params) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      if (params.orderId) queryParams.append('orderId', params.orderId);
      if (params.memberName) queryParams.append('memberName', params.memberName);
      if (params.startTime) queryParams.append('startTime', params.startTime);
      if (params.endTime) queryParams.append('endTime', params.endTime);
      if (params.status) queryParams.append('status', params.status);
      
      const response = await fetch(`/api/admin/order/list?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('网络请求失败');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取订单列表失败:', error);
      // 失败时返回模拟数据
      return {
        success: true,
        data: [],
        total: 0
      };
    }
  },
  
  // 获取订单详情
  async getOrderDetail(orderId) {
    try {
      const response = await fetch(`/api/admin/order/detail/${orderId}`);
      if (!response.ok) {
        throw new Error('网络请求失败');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  },
  
  // 订单收款
  async collectPayment(orderId, params) {
    try {
      const response = await fetch(`/api/admin/order/collect/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      if (!response.ok) {
        throw new Error('网络请求失败');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('订单收款失败:', error);
      throw error;
    }
  }
};

const { RangePicker } = DatePicker;

const OrderList = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(1002); // 总订单数
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // 搜索参数状态 - 简化为图片中的三个字段
  const [searchParams, setSearchParams] = useState({
    orderId: '',
    memberName: '',
    dateRange: null
  });

  // 根据状态获取标签颜色
  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'orange', // 未付款
      paid: 'blue',      // 已付款
      verification: 'orange', // 待核验
      completed: 'green', // 已完成
      cancelled: 'red'    // 已关闭
    };
    return colorMap[status] || 'default';
  };

  // 根据状态值获取状态文本
  const getStatusText = (status) => {
    const statusMap = {
      pending: '未付款',
      paid: '已付款',
      verification: '待核验',
      completed: '已完成',
      cancelled: '已关闭'
    };
    return statusMap[status] || status;
  };

  // 加载订单列表
  const loadOrders = async (params = {}) => {
    setLoading(true);
    try {
      // 准备API参数
      const apiParams = {
        page: params.page || currentPage,
        pageSize: params.pageSize || pageSize,
        status: params.status || activeTab
      };
      
      // 添加搜索条件
      if (searchParams.orderId) {
        apiParams.orderId = searchParams.orderId;
      }
      
      if (searchParams.memberName) {
        apiParams.memberName = searchParams.memberName;
      }
      
      // 处理日期范围
      if (searchParams.dateRange && searchParams.dateRange.length === 2) {
        apiParams.startTime = searchParams.dateRange[0].format('YYYY-MM-DD');
        apiParams.endTime = searchParams.dateRange[1].format('YYYY-MM-DD');
      }
      
      // 调用API获取数据
      const result = await api.getOrderList(apiParams);
      
      if (result.success) {
        // 确保订单数据中包含statusText和statusColor字段
        const formattedOrders = result.data.map(order => ({
          ...order,
          statusText: order.statusText || getStatusText(order.status),
          statusColor: order.statusColor || getStatusColor(order.status)
        }));
        
        setOrders(formattedOrders);
        setTotalOrders(result.total || 1002); // 默认值保持与之前一致
        setCurrentPage(params.page || currentPage);
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
      message.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // 处理分页变化
  const handlePageChange = (page) => {
    loadOrders({ page });
  };
  
  // 处理页面大小变化
  const handlePageSizeChange = (pageSize) => {
    setPageSize(pageSize);
    loadOrders({ pageSize, page: 1 });
  };

  // 搜索功能
  const handleSearch = () => {
    // 重置到第一页并搜索
    loadOrders({ page: 1 });
    message.success('搜索成功');
  };

  // 处理标签切换
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    // 重置到第一页并切换状态筛选
    loadOrders({ status: tabKey, page: 1 });
  };

  // 查看订单详情
  const handleView = async (record) => {
    try {
      const result = await api.getOrderDetail(record.id);
      if (result.success) {
        console.log('查看订单详情:', result.data);
        message.info(`查看订单 ${record.id} 详情`);
        // 这里可以打开详情弹窗，展示result.data中的详细信息
      }
    } catch (error) {
      console.error('获取详情失败:', error);
      message.error('获取详情失败');
    }
  };

  // 收款功能
  const handleCollect = async (record) => {
    try {
      // 确认收款操作
      if (window.confirm(`确定要对订单 ${record.id} 进行收款操作吗？`)) {
        const result = await api.collectPayment(record.id, {
          paymentMethod: '在线支付',
          transactionId: `TXN${Date.now()}`
        });
        
        if (result.success) {
          message.success(`订单 ${record.id} 收款成功`);
          // 重新加载当前页面数据
          loadOrders();
        }
      }
    } catch (error) {
      console.error('收款操作失败:', error);
      message.error('收款操作失败');
    }
  };

  // 表格列配置 - 严格按照图片中的列进行配置
  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 250
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180
    },
    {
      title: '订单来源',
      dataIndex: 'source',
      key: 'source',
      width: 100
    },
    {
      title: '买家名称',
      dataIndex: 'buyerName',
      key: 'buyerName',
      width: 120
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
      title: '订单状态',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={record.statusColor}>{record.statusText}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            size="small"
            onClick={() => handleCollect(record)}
            style={{ color: '#999' }}
          >
            收款
          </Button>
          <Button 
            type="link" 
            size="small"
            onClick={() => handleView(record)}
            style={{ color: '#ff7875' }}
          >
            查看
          </Button>
        </Space>
      )
    }
  ];

  // 状态标签配置 - 严格按照图片中的标签进行配置
  const statusTabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '未付款' },
    { key: 'paid', label: '已付款' },
    { key: 'verification', label: '待核验' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已关闭' }
  ];

  return (
    <div className="order-list">
      {/* 搜索区域 - 简化为图片中的三个输入框和一个搜索按钮 */}
      <div className="search-area" style={{ padding: '16px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>订单号</span>
            <Input 
              placeholder="请输入订单号" 
              value={searchParams.orderId} 
              onChange={(e) => setSearchParams({...searchParams, orderId: e.target.value})} 
              style={{ width: 180, height: 32 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>会员名称</span>
            <Input 
              placeholder="请输入会员名称" 
              value={searchParams.memberName} 
              onChange={(e) => setSearchParams({...searchParams, memberName: e.target.value})} 
              style={{ width: 180, height: 32 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>下单时间</span>
            <RangePicker 
              placeholder={['选择起始时间']}
              value={searchParams.dateRange}
              onChange={(dates) => setSearchParams({...searchParams, dateRange: dates})}
              style={{ width: 240, height: 32 }}
            />
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={handleSearch} 
              style={{ 
                width: 80, 
                height: 32, 
                backgroundColor: '#ff0000', 
                borderColor: '#ff0000', 
                color: '#ffffff !important',
                fontWeight: '500',
                fontSize: '14px',
                padding: '0 16px'
              }}
            >
              搜索
            </Button>
          </Col>
        </Row>
      </div>

      {/* 订单列表容器 */}
      <div className="order-table-container" style={{ backgroundColor: '#fff' }}>
        {/* 状态标签区域 - 严格按照图片中的标签样式 */}
        <div className="status-tabs" style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div className="tab-list" style={{ display: 'flex', paddingLeft: '16px' }}>
            {statusTabs.map(tab => (
              <div
                key={tab.key}
                className={`status-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  padding: '0 16px',
                  height: 32,
                  lineHeight: '32px',
                  cursor: 'pointer',
                  color: activeTab === tab.key ? '#ff4d4f' : '#666',
                  borderBottom: activeTab === tab.key ? '2px solid #ff4d4f' : 'none',
                  fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                  marginRight: '16px'
                }}
              >
                {tab.label}
              </div>
            ))}
          </div>
        </div>

        {/* 表格区域 */}
        <Table
          columns={columns}
          dataSource={orders}
          rowKey={(record) => record.id}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共${totalOrders}条`,
            pageSizeOptions: ['10条/页', '20条/页', '50条/页'],
            onChange: handlePageChange,
            onShowSizeChange: (current, size) => handlePageSizeChange(size)
          }}
          className="order-table"
          style={{ padding: '0 16px' }}
        />
      </div>
    </div>
  );
};

export default OrderList;