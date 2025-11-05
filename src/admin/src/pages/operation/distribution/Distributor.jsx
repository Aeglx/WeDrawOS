import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Table, Select, message, Tag, Modal, Form, InputNumber } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import './Distributor.css';

const { Option } = Select;
const { TextArea } = Input;

const Distributor = () => {
  // 搜索条件状态
  const [searchForm] = Form.useForm();
  const [status, setStatus] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // 模态框状态
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [editForm] = Form.useForm();
  
  // 模拟数据
  const [distributors, setDistributors] = useState([]);
  
  // 初始化数据
  useEffect(() => {
    // 模拟从API获取数据
    const mockData = [
      {
        key: '1',
        memberName: '15810610731',
        realName: '帅帅asdfgdswsdss',
        idCard: '179292199005020635',
        bankName: '12312312312',
        bankAccount: '2asdasd',
        bankBranch: 'fasdasddvgyd',
        promotionCount: 3,
        orderAmount: '',
        distributionAmount: '89.00',
        withdrawAmount: '0.00',
        frozenAmount: '0.00',
        status: 'passed',
      },
      {
        key: '2',
        memberName: 'm176330660...',
        realName: '季三',
        idCard: '13077199911114151',
        bankName: 'ease',
        bankAccount: '1',
        bankBranch: '1',
        promotionCount: 2,
        orderAmount: '',
        distributionAmount: '4.00',
        withdrawAmount: '0.00',
        frozenAmount: '0.00',
        status: 'passed',
      },
      {
        key: '3',
        memberName: '13011111111',
        realName: '张三',
        idCard: '13051299208102512',
        bankName: '1',
        bankAccount: '1',
        bankBranch: '1',
        promotionCount: 52,
        orderAmount: '2,026.04',
        distributionAmount: '1,233.00',
        withdrawAmount: '834.00',
        frozenAmount: '4.00',
        status: 'passed',
      },
      {
        key: '4',
        memberName: 'm13811198935',
        realName: '罗博',
        idCard: '110101198901273168',
        bankName: '411327199503010038',
        bankAccount: '1',
        bankBranch: '1',
        promotionCount: 0,
        orderAmount: '',
        distributionAmount: '0.00',
        withdrawAmount: '0.00',
        frozenAmount: '0.00',
        status: 'passed',
      },
      {
        key: '5',
        memberName: 'm153443073...',
        realName: '王晶',
        idCard: '411327199503010038',
        bankName: '111111111111111',
        bankAccount: '1',
        bankBranch: '1',
        promotionCount: 0,
        orderAmount: '',
        distributionAmount: '0.00',
        withdrawAmount: '0.00',
        frozenAmount: '0.00',
        status: 'passed',
      },
      {
        key: '6',
        memberName: 'm165103352...',
        realName: '流水',
        idCard: '111111111111111121',
        bankName: '1',
        bankAccount: '1',
        bankBranch: '1',
        promotionCount: 0,
        orderAmount: '',
        distributionAmount: '0.00',
        withdrawAmount: '0.00',
        frozenAmount: '0.00',
        status: 'retired',
      },
      {
        key: '7',
        memberName: '15139650614',
        realName: '张三',
        idCard: '4128271995403020568',
        bankName: '1',
        bankAccount: '1',
        bankBranch: '1',
        promotionCount: 0,
        orderAmount: '',
        distributionAmount: '0.00',
        withdrawAmount: '0.00',
        frozenAmount: '0.00',
        status: 'retired',
      },
      {
        key: '8',
        memberName: 'm135703353...',
        realName: '胡先生',
        idCard: '210124198508162281',
        bankName: '1',
        bankAccount: '1',
        bankBranch: '1',
        promotionCount: 0,
        orderAmount: '',
        distributionAmount: '0.00',
        withdrawAmount: '0.00',
        frozenAmount: '0.00',
        status: 'retired',
      },
      {
        key: '9',
        memberName: 'admin1',
        realName: '高',
        idCard: '210203198112133033',
        bankName: '1',
        bankAccount: '1',
        bankBranch: '1',
        promotionCount: 0,
        orderAmount: '',
        distributionAmount: '0.00',
        withdrawAmount: '0.00',
        frozenAmount: '0.00',
        status: 'retired',
      },
      {
        key: '10',
        memberName: 'm176837284...',
        realName: '大长腿',
        idCard: '372529197308072810',
        bankName: '1',
        bankAccount: '1',
        bankBranch: '1',
        promotionCount: 0,
        orderAmount: '',
        distributionAmount: '0.00',
        withdrawAmount: '0.00',
        frozenAmount: '0.00',
        status: 'retired',
      },
    ];
    
    setDistributors(mockData);
    setTotalCount(81); // 模拟总数
  }, []);
  
  // 处理搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    // 实际项目中这里应该调用API进行搜索
    console.log('搜索条件:', values);
    // 模拟搜索成功提示
    message.success('搜索成功');
  };
  
  // 处理重置
  const handleReset = () => {
    searchForm.resetFields();
    setStatus('');
    setCurrentPage(1);
  };
  
  // 分页处理
  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
    console.log('页码:', page, '每页条数:', pageSize);
  };
  
  // 处理编辑
  const handleEdit = (record) => {
    setEditingData(record);
    editForm.setFieldsValue({
      realName: record.realName,
      idCard: record.idCard,
      bankName: record.bankName,
      bankAccount: record.bankAccount,
      bankBranch: record.bankBranch,
    });
    setIsEditModalVisible(true);
  };
  
  // 处理保存编辑
  const handleSaveEdit = () => {
    editForm.validateFields().then(values => {
      // 实际项目中这里应该调用API保存数据
      setDistributors(distributors.map(item => 
        item.key === editingData.key ? { ...item, ...values } : item
      ));
      setIsEditModalVisible(false);
      message.success('编辑成功');
    });
  };
  
  // 处理清退
  const handleRetire = (record) => {
    Modal.confirm({
      title: '确认清退',
      content: `确定要清退分销员「${record.memberName}」吗？`,
      onOk: () => {
        // 实际项目中这里应该调用API清退分销员
        setDistributors(distributors.map(item => 
          item.key === record.key ? { ...item, status: 'retired' } : item
        ));
        message.success('清退成功');
      }
    });
  };
  
  // 处理恢复
  const handleRestore = (record) => {
    Modal.confirm({
      title: '确认恢复',
      content: `确定要恢复分销员「${record.memberName}」吗？`,
      onOk: () => {
        // 实际项目中这里应该调用API恢复分销员
        setDistributors(distributors.map(item => 
          item.key === record.key ? { ...item, status: 'passed' } : item
        ));
        message.success('恢复成功');
      }
    });
  };
  
  // 渲染状态标签
  const renderStatusTag = (status) => {
    if (status === 'passed') {
      return <Tag color="success">通过</Tag>;
    } else if (status === 'retired') {
      return <Tag color="warning">清退</Tag>;
    }
    return <Tag>未知</Tag>;
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
      width: 120,
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 180,
    },
    {
      title: '结算银行开户名称',
      dataIndex: 'bankName',
      key: 'bankName',
      width: 150,
    },
    {
      title: '结算银行开户账号',
      dataIndex: 'bankAccount',
      key: 'bankAccount',
      width: 150,
    },
    {
      title: '结算银行开户支行名称',
      dataIndex: 'bankBranch',
      key: 'bankBranch',
      width: 150,
    },
    {
      title: '推广单数',
      dataIndex: 'promotionCount',
      key: 'promotionCount',
      width: 80,
    },
    {
      title: '分销订单金额',
      dataIndex: 'orderAmount',
      key: 'orderAmount',
      width: 120,
      render: (text) => text ? <span style={{ color: '#ff4d4f' }}>¥{text}</span> : '',
    },
    {
      title: '分销金额',
      dataIndex: 'distributionAmount',
      key: 'distributionAmount',
      width: 100,
      render: (text) => <span style={{ color: '#ff4d4f' }}>¥{text}</span>,
    },
    {
      title: '待提现金额',
      dataIndex: 'withdrawAmount',
      key: 'withdrawAmount',
      width: 100,
      render: (text) => <span style={{ color: '#52c41a' }}>¥{text}</span>,
    },
    {
      title: '冻结金额',
      dataIndex: 'frozenAmount',
      key: 'frozenAmount',
      width: 100,
      render: (text) => <span style={{ color: '#faad14' }}>¥{text}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: renderStatusTag,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <>
          {record.status === 'passed' ? (
            <>
              <Button 
                type="link" 
                danger 
                size="small" 
                onClick={() => handleRetire(record)}
              >
                清退
              </Button>
              <Button 
                type="link" 
                size="small" 
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            </>
          ) : (
            <>
              <Button 
                type="link" 
                size="small" 
                onClick={() => handleRestore(record)}
              >
                恢复
              </Button>
              <Button 
                type="link" 
                size="small" 
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            </>
          )}
        </>
      ),
    },
  ];
  
  return (
    <div className="distributor-container">
      <Card>
        {/* 搜索区域 */}
        <div className="search-area">
          <Form 
            form={searchForm} 
            layout="inline" 
            className="search-form"
            onFinish={handleSearch}
          >
            <Form.Item name="memberName" label="会员名称">
              <Input placeholder="请输入会员名称" style={{ width: 180, height: 32 }} />
            </Form.Item>
            
            <Form.Item name="status" label="状态">
              <Select 
                placeholder="请选择" 
                style={{ width: 180, height: 32 }} 
                onChange={(value) => setStatus(value)}
              >
                <Option value="">全部</Option>
                <Option value="passed">通过</Option>
                <Option value="retired">清退</Option>
              </Select>
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                style={{ height: 32, backgroundColor: '#ff0000', borderColor: '#ff0000' }}
                htmlType="submit"
              >
                搜索
              </Button>
            </Form.Item>
            
            <Form.Item>
              <Button 
                onClick={handleReset} 
                style={{ height: 32 }}
              >
                重置
              </Button>
            </Form.Item>
          </Form>
        </div>
        
        {/* 表格区域 */}
        <Table
          columns={columns}
          dataSource={distributors}
          rowKey="key"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            pageSizeOptions: ['10'],
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            onChange: handlePageChange,
          }}
          className="distributor-table"
        />
      </Card>
      
      {/* 编辑模态框 */}
      <Modal
        title="编辑分销员信息"
        open={isEditModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setIsEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form 
          form={editForm} 
          layout="vertical"
          className="edit-form"
        >
          <Form.Item 
            name="realName" 
            label="姓名" 
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          
          <Form.Item 
            name="idCard" 
            label="身份证号" 
            rules={[{ required: true, message: '请输入身份证号' }]}
          >
            <Input placeholder="请输入身份证号" />
          </Form.Item>
          
          <Form.Item 
            name="bankName" 
            label="结算银行开户名称" 
            rules={[{ required: true, message: '请输入银行名称' }]}
          >
            <Input placeholder="请输入银行名称" />
          </Form.Item>
          
          <Form.Item 
            name="bankAccount" 
            label="结算银行开户账号" 
            rules={[{ required: true, message: '请输入银行账号' }]}
          >
            <Input placeholder="请输入银行账号" />
          </Form.Item>
          
          <Form.Item 
            name="bankBranch" 
            label="结算银行开户支行名称" 
            rules={[{ required: true, message: '请输入支行名称' }]}
          >
            <Input placeholder="请输入支行名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Distributor;