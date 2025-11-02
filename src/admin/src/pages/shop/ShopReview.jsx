import React, { useState } from 'react';
import { Table, Button, Input, Select, DatePicker, Space, Tag, Modal, Form, message } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import './ShopReview.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

// 店铺审核页面组件
const ShopReview = () => {
  // 状态管理
  const [memberName, setMemberName] = useState('');
  const [shopName, setShopName] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [createTime, setCreateTime] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total] = useState(1119);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentShop, setCurrentShop] = useState(null);
  const [reviewModalForm] = Form.useForm();

  // 模拟店铺数据
  const [shops] = useState([
    {
      id: '1',
      shopName: 'bhw 测试店铺',
      memberName: 'okE4i3G1WZ1i+bsC1DH4OJA+b4',
      shopAddress: '安徽省合肥市肥西县',
      reviewStatus: '待审核',
      createTime: '2025-10-18 15:57:30'
    },
    {
      id: '2',
      shopName: '西西',
      memberName: '长相',
      shopAddress: '上海市上海城区崇明区绿华镇',
      reviewStatus: '待审核',
      createTime: '2025-10-19 17:21:19'
    },
    {
      id: '3',
      shopName: '测试',
      memberName: '吃烧烤',
      shopAddress: '内蒙古自治区',
      reviewStatus: '审核失败',
      createTime: '2025-10-18 17:48:36'
    },
    {
      id: '4',
      shopName: '壹铭心意',
      memberName: '姚润昊',
      shopAddress: '广东省佛山市三水区',
      reviewStatus: '待审核',
      createTime: '2025-10-12 15:55:40'
    },
    {
      id: '5',
      shopName: '刺猬阅读器材',
      memberName: '5b59bd24ba33cbc69b959e45ca52be99',
      shopAddress: '福建省厦门市翔安区马巷镇',
      reviewStatus: '待审核',
      createTime: '2025-09-27 14:31:37'
    },
    {
      id: '6',
      shopName: '朴树店',
      memberName: 'm18638752597',
      shopAddress: '河南省郑州市上街区中心路街道',
      reviewStatus: '待审核',
      createTime: '2025-09-27 13:18:33'
    },
    {
      id: '7',
      shopName: '123',
      memberName: 'cbe9e078e484e8d761bf40062e91c322',
      shopAddress: '北京市北京城区平谷区马坊镇',
      reviewStatus: '待审核',
      createTime: '2025-09-24 21:34:21'
    },
    {
      id: '8',
      shopName: '1111',
      memberName: '1881468186',
      shopAddress: '辽宁省大连市庄河市城山镇',
      reviewStatus: '待审核',
      createTime: '2025-09-23 20:00:26'
    },
    {
      id: '9',
      shopName: '1',
      memberName: '15268519112',
      shopAddress: '辽宁省大连市庄河市城山镇',
      reviewStatus: '待审核',
      createTime: '2025-09-23 16:55:30'
    },
    {
      id: '10',
      shopName: '吴大药房',
      memberName: 'okE4iw7ulKUTD1aLhUe7xJvJ5O',
      shopAddress: '广东省汕头市潮阳区和平镇',
      reviewStatus: '待审核',
      createTime: '2025-09-20 10:30:09'
    }
  ]);

  // 处理搜索
  const handleSearch = () => {
    // 实际项目中这里应该调用API进行搜索
    console.log('搜索条件:', {
      memberName,
      shopName,
      reviewStatus,
      createTime: createTime.map(time => time ? time.format('YYYY-MM-DD') : null)
    });
  };

  // 处理重置
  const handleReset = () => {
    setMemberName('');
    setShopName('');
    setReviewStatus('');
    setCreateTime([]);
    setCurrentPage(1);
  };

  // 处理分页变化
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 实际项目中这里应该根据页码加载对应的数据
    console.log('切换到页码:', page);
  };

  // 处理查看审核信息
  const handleViewReview = (record) => {
    setCurrentShop(record);
    setIsModalVisible(true);
  };

  // 处理审核通过
  const handleApprove = (record) => {
    Modal.confirm({
      title: '确认审核通过',
      content: `确定要审核通过店铺「${record.shopName}」吗？`,
      onOk() {
        message.success('审核通过成功');
        // 实际项目中这里应该调用API进行审核通过操作
      }
    });
  };

  // 处理审核拒绝
  const handleReject = (record) => {
    Modal.confirm({
      title: '确认审核拒绝',
      content: `确定要拒绝店铺「${record.shopName}」的申请吗？`,
      onOk() {
        message.success('审核拒绝成功');
        // 实际项目中这里应该调用API进行审核拒绝操作
      }
    });
  };

  // 关闭模态框
  const handleModalClose = () => {
    setIsModalVisible(false);
    reviewModalForm.resetFields();
  };

  // 提交审核意见
  const handleSubmitReview = () => {
    reviewModalForm.validateFields().then(values => {
      console.log('审核意见:', values);
      message.success('提交审核意见成功');
      handleModalClose();
    });
  };

  // 渲染审核状态标签
  const renderStatusTag = (status) => {
    if (status === '待审核') {
      return (
        <Tag color="blue" className="status-tag-blue">
          {status}
        </Tag>
      );
    } else if (status === '审核通过') {
      return (
        <Tag color="green" className="status-tag-green">
          {status}
        </Tag>
      );
    } else if (status === '审核失败') {
      return (
        <Tag color="red" className="status-tag-red">
          {status}
        </Tag>
      );
    }
    return (
      <Tag color="default">
        {status}
      </Tag>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '店铺名称',
      dataIndex: 'shopName',
      key: 'shopName',
      ellipsis: true,
      width: 150
    },
    {
      title: '会员名称',
      dataIndex: 'memberName',
      key: 'memberName',
      ellipsis: true,
      width: 200
    },
    {
      title: '店铺地址',
      dataIndex: 'shopAddress',
      key: 'shopAddress',
      ellipsis: true,
      width: 180
    },
    {
      title: '审核状态',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      width: 100,
      render: (text) => renderStatusTag(text)
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <a href="#" className="view-btn" onClick={() => handleViewReview(record)}>查看</a>
          <a href="#" className="approve-btn" onClick={() => handleApprove(record)}>通过</a>
          <a href="#" className="reject-btn" onClick={() => handleReject(record)}>拒绝</a>
        </Space>
      )
    }
  ];

  return (
    <div className="shop-review">
      {/* 搜索区域 */}
      <div className="search-area">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>会员名称</span>
            <Input
              placeholder="请输入会员名称"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>店铺名称</span>
            <Input
              placeholder="请输入店铺名称"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>审核状态</span>
            <Select
              placeholder="请选择审核状态"
              value={reviewStatus}
              onChange={(value) => setReviewStatus(value)}
              allowClear
              style={{ width: 180, fontSize: '12px', height: 32 }}
            >
              <Option value="待审核">待审核</Option>
              <Option value="审核通过">审核通过</Option>
              <Option value="审核失败">审核失败</Option>
            </Select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>创建时间</span>
            <RangePicker
              value={createTime}
              onChange={(dates) => setCreateTime(dates)}
              style={{ fontSize: '12px', height: 32 }}
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

      {/* 表格区域 */}
      <div className="shop-table">
        <Table
          columns={columns}
          dataSource={shops}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: handlePageChange,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10条', '20条', '50条', '100条']
          }}
          scroll={{ x: 1200 }}
        />
      </div>

      {/* 审核详情模态框 */}
      <Modal
        title="店铺审核信息"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="cancel" onClick={handleModalClose}>
            关闭
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmitReview}>
            提交审核意见
          </Button>
        ]}
        width={600}
      >
        {currentShop && (
          <Form form={reviewModalForm} layout="vertical">
            <Form.Item label="店铺名称" name="shopName" initialValue={currentShop.shopName}>
              <Input disabled />
            </Form.Item>
            <Form.Item label="会员名称" name="memberName" initialValue={currentShop.memberName}>
              <Input disabled />
            </Form.Item>
            <Form.Item label="店铺地址" name="shopAddress" initialValue={currentShop.shopAddress}>
              <Input disabled />
            </Form.Item>
            <Form.Item label="当前状态" name="reviewStatus" initialValue={currentShop.reviewStatus}>
              <Input disabled />
            </Form.Item>
            <Form.Item 
              label="审核意见" 
              name="reviewComment" 
              rules={[{ required: true, message: '请输入审核意见' }]}
            >
              <Input.TextArea rows={4} placeholder="请输入审核意见" />
            </Form.Item>
            <Form.Item label="审核结果" name="reviewResult">
              <Select placeholder="请选择审核结果">
                <Option value="approve">审核通过</Option>
                <Option value="reject">审核拒绝</Option>
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ShopReview;