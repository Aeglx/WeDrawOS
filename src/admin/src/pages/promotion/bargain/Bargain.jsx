import React, { useState } from 'react';
import { Button, Input, Select, Table, DatePicker } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Bargain = () => {
  // 搜索参数状态
  const [searchParams, setSearchParams] = useState({
    name: '',
    status: '',
    product: '',
    timeRange: null,
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalItems = 100; // 模拟数据总数
  
  // 处理搜索参数变化
  const handleSearchChange = (param, value) => {
    setSearchParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // 处理搜索提交
  const handleSearch = () => {
    console.log('搜索参数:', searchParams);
  };

  // 处理添加活动
  const handleAddActivity = () => {
    console.log('添加砍价活动');
  };

  // 处理编辑操作
  const handleEdit = (record) => {
    console.log('编辑活动:', record);
  };

  // 处理查看操作
  const handleView = (record) => {
    console.log('查看活动:', record);
  };

  // 处理删除操作
  const handleDelete = (record) => {
    console.log('删除活动:', record);
  };

  // 表格列配置
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 150,
    },
    {
      title: '库存数量',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
    },
    {
      title: '剩余活动库存',
      dataIndex: 'remainingStock',
      key: 'remainingStock',
      width: 120,
    },
    {
      title: '每人最低砍',
      dataIndex: 'minDiscount',
      key: 'minDiscount',
      width: 100,
    },
    {
      title: '每人最高砍',
      dataIndex: 'maxDiscount',
      key: 'maxDiscount',
      width: 100,
    },
    {
      title: '结算价格',
      dataIndex: 'settlementPrice',
      key: 'settlementPrice',
      width: 100,
    },
    {
      title: '活动开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        const statusConfig = {
          0: { color: '#999', text: '未开始' },
          1: { color: '#1890ff', text: '进行中' },
          2: { color: '#999', text: '已结束' },
        };
        const config = statusConfig[status] || { color: '#999', text: status };
        return (
          <span style={{ color: config.color }}>
            {config.text}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" onClick={() => handleView(record)}>查看</Button>
          <Button size="small" danger onClick={() => handleDelete(record)}>删除</Button>
        </div>
      ),
    },
  ];

  // 模拟数据
  const mockBargainData = [];

  return (
    <div className="bargain-container">
      {/* 搜索区域 */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>商品名称</span>
            <Input
              placeholder="请输入商品名称"
              value={searchParams.product}
              onChange={(e) => handleSearchChange('product', e.target.value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>活动状态</span>
            <Select
              placeholder="请选择"
              value={searchParams.status}
              onChange={(value) => handleSearchChange('status', value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            >
              <Option value="">全部</Option>
              <Option value="0">未开始</Option>
              <Option value="1">进行中</Option>
              <Option value="2">已结束</Option>
            </Select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>活动时间</span>
            <RangePicker
              value={searchParams.timeRange}
              onChange={(value) => handleSearchChange('timeRange', value)}
              style={{ width: 260, fontSize: '12px', height: 32 }}
              placeholder={['选择起始时间', '选择结束时间']}
            />
          </div>
          
          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            onClick={handleSearch}
            style={{ height: 32, fontSize: '12px', backgroundColor: '#ff0000', borderColor: '#ff0000' }}
          >
            搜索
          </Button>
        </div>
      </div>

      {/* 操作按钮区 */}
      <div style={{ marginBottom: '20px', paddingTop: '16px' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAddActivity}
          style={{ 
            height: 32, 
            fontSize: '12px', 
            backgroundColor: '#ff0000', 
            borderColor: '#ff0000' 
          }}
        >
          添加砍价
        </Button>
      </div>

      {/* 表格展示区 */}
      <div className="table-section">
        <Table
          columns={columns}
          dataSource={mockBargainData}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: 0,
            onChange: (page) => setCurrentPage(page),
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: '暂无数据'
          }}
          bordered
        />
      </div>
    </div>
  );
};

export default Bargain;