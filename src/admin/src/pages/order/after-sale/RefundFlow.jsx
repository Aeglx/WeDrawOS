import React, { useState, useEffect } from 'react';
import { Table, Input, DatePicker, Button, Select, Space, message, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './RefundFlow.css';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

// 生成模拟退款流水数据
const generateMockRefundFlow = (count = 5000) => {
  const data = [];
  const statuses = ['已退款', '处理中', '已拒绝', '已取消'];
  
  for (let i = 1; i <= count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const applyTime = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    const isOrderCancelled = Math.random() > 0.7;
    
    // 生成随机金额
    const amount = isOrderCancelled ? 
      `${(Math.random() * 1000).toFixed(2)}` : 
      `${(Math.random() * 100 + 0.01).toFixed(2)}`;
    
    data.push({
      key: i,
      refundOrderNo: isOrderCancelled ? '订单取消' : `A${20250709}${100000 + i}`,
      orderNo: `O${20250709}${100000 + i}`,
      thirdPartyPaymentFlow: Math.random() > 0.3 ? `2025${Math.floor(Math.random() * 10000000000000000000)}` : '-1',
      thirdPartyRefundFlow: Math.random() > 0.3 ? `AF${Math.floor(Math.random() * 100000000000000000)}` : '',
      refundAmount: amount,
      applyTime: applyTime.toLocaleString('zh-CN'),
      refundStatus: status
    });
  }
  
  return data;
};

const RefundFlow = () => {
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    orderNo: '',
    refundStatus: '',
    dateRange: []
  });
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 4039 // 总记录数，从截图中获取
  });

  // 加载数据
  const loadData = (page = 1, pageSize = 10) => {
    setLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const allData = generateMockRefundFlow(pagination.total);
      
      // 过滤数据
      let filteredData = [...allData];
      
      if (searchParams.orderNo) {
        filteredData = filteredData.filter(item => 
          item.orderNo.includes(searchParams.orderNo) || 
          item.refundOrderNo.includes(searchParams.orderNo)
        );
      }
      
      if (searchParams.refundStatus) {
        filteredData = filteredData.filter(item => 
          item.refundStatus === searchParams.refundStatus
        );
      }
      
      if (searchParams.dateRange && searchParams.dateRange.length === 2) {
        const [startDate, endDate] = searchParams.dateRange;
        filteredData = filteredData.filter(item => {
          const itemDate = new Date(item.applyTime);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }
      
      // 分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setDataSource(paginatedData);
      setPagination(prev => ({ ...prev, total: filteredData.length }));
      setLoading(false);
    }, 300);
  };

  // 处理搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadData(1, pagination.pageSize);
  };

  // 处理分页变化
  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ 
      ...prev, 
      current: page, 
      pageSize 
    }));
    loadData(page, pageSize);
  };

  // 初始加载
  useEffect(() => {
    loadData(pagination.current, pagination.pageSize);
  }, []);

  // 表格列配置
  const columns = [
    {
      title: '售后单号',
      dataIndex: 'refundOrderNo',
      key: 'refundOrderNo',
      width: 200,
      ellipsis: true,
      render: (text) => <span title={text}>{text}</span>
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
      ellipsis: true,
      render: (text) => <span title={text}>{text}</span>
    },
    {
      title: '第三方支付流水',
      dataIndex: 'thirdPartyPaymentFlow',
      key: 'thirdPartyPaymentFlow',
      width: 200,
      ellipsis: true,
      render: (text) => <span title={text}>{text}</span>
    },
    {
      title: '第三方退款流水',
      dataIndex: 'thirdPartyRefundFlow',
      key: 'thirdPartyRefundFlow',
      width: 200,
      ellipsis: true,
      render: (text) => <span title={text}>{text || '-'}</span>
    },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      width: 120,
      align: 'center',
      render: (value) => <span style={{ color: '#ff4d4f' }}>¥{value}</span>
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 180,
      align: 'center'
    },
    {
      title: '退款状态',
      dataIndex: 'refundStatus',
      key: 'refundStatus',
      width: 100,
      align: 'center',
      render: (status) => {
        let color = 'default';
        switch (status) {
          case '已退款':
            color = 'success';
            break;
          case '处理中':
            color = 'processing';
            break;
          case '已拒绝':
            color = 'error';
            break;
          case '已取消':
            color = 'default';
            break;
          default:
            color = 'default';
        }
        return <span className={`status-tag status-${color}`}>{status}</span>;
      }
    }
  ];

  return (
    <div className="refund-flow-container">
      {/* 搜索区域 */}
      <div className="search-area" style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', marginBottom: '16px', padding: '16px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>订单号</span>
            <Input
              placeholder="订单/交易号"
              allowClear
              value={searchParams.orderNo}
              onChange={(e) => setSearchParams(prev => ({ ...prev, orderNo: e.target.value }))}
              onPressEnter={handleSearch}
              style={{ width: 200, height: 32 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>退款状态</span>
            <Select
              placeholder="请选择"
              style={{ width: 120, height: 32 }}
              allowClear
              value={searchParams.refundStatus}
              onChange={(value) => setSearchParams(prev => ({ ...prev, refundStatus: value }))}
            >
              <Option value="已退款">已退款</Option>
              <Option value="处理中">处理中</Option>
              <Option value="已拒绝">已拒绝</Option>
              <Option value="已取消">已取消</Option>
            </Select>
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>退款时间</span>
            <RangePicker
              placeholder={['选择起始时间', '选择结束时间']}
              value={searchParams.dateRange}
              onChange={(dates) => setSearchParams(prev => ({ ...prev, dateRange: dates }))}
              style={{ width: 320, height: 32 }}
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
                color: '#ffffff'
              }}
            >
              搜索
            </Button>
          </Col>
        </Row>
      </div>

      {/* 表格区域 */}
      <div className="table-container">
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: handlePageChange,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          loading={loading}
          rowKey="key"
          scroll={{ x: 1300 }}
          rowClassName={(record, index) => index % 2 === 0 ? 'even-row' : 'odd-row'}
        />
      </div>
    </div>
  );
};

export default RefundFlow;