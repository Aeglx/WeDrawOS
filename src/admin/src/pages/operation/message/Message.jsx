import React, { useState } from 'react';
import { Tabs, Card, Form, Input, Button, Table, Pagination, Modal, message } from 'antd';
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import './Message.css';

const { TabPane } = Tabs;
const { Item } = Form;
const { Search } = Input;

// 模拟站内信数据
const mockMessageData = [
  {
    key: '1',
    title: '214',
    content: '2144122',
    target: '商家',
    type: '指定商家',
    time: '2025-10-17 13:59:06'
  },
  {
    key: '2',
    title: 'wewe',
    content: 'asdvae',
    target: '商家',
    type: '全站',
    time: '2025-09-19 14:57:18'
  },
  {
    key: '3',
    title: '123',
    content: '123',
    target: '商家',
    type: '指定商家',
    time: '2025-09-15 14:29:55'
  },
  {
    key: '4',
    title: '123',
    content: '123123',
    target: '会员',
    type: '指定会员',
    time: '2025-09-01 02:50:58'
  },
  {
    key: '5',
    title: '能收到吗',
    content: '717',
    target: '商家',
    type: '指定商家',
    time: '2025-07-17 15:03:23'
  },
  {
    key: '6',
    title: '很久很久很久',
    content: '金红火火恍恍惚惚',
    target: '商家',
    type: '指定商家',
    time: '2025-07-03 15:05:26'
  },
  {
    key: '7',
    title: '颂达',
    content: '沙土士大夫',
    target: '会员',
    type: '全站',
    time: '2025-06-10 15:08:34'
  },
  {
    key: '8',
    title: '做好准备',
    content: 'ewqrt',
    target: '商家',
    type: '全站',
    time: '2025-05-28 18:14:09'
  },
  {
    key: '9',
    title: 'qweqwe',
    content: 'qeqwe',
    target: '会员',
    type: '全站',
    time: '2025-04-10 15:06:18'
  },
  {
    key: '10',
    title: 'test',
    content: 'nverqwe',
    target: '商家',
    type: '指定商家',
    time: '2025-04-09 19:06:37'
  }
];

// 模拟会员数据
const mockMemberData = [
  {
    key: '1',
    memberId: '19888969326...',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    memberName: 'okaE4tL_cpIDC4Wp...',
    nickname: '一化北濠鱼',
    contact: '138****1234',
    registerTime: '2025-11-13 21:56:55',
    lastLoginTime: '2025-11-13 21:56:55',
    points: '0'
  },
  {
    key: '2',
    memberId: '1988947345...',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    memberName: 'e31211122ff065ba...',
    nickname: '微信用户',
    contact: '',
    registerTime: '2025-11-13 20:29:34',
    lastLoginTime: '2025-11-13 20:29:34',
    points: '0'
  },
  {
    key: '3',
    memberId: '19889270027...',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    memberName: '303320a04f35fac...',
    nickname: '微信用户',
    contact: '',
    registerTime: '2025-11-13 19:28:37',
    lastLoginTime: '2025-11-13 19:28:37',
    points: '0'
  },
  {
    key: '4',
    memberId: '1988899768...',
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    memberName: 'okaE4F6jDbQssAN...',
    nickname: '马房山人',
    contact: '159****6789',
    registerTime: '2025-11-13 17:20:31',
    lastLoginTime: '2025-11-13 17:20:31',
    points: '0'
  },
  {
    key: '5',
    memberId: '1988899174...',
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    memberName: '690147f2f2227d19...',
    nickname: '微信用户',
    contact: '',
    registerTime: '2025-11-13 17:18:09',
    lastLoginTime: '2025-11-13 17:18:09',
    points: '0'
  },
  {
    key: '6',
    memberId: '1988898089...',
    avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
    memberName: '95d4a1e0641ed96...',
    nickname: '微信用户',
    contact: '',
    registerTime: '2025-11-13 17:13:51',
    lastLoginTime: '2025-11-13 17:13:51',
    points: '0'
  },
  {
    key: '7',
    memberId: '1988888489...',
    avatar: 'https://randomuser.me/api/portraits/men/7.jpg',
    memberName: '253566d9723c605e...',
    nickname: '唱唱',
    contact: '135****4567',
    registerTime: '2025-11-13 16:35:42',
    lastLoginTime: '2025-11-13 16:35:42',
    points: '0'
  },
  {
    key: '8',
    memberId: '1988881661...',
    avatar: 'https://randomuser.me/api/portraits/women/8.jpg',
    memberName: '5e49bd86942c397...',
    nickname: '微信用户',
    contact: '',
    registerTime: '2025-11-13 16:08:34',
    lastLoginTime: '2025-11-13 16:08:34',
    points: '0'
  },
  {
    key: '9',
    memberId: '19887847914...',
    avatar: 'https://randomuser.me/api/portraits/men/9.jpg',
    memberName: '158****5448',
    nickname: '用户803067',
    contact: '158****5448',
    registerTime: '2025-11-13 15:41:45',
    lastLoginTime: '2025-11-13 15:41:45',
    points: '0'
  },
  {
    key: '10',
    memberId: '1988874691...',
    avatar: 'https://randomuser.me/api/portraits/women/10.jpg',
    memberName: '153****1234',
    nickname: '用户503817',
    contact: '153****1234',
    registerTime: '2025-11-13 15:40:52',
    lastLoginTime: '2025-11-13 15:40:52',
    points: '0'
  }
];

