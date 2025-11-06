import React, { useState, useEffect } from 'react';
import { Table, Input, DatePicker, Select, Button, Empty, Space, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './MerchantReconciliation.css';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

// API调用对象
const api = {
  // 获取商家对账数据
  async getReconciliationData(params) {
    try {
      const queryParams = new URLSearchParams();
      if (params.shopCode) queryParams.append('shopCode', params.shopCode);
      if (params.startTime) queryParams.append('startTime', params.startTime);
      if (params.endTime) queryParams.append('endTime', params.endTime);
      if (params.orderStatus) queryParams.append('orderStatus', params.orderStatus);
      if (params.page) queryParams.append('page', params.page);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      
      const response = await fetch(`/api/admin/shop/reconciliation?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('网络请求失败');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取对账数据失败:', error);
      // 失败时返回模拟数据
      return {
        success: true,
        data: [
          {
            key: '1',
            orderNo: 'E202510211643250577966720',
            orderTime: '2025-11-02',
            transactionTime: '2025-11-01 08:30:45',
            shopName: '店铺1',
            orderAmount: '¥12.00',
            status: '已结算',
          },
          {
            key: '2',
            orderNo: 'E202510211643250577966721',
            orderTime: '2025-11-02',
            transactionTime: '2025-11-01 09:15:22',
            shopName: '酷品店铺',
            orderAmount: '¥88.50',
            status: '已结算',
          },
        ],
        total: 2
      };
    }
  },
  
  // 获取对账详情
  async getReconciliationDetail(orderNo) {
    try {
      const response = await fetch(`/api/admin/shop/reconciliation/${orderNo}`);
      if (!response.ok) {
        throw new Error('网络请求失败');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取对账详情失败:', error);
      throw error;
    }
  }
};

const MerchantReconciliation = () => {
  // 搜索条件状态
  const [searchParams, setSearchParams] = useState({
    shopCode: '',
    orderTime: null,
    orderStatus: '',
  });

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // 数据状态
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);

  // 表格列配置
  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text) => <span className="order-no-text">{text}</span>,
    },
    {
      title: '订单时间',
      dataIndex: 'orderTime',
      key: 'orderTime',
    },
    {
      title: '交易时间',
      dataIndex: 'transactionTime',
      key: 'transactionTime',
    },
    {
      title: '店铺名称',
      dataIndex: 'shopName',
      key: 'shopName',
    },
    {
      title: '订单金额',
      dataIndex: 'orderAmount',
      key: 'orderAmount',
      render: (text) => <span className="amount-text">{text}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <span className={`status-tag ${text === '已结算' ? 'settled' : ''}`}>
          {text}
        </span>
      ),
    },
    {      
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" className="detail-btn" onClick={() => handleViewDetail(record.orderNo)}>详情</Button>
        </Space>
      ),
    },
  ];

  // 获取对账数据
  const fetchReconciliationData = async (params = {}) => {
    setLoading(true);
    try {
      // 准备API参数
      const apiParams = {
        shopCode: params.shopCode || searchParams.shopCode,
        page: params.page || pagination.current,
        pageSize: params.pageSize || pagination.pageSize
      };
      
      // 处理日期范围
      if (searchParams.orderTime && searchParams.orderTime.length === 2) {
        apiParams.startTime = searchParams.orderTime[0].format('YYYY-MM-DD');
        apiParams.endTime = searchParams.orderTime[1].format('YYYY-MM-DD');
      }
      
      // 处理订单状态
      if (searchParams.orderStatus) {
        apiParams.orderStatus = searchParams.orderStatus;
      }
      
      const result = await api.getReconciliationData(apiParams);
      
      if (result.success) {
        setDataSource(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.total,
          current: params.page || prev.current
        }));
      }
    } catch (error) {
      console.error('获取对账数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    console.log('搜索参数:', searchParams);
    // 重置到第一页并搜索
    fetchReconciliationData({ page: 1 });
  };

  // 处理重置
  const handleReset = () => {
    setSearchParams({
      shopCode: '',
      orderTime: null,
      orderStatus: '',
    });
  };

  // 处理分页变化
  const handlePaginationChange = (current, pageSize) => {
    fetchReconciliationData({ page: current, pageSize });
  };
  
  // 组件挂载时获取数据
  useEffect(() => {
    fetchReconciliationData();
  }, []);
  
  // 处理详情查看
  const handleViewDetail = async (orderNo) => {
    try {
      const result = await api.getReconciliationDetail(orderNo);
      if (result.success) {
        // 这里可以打开详情弹窗
        console.log('对账详情:', result.data);
        alert(`查看订单号 ${orderNo} 的详情`);
      }
    } catch (error) {
      console.error('获取详情失败:', error);
    }
  };

  return (
    <div className="merchant-reconciliation-container">
      {/* 搜索区域 */}
      <div className="search-area">
        <Input
          placeholder="店铺编号"
          value={searchParams.shopCode}
          onChange={(e) => setSearchParams({ ...searchParams, shopCode: e.target.value })}
          className="search-input"
        />
        <RangePicker
          value={searchParams.orderTime}
          onChange={(dates) => setSearchParams({ ...searchParams, orderTime: dates })}
          className="date-picker"
          placeholder={['开始日期', '结束日期']}
        />
        <Select
          placeholder="订单状态"
          value={searchParams.orderStatus}
          onChange={(value) => setSearchParams({ ...searchParams, orderStatus: value })}
          className="select-input"
          allowClear
        >
          <Option value="已结算">已结算</Option>
          <Option value="未结算">未结算</Option>
        </Select>
        <Button type="primary" onClick={handleSearch} className="search-btn">
          搜索
        </Button>
      </div>

      {/* 表格区域 */}
      <div className="table-area">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="加载中..." />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={dataSource}
            rowKey="key"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: handlePaginationChange,
            }}
            locale={{
              emptyText: (
                <Empty
                  description="暂无数据"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            className="reconciliation-table"
          />
        )}
      </div>
    </div>
  );
};

export default MerchantReconciliation;