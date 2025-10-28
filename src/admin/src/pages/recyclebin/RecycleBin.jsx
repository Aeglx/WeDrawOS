import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, Popconfirm, message, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './RecycleBin.css';

const RecycleBin = () => {
  // 严格按照设计图的会员管理数据格式
  const mockData = [
    {
      key: '1',
      memberId: '28a9867f2b20e11077c047b6d934e434',
      nickname: '用户已注销',
      contact: 'chJ3u3t223210\n386782209b\n555sshal\n',
      registrationDate: '2025-10-13 21:41:38',
      points: 10,
    },
    {
      key: '2',
      memberId: '9f67b97110c967f034a2486b062c',
      nickname: '用户已注销',
      contact: 'S5m89p959173\n514f0d61b927\n448407e85481b\n',
      registrationDate: '2025-09-29 13:37:53',
      points: 10,
    },
    {
      key: '3',
      memberId: '855da655c952907470179312905e605',
      nickname: '用户已注销',
      contact: 'd4df788500618\n4527d11529989\n',
      registrationDate: '2025-09-25 17:53:38',
      points: 10,
    },
    {
      key: '4',
      memberId: '3db334a382f78e210c8a9a47937f15',
      nickname: '用户已注销',
      contact: 'e61e319524829\n05d30400c0c44\n4a2c868f2ecc9\n',
      registrationDate: '2025-08-11 19:36:58',
      points: 10,
    },
    {
      key: '5',
      memberId: 'b0d3734d9823ea81e4910ca1271d0c',
      nickname: '用户已注销',
      contact: '59a81c825990f\n599e\n',
      registrationDate: '2025-08-07 16:41:41',
      points: 10,
    },
    {
      key: '6',
      memberId: '63caaa85c28f80840358aea1e22270',
      nickname: '用户已注销',
      contact: '128108600420\n831e7051757eb\n',
      registrationDate: '2025-08-07 13:15:20',
      points: 10,
    },
    {
      key: '7',
      memberId: 'e817764c888b014f6deeb3a243a38c',
      nickname: '用户已注销',
      contact: 'b06d4075c546f\n256b56a8e\n1625dd95d9647\n',
      registrationDate: '2025-07-31 21:09:15',
      points: 12,
    },
    {
      key: '8',
      memberId: '240699e3651cb8d20799b9478f6ec',
      nickname: '用户已注销',
      contact: '721704b04c63d\n337786443870\n',
      registrationDate: '2025-07-12 15:38:39',
      points: 10,
    },
    {
      key: '9',
      memberId: 'd6757c44358809768503d0b1f1ee7',
      nickname: '用户已注销',
      contact: '059b7d6c657\n165f0fbc0a\n',
      registrationDate: '2025-06-21 10:29:00',
      points: 10,
    },
  ];

  const [data, setData] = useState(mockData);
  const [filteredData, setFilteredData] = useState(mockData);
  const [searchName, setSearchName] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // 搜索过滤功能
  useEffect(() => {
    let result = [...data];
    
    // 按会员名称搜索
    if (searchName) {
      result = result.filter(item => 
        item.memberId.toLowerCase().includes(searchName.toLowerCase())
      );
    }
    
    // 按联系方式搜索
    if (searchContact) {
      result = result.filter(item => 
        item.contact.toLowerCase().includes(searchContact.toLowerCase())
      );
    }
    
    setFilteredData(result);
  }, [searchName, searchContact, data]);

  // 恢复选中项
  const handleRestore = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要恢复的会员');
      return;
    }

    const newData = data.filter((item) => !selectedRowKeys.includes(item.key));
    setData(newData);
    setSelectedRowKeys([]);
    message.success(`已成功恢复 ${selectedRowKeys.length} 个会员`);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的会员');
      return;
    }

    const newData = data.filter((item) => !selectedRowKeys.includes(item.key));
    setData(newData);
    setSelectedRowKeys([]);
    message.success(`已成功删除 ${selectedRowKeys.length} 个会员`);
  };

  // 清空回收站
  const handleClearRecycleBin = () => {
    setData([]);
    setSelectedRowKeys([]);
    message.success('回收站已清空');
  };

  // 选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    type: 'checkbox',
  };
  
  // 搜索功能已在下方定义

  // 查看会员详情
  const handleView = (record) => {
    Modal.info({
      title: '会员详情',
      content: (
        <div>
          <p>会员名称: {record.memberId}</p>
          <p>昵称: {record.nickname}</p>
          <p>联系方式: {record.contact.replace(/\n/g, '<br/>')}</p>
          <p>注册时间: {record.registrationDate}</p>
          <p>积分数量: {record.points}</p>
        </div>
      ),
      okText: '确定'
    });
  };

  // 启用会员（恢复）
  const handleEnable = (record) => {
    setLoading(true);
    Modal.confirm({
      title: '确认启用',
      content: `确定要启用会员"${record.memberId}"吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setTimeout(() => {
          message.success(`已启用会员: ${record.memberId}`);
          setData(data.filter(item => item.key !== record.key));
          setLoading(false);
        }, 500);
      },
      onCancel: () => setLoading(false)
    });
  };

  // 删除会员
  const handleEdit = (record) => {
    setLoading(true);
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除会员"${record.memberId}"吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setTimeout(() => {
          message.success(`已删除会员: ${record.memberId}`);
          setData(data.filter(item => item.key !== record.key));
          setLoading(false);
        }, 500);
      },
      onCancel: () => setLoading(false)
    });
  };

  // 执行搜索
  const handleSearch = () => {
    // 搜索逻辑已在useEffect中处理
    message.info(`搜索条件: 名称=${searchName}, 联系方式=${searchContact}`);
  };

  // 表格列定义 - 严格按照设计图
  const columns = [
    {
      title: '会员名称',
      dataIndex: 'memberId',
      key: 'memberId',
      width: 200,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120,
      render: (text) => (
        <span style={{ color: '#999', fontSize: '14px' }}>{text}</span>
      ),
    },
    {
      title: '联系方式',
      dataIndex: 'contact',
      key: 'contact',
      width: 180,
      render: (text) => (
        <div style={{ whiteSpace: 'pre-line' }}>{text}</div>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      width: 160,
    },
    {
      title: '积分数量',
      dataIndex: 'points',
      key: 'points',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <>
          <Button
            type="primary"
            size="small"
            style={{ backgroundColor: '#ff7a45', borderColor: '#ff7a45', marginRight: '4px' }}
            onClick={() => handleView(record)}
            loading={loading}
          >
            查看
          </Button>
          <Button
            type="primary"
            size="small"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', marginRight: '4px' }}
            onClick={() => handleEnable(record)}
            loading={loading}
          >
            启用
          </Button>
          <Button
            type="primary"
            size="small"
            style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
            onClick={() => handleEdit(record)}
            loading={loading}
          >
            删除
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="recycle-bin-container">
      {/* 搜索栏 - 按照统一样式优化 */}
      <div className="search-area" style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>会员名称</span>
            <Input
              placeholder="请输入会员名称"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{ width: 180, height: 32 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>联系方式</span>
            <Input
              placeholder="请输入会员联系方式"
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              style={{ width: 180, height: 32 }}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              style={{ 
                width: 80, 
                height: 32, 
                backgroundColor: '#ff0000', 
                borderColor: '#ff0000',
                color: 'white',
                fontWeight: '500',
                fontSize: '14px',
                padding: '0 16px',
                textShadow: 'none'
              }}
              onClick={handleSearch}
            >
              搜索
            </Button>
          </Col>
        </Row>
      </div>

      {/* 工具栏按钮 - 严格按照设计图 */}
      <div style={{ marginTop: '16px', marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <Button
          type="primary"
          onClick={handleRestore}
          disabled={selectedRowKeys.length === 0}
        >
          恢复选中
        </Button>
        <Button
          type="primary"
          danger
          onClick={handleBatchDelete}
          disabled={selectedRowKeys.length === 0}
        >
          批量删除
        </Button>
        <Popconfirm
          title="确认清空回收站?"
          onConfirm={handleClearRecycleBin}
          okText="确认"
          cancelText="取消"
          disabled={data.length === 0}
        >
          <Button danger disabled={data.length === 0}>
            清空回收站
          </Button>
        </Popconfirm>
      </div>

      {/* 表格 */}
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={filteredData}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        rowKey="key"
        scroll={{ x: 1300 }}
        loading={loading}
        rowClassName={(record, index) => index % 2 === 0 ? 'even-row' : 'odd-row'}
      />
    </div>
  );
};

export default RecycleBin;