const Message = () => {
  const [form] = Form.useForm();
  const [memberSearchForm] = Form.useForm();
  const [activeTabKey, setActiveTabKey] = useState('1');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(554);
  const [isSendModalVisible, setIsSendModalVisible] = useState(false);
  const [isSelectMemberModalVisible, setIsSelectMemberModalVisible] = useState(false);
  const [viewMessageModalVisible, setViewMessageModalVisible] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [sendTo, setSendTo] = useState('all'); // all: 全站会员, specific: 指定会员
  const [sendRange, setSendRange] = useState('station'); // station: 全站, specific: 指定会员
  const [memberCurrentPage, setMemberCurrentPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(20);
  const [memberTotalItems, setMemberTotalItems] = useState(43959);
  const [currentMessage, setCurrentMessage] = useState({});
  
  // 处理标签页切换
  const handleTabChange = (key) => {
    setActiveTabKey(key);
  };
  
  // 处理搜索
  const handleSearch = () => {
    form.validateFields().then(values => {
      console.log('搜索条件:', values);
      message.info('搜索功能开发中');
    }).catch(error => {
      console.error('搜索表单验证失败:', error);
    });
  };
  
  // 处理页码变化
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
    message.info(`切换到第 ${page} 页，每页 ${size} 条`);
  };
  
  // 处理发消息按钮点击
  const handleSendMessageClick = () => {
    setIsSendModalVisible(true);
  };
  
  // 处理发送消息弹窗关闭
  const handleSendModalClose = () => {
    setIsSendModalVisible(false);
  };
  
  // 处理发送消息
  const handleSendMessage = () => {
    message.success('消息发送成功');
    setIsSendModalVisible(false);
  };
  
  // 处理选择会员按钮点击
  const handleSelectMemberClick = () => {
    setIsSelectMemberModalVisible(true);
  };
  
  // 处理选择会员弹窗关闭
  const handleSelectMemberModalClose = () => {
    setIsSelectMemberModalVisible(false);
  };
  
  // 处理会员选择
  const handleMemberSelect = (record) => {
    // 检查会员是否已被选择
    const isSelected = selectedMembers.some(member => member.key === record.key);
    if (isSelected) {
      // 取消选择
      setSelectedMembers(selectedMembers.filter(member => member.key !== record.key));
    } else {
      // 添加选择
      setSelectedMembers([...selectedMembers, record]);
    }
  };
  
  // 处理确认选择会员
  const handleConfirmSelectMember = () => {
    message.info(`已选择 ${selectedMembers.length} 个会员`);
    setIsSelectMemberModalVisible(false);
  };
  
  // 处理删除消息
  const handleDeleteMessage = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `您确定要删除消息${record.title}吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        message.success('消息删除成功');
      },
      onCancel() {
        message.info('已取消删除');
      }
    });
  };
  
  // 处理查看消息
  const handleViewMessage = (record) => {
    setCurrentMessage(record);
    setViewMessageModalVisible(true);
  };
  
  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedMessageIds.length === 0) {
      message.warning('请选择要删除的消息');
      return;
    }
    Modal.confirm({
      title: '确认批量删除',
      content: `您确定要删除选中的 ${selectedMessageIds.length} 条消息吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        message.success('消息批量删除成功');
        setSelectedMessageIds([]);
      },
      onCancel() {
        message.info('已取消批量删除');
      }
    });
  };
  
  // 处理发送对象变更
  const handleSendToChange = (value) => {
    setSendTo(value);
  };
  
  // 处理移除选中会员
  const handleRemoveMember = (memberId) => {
    setSelectedMembers(selectedMembers.filter(member => member.memberId !== memberId));
  };
  
  // 处理会员搜索
  const handleMemberSearch = () => {
    message.info('会员搜索功能待实现');
  };
  
  // 处理会员搜索重置
  const handleMemberReset = () => {
    memberSearchForm.resetFields();
    message.info('搜索条件已重置');
  };
  
  // 处理取消发送消息
  const handleCancelSendMessage = () => {
    setIsSendModalVisible(false);
    form.resetFields();
  };
  
  // 处理确认发送消息
  const handleConfirmSendMessage = () => {
    form.validateFields().then(values => {
      message.success('消息发送成功');
      setIsSendModalVisible(false);
      form.resetFields();
      setSelectedMembers([]);
    }).catch(errorInfo => {
      message.error('表单验证失败：' + errorInfo);
    });
  };

  // 消息表格列定义
  const messageColumns = [
    {
      title: 'ID',
      dataIndex: 'key',
      key: 'key',
      width: 80,
      align: 'center',
    },
    {
      title: '消息类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      align: 'center',
    },
    {
      title: '消息标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '发送人',
      dataIndex: 'sender',
      key: 'sender',
      width: 120,
      align: 'center',
      render: () => '系统',
    },
    {
      title: '接收人',
      dataIndex: 'target',
      key: 'target',
      width: 120,
      align: 'center',
    },
    {
      title: '发送时间',
      dataIndex: 'time',
      key: 'time',
      width: 180,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => {
        return (
          <Space size="middle">
            <Button type="link" size="small" onClick={() => handleViewMessage(record)}>
              查看
            </Button>
            <Button type="link" size="small" danger onClick={() => handleDeleteMessage(record)}>
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  // 会员表格列定义
  const memberColumns = [
    {
      title: '会员ID',
      dataIndex: 'memberId',
      key: 'memberId',
      width: 150,
      ellipsis: true,
    },
    {
      title: '会员名称',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 120,
      ellipsis: true,
    },
    {
      title: '联系方式',
      dataIndex: 'contact',
      key: 'contact',
      width: 120,
      ellipsis: true,
    },
    {
      title: '注册时间',
      dataIndex: 'registerTime',
      key: 'registerTime',
      width: 180,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => {
        return (
          <Button
            type="link"
            size="small"
            onClick={() => handleSelectMember(record)}
            disabled={selectedMembers.some((member) => member.key === record.key)}
          >
            {selectedMembers.some((member) => member.key === record.key) ? '已选择' : '选择'}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="message-container">
      <Card title="站内信" bordered={false} className="message-card">
        <div className="card-header">
          <Space>
            <Button type="primary" onClick={() => setIsSendModalVisible(true)}>
              发送消息
            </Button>
            <Button onClick={() => handleBatchDelete()}>
              <DeleteOutlined /> 批量删除
            </Button>
          </Space>
        </div>
        <Table
          dataSource={mockMessageData}
          columns={messageColumns}
          rowKey="id"
          pagination={false}
          bordered={false}
          className="message-table"
          rowSelection={{
            type: 'checkbox',
            onChange: (selectedRowKeys, selectedRows) => {
              setSelectedMessageIds(selectedRowKeys);
            },
          }}
        />
        <div className="card-pagination">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </div>
      </Card>

      {/* 发送消息弹窗 */}
      <Modal
        title="发送消息"
        visible={isSendModalVisible}
        onCancel={handleCancelSendMessage}
        onOk={handleConfirmSendMessage}
        width={600}
        footer={[
          <Button key="back" onClick={handleCancelSendMessage}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleConfirmSendMessage}>
            发送
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="type"
            label="消息类型"
            rules={[{ required: true, message: '请选择消息类型' }]}
          >
            <Select placeholder="请选择消息类型">
              <Select.Option value="system">系统消息</Select.Option>
              <Select.Option value="notice">通知消息</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="消息标题"
            rules={[{ required: true, message: '请输入消息标题' }]}
          >
            <Input placeholder="请输入消息标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="消息内容"
            rules={[{ required: true, message: '请输入消息内容' }]}
          >
            <Input.TextArea placeholder="请输入消息内容" rows={4} />
          </Form.Item>
          <Form.Item
            name="sendTo"
            label="发送对象"
            rules={[{ required: true, message: '请选择发送对象' }]}
          >
            <Select placeholder="请选择发送对象" onChange={handleSendToChange}>
              <Select.Option value="all">全站会员</Select.Option>
              <Select.Option value="specific">指定会员</Select.Option>
            </Select>
          </Form.Item>
          {sendTo === 'specific' && (
            <Form.Item label="选择会员">
              <Button type="link" onClick={() => setIsSelectMemberModalVisible(true)}>
                选择会员 ({selectedMembers.length})
              </Button>
              <div className="selected-members">
                {selectedMembers.map((member) => (
                  <Tag key={member.memberId} closable onClose={() => handleRemoveMember(member.memberId)}>
                    {member.memberName}
                  </Tag>
                ))}
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 查看消息弹窗 */}
      <Modal
        title="查看消息"
        visible={viewMessageModalVisible}
        onCancel={() => setViewMessageModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="view-message-content">
          <div className="message-info">
            <div className="message-label">消息类型：</div>
            <div className="message-value">{currentMessage.type || '系统消息'}</div>
          </div>
          <div className="message-info">
            <div className="message-label">消息标题：</div>
            <div className="message-value">{currentMessage.title || ''}</div>
          </div>
          <div className="message-info">
            <div className="message-label">发送时间：</div>
            <div className="message-value">{currentMessage.time || ''}</div>
          </div>
          <div className="message-info">
            <div className="message-label">消息内容：</div>
            <div className="message-value message-content">{currentMessage.content || ''}</div>
          </div>
        </div>
      </Modal>

      {/* 选择会员弹窗 */}
      <Modal
        title="选择会员"
        visible={isSelectMemberModalVisible}
        onCancel={() => setIsSelectMemberModalVisible(false)}
        onOk={handleConfirmSelectMember}
        width={900}
        footer={[
          <Button key="back" onClick={() => setIsSelectMemberModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleConfirmSelectMember}>
            确定
          </Button>,
        ]}
      >
        <div className="member-search">
          <Form form={memberSearchForm} layout="inline">
            <Form.Item name="memberName">
              <Input placeholder="会员名称" />
            </Form.Item>
            <Form.Item name="phone">
              <Input placeholder="手机号" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleMemberSearch}>
                <SearchOutlined /> 搜索
              </Button>
            </Form.Item>
            <Form.Item>
              <Button onClick={handleMemberReset}>重置</Button>
            </Form.Item>
          </Form>
        </div>
        <Table
          dataSource={mockMemberData}
          columns={memberColumns}
          rowKey="memberId"
          pagination={{
            current: memberCurrentPage,
            pageSize: memberPageSize,
            total: memberTotalItems,
            onChange: (page, pageSize) => {
              setMemberCurrentPage(page);
              setMemberPageSize(pageSize);
            },
          }}
          bordered={false}
          className="member-table"
        />
      </Modal>
    </div>
  );
};

export default Message;