import React, { useState } from 'react';
import { Table, Input, Select, Button, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './FullDiscount.css';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 模拟满额活动数据 - 目前为空数组，展示"暂无数据"
const mockFullDiscountData = [];

// 状态标签配置
const statusConfig = {
  '已开始': {
    color: 'green',
    text: '已开始'
  },
  '已结束': {
    color: 'red',
    text: '已结束'
  },
  '未开始': {
    color: 'blue',
    text: '未开始'
  }
};

const FullDiscount = () => {
  const [searchParams, setSearchParams] = useState({
    name: '',
    type: '',
    scope: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalItems = 0; // 总数据条数

  // 处理搜索参数变化
  const handleSearchChange = (param, value) => {
    setSearchParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // 已移除时间范围处理函数，使用通用搜索参数处理函数

  // 处理搜索提交
  const handleSearch = () => {
    // 这里可以实现实际的搜索逻辑
    console.log('搜索参数:', searchParams);
  };

  // 处理添加活动
  const handleAddActivity = () => {
    // 这里可以实现添加活动的逻辑
    console.log('添加满额活动');
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
      title: '活动名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180,
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 180,
    },
    {
      title: '店铺名称',
      dataIndex: 'shopName',
      key: 'shopName',
      width: 150,
    },
    {
      title: '活动类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
    {
      title: '活动状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        const config = statusConfig[status] || { color: 'default', text: status };
        return (
          <span className={`status-tag status-${config.color}`}>
            {config.text}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <span className="action-buttons">
          <a href="#" className="edit-btn" onClick={(e) => { e.preventDefault(); handleEdit(record); }}>编辑</a>
          <a href="#" className="view-btn" onClick={(e) => { e.preventDefault(); handleView(record); }}>查看</a>
          <a href="#" className="delete-btn" onClick={(e) => { e.preventDefault(); handleDelete(record); }}>删除</a>
        </span>
      ),
    },
  ];

  return (
    <div className="full-discount-container">
      {/* 搜索区域 */}
      <div className="search-area">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>活动名称</span>
            <Input
              placeholder="请输入活动名称"
              value={searchParams.name}
              onChange={(e) => handleSearchChange('name', e.target.value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>活动类型</span>
            <Select
              placeholder="请选择活动类型"
              value={searchParams.type}
              onChange={(value) => handleSearchChange('type', value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            >
              <Option value="">全部</Option>
              <Option value="满减">满减</Option>
              <Option value="满折">满折</Option>
              <Option value="满赠">满赠</Option>
            </Select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>活动范围</span>
            <Select
              placeholder="请选择活动范围"
              value={searchParams.scope}
              onChange={(value) => handleSearchChange('scope', value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            >
              <Option value="">全部</Option>
              <Option value="全场">全场</Option>
              <Option value="指定商品">指定商品</Option>
              <Option value="指定分类">指定分类</Option>
            </Select>
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
      <div className="action-section">
        <Button type="primary" onClick={handleAddActivity}>
          添加活动
        </Button>
      </div>

      {/* 表格展示区 */}
      <div className="table-section">
        <Table
          columns={columns}
          dataSource={mockFullDiscountData}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
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
        />
      </div>
    </div>
  );
};

export default FullDiscount;