import React, { useState } from 'react';
import { Table, Input, Select, Button, Space, Tag, Modal, Form, DatePicker, Radio, Card, Row, Col, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './CouponActivity.css';
import './CouponActivityForm.css';

const { Search } = Input;
const { Option } = Select;

// 模拟活动数据
const mockActivityData = [
  {
    key: '1',
    name: 'zidongf',
    type: '自动发券',
    scope: '全部会员',
    frequency: '每日',
    startTime: '2025-10-21 00:00:00',
    endTime: '2025-10-22 00:00:00',
    status: '已结束',
  },
  {
    key: '2',
    name: 'zidong',
    type: '自动发券',
    scope: '全部会员',
    frequency: '每日',
    startTime: '2025-10-21 00:00:00',
    endTime: '2025-10-22 00:00:00',
    status: '已结束',
  },
  {
    key: '3',
    name: 'ces',
    type: '精确发券',
    scope: '全部会员',
    frequency: '/',
    startTime: '2025-10-21 00:00:00',
    endTime: '2025-10-22 00:00:00',
    status: '已结束',
  },
  {
    key: '4',
    name: '1223',
    type: '精确发券',
    scope: '指定会员',
    frequency: '/',
    startTime: '2025-10-16 00:00:00',
    endTime: '',
    status: '已开始',
  },
  {
    key: '5',
    name: '粥任务',
    type: '自动发券',
    scope: '全部会员',
    frequency: '每日',
    startTime: '2025-10-31 00:00:00',
    endTime: '',
    status: '已关闭',
  },
  {
    key: '6',
    name: '精准发卷',
    type: '精确发券',
    scope: '指定会员',
    frequency: '/',
    startTime: '2025-10-24 00:00:00',
    endTime: '',
    status: '已结束',
  },
  {
    key: '7',
    name: '123123',
    type: '注册赠券',
    scope: '全部会员',
    frequency: '/',
    startTime: '2025-10-10 00:00:00',
    endTime: '2025-11-01 00:00:00',
    status: '已开始',
  },
  {
    key: '8',
    name: '测试活动cw',
    type: '精确发券',
    scope: '全部会员',
    frequency: '/',
    startTime: '2025-09-30 00:00:00',
    endTime: '',
    status: '已结束',
  },
  {
    key: '9',
    name: 'ceaaaaa',
    type: '注册赠券',
    scope: '全部会员',
    frequency: '/',
    startTime: '2025-10-23 00:00:00',
    endTime: '',
    status: '已关闭',
  },
  {
    key: '10',
    name: '新人发券',
    type: '注册赠券',
    scope: '全部会员',
    frequency: '/',
    startTime: '1970-01-01 08:00:00',
    endTime: '1970-01-01 08:00:00',
    status: '已结束',
  },
];

// 状态标签配置
const statusConfig = {
  '已结束': {
    color: 'red',
    text: '已结束'
  },
  '已开始': {
    color: 'green',
    text: '已开始'
  },
  '已关闭': {
    color: 'red',
    text: '已关闭'
  }
};

const CouponActivity = () => {
  const [searchParams, setSearchParams] = useState({
    name: '',
    type: '',
    scope: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalItems = 675; // 总数据条数
  
  // 添加活动模态框状态
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  // 选择优惠券弹窗状态
  const [isCouponSelectModalVisible, setIsCouponSelectModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 处理搜索参数变化
  const handleSearchChange = (param, value) => {
    setSearchParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // 处理搜索提交
  const handleSearch = () => {
    // 这里可以实现实际的搜索逻辑
    console.log('搜索参数:', searchParams);
  };

  // 处理添加活动
  const handleAddActivity = () => {
    // 重置表单并打开模态框
    form.resetFields();
    setIsAddModalVisible(true);
  };

  // 处理添加活动表单提交
  const handleAddSubmit = () => {
    form.validateFields()
      .then(values => {
        console.log('添加活动表单数据:', values);
        setIsAddModalVisible(false);
      })
      .catch(info => {
        console.log('表单验证失败:', info);
      });
  };
  
  // 处理打开选择优惠券弹窗
  const handleOpenCouponSelect = () => {
    setIsCouponSelectModalVisible(true);
  };
  
  // 处理优惠券选择确认
  const handleCouponSelectConfirm = () => {
    // 这里可以实现选择优惠券的逻辑
    console.log('选择优惠券确认');
    setIsCouponSelectModalVisible(false);
  };
  
  // 处理优惠券选择取消
  const handleCouponSelectCancel = () => {
    setIsCouponSelectModalVisible(false);
  };

  // 处理添加活动模态框取消
  const handleAddCancel = () => {
    setIsAddModalVisible(false);
  };

  // 处理查看操作
  const handleView = (record) => {
    console.log('查看活动:', record);
  };

  // 处理关闭操作
  const handleClose = (record) => {
    console.log('关闭活动:', record);
  };

  // 表格列配置
  const columns = [
    {
      title: '活动名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '活动类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '活动范围',
      dataIndex: 'scope',
      key: 'scope',
      width: 120,
    },
    {
      title: '领取频率',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 80,
    },
    {
      title: '活动时间',
      key: 'time',
      width: 200,
      render: (_, record) => (
        <div>
          {record.startTime && !record.endTime ? `${record.startTime}` : 
           record.startTime && record.endTime ? `${record.startTime}\n${record.endTime}` : ''}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        const config = statusConfig[status] || { color: 'default', text: status };
        return (
          <Tag color={config.color}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" className="view-btn" onClick={() => handleView(record)}>查看</Button>
          {record.status === '已开始' && (
            <Button type="link" className="close-btn" onClick={() => handleClose(record)}>关闭</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="coupon-activity-container">
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
              <Option value="自动发券">自动发券</Option>
              <Option value="精确发券">精确发券</Option>
              <Option value="注册赠券">注册赠券</Option>
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
              <Option value="全部会员">全部会员</Option>
              <Option value="指定会员">指定会员</Option>
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
          dataSource={mockActivityData}
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
        />
      </div>

      {/* 添加活动模态框 */}
      <Modal
        title="添加优惠券活动"
        open={isAddModalVisible}
        onOk={handleAddSubmit}
        onCancel={handleAddCancel}
        width={1000}
        okText="提交"
        cancelText="返回"
      >
        <div className="coupon-activity-form">
          <Card title="活动信息">
            <Form form={form} layout="horizontal">
              <Form.Item
                name="activityName"
                label="活动名称"
                rules={[{ required: true, message: '请填写活动名称' }]}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <Input placeholder="请填写活动名称" />
              </Form.Item>
              
              <Form.Item
                name="activityTime"
                label="活动时间"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <DatePicker.RangePicker placeholder="请选择活动时间" />
              </Form.Item>
              
              <Form.Item
                name="activityType"
                label="优惠券活动类型"
                initialValue="新人发券"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <Radio.Group>
                  <Radio.Button value="新人发券">新人发券</Radio.Button>
                  <Radio.Button value="精确发券">精确发券</Radio.Button>
                  <Radio.Button value="注册赠券">注册赠券</Radio.Button>
                  <Radio.Button value="自动赠券">自动赠券</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Form>
          </Card>
          
          <Card title="配置优惠券" style={{ marginTop: 20 }}>
            <Form form={form} layout="horizontal">
              <Form.Item
                name="couponId"
                label="选择优惠券"
                labelCol={{ span: 7 }}
                wrapperCol={{ span: 17 }}
                style={{ fontSize: '12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                  <Button type="primary" onClick={handleOpenCouponSelect} style={{ height: 32, fontSize: '12px' }}>选择优惠券</Button>
                </div>
              </Form.Item>
            </Form>
            
            <Table
              columns={[
                { title: '赠送位置', dataIndex: 'position', key: 'position' },
                { title: '优惠券名称', dataIndex: 'name', key: 'name' },
                { title: '品类描述', dataIndex: 'category', key: 'category' },
                { title: '面额折扣', dataIndex: 'discount', key: 'discount' },
                { title: '赠送数量', dataIndex: 'quantity', key: 'quantity' },
                { title: '操作', dataIndex: 'action', key: 'action' },
              ]}
              dataSource={[]}
              locale={{ emptyText: '暂无数据' }}
            />
          </Card>
        </div>
      </Modal>
      
      {/* 选择优惠券弹窗 */}
      <Modal
        title="选择优惠券"
        open={isCouponSelectModalVisible}
        onOk={handleCouponSelectConfirm}
        onCancel={handleCouponSelectCancel}
        width={1000}
        okText="确定"
        cancelText="取消"
      >
        <div className="coupon-select-container">
          <Card className="search-card">
            <Row gutter={16} align="middle" style={{ flexWrap: 'nowrap' }}>
              <Col span={6}>
                <div className="search-item" style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                  <span className="search-label" style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>优惠券名称</span>
                  <Input 
                    placeholder="请输入优惠券名称" 
                    style={{ flex: 1, fontSize: '12px' }}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div className="search-item" style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                  <span className="search-label" style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>获取方式</span>
                  <Select 
                    placeholder="活动获取" 
                    style={{ flex: 1, fontSize: '12px' }}
                  >
                    <Option value="活动获取">活动获取</Option>
                    <Option value="免费获取">免费获取</Option>
                    <Option value="付费获取">付费获取</Option>
                  </Select>
                </div>
              </Col>
              <Col span={6}>
                <div className="search-item" style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                  <span className="search-label" style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>活动状态</span>
                  <Select 
                    placeholder="已开始/上架" 
                    style={{ flex: 1, fontSize: '12px' }}
                  >
                    <Option value="进行中">进行中</Option>
                    <Option value="已关闭">已关闭</Option>
                    <Option value="已结束">已结束</Option>
                    <Option value="未开始">未开始</Option>
                  </Select>
                </div>
              </Col>
              <Col span={6}>
                <div className="search-item" style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                  <span className="search-label" style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>活动时间</span>
                  <DatePicker 
                    style={{ flex: 1, fontSize: '12px' }}
                    placeholder="选择起始时间"
                  />
                </div>
              </Col>
              <Col span={6} offset={18} style={{ textAlign: 'right' }}>
                <Button type="primary" icon={<SearchOutlined />} style={{ fontSize: '12px' }}>
                  搜索
                </Button>
              </Col>
            </Row>
          </Card>
          
          <Table 
            columns={[
              {
                title: '',
                dataIndex: '',
                key: 'selection',
                width: 40,
                render: (_, record) => (
                  <Checkbox />
                ),
              },
              { title: '优惠券名称', dataIndex: 'couponName', key: 'couponName' },
              { title: '面额折扣', dataIndex: 'faceValue', key: 'faceValue' },
              { title: '已领取数量/总数量', dataIndex: 'claimedQuantity', key: 'claimedQuantity' },
              { title: '已使用/已领取数量', dataIndex: 'usedQuantity', key: 'usedQuantity' },
              { title: '获取方式', dataIndex: 'acquisitionMethod', key: 'acquisitionMethod' },
              { title: '优惠券类型', dataIndex: 'couponType', key: 'couponType' },
              { title: '品类描述', dataIndex: 'categoryRange', key: 'categoryRange' },
              { title: '活动时间', dataIndex: 'activityTime', key: 'activityTime' },
            ]} 
            dataSource={[]} 
            pagination={{
              current: 1,
              pageSize: 10,
              total: 0,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            locale={{ emptyText: '暂无数据' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default CouponActivity;