import React, { useState, useEffect } from 'react';
import { Input, Button, Table, Pagination, Spin, DatePicker, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './WithdrawApply.css';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

// 生成随机申请编号
const generateApplyNo = () => {
  return `W${1970000000000000000 + Math.floor(Math.random() * 100000000000000000)}`;
};

// 模拟提现申请数据
const generateMockData = (page, pageSize) => {
  const data = [];
  const baseId = (page - 1) * pageSize + 1;
  const statuses = ['申请中', '提现失败'];
  const amounts = [1, 10, 100, 500, 999, 1000, 9999];
  
  for (let i = 0; i < pageSize; i++) {
    // 生成随机时间（最近一个月内）
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 30);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    const randomSeconds = Math.floor(Math.random() * 60);
    
    now.setDate(now.getDate() - randomDays);
    now.setHours(randomHours, randomMinutes, randomSeconds, 0);
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    
    // 审核时间 - 只有提现失败状态才有审核时间
    let auditTime = null;
    let auditTimeDisplay = '';
    
    if (status === '提现失败') {
      auditTime = new Date(now.getTime() + Math.random() * 24 * 3600000); // 申请后随机时间内审核
      auditTimeDisplay = auditTime.toLocaleString('zh-CN');
    }
    
    data.push({
      key: baseId + i,
      applyNo: generateApplyNo(),
      username: 'GOODS', // 从图片中看到用户名统一为GOODS
      amount: amount,
      status: status,
      applyTime: now,
      applyTimeDisplay: now.toLocaleString('zh-CN'),
      auditTime: auditTime,
      auditTimeDisplay: auditTimeDisplay
    });
  }
  
  return data;
};

const WithdrawApply = () => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 1050 // 总记录数，从图片中获取
  });

  // 加载数据
  const loadData = (page = 1, pageSize = 10) => {
    setLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const data = generateMockData(page, pageSize);
      
      // 如果有搜索条件，进行简单的过滤
      let filteredData = data;
      
      if (username) {
        filteredData = filteredData.filter(item => 
          item.username.includes(username)
        );
      }
      
      if (status) {
        filteredData = filteredData.filter(item => 
          item.status === status
        );
      }
      
      // 如果有日期范围过滤
      if (dateRange && dateRange.length === 2) {
        const [startDate, endDate] = dateRange;
        filteredData = filteredData.filter(item => {
          const itemDate = item.applyTime;
          return itemDate >= startDate && itemDate <= endDate;
        });
      }
      
      setDataSource(filteredData);
      setLoading(false);
    }, 500);
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

  // 处理审核操作
  const handleAudit = (record) => {
    // 实际项目中这里应该跳转到审核页面或打开审核弹窗
    console.log('审核提现申请:', record);
    // 可以添加确认对话框
  };

  // 处理查看操作
  const handleView = (record) => {
    // 实际项目中这里应该跳转到详情页面或打开详情弹窗
    console.log('查看提现申请:', record);
  };

  // 初始加载
  useEffect(() => {
    loadData(pagination.current, pagination.pageSize);
  }, []);

  // 表格列配置
  const columns = [
    {
      title: '申请编号',
      dataIndex: 'applyNo',
      key: 'applyNo',
      width: 180,
      ellipsis: true,
      render: (text) => (
        <span className="applyNo" title={text}>{text}</span>
      )
    },
    {
      title: '用户名称',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text) => (
        <span className="usernameCell">{text}</span>
      )
    },
    {
      title: '申请金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.amount - b.amount,
      render: (value) => (
        <span className="amount">¥{value.toFixed(2)}</span>
      )
    },
    {
      title: '提现状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (text) => (
        <span className={`statusTag ${text === '申请中' ? 'pending' : 'failed'}`}>
          {text}
        </span>
      )
    },
    {
      title: '申请时间',
      dataIndex: 'applyTimeDisplay',
      key: 'applyTime',
      width: 180,
      align: 'center',
      render: (text) => (
        <span className="timeCell">{text}</span>
      )
    },
    {
      title: '审核时间',
      dataIndex: 'auditTimeDisplay',
      key: 'auditTime',
      width: 180,
      align: 'center',
      render: (text) => (
        <span className="timeCell">{text || '-'}</span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
      render: (record) => (
        <Space size={8}>
          {record.status === '申请中' ? (
            <Button 
              type="primary" 
              size="small" 
              onClick={() => handleAudit(record)}
              className="auditButton"
            >
              审核
            </Button>
          ) : (
            <Button 
              size="small" 
              onClick={() => handleView(record)}
              className="viewButton"
            >
              查看
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="container">
      {/* 搜索区域 */}
      <div className="searchContainer">
        <Space size={16}>
          <div className="searchItem">
            <span className="searchLabel">会员名称</span>
            <Search
              placeholder="请输入会员名称"
              allowClear
              size="middle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: 200 }}
            />
          </div>
          <div className="searchItem">
            <span className="searchLabel">审核状态</span>
            <Select
              placeholder="请选择"
              allowClear
              size="middle"
              style={{ width: 120 }}
              value={status}
              onChange={(value) => setStatus(value)}
            >
              <Option value="申请中">申请中</Option>
              <Option value="提现失败">提现失败</Option>
            </Select>
          </div>
          <div className="searchItem">
            <span className="searchLabel">申请时间</span>
            <RangePicker
              placeholder={['选择起始时间', '选择结束时间']}
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: 320 }}
            />
          </div>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            size="middle"
            className="searchButton"
          >
            搜索
          </Button>
        </Space>
      </div>

      {/* 表格区域 */}
      <div className="tableContainer">
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          loading={loading}
          rowKey="key"
          scroll={{ y: 500 }}
          rowClassName={(record, index) => index % 2 === 0 ? 'evenRow' : 'oddRow'}
          locale={{
            emptyText: loading ? <Spin size="small" /> : '暂无提现申请数据'
          }}
        />
      </div>

      {/* 分页区域 */}
      <div className="paginationContainer">
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={handlePageChange}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `共${total}条`}
          pageSizeOptions={['10', '20', '50', '100']}
          size="small"
        />
      </div>
    </div>
  );
};

export default WithdrawApply;