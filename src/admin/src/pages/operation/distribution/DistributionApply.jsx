import React, { useState } from 'react';
import { Card, Input, Button, Table, Tag, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './DistributionApply.css';

const DistributionApply = () => {
  // 搜索条件状态
  const [memberName, setMemberName] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // 模拟数据
  const mockData = [
    {
      key: '1',
      memberName: '张三',
      realName: '张三',
      qqAccount: '123456789',
      openId: 'oW4m7555555555555555555555555555',
      unionId: 'oW4m7555555555555555555555555555',
      submitTime: '2023-05-15 10:30:00',
    },
    {
      key: '2',
      memberName: '李四',
      realName: '李四',
      qqAccount: '987654321',
      openId: 'oW4m7666666666666666666666666666',
      unionId: 'oW4m7666666666666666666666666666',
      submitTime: '2023-05-16 14:20:00',
    },
    {
      key: '3',
      memberName: '王五',
      realName: '王五',
      qqAccount: '1122334455',
      openId: 'oW4m7777777777777777777777777777',
      unionId: 'oW4m7777777777777777777777777777',
      submitTime: '2023-05-17 09:45:00',
    },
  ];
  
  // 设置总条数
  React.useEffect(() => {
    setTotalCount(mockData.length);
  }, []);
  
  // 处理搜索
  const handleSearch = () => {
    // 实际项目中这里应该调用API进行搜索
    console.log('搜索条件:', { memberName });
    // 模拟搜索成功提示
    message.success('搜索成功');
  };
  
  // 处理重置
  const handleReset = () => {
    setMemberName('');
    setCurrentPage(1);
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
      title: '会员名称',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 100,
    },
    {
      title: '腾讯账号',
      dataIndex: 'qqAccount',
      key: 'qqAccount',
      width: 120,
    },
    {
      title: '微信账号（openId）',
      dataIndex: 'openId',
      key: 'openId',
      width: 200,
      ellipsis: true,
      tooltips: true,
    },
    {
      title: '微信账号（unionId）',
      dataIndex: 'unionId',
      key: 'unionId',
      width: 200,
      ellipsis: true,
      tooltips: true,
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" onClick={() => handleView(record)}>
          查看
        </Button>
      ),
    },
  ];
  
  // 查看详情
  const handleView = (record) => {
    console.log('查看详情:', record);
    // 实际项目中这里应该跳转到详情页或弹出详情模态框
    message.info(`查看${record.memberName}的申请详情`);
  };
  
  return (
    <div className="distribution-apply-container">
      <Card className="distribution-apply-card">
        {/* 搜索区域 - 按照平台商品页面样式 */}
        <div className="search-area">
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', whiteSpace: 'nowrap' }}>会员名称：</span>
              <Input
                type="text"
                placeholder="请输入会员名称"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 180, fontSize: '12px', height: 32 }}
                allowClear
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
            <Button 
              onClick={handleReset}
              style={{ height: 32, fontSize: '12px' }}
            >
              重置
            </Button>
          </div>
        </div>
        
        {/* 表格区域 */}
        <div className="table-container">
          <Table
            columns={columns}
            dataSource={mockData}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalCount,
              onChange: handlePageChange,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            rowKey="key"
            className="apply-table"
          />
        </div>
      </Card>
    </div>
  );
};

export default DistributionApply;