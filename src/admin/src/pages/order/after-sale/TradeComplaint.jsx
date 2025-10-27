import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Select, Tag, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';

const { Option } = Select;

// 生成模拟数据
const generateMockData = () => {
  const data = [];
  // 生成506条数据，其中包含待申诉和已完成两种状态
  for (let i = 1; i <= 506; i++) {
    const isPending = i % 5 === 0; // 约20%的数据为待申诉状态
    
    // 确保ID唯一，避免JavaScript数字精度问题
    const baseId = 'C2025' + String(i).padStart(16, '0');
    const baseOrderId = 'O2025' + String(i).padStart(16, '0');
    
    data.push({
      id: baseId,
      orderId: baseOrderId,
      memberName: i % 10 === 0 ? '181***3560' : i % 5 === 0 ? 'EASO' : i % 3 === 0 ? '934590022822e2a687992839a2bd0b0' : i % 7 === 0 ? 'oke4E6TlZGlb3JlvPV5az79Y_IM' : i % 9 === 0 ? 'kui' : '130***1111',
      productName: i % 8 === 0 ? '测试商品 测试规格项1' : i % 6 === 0 ? '@@ 128G' : i % 4 === 0 ? '荣耀X90 2' : i % 11 === 0 ? '超级商品1 小白' : i % 9 === 0 ? '去测试清空联取消 66666' : i % 7 === 0 ? '雨生咖啡-实物商品 50ml' : i % 5 === 0 ? 'fad 1' : i % 3 === 0 ? '滚筒洗衣机,黑色' : '野生 优质',
      complaintType: ['订单货物问题', '货不对板', '问题得不到解决'][i % 3],
      complaintTime: `${2025}-${String(Math.floor(i / 50) + 7).padStart(2, '0')}-${String(i % 28 + 1).padStart(2, '0')} ${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
      status: isPending ? 'pending' : 'completed',
      // 确保每个记录都有明确的状态值
      statusText: isPending ? '待申诉' : '已完成',
      statusColor: isPending ? 'orange' : 'green'
    });
  }
  return data;
};

const TradeComplaint = () => {
  // 状态管理
  const [dataSource] = useState(generateMockData());
  const [filteredData, setFilteredData] = useState([]);
  const [orderId, setOrderId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // 初始化数据加载
  useEffect(() => {
    setFilteredData(dataSource);
  }, [dataSource]);

  // 搜索功能
  const handleSearch = () => {
    let filtered = [...dataSource];
    
    if (orderId) {
      filtered = filtered.filter(item => item.orderId.includes(orderId));
    }
    
    if (memberName) {
      filtered = filtered.filter(item => item.memberName.includes(memberName));
    }
    
    if (status) {
      const statusKey = status === '待申诉' ? 'pending' : '已完成';
      filtered = filtered.filter(item => item.status === statusKey);
    }
    
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  // 分页配置
  const pagination = {
    current: currentPage,
    pageSize: pageSize,
    total: filteredData.length,
    onChange: (page) => setCurrentPage(page),
    showTotal: (total) => `共 ${total} 条`,
    showQuickJumper: true,
    showLessItems: true,
    pageSizeOptions: ['10'],
    style: { fontSize: '12px' }
  };

  // 计算当前页数据
  const currentData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 表格列配置 - 所有字体设置为12px，所有列左对齐
  const columns = [
    {
      title: '会员名称',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 120,
      align: 'left',
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px' } })
    },
    {
      title: '订单编号',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 200,
      align: 'left',
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px' } })
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 180,
      align: 'left',
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px' } })
    },
    {
      title: '投诉主题',
      dataIndex: 'complaintType',
      key: 'complaintType',
      width: 120,
      align: 'left',
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px' } })
    },
    {
      title: '投诉时间',
      dataIndex: 'complaintTime',
      key: 'complaintTime',
      width: 180,
      align: 'left',
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px' } })
    },
    {
      title: '投诉状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'left',
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px' } }),
      render: (_, record) => (
        <Tag 
          color={record.statusColor}
          style={{
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'normal',
            textAlign: 'center',
            minWidth: '60px',
            height: '26px',
            lineHeight: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {record.statusText}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'left',
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px' } }),
      render: (_, record) => (
        <Button 
          type="link" 
          style={{ 
            color: record.status === 'pending' ? '#ff4d4f' : '#fa8c16',
            fontSize: '12px',
            padding: '0'
          }}
        >
          {record.status === 'pending' ? '处理' : '详情'}
        </Button>
      )
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '20px', fontSize: '12px' }}>
      {/* 搜索功能区 - 完全独立的模块 */}
      <div style={{ 
        marginBottom: '16px', 
        padding: '16px', 
        backgroundColor: '#fafafa',
        border: '1px solid #f0f0f0',
        borderRadius: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px', color: '#666', fontSize: '12px' }}>订单编号</span>
            <Input
              placeholder="请输入订单编号"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: '200px', height: '32px', fontSize: '12px' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px', color: '#666', fontSize: '12px' }}>会员名称</span>
            <Input
              placeholder="请输入会员名称"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: '200px', height: '32px', fontSize: '12px' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px', color: '#666', fontSize: '12px' }}>状态</span>
            <Select
              placeholder="请选择"
              value={status}
              onChange={setStatus}
              style={{ width: '150px', height: '32px', fontSize: '12px' }}
              allowClear
            >
              <Option value="待申诉" style={{ fontSize: '12px' }}>待申诉</Option>
              <Option value="已完成" style={{ fontSize: '12px' }}>已完成</Option>
            </Select>
          </div>
          
          <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              style={{ 
                backgroundColor: '#ff0000', 
                borderColor: '#ff0000',
                height: '32px',
                color: '#ffffff',
                fontSize: '12px'
              }}
            >
            搜索
          </Button>
        </div>
      </div>
      
      {/* 列表功能区 - 完全独立的模块 */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '4px' }}>

        {/* 表格区域 - 字体设置为12px */}
        <Table
          columns={columns}
          dataSource={currentData}
          pagination={pagination}
          rowKey="id"
          bordered
          style={{ backgroundColor: '#fff', fontSize: '12px' }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </div>
    </div>
  );
};

export default TradeComplaint;