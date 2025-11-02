import React, { useState } from 'react';
import { Table, Button, Input, Select, DatePicker, Space, Tag, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './ShopSettlement.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

// 店铺结算页面组件
const ShopSettlement = () => {
  // 状态管理
  const [billNo, setBillNo] = useState('');
  const [billTime, setBillTime] = useState([]);
  const [billStatus, setBillStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total] = useState(25861); // 从截图中获取的总记录数

  // 模拟账单数据
  const [bills] = useState([
    {
      id: '1',
      billNo: 'B20251102198468326657566720',
      createTime: '2025-11-02',
      settleTimeRange: '2025-10-02至2025-11-02',
      shopName: '薇薇',
      settleAmount: '0.00',
      status: '已出账'
    },
    {
      id: '2',
      billNo: 'B20251102198468326598089472',
      createTime: '2025-11-02',
      settleTimeRange: '2025-11-01至2025-11-02',
      shopName: '薇品出露',
      settleAmount: '0.00',
      status: '已出账'
    },
    {
      id: '3',
      billNo: 'B202511021984683265130840064',
      createTime: '2025-11-02',
      settleTimeRange: '2025-11-01至2025-11-02',
      shopName: '薇品批发111',
      settleAmount: '0.00',
      status: '已出账'
    },
    {
      id: '4',
      billNo: 'B202511021984683264364776736',
      createTime: '2025-11-02',
      settleTimeRange: '2025-10-02至2025-11-02',
      shopName: '564616',
      settleAmount: '0.00',
      status: '已出账'
    },
    {
      id: '5',
      billNo: 'B202511021984683263230905040',
      createTime: '2025-11-02',
      settleTimeRange: '2025-10-14至2025-11-02',
      shopName: '软件店铺1',
      settleAmount: '0.00',
      status: '已出账'
    },
    {
      id: '6',
      billNo: 'B20251102198468326277641216',
      createTime: '2025-11-02',
      settleTimeRange: '2025-11-01至2025-11-02',
      shopName: '群丁的小铺',
      settleAmount: '0.00',
      status: '已出账'
    },
    {
      id: '7',
      billNo: 'B202511021984683261349852544',
      createTime: '2025-11-02',
      settleTimeRange: '2025-11-01至2025-11-02',
      shopName: '小型无人机',
      settleAmount: '0.00',
      status: '已出账'
    },
    {
      id: '8',
      billNo: 'B202511021984683260360351872',
      createTime: '2025-11-02',
      settleTimeRange: '2025-10-02至2025-11-02',
      shopName: '测试店铺11111111',
      settleAmount: '0.00',
      status: '已出账'
    },
    {
      id: '9',
      billNo: 'B202511021984683259580211238',
      createTime: '2025-11-02',
      settleTimeRange: '2025-11-01至2025-11-02',
      shopName: 'jdjhdjhdjdjdioskjd',
      settleAmount: '0.00',
      status: '已出账'
    },
    {
      id: '10',
      billNo: 'B202511021984683258759692288',
      createTime: '2025-11-02',
      settleTimeRange: '2025-10-02至2025-11-02',
      shopName: 'dfdvdfvdvdfvdvdfvdv',
      settleAmount: '0.00',
      status: '已出账'
    }
  ]);

  // 处理搜索
  const handleSearch = () => {
    // 实际项目中这里应该调用API进行搜索
    console.log('搜索条件:', {
      billNo,
      billTime,
      billStatus
    });
    // 模拟搜索成功提示
    message.success('搜索成功');
  };

  // 处理重置
  const handleReset = () => {
    setBillNo('');
    setBillTime([]);
    setBillStatus('');
    setCurrentPage(1);
  };

  // 处理分页变化
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 实际项目中这里应该根据页码加载对应的数据
    console.log('切换到页码:', page);
  };

  // 处理查看详情
  const handleViewDetail = (record) => {
    console.log('查看账单详情:', record);
    // 模拟查看详情操作
    message.info(`查看账单 ${record.billNo} 详情`);
  };

  // 渲染状态标签
  const renderStatusTag = (status) => {
    let color = 'blue'; // 默认蓝色
    
    switch (status) {
      case '已出账':
        color = 'blue';
        break;
      case '已结算':
        color = 'green';
        break;
      case '待结算':
        color = 'orange';
        break;
      case '已取消':
        color = 'red';
        break;
      default:
        color = 'blue';
    }
    
    return <Tag color={color} style={{ fontSize: '12px', padding: '2px 8px' }}>{status}</Tag>;
  };

  // 表格列配置
  const columns = [
    {
      title: '',
      key: 'checkbox',
      width: 40,
      render: () => <input type="checkbox" />
    },
    {
      title: '账单号',
      dataIndex: 'billNo',
      key: 'billNo',
      width: 250
    },
    {
      title: '生成时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 120
    },
    {
      title: '结算时间段',
      dataIndex: 'settleTimeRange',
      key: 'settleTimeRange',
      width: 150
    },
    {
      title: '店铺名称',
      dataIndex: 'shopName',
      key: 'shopName',
      width: 150
    },
    {
      title: '结算金额',
      dataIndex: 'settleAmount',
      key: 'settleAmount',
      width: 100,
      render: (amount) => <span style={{ color: '#ff0000', fontSize: '12px' }}>¥{amount}</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => renderStatusTag(status)
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => handleViewDetail(record)}
          style={{ color: '#ff7875', fontSize: '12px' }}
        >
          详情
        </Button>
      )
    }
  ];

  return (
    <div className="shop-settlement">
      {/* 搜索区域 */}
      <div className="search-area">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', whiteSpace: 'nowrap' }}>账单编号</span>
            <Input
              placeholder="请输入账单编号"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', whiteSpace: 'nowrap' }}>出账时间</span>
            <RangePicker
              value={billTime}
              onChange={setBillTime}
              style={{ fontSize: '12px', height: 32 }}
              placeholder={['开始日期', '结束日期']}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', whiteSpace: 'nowrap' }}>账单状态</span>
            <Select
              placeholder="请选择"
              value={billStatus}
              onChange={setBillStatus}
              allowClear
              style={{ width: 180, fontSize: '12px', height: 32 }}
            >
              <Option value="已出账">已出账</Option>
              <Option value="已结算">已结算</Option>
              <Option value="待结算">待结算</Option>
              <Option value="已取消">已取消</Option>
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

      {/* 表格区域 */}
      <div className="table-area">
        <Table
          columns={columns}
          dataSource={bills}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: '暂无数据' }}
          style={{ fontSize: '12px' }}
          className="settlement-table"
        />
      </div>

      {/* 分页区域 */}
      <div className="pagination-area">
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: '12px' }}>
          <span style={{ marginRight: '16px', color: '#666666' }}>共 {total} 条</span>
          <span style={{ marginRight: '8px' }}>
            <a href="#" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              上一页
            </a>
          </span>
          <span style={{ marginRight: '8px' }}>{currentPage}</span>
          <span style={{ marginRight: '8px' }}>
            <a href="#" onClick={() => handlePageChange(currentPage + 1)}>
              下一页
            </a>
          </span>
          <span style={{ marginRight: '8px' }}>...</span>
          <span style={{ marginRight: '16px' }}>
            <a href="#" onClick={() => handlePageChange(Math.ceil(total / pageSize))}>
              {Math.ceil(total / pageSize)}
            </a>
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>10条/页</span>
            <select style={{ fontSize: '12px', padding: '2px' }}>
              <option value="10">10条/页</option>
              <option value="20">20条/页</option>
              <option value="50">50条/页</option>
              <option value="100">100条/页</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '16px' }}>
            <span style={{ marginRight: '8px' }}>跳至</span>
            <input 
              type="number" 
              min="1" 
              max={Math.ceil(total / pageSize)}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= Math.ceil(total / pageSize)) {
                  handlePageChange(page);
                }
              }}
              style={{ width: 50, fontSize: '12px', height: 24, padding: '0 4px' }}
            />
            <span style={{ marginLeft: '8px' }}>页</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopSettlement;