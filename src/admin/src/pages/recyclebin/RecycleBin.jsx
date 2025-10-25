import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, Popconfirm, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import './RecycleBin.css';

const RecycleBin = () => {
  // 根据设计图创建的会员数据
  const mockData = [
    {
      id: '1',
      name: '29a86672db2fa010****74074c676034f',
      nickname: '用户已注销',
      contact: 'c51a8c333d2310\n36678cc72d903b\n585bnull',
      registerTime: '2025-10-13 21:04:38',
      points: 10
    },
    {
      id: '2',
      name: '9f67d7f10cc977e83ce2f44860b2c',
      nickname: '用户已注销',
      contact: '51b96b0916737\n4a4f468b58475\n9397e8ll',
      registerTime: '2025-09-29 13:37:53',
      points: 10
    },
    {
      id: '3',
      name: '85d0daa6ce952979047c09128f6de5e5',
      nickname: '用户已注销',
      contact: '0a4f67e8850681b\nddf778e5e6f143\n4c821***592689',
      registerTime: '2025-09-25 17:53:38',
      points: 10
    },
    {
      id: '4',
      name: '3df558433827e1f3ca18aa97a195715',
      nickname: '用户已注销',
      contact: 'e163f1b194d04b\nd5a3da11344064\n5d2266dll',
      registerTime: '2025-08-11 19:36:58',
      points: 10
    },
    {
      id: '5',
      name: 'b03c73d4c308936e3e8140911ca217dc',
      nickname: '用户已注销',
      contact: 'ad28fa6217bccf9\n589cf8a829dc0\nnull\n1bb811060a712e',
      registerTime: '2025-08-07 16:41:41',
      points: 10
    },
    {
      id: '6',
      name: '63caaaf452c7680af403f5a6a4ee12370',
      nickname: '用户已注销',
      contact: '1bb811060a712e\n4214d3c7d4f405\ne707dnul',
      registerTime: '2025-08-07 13:15:20',
      points: 10
    },
    {
      id: '7',
      name: 'e617f764c8b870d146bdeaba234a3dce',
      nickname: '用户已注销',
      contact: '863d1075767eb5\n96104357c6467\n25fe3nul',
      registerTime: '2025-07-31 21:09:15',
      points: 12
    },
    {
      id: '8',
      name: '24ddd99dc8531cb82207997b9a7f6ec',
      nickname: '用户已注销',
      contact: '182d9d9fd49f67\n725170a46e46d\nd34nul',
      registerTime: '2025-07-12 15:38:39',
      points: 10
    },
    {
      id: '9',
      name: 'dc5794c435983a95f7683bd61b19ee7',
      nickname: '用户已注销',
      contact: '3778f0a46c370\nd99e88e2b5e7d\n1e576nul',
      registerTime: '2025-06-21 10:59:00',
      points: 10
    }
  ];

  const [data, setData] = useState(mockData);
  const [filteredData, setFilteredData] = useState(mockData);
  const [searchName, setSearchName] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [loading, setLoading] = useState(false);

  // 搜索过滤功能
  useEffect(() => {
    let result = [...data];
    
    // 按会员名称搜索
    if (searchName) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchName.toLowerCase())
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

  // 查看会员详情
  const handleView = (record) => {
    Modal.info({
      title: '会员详情',
      content: (
        <div>
          <p>会员名称: {record.name}</p>
          <p>昵称: {record.nickname}</p>
          <p>联系方式: {record.contact.replace(/\n/g, '<br/>')}</p>
          <p>注册时间: {record.registerTime}</p>
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
      content: `确定要启用会员"${record.name}"吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setTimeout(() => {
          message.success(`已启用会员: ${record.name}`);
          setData(data.filter(item => item.id !== record.id));
          setLoading(false);
        }, 500);
      },
      onCancel: () => setLoading(false)
    });
  };

  // 编辑会员
  const handleEdit = (record) => {
    Modal.info({
      title: '编辑会员',
      content: <p>编辑功能待实现</p>,
      okText: '确定'
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
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120,
      render: (text) => (
        <span style={{ color: '#999' }}>{text}</span>
      ),
    },
    {
      title: '联系方式',
      dataIndex: 'contact',
      key: 'contact',
      width: 250,
      render: (text) => (
        <div style={{ whiteSpace: 'pre-line', color: '#1890ff' }}>{text}</div>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'registerTime',
      key: 'registerTime',
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
        <Space size="small">
          <Button 
            type="default" 
            size="small"
            style={{
              backgroundColor: '#ff7a45',
              borderColor: '#ff7a45',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '12px'
            }}
            onClick={() => handleView(record)}
            loading={loading}
          >
            查看
          </Button>
          <Button 
            type="default" 
            size="small"
            style={{
              backgroundColor: '#52c41a',
              borderColor: '#52c41a',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '12px'
            }}
            onClick={() => handleEnable(record)}
            loading={loading}
          >
            启用
          </Button>
          <Button 
            type="default" 
            size="small"
            style={{
              backgroundColor: '#1890ff',
              borderColor: '#1890ff',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '12px'
            }}
            onClick={() => handleEdit(record)}
            loading={loading}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="recycle-bin-container">
      {/* 搜索栏 */}
      <div className="search-bar">
        <div className="search-item">
          <label className="search-label">会员名称</label>
          <Input
            placeholder="请输入会员名称"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            style={{ width: 200 }}
          />
        </div>
        
        <div className="search-item">
          <label className="search-label">联系方式</label>
          <Input
            placeholder="请输入会员联系方式"
            value={searchContact}
            onChange={e => setSearchContact(e.target.value)}
            style={{ width: 200 }}
          />
        </div>
        
        <Button
          type="default"
          style={{
            backgroundColor: '#ff4d4f',
            borderColor: '#ff4d4f',
            color: '#fff',
            height: 32
          }}
          onClick={handleSearch}
          icon={<SearchOutlined />}
        >
          搜索
        </Button>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        loading={loading}
        locale={{
          emptyText: '暂无数据',
          triggerAsc: '点击升序',
          triggerDesc: '点击降序',
          cancelSort: '取消排序',
        }}
        style={{
          border: '1px solid #f0f0f0',
          borderRadius: '4px',
          marginTop: '16px'
        }}
        components={{
          header: {
            wrapper: ({ className, children }) => (
              <table
                className={className}
                style={{
                  backgroundColor: '#fafafa',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                {children}
              </table>
            )
          }
        }}
        rowClassName={(record, index) => index % 2 === 0 ? 'even-row' : 'odd-row'}
      />
    </div>
  );
};

export default RecycleBin;