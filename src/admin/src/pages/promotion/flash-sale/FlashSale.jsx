import React, { useState } from 'react';
import { Button, Input, Select, Table, Card, Tabs, DatePicker, Modal, Form } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

const FlashSale = () => {
  // 搜索参数状态
  const [searchParams, setSearchParams] = useState({
    name: '',
    status: '',
    timeRange: [],
  });
  
  // 添加活动弹窗状态
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [form] = Form.useForm();
  
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
    setIsAddModalVisible(true);
  };
  
  // 处理弹窗取消
  const handleCancel = () => {
    setIsAddModalVisible(false);
    form.resetFields();
  };
  
  // 处理表单提交
  const handleSubmit = (values) => {
    console.log('提交的活动数据:', values);
    // 这里可以添加API调用逻辑
    setIsAddModalVisible(false);
    form.resetFields();
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
      title: '活动状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          0: { color: 'default', text: '未开始' },
          1: { color: 'green', text: '进行中' },
          2: { color: 'red', text: '已结束' },
        };
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

  // 模拟数据
  const mockFlashSaleData = [
    {
      key: '1',
      name: '双11秒杀活动',
      startTime: '2024-11-11 00:00:00',
      endTime: '2024-11-11 23:59:59',
      status: 1,
    },
    {
      key: '2',
      name: '新品秒杀',
      startTime: '2024-11-12 10:00:00',
      endTime: '2024-11-12 12:00:00',
      status: 0,
    },
    {
      key: '3',
      name: '周末特价秒杀',
      startTime: '2024-11-09 09:00:00',
      endTime: '2024-11-09 18:00:00',
      status: 2,
    },
  ];

  return (
    <div className="flash-sale-container">
      {/* 搜索区域 */}
      <Card>
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
              style={{ width: 180, height: 32 }}
              placeholder={['开始时间', '结束时间']}
              value={searchParams.timeRange}
              onChange={(dates) => handleSearchChange('timeRange', dates)}
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
      </Card>

      {/* 操作按钮区 */}
      <div className="action-section" style={{ margin: '16px 0' }}>
        <Button 
          type="primary" 
          onClick={handleAddActivity}
          style={{ backgroundColor: '#fff', color: '#ff0000', borderColor: '#ff0000' }}
        >
          添加活动
        </Button>
      </div>

      {/* 表格展示区 */}
      <div className="table-section">
        <Tabs 
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: '秒杀活动列表',
              children: (
                <Table
                  columns={columns}
                  dataSource={mockFlashSaleData}
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
              )
            },
            {
              key: '2',
              label: '秒杀活动设置',
              children: (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
                  暂无秒杀活动设置数据
                </div>
              )
            }
          ]}
        />
        
        {/* 添加活动弹窗 */}
        <Modal
          title="添加秒杀活动"
          open={isAddModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ maxWidth: '100%' }}
          >
            <Form.Item
              name="name"
              label="活动名称"
              rules={[{ required: true, message: '请输入活动名称' }]}
            >
              <Input placeholder="请输入活动名称" />
            </Form.Item>
            
            <Form.Item
              name="timeRange"
              label="活动时间"
              rules={[{ required: true, message: '请选择活动时间' }]}
            >
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="status"
              label="活动状态"
              initialValue="0"
              rules={[{ required: true, message: '请选择活动状态' }]}
            >
              <Select>
                <Option value="0">未开始</Option>
                <Option value="1">进行中</Option>
              </Select>
            </Form.Item>
            
            <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
              <Button onClick={handleCancel} style={{ marginRight: '8px' }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default FlashSale;