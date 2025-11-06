import React, { useState } from 'react';
import { Card, Input, Select, Button, Table, Modal, Row, Col, Empty } from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import './DistributionWithdraw.css';

const { Option } = Select;

const DistributionWithdraw = () => {
  // 搜索参数状态
  const [searchParams, setSearchParams] = useState({
    memberName: '',
    withdrawNo: '',
    status: ''
  });

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 详情模态框状态
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [currentWithdraw, setCurrentWithdraw] = useState(null);

  // 模拟提现数据
  const withdrawList = [
    {
      key: '1',
      withdrawNo: 'D1933785973698508736',
      memberName: '微信用户',
      applyAmount: '¥5.00',
      applyTime: '2025-06-14 15:32:08',
      realName: '颜先生',
      idCard: '430382199512053025',
      bankName: '李老师',
      bankAccount: '6227001215970172744',
      bankBranch: '建设银行',
      processTime: '2025-06-15 21:33:15',
      status: '审核拒绝'
    },
    {
      key: '2',
      withdrawNo: 'D1910341225398015104',
      memberName: '微信用户',
      applyAmount: '¥100.00',
      applyTime: '2025-04-10 22:36:55',
      realName: '测试',
      idCard: '420624189709190982',
      bankName: '测试',
      bankAccount: '62286901120090865',
      bankBranch: '招商银行',
      processTime: '2025-04-10 22:44:40',
      status: '通过'
    },
    {
      key: '3',
      withdrawNo: 'D1909894058321029600',
      memberName: '微信用户',
      applyAmount: '¥1.00',
      applyTime: '2025-04-09 22:59:26',
      realName: 'zhang',
      idCard: '4112241199801027032',
      bankName: '张三',
      bankAccount: '62286908796690863',
      bankBranch: '农业银行',
      processTime: '2025-04-10 13:42:50',
      status: '通过'
    },
    {
      key: '4',
      withdrawNo: 'D1909415824419614160',
      memberName: '微信用户',
      applyAmount: '¥1.00',
      applyTime: '2025-04-08 09:19:42',
      realName: 'zhang',
      idCard: '412221199801027034',
      bankName: '张三',
      bankAccount: '62286908796690863',
      bankBranch: '农业银行',
      processTime: '2025-04-08 09:19:56',
      status: '通过'
    },
    {
      key: '5',
      withdrawNo: 'D1897219889016155392',
      memberName: '分销测试',
      applyAmount: '¥1.00',
      applyTime: '2025-03-05 17:33:49',
      realName: '分销测试',
      idCard: '2201719981508081141',
      bankName: '测试',
      bankAccount: '64872195',
      bankBranch: '中国银行',
      processTime: '2025-03-05 17:34:56',
      status: '通过'
    },
    {
      key: '6',
      withdrawNo: 'D1857310968527235840',
      memberName: '666',
      applyAmount: '¥650.00',
      applyTime: '2024-11-15 14:33:36',
      realName: 'zzw',
      idCard: '123456789123456789',
      bankName: '1',
      bankAccount: '1',
      bankBranch: '1',
      processTime: '2024-11-15 14:34:07',
      status: '通过'
    },
    {
      key: '7',
      withdrawNo: 'D185325385077447680',
      memberName: '13011111111',
      applyAmount: '¥834.00',
      applyTime: '2024-11-01 20:24:28',
      realName: '张三',
      idCard: '131082199208021512',
      bankName: '1',
      bankAccount: '1',
      bankBranch: '1',
      processTime: '2024-11-05 17:57:41',
      status: '审核拒绝'
    },
    {
      key: '8',
      withdrawNo: 'D1849368771489222656',
      memberName: '13011111111',
      applyAmount: '¥2.00',
      applyTime: '2024-10-24 16:34:09',
      realName: '张三',
      idCard: '131082199208021512',
      bankName: '1',
      bankAccount: '1',
      bankBranch: '1',
      processTime: '2024-10-24 18:16:21',
      status: '通过'
    },
    {
      key: '9',
      withdrawNo: 'D1849270981018883886',
      memberName: '13011111111',
      applyAmount: '¥1.00',
      applyTime: '2024-10-24 10:05:34',
      realName: '张三',
      idCard: '131082199208021512',
      bankName: '1',
      bankAccount: '1',
      bankBranch: '1',
      processTime: '2024-10-24 13:43:29',
      status: '审核拒绝'
    },
    {
      key: '10',
      withdrawNo: 'D1848664300954083328',
      memberName: '13011111111',
      applyAmount: '¥2.00',
      applyTime: '2024-10-22 17:54:50',
      realName: '张三',
      idCard: '131082199208021512',
      bankName: '1',
      bankAccount: '1',
      bankBranch: '1',
      processTime: '2024-10-22 17:55:02',
      status: '通过'
    }
  ];

  // 处理搜索
  const handleSearch = () => {
    // 实际项目中这里应该调用API进行搜索
    console.log('搜索参数:', searchParams);
    setCurrentPage(1); // 重置到第一页
  };

  // 处理重置
  const handleReset = () => {
    setSearchParams({
      memberName: '',
      withdrawNo: '',
      status: ''
    });
    setCurrentPage(1);
  };

  // 处理查看详情
  const handleView = (record) => {
    setCurrentWithdraw(record);
    setIsViewModalVisible(true);
  };

  // 处理分页变化
  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  // 过滤数据
  const filteredWithdraws = withdrawList.filter(item => {
    if (searchParams.memberName && !item.memberName.includes(searchParams.memberName)) {
      return false;
    }
    if (searchParams.withdrawNo && !item.withdrawNo.includes(searchParams.withdrawNo)) {
      return false;
    }
    if (searchParams.status && item.status !== searchParams.status) {
      return false;
    }
    return true;
  });

  // 计算分页数据
  const paginatedWithdraws = filteredWithdraws.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 表格列配置
  const columns = [
    {
      title: '编号',
      dataIndex: 'withdrawNo',
      key: 'withdrawNo',
      width: 200,
      ellipsis: true
    },
    {
      title: '会员名称',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 120
    },
    {
      title: '申请金额',
      dataIndex: 'applyAmount',
      key: 'applyAmount',
      width: 100,
      render: (amount) => <span style={{ color: '#ff0000' }}>{amount}</span>
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 150
    },
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 100
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 180,
      ellipsis: true
    },
    {
      title: '结算银行开户名称',
      dataIndex: 'bankName',
      key: 'bankName',
      width: 120,
      ellipsis: true
    },
    {
      title: '结算银行开户账号',
      dataIndex: 'bankAccount',
      key: 'bankAccount',
      width: 150,
      ellipsis: true
    },
    {
      title: '结算银行开户支行名称',
      dataIndex: 'bankBranch',
      key: 'bankBranch',
      width: 120,
      ellipsis: true
    },
    {
      title: '处理时间',
      dataIndex: 'processTime',
      key: 'processTime',
      width: 150
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <span className={status === '审核拒绝' ? 'status-rejected' : 'status-approved'}>
          {status}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
          style={{ color: '#ff0000' }}
        >
          查看
        </Button>
      )
    }
  ];

  return (
    <div className="distribution-withdraw-container">
      <Card className="distribution-withdraw-card">
        {/* 搜索区域 - 平台商品页面风格 */}
        <div className="search-area">
          <Row gutter={16} align="middle">
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>会员名称</span>
              <Input
                placeholder="请输入会员名称"
                value={searchParams.memberName}
                onChange={(e) => setSearchParams({ ...searchParams, memberName: e.target.value })}
                onPressEnter={handleSearch}
                style={{ width: 180, height: 32 }}
              />
            </Col>
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>编号</span>
              <Input
                placeholder="请输入编号"
                value={searchParams.withdrawNo}
                onChange={(e) => setSearchParams({ ...searchParams, withdrawNo: e.target.value })}
                onPressEnter={handleSearch}
                style={{ width: 180, height: 32 }}
              />
            </Col>
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>状态</span>
              <Select
                placeholder="请选择"
                value={searchParams.status}
                onChange={(value) => setSearchParams({ ...searchParams, status: value })}
                style={{ width: 180, height: 32 }}
                allowClear
              >
                <Option value="通过">通过</Option>
                <Option value="审核拒绝">审核拒绝</Option>
              </Select>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                style={{ backgroundColor: '#ff0000', borderColor: '#ff0000', height: 32 }}
              >
                搜索
              </Button>
              <Button
                onClick={handleReset}
                style={{ marginLeft: 8, height: 32 }}
              >
                重置
              </Button>
            </Col>
          </Row>
        </div>

        {/* 表格区域 */}
        <div className="table-container">
          <Table
            columns={columns}
            dataSource={paginatedWithdraws}
            rowKey="key"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredWithdraws.length,
              onChange: handlePageChange,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `共 ${total} 条`
            }}
            className="distribution-withdraw-table"
            locale={{
              emptyText: (
                <Empty
                  description="暂无提现记录"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )
            }}
          />
        </div>
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="提现详情"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {currentWithdraw && (
          <div className="withdraw-detail">
            <div className="detail-section">
              <h3>提现基本信息</h3>
              <div className="detail-item">
                <span className="detail-label">提现编号：</span>
                <span>{currentWithdraw.withdrawNo}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">会员名称：</span>
                <span>{currentWithdraw.memberName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">申请金额：</span>
                <span style={{ color: '#ff0000', fontWeight: 'bold' }}>{currentWithdraw.applyAmount}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">申请时间：</span>
                <span>{currentWithdraw.applyTime}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">处理时间：</span>
                <span>{currentWithdraw.processTime}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">状态：</span>
                <span className={currentWithdraw.status === '审核拒绝' ? 'status-rejected' : 'status-approved'}>
                  {currentWithdraw.status}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h3>提现人信息</h3>
              <div className="detail-item">
                <span className="detail-label">姓名：</span>
                <span>{currentWithdraw.realName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">身份证号：</span>
                <span>{currentWithdraw.idCard}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>银行信息</h3>
              <div className="detail-item">
                <span className="detail-label">开户名称：</span>
                <span>{currentWithdraw.bankName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">银行账号：</span>
                <span>{currentWithdraw.bankAccount}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">开户支行：</span>
                <span>{currentWithdraw.bankBranch}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DistributionWithdraw;