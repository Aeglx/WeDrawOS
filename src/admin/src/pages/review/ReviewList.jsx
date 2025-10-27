import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Switch, Pagination, message, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const ReviewList = () => {
  const [searchText, setSearchText] = useState('');
  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(3561); // 总数据量

  // 模拟数据
  const mockData = [
    { key: '1', productName: '1 1', memberName: '胜华', reviewType: '好评', logisticsScore: 5, serviceScore: 5, descriptionScore: 5, reviewTime: '2025-10-25 02:05:01', show: true },
    { key: '2', productName: '精品66666666666 高级回归酒', memberName: '胜华', reviewType: '好评', logisticsScore: 5, serviceScore: 5, descriptionScore: 5, reviewTime: '2025-10-25 02:05:01', show: true },
    { key: '3', productName: 'iphone14 256G 深空灰', memberName: '用户884742', reviewType: '好评', logisticsScore: 5, serviceScore: 5, descriptionScore: 5, reviewTime: '2025-10-25 02:05:01', show: true },
    { key: '4', productName: '手机202510211 1', memberName: 'GOODS', reviewType: '好评', logisticsScore: 5, serviceScore: 5, descriptionScore: 5, reviewTime: '2025-10-23 10:22:09', show: true },
    { key: '5', productName: '1 1', memberName: 'GOODS', reviewType: '好评', logisticsScore: 5, serviceScore: 5, descriptionScore: 5, reviewTime: '2025-10-21 09:38:08', show: true },
    { key: '6', productName: '蛇给 60 普通', memberName: 'GOODS', reviewType: '好评', logisticsScore: 5, serviceScore: 5, descriptionScore: 5, reviewTime: '2025-10-21 09:37:23', show: true },
    { key: '7', productName: 'Navigator Avigraph', memberName: 'GOODS', reviewType: '好评', logisticsScore: 5, serviceScore: 5, descriptionScore: 5, reviewTime: '2025-10-21 09:37:13', show: true },
    { key: '8', productName: '20220218测试商品发布 1', memberName: 'GOODS', reviewType: '好评', logisticsScore: 5, serviceScore: 5, descriptionScore: 5, reviewTime: '2025-10-21 09:36:52', show: true },
    { key: '9', productName: 'iphone20 2.5.5', memberName: 'GOODS', reviewType: '好评', logisticsScore: 5, serviceScore: 5, descriptionScore: 5, reviewTime: '2025-10-21 09:36:19', show: true },
    { key: '10', productName: '测试 1', memberName: 'GOODS', reviewType: '好评', logisticsScore: 5, serviceScore: 5, descriptionScore: 5, reviewTime: '2025-10-21 09:35:52', show: true },
  ];

  useEffect(() => {
    // 初始化数据
    setReviews(mockData);
  }, []);

  // 处理搜索
  const handleSearch = () => {
    // 这里应该是实际的搜索逻辑
    console.log('搜索会员:', searchText);
    // 模拟搜索结果
    message.success('搜索成功');
  };

  // 处理展示状态切换
  const handleShowChange = (key, checked) => {
    setReviews(reviews.map(item => 
      item.key === key ? { ...item, show: checked } : item
    ));
    message.success(`已${checked ? '开启' : '关闭'}展示`);
  };

  // 处理查看操作
  const handleView = (record) => {
    console.log('查看评价:', record);
    message.info('查看评价详情');
  };

  // 处理删除操作
  const handleDelete = (key) => {
    setReviews(reviews.filter(item => item.key !== key));
    message.success('评价已删除');
  };

  // 分页处理
  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
    console.log('页码:', page, '每页条数:', pageSize);
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
      title: '会员名称',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 100,
    },
    {
      title: '评价',
      dataIndex: 'reviewType',
      key: 'reviewType',
      width: 80,
      render: (text) => (
        <span style={{ color: '#52c41a', backgroundColor: '#f6ffed', padding: '2px 8px', borderRadius: '4px' }}>
          {text}
        </span>
      ),
    },
    {
      title: '物流评分',
      dataIndex: 'logisticsScore',
      key: 'logisticsScore',
      width: 80,
    },
    {
      title: '服务评分',
      dataIndex: 'serviceScore',
      key: 'serviceScore',
      width: 80,
    },
    {
      title: '描述评分',
      dataIndex: 'descriptionScore',
      key: 'descriptionScore',
      width: 80,
    },
    {
      title: '评价时间',
      dataIndex: 'reviewTime',
      key: 'reviewTime',
      width: 150,
    },
    {
      title: '页面展示',
      dataIndex: 'show',
      key: 'show',
      width: 100,
      render: (text, record) => (
        <Switch
          checked={text}
          onChange={(checked) => handleShowChange(record.key, checked)}
          checkedChildren="展示"
          unCheckedChildren="隐藏"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <span>
          <Button
            type="link"
            style={{ color: '#ff7875', marginRight: '8px' }}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            style={{ color: '#ff7875' }}
            onClick={() => handleDelete(record.key)}
          >
            删除
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', background: '#fff' }}>
      {/* 搜索区域 - 按照统一样式优化 */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>会员名称</span>
            <Input
              placeholder="请输入会员名称"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 180, height: 32 }}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              style={{ 
                width: 80, 
                height: 32, 
                backgroundColor: '#ff4d4f', 
                borderColor: '#ff4d4f',
                color: '#fff'
              }}
              onClick={handleSearch}
            >
              搜索
            </Button>
          </Col>
        </Row>
      </div>

      {/* 数据表格 */}
      <Table
        columns={columns}
        dataSource={reviews}
        pagination={false}
        rowKey="key"
        style={{ marginBottom: '20px' }}
        rowClassName={(record, index) => index % 2 === 0 ? 'ant-table-row' : 'ant-table-row ant-table-row-hover'}
      />

      {/* 分页 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <span style={{ marginRight: '20px', color: '#666' }}>共{total}条</span>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={handlePageChange}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `共 ${total} 条`}
          pageSizeOptions={['10', '20', '50', '100']}
        />
      </div>
    </div>
  );
};

export default ReviewList;