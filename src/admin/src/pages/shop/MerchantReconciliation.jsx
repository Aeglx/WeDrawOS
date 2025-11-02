import React, { useState } from 'react';
import { Table, Input, DatePicker, Select, Button, Empty, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './MerchantReconciliation.css';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

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

  // 模拟数据
  const mockData = [
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
    {
      key: '3',
      orderNo: 'E202510211643250577966722',
      orderTime: '2025-11-02',
      transactionTime: '2025-11-01 10:20:11',
      shopName: '潮流前线1111',
      orderAmount: '¥128.00',
      status: '已结算',
    },
    {
      key: '4',
      orderNo: 'E202510211643250577966723',
      orderTime: '2025-11-02',
      transactionTime: '2025-11-01 11:45:30',
      shopName: '566616',
      orderAmount: '¥56.80',
      status: '已结算',
    },
    {
      key: '5',
      orderNo: 'E202510211643250577966724',
      orderTime: '2025-11-02',
      transactionTime: '2025-11-01 14:20:55',
      shopName: '我叫潮潮！',
      orderAmount: '¥99.00',
      status: '已结算',
    },
    {
      key: '6',
      orderNo: 'E202510211643250577966725',
      orderTime: '2025-11-02',
      transactionTime: '2025-11-01 15:30:22',
      shopName: '打字小铺',
      orderAmount: '¥23.50',
      status: '已结算',
    },
    {
      key: '7',
      orderNo: 'E202510211643250577966726',
      orderTime: '2025-11-02',
      transactionTime: '2025-11-01 16:45:10',
      shopName: '小吃街人1',
      orderAmount: '¥45.00',
      status: '已结算',
    },
    {
      key: '8',
      orderNo: 'E202510211643250577966727',
      orderTime: '2025-11-02',
      transactionTime: '2025-11-01 17:20:33',
      shopName: '潮流前线11111111',
      orderAmount: '¥199.00',
      status: '已结算',
    },
    {
      key: '9',
      orderNo: 'E202510211643250577966728',
      orderTime: '2025-11-02',
      transactionTime: '2025-11-01 18:10:45',
      shopName: 'kaopppppppppppp',
      orderAmount: '¥35.80',
      status: '已结算',
    },
    {
      key: '10',
      orderNo: 'E202510211643250577966729',
      orderTime: '2025-11-02',
      transactionTime: '2025-11-01 19:50:15',
      shopName: 'dddddddddddddd',
      orderAmount: '¥78.00',
      status: '已结算',
    },
  ];

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
          <Button type="link" className="detail-btn">详情</Button>
        </Space>
      ),
    },
  ];

  // 处理搜索
  const handleSearch = () => {
    // 这里应该调用API进行搜索
    console.log('搜索参数:', searchParams);
    // 模拟搜索结果
    setPagination({
      ...pagination,
      total: mockData.length,
      current: 1,
    });
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
    setPagination({
      ...pagination,
      current,
      pageSize,
    });
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
        <Table
          columns={columns}
          dataSource={mockData}
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
      </div>
    </div>
  );
};

export default MerchantReconciliation;