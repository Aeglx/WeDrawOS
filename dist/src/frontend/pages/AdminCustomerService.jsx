import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Input, Avatar, Badge, Tag, Modal, Form, Select, DatePicker, Card, Statistic, Row, Col } from 'antd';
import { UserOutlined, MessageOutlined, BarChartOutlined, SettingOutlined, SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { TabPane } = Tabs;
const { Search } = Input;
const { RangePicker } = DatePicker;

/**
 * 客服管理后台页面
 * 提供客服管理、会话监控、统计分析等功能
 */
const AdminCustomerService = () => {
  const [activeTab, setActiveTab] = useState('agents');
  const [agents, setAgents] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState([moment().subtract(7, 'days'), moment()]);
  const [agentModalVisible, setAgentModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [form] = Form.useForm();
  const [trendData, setTrendData] = useState([]);

  // 获取客服列表
  useEffect(() => {
    fetchAgents();
  }, []);

  // 获取统计数据
  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchStatistics();
      fetchTrendData();
    }
  }, [activeTab, dateRange]);

  // 获取会话列表
  useEffect(() => {
    if (activeTab === 'conversations') {
      fetchConversations();
    }
  }, [activeTab]);

  // 获取客服列表
  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/customer-service/admin/agents');
      setAgents(response.data.agents || []);
    } catch (error) {
      console.error('获取客服列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取会话列表
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/customer-service/admin/conversations', {
        params: {
          search: searchText,
          status: 'all'
        }
      });
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('获取会话列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/customer-service/statistics/overview', {
        params: {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD')
        }
      });
      setStatistics(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取趋势数据
  const fetchTrendData = async () => {
    try {
      const response = await axios.get('/api/customer-service/statistics/trend', {
        params: {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          interval: 'day'
        }
      });
      setTrendData(response.data.trend || []);
    } catch (error) {
      console.error('获取趋势数据失败:', error);
    }
  };

  // 处理搜索
  const handleSearch = (value) => {
    setSearchText(value);
    if (activeTab === 'conversations') {
      fetchConversations();
    } else if (activeTab === 'agents') {
      // 客服搜索可以在这里实现
    }
  };

  // 处理日期范围变更
  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange(dates);
    }
  };

  // 打开客服编辑模态框
  const openAgentModal = (agent = null) => {
    setSelectedAgent(agent);
    if (agent) {
      form.setFieldsValue({
        name: agent.name,
        email: agent.email,
        status: agent.status,
        role: agent.role
      });
    } else {
      form.resetFields();
    }
    setAgentModalVisible(true);
  };

  // 关闭客服编辑模态框
  const closeAgentModal = () => {
    setAgentModalVisible(false);
    setSelectedAgent(null);
    form.resetFields();
  };

  // 保存客服信息
  const handleSaveAgent = async () => {
    try {
      const values = await form.validateFields();
      if (selectedAgent) {
        // 更新客服
        await axios.put(`/api/customer-service/admin/agents/${selectedAgent.id}`, values);
      } else {
        // 创建新客服
        await axios.post('/api/customer-service/admin/agents', values);
      }
      closeAgentModal();
      fetchAgents();
    } catch (error) {
      console.error('保存客服信息失败:', error);
    }
  };

  // 删除客服
  const handleDeleteAgent = (agentId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该客服吗？',
      onOk: async () => {
        try {
          await axios.delete(`/api/customer-service/admin/agents/${agentId}`);
          fetchAgents();
        } catch (error) {
          console.error('删除客服失败:', error);
        }
      }
    });
  };

  // 导出统计报表
  const exportReport = async () => {
    try {
      const response = await axios.get('/api/customer-service/statistics/report', {
        params: {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          format: 'xlsx'
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `客服统计报表_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('导出报表失败:', error);
    }
  };

  // 客服表格列配置
  const agentColumns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (avatar) => (
        <Avatar src={avatar} icon={<UserOutlined />} />
      )
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'online' ? 'green' : status === 'busy' ? 'orange' : 'gray'}>
          {status === 'online' ? '在线' : status === 'busy' ? '忙碌' : '离线'}
        </Tag>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '客服'}
        </Tag>
      )
    },
    {
      title: '当前会话',
      dataIndex: 'activeConversations',
      key: 'activeConversations',
      render: (count) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <span>
          <Button type="link" icon={<EditOutlined />} onClick={() => openAgentModal(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteAgent(record.id)}>删除</Button>
        </span>
      )
    }
  ];

  // 会话表格列配置
  const conversationColumns = [
    {
      title: '会话ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer) => (
        <span>{customer?.name || '未知客户'}</span>
      )
    },
    {
      title: '客服',
      dataIndex: 'agent',
      key: 'agent',
      render: (agent) => (
        <span>{agent?.name || '未分配'}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = '未知';
        switch (status) {
          case 'waiting':
            color = 'warning';
            text = '等待中';
            break;
          case 'active':
            color = 'processing';
            text = '进行中';
            break;
          case 'closed':
            color = 'success';
            text = '已关闭';
            break;
          case 'transferred':
            color = 'default';
            text = '已转移';
            break;
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time) => moment(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '最后消息',
      dataIndex: 'lastMessage',
      key: 'lastMessage',
      render: (message) => message?.content || '暂无消息'
    },
    {
      title: '消息数',
      dataIndex: 'messageCount',
      key: 'messageCount'
    }
  ];

  return (
    <div className="admin-customer-service">
      <div className="page-header">
        <h1>客服系统管理</h1>
      </div>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><UserOutlined /> 客服管理</span>} key="agents">
          <div className="tab-content">
            <div className="action-bar">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openAgentModal()}>添加客服</Button>
              <Search
                placeholder="搜索客服"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                style={{ width: 250, marginLeft: 10 }}
                onSearch={handleSearch}
              />
            </div>
            <Table
              columns={agentColumns}
              dataSource={agents}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </div>
        </TabPane>

        <TabPane tab={<span><MessageOutlined /> 会话监控</span>} key="conversations">
          <div className="tab-content">
            <div className="action-bar">
              <Search
                placeholder="搜索会话"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                style={{ width: 300 }}
                onSearch={handleSearch}
              />
            </div>
            <Table
              columns={conversationColumns}
              dataSource={conversations}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          </div>
        </TabPane>

        <TabPane tab={<span><BarChartOutlined /> 统计分析</span>} key="statistics">
          <div className="tab-content">
            <div className="action-bar">
              <RangePicker value={dateRange} onChange={handleDateRangeChange} />
              <Button type="primary" icon={<PlusOutlined />} onClick={exportReport}>导出报表</Button>
            </div>
            
            {statistics && (
              <>
                <Row gutter={16} style={{ marginBottom: 20 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic title="总会话数" value={statistics.totalConversations} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic title="今日新增会话" value={statistics.todayConversations} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic title="平均响应时间(秒)" value={statistics.averageResponseTime} precision={2} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic title="客户满意度" value={statistics.satisfactionRate} suffix="%" />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginBottom: 20 }}>
                  <Col span={12}>
                    <Card title="会话趋势" size="small">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="newConversations" stroke="#8884d8" name="新增会话" />
                          <Line type="monotone" dataKey="closedConversations" stroke="#82ca9d" name="关闭会话" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="客服绩效" size="small">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statistics.agentPerformance || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="conversations" fill="#8884d8" name="处理会话数" />
                          <Bar dataKey="satisfactionRate" fill="#82ca9d" name="满意度" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                </Row>

                <Card title="会话类型分布" size="small">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statistics.conversationTypeDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="会话数" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            )}
          </div>
        </TabPane>

        <TabPane tab={<span><SettingOutlined /> 系统设置</span>} key="settings">
          <div className="tab-content">
            <Card title="自动回复规则设置">
              <p>此处将集成自动回复规则管理功能</p>
            </Card>
            <Card title="系统配置" style={{ marginTop: 20 }}>
              <p>此处将集成系统配置功能</p>
            </Card>
          </div>
        </TabPane>
      </Tabs>

      {/* 客服编辑模态框 */}
      <Modal
        title={selectedAgent ? "编辑客服" : "添加客服"}
        visible={agentModalVisible}
        onOk={handleSaveAgent}
        onCancel={closeAgentModal}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入客服姓名' }]}
          >
            <Input placeholder="请输入客服姓名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>
          
          {!selectedAgent && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请设置密码' }]}
            >
              <Input.Password placeholder="请设置密码" />
            </Form.Item>
          )}
          
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Select.Option value="customer_service">客服</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="online">在线</Select.Option>
              <Select.Option value="offline">离线</Select.Option>
              <Select.Option value="busy">忙碌</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCustomerService;