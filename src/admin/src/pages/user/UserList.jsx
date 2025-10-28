import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Input, Space, Tag, Modal, Select, message, Upload, Form, DatePicker, Row, Col } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleOutlined, PlusOutlined, UploadOutlined, DownloadOutlined, UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import './UserList.css';

const { Search } = Input;
const { Option } = Select;

const UserList = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchConditions, setSearchConditions] = useState({
    id: '',
    username: '',
    email: '',
    phone: '',
    openid: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form] = Form.useForm();
  const uploadButtonRef = useRef(null);

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true);
    try {
      // 模拟用户数据
      const mockUsers = [];
      for (let i = 1; i <= 50; i++) {
        mockUsers.push({
          id: `U${String(i).padStart(10, '0')}`,
          username: `用户${i}`,
          avatar: `https://picsum.photos/40/40`,
          email: `user${i}@example.com`,
          phone: `1380013800${i}`,
          openid: `o${String(i).padStart(20, '0')}`,
          status: i % 10 === 0 ? 0 : 1,
          role: i % 5 === 0 ? 'seller' : 'buyer',
          createdAt: `2024-01-${String(i).padStart(2, '0')} 10:00:00`,
          lastLogin: `2024-02-${String(i).padStart(2, '0')} 15:30:00`,
          membership: i % 3 === 0 ? 'VIP' : i % 5 === 0 ? '高级会员' : '普通会员'
        });
      }
      
      setUsers(mockUsers);
      setTotal(mockUsers.length);
    } catch (error) {
      console.error('加载用户列表失败:', error);
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 搜索和筛选逻辑
  useEffect(() => {
    let result = [...users];
    
    // 高级搜索逻辑 - 根据各个字段分别搜索
    if (searchConditions.id) {
      result = result.filter(user => user.id.toLowerCase().includes(searchConditions.id.toLowerCase()));
    }
    
    if (searchConditions.username) {
      result = result.filter(user => user.username.toLowerCase().includes(searchConditions.username.toLowerCase()));
    }
    
    if (searchConditions.email) {
      result = result.filter(user => user.email.toLowerCase().includes(searchConditions.email.toLowerCase()));
    }
    
    if (searchConditions.phone) {
      result = result.filter(user => user.phone.includes(searchConditions.phone));
    }
    
    if (searchConditions.openid) {
      result = result.filter(user => user.openid.includes(searchConditions.openid));
    }
    
    // 状态筛选逻辑
    if (statusFilter !== 'all') {
      result = result.filter(user => 
        statusFilter === 'active' ? user.status === 1 : user.status === 0
      );
    }
    
    setFilteredUsers(result);
    setTotal(result.length);
    setCurrentPage(1); // 重置到第一页
  }, [users, searchConditions, statusFilter]);

  // 分页处理
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // 搜索功能
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // 筛选功能
  const handleFilter = (value) => {
    setStatusFilter(value);
  };

  // 更新搜索条件
  const updateSearchCondition = (key, value) => {
    setSearchConditions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 高级搜索
  const handleAdvancedSearch = () => {
    // 搜索逻辑现在直接在useEffect中根据searchConditions执行
    // 这里可以添加搜索时的视觉反馈
    message.info('正在搜索...');
  };

  // 重置搜索
  const handleResetSearch = () => {
    setSearchConditions({
      id: '',
      username: '',
      email: '',
      phone: '',
      openid: ''
    });
    setSearchText('');
    setStatusFilter('all');
  };

  // 添加会员
  const handleAddMember = () => {
    form.resetFields();
    setAddModalVisible(true);
  };

  // 关闭添加会员模态框
  const handleAddModalClose = () => {
    form.resetFields();
    setAddModalVisible(false);
  };

  // 保存新会员
  const handleSaveMember = () => {
    form.validateFields().then(values => {
      setLoading(true);
      try {
        // 创建新会员数据
        const newMember = {
          id: `U${String(users.length + 1).padStart(10, '0')}`,
          username: values.username,
          avatar: 'https://picsum.photos/40/40',
          email: values.email,
          phone: values.phone,
          openid: values.openid || `o${String(users.length + 1).padStart(20, '0')}`,
          status: values.status === 'active' ? 1 : 0,
          role: values.role,
          membership: values.membership,
          createdAt: new Date().toLocaleString('zh-CN'),
          lastLogin: new Date().toLocaleString('zh-CN')
        };
        
        // 添加到用户列表
        const updatedUsers = [newMember, ...users];
        setUsers(updatedUsers);
        
        message.success('会员添加成功');
        setAddModalVisible(false);
        form.resetFields();
      } catch (error) {
        console.error('添加会员失败:', error);
        message.error('添加会员失败');
      } finally {
        setLoading(false);
      }
    }).catch(info => {
      message.warning('请完善会员信息');
    });
  };

  // 生成会员ID
  const generateMemberId = () => {
    return `U${String(users.length + 1).padStart(10, '0')}`;
  };

  // 编辑用户
  const handleEdit = (record) => {
    Modal.info({
      title: '编辑用户',
      content: `编辑用户 ${record.username} 的功能正在开发中`
    });
  };

  // 删除用户
  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个用户吗？此操作不可撤销。',
      onOk: async () => {
        try {
          setUsers(users.filter(user => user.id !== id));
          message.success('删除成功');
        } catch (error) {
          console.error('删除用户失败:', error);
          message.error('删除失败');
        }
      }
    });
  };

  // 查看用户详情
  const handleView = (record) => {
    setSelectedUser(record);
    setDetailModalVisible(true);
  };

  // 切换用户状态
  const toggleStatus = (id, currentStatus) => {
    Modal.confirm({
      title: '确认操作',
      icon: <ExclamationCircleOutlined />,
      content: currentStatus === 1 ? '确定要禁用这个用户吗？' : '确定要启用这个用户吗？',
      onOk: () => {
        setUsers(users.map(user => 
          user.id === id ? { ...user, status: currentStatus === 1 ? 0 : 1 } : user
        ));
        message.success(currentStatus === 1 ? '禁用成功' : '启用成功');
      }
    });
  };

  // 导入会员
  const handleImport = (file) => {
    if (!file.file) return;
    
    const excelFile = file.file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 转换Excel数据为JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          message.error('导入文件为空');
          return;
        }
        
        // 验证数据格式
        const validData = jsonData.filter(row => 
          row.用户名 && (row.手机号 || row.邮箱)
        );
        
        if (validData.length === 0) {
          message.error('导入文件数据格式不正确，请检查后重试');
          return;
        }
        
        // 转换为系统用户格式
        const newUsers = validData.map((row, index) => ({
          id: `U${String(users.length + index + 1).padStart(10, '0')}`,
          username: row.用户名,
          avatar: 'https://picsum.photos/40/40',
          email: row.邮箱 || '',
          phone: row.手机号 || '',
          openid: `o${String(users.length + index + 1).padStart(20, '0')}`,
          status: row.状态 === '禁用' ? 0 : 1,
          role: row.角色 === '商家' ? 'seller' : 'buyer',
          membership: row.会员等级 || '普通会员',
          createdAt: new Date().toLocaleString('zh-CN'),
          lastLogin: new Date().toLocaleString('zh-CN')
        }));
        
        // 合并到现有用户列表
        const updatedUsers = [...users, ...newUsers];
        setUsers(updatedUsers);
        
        message.success(`成功导入 ${newUsers.length} 名会员`);
      } catch (error) {
        console.error('导入失败:', error);
        message.error('导入失败，请检查文件格式');
      }
    };
    
    reader.readAsArrayBuffer(excelFile);
    
    // 阻止默认上传行为
    return false;
  };

  // 导出会员
  const handleExport = () => {
    if (filteredUsers.length === 0) {
      message.warning('当前没有可导出的数据');
      return;
    }
    
    setLoading(true);
    
    try {
      // 准备导出数据
      const exportData = filteredUsers.map(user => ({
        '用户ID': user.id,
        '用户名': user.username,
        '邮箱': user.email,
        '手机号': user.phone,
        '公众号OpenID': user.openid,
        '角色': user.role === 'seller' ? '商家' : '买家',
        '会员等级': user.membership,
        '状态': user.status === 1 ? '启用' : '禁用',
        '注册时间': user.createdAt,
        '最后登录': user.lastLogin
      }));
      
      // 创建工作簿和工作表
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '会员数据');
      
      // 设置列宽
      const colWidths = [
        { wch: 15 }, // 用户ID
        { wch: 10 }, // 用户名
        { wch: 25 }, // 邮箱
        { wch: 15 }, // 手机号
        { wch: 25 }, // 公众号OpenID
        { wch: 8 },  // 角色
        { wch: 12 }, // 会员等级
        { wch: 8 },  // 状态
        { wch: 20 }, // 注册时间
        { wch: 20 }  // 最后登录
      ];
      ws['!cols'] = colWidths;
      
      // 导出文件
      XLSX.writeFile(wb, `会员数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`);
      
      message.success(`成功导出 ${filteredUsers.length} 条会员数据`);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 下载导入模板
  const handleDownloadTemplate = () => {
    try {
      // 创建模板数据
      const templateData = [
        {
          '用户名': '张三',
          '手机号': '13800138000',
          '邮箱': 'zhangsan@example.com',
          '角色': '买家', // 买家/商家
          '会员等级': '普通会员', // 普通会员/VIP/高级会员
          '状态': '启用' // 启用/禁用
        }
      ];
      
      // 创建工作簿和工作表
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '会员导入模板');
      
      // 设置列宽
      const colWidths = [
        { wch: 10 }, // 用户名
        { wch: 15 }, // 手机号
        { wch: 25 }, // 邮箱
        { wch: 8 },  // 角色
        { wch: 12 }, // 会员等级
        { wch: 8 }   // 状态
      ];
      ws['!cols'] = colWidths;
      
      // 导出文件
      XLSX.writeFile(wb, '会员导入模板.xlsx');
      
      message.success('模板下载成功');
    } catch (error) {
      console.error('模板下载失败:', error);
      message.error('模板下载失败，请稍后重试');
    }
  };

  // 上传文件前的检查
  const beforeUpload = (file) => {
    const isExcel = file.type === 'application/vnd.ms-excel' || 
                   file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const isLt10M = file.size / 1024 / 1024 < 10;
    
    if (!isExcel) {
      message.error('请上传Excel文件!');
      return Upload.LIST_IGNORE;
    }
    if (!isLt10M) {
      message.error('文件大小不能超过10MB!');
      return Upload.LIST_IGNORE;
    }
    
    // 自动触发导入处理
    if (uploadButtonRef.current) {
      handleImport({ file });
    }
    
    return Upload.LIST_IGNORE;
  };

  // 分页数据处理
  const getPagedData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUsers.slice(startIndex, endIndex);
  };

  // 表格列配置
  const columns = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      fixed: 'left'
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 60,
      render: (avatar) => (
        <img src={avatar} alt="用户头像" className="user-avatar" />
      )
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120
    },
    {
      title: '公众号OpenID',
      dataIndex: 'openid',
      key: 'openid',
      width: 200
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 80,
      render: (role) => (
        <Tag className={role === 'seller' ? 'role-seller' : 'role-buyer'}>
          {role === 'seller' ? '商家' : '买家'}
        </Tag>
      )
    },
    {
      title: '会员等级',
      dataIndex: 'membership',
      key: 'membership',
      width: 100,
      render: (membership) => {
        let className = 'membership-default';
        if (membership === 'VIP') className = 'membership-vip';
        else if (membership === '高级会员') className = 'membership-premium';
        return <Tag className={className}>{membership}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status, record) => (
        <div className="status-container">
          <Tag className={status === 1 ? 'status-active' : 'status-inactive'}>
            {status === 1 ? '已启用' : '已禁用'}
          </Tag>
          <Button
            size="small"
            type={status === 1 ? 'default' : 'primary'}
            danger={status === 1}
            className={`status-toggle-btn`}
            onClick={(e) => {
              e.stopPropagation();
              toggleStatus(record.id, status);
            }}
          >
            {status === 1 ? '禁用' : '启用'}
          </Button>
        </div>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <div className="action-buttons">
          <Button 
            className="action-btn view-btn" 
            onClick={(e) => {
              e.stopPropagation();
              handleView(record);
            }} 
            size="small"
          >
            查看
          </Button>
          <Button 
            className="action-btn edit-btn" 
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }} 
            size="small"
          >
            编辑
          </Button>
          <Button 
            className="action-btn delete-btn" 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record.id);
            }} 
            size="small"
            danger
          >
            删除
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        {/* 功能按钮区域 */}
        <div className="function-buttons">
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddMember}
            className="add-button"
          >
            添加会员
          </Button>
          <Upload 
            beforeUpload={beforeUpload} 
            showUploadList={false}
          >
            <Button 
              ref={uploadButtonRef}
              icon={<UploadOutlined />} 
              className="import-button"
            >
              导入会员
            </Button>
          </Upload>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
            className="export-button"
            loading={loading}
          >
            导出会员
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleDownloadTemplate}
            className="template-button"
          >
            下载模板
          </Button>
        </div>
        
        {/* 搜索区域 - 按照订单页面样式 */}
        <div className="search-area" style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
          {/* 第一行搜索条件 */}
          <Row gutter={16} align="middle" style={{ marginBottom: '16px' }}>
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>会员ID</span>
              <Input 
                placeholder="请输入会员ID" 
                value={searchConditions.id || ''} 
                onChange={(e) => updateSearchCondition('id', e.target.value)}
                style={{ width: 180, height: 32 }}
              />
            </Col>
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>用户名</span>
              <Input 
                placeholder="请输入用户名" 
                value={searchConditions.username || ''} 
                onChange={(e) => updateSearchCondition('username', e.target.value)}
                style={{ width: 180, height: 32 }}
              />
            </Col>
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>邮箱</span>
              <Input 
                placeholder="请输入邮箱" 
                value={searchConditions.email || ''} 
                onChange={(e) => updateSearchCondition('email', e.target.value)}
                style={{ width: 180, height: 32 }}
              />
            </Col>
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>状态筛选</span>
              <Select
                placeholder="全部状态"
                value={statusFilter}
                onChange={handleFilter}
                style={{ width: 120, height: 32 }}
              >
                <Option value="all">全部状态</Option>
                <Option value="active">已启用</Option>
                <Option value="inactive">已禁用</Option>
              </Select>
            </Col>
          </Row>
          
          {/* 第二行搜索条件 */}
          <Row gutter={16} align="middle">
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>手机号</span>
              <Input 
                placeholder="请输入手机号" 
                value={searchConditions.phone || ''} 
                onChange={(e) => updateSearchCondition('phone', e.target.value)}
                style={{ width: 180, height: 32 }}
              />
            </Col>
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>公众号OpenID</span>
              <Input 
                placeholder="请输入公众号OpenID" 
                value={searchConditions.openid || ''} 
                onChange={(e) => updateSearchCondition('openid', e.target.value)}
                style={{ width: 180, height: 32 }}
              />
            </Col>
            
            {/* 操作按钮区域 */}
            <div className="search-actions-container" style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                onClick={handleAdvancedSearch} 
                style={{ 
                width: 80, 
                height: 32, 
                backgroundColor: '#ff0000', 
                borderColor: '#ff0000',
                color: 'white',
                color: '#ffffff',
                fontWeight: '500',
                fontSize: '14px',
                padding: '0 16px',
                // 确保文本颜色不会被覆盖
                textShadow: 'none'
              }}
              >
                搜索
              </Button>
              <Button 
                onClick={handleResetSearch} 
                style={{ 
                  width: 80, 
                  height: 32 
                }}
              >
                重置
              </Button>
            </div>
          </Row>
        </div>
      </div>

      <div className="user-table-container">
        <Table
          columns={columns}
          dataSource={getPagedData()}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handlePageChange
          }}
          className="user-table"
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </div>

      {/* 用户详情模态框 */}
      <Modal
        title="用户详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedUser && (
          <div className="user-detail">
            <div className="detail-header">
              <img src={selectedUser.avatar} alt="用户头像" className="detail-avatar" />
              <div className="detail-info">
                <h3>{selectedUser.username}</h3>
                <p>用户ID: {selectedUser.id}</p>
              </div>
            </div>
            <div className="detail-content">
              <div className="detail-row">
                <span className="detail-label">邮箱:</span>
                <span className="detail-value">{selectedUser.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">手机号:</span>
                <span className="detail-value">{selectedUser.phone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">公众号OpenID:</span>
                <span className="detail-value">{selectedUser.openid}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">角色:</span>
                <span className="detail-value">{selectedUser.role === 'seller' ? '商家' : '买家'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">会员等级:</span>
                <span className="detail-value">{selectedUser.membership}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">状态:</span>
                <span className="detail-value">{selectedUser.status === 1 ? '已启用' : '已禁用'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">注册时间:</span>
                <span className="detail-value">{selectedUser.createdAt}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">最后登录:</span>
                <span className="detail-value">{selectedUser.lastLogin}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 添加会员模态框 */}
      <Modal
        title="添加会员"
        open={addModalVisible}
        onCancel={handleAddModalClose}
        onOk={handleSaveMember}
        footer={[
          <Button key="cancel" onClick={handleAddModalClose}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveMember} loading={loading}>
            保存
          </Button>
        ]}
        width={600}
      >
        <div className="add-member-form">
          <Form
            form={form}
            layout="vertical"
            className="member-form"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
              className="form-item"
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="请输入用户名"
                className="form-input"
              />
            </Form.Item>
            
            <div className="form-row">
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { 
                    pattern: /^1[3-9]\d{9}$/, 
                    message: '请输入正确的手机号'
                  }
                ]}
                className="form-item"
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="请输入手机号"
                  className="form-input"
                />
              </Form.Item>
              
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { 
                    type: 'email', 
                    message: '请输入正确的邮箱地址'
                  }
                ]}
                className="form-item"
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="请输入邮箱"
                  className="form-input"
                />
              </Form.Item>
            </div>
            
            <Form.Item
              name="openid"
              label="公众号OpenID"
              className="form-item"
            >
              <Input placeholder="请输入公众号OpenID（可选）" className="form-input" />
            </Form.Item>
            
            <div className="form-row">
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
                className="form-item"
              >
                <Select placeholder="请选择角色" className="form-select">
                  <Option value="buyer">买家</Option>
                  <Option value="seller">商家</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="membership"
                label="会员等级"
                rules={[{ required: true, message: '请选择会员等级' }]}
                className="form-item"
              >
                <Select placeholder="请选择会员等级" className="form-select">
                  <Option value="普通会员">普通会员</Option>
                  <Option value="高级会员">高级会员</Option>
                  <Option value="VIP">VIP</Option>
                </Select>
              </Form.Item>
            </div>
            
            <Form.Item
              name="status"
              label="状态"
              initialValue="active"
              rules={[{ required: true, message: '请选择状态' }]}
              className="form-item"
            >
              <Select placeholder="请选择状态" className="form-select">
                <Option value="active">启用</Option>
                <Option value="inactive">禁用</Option>
              </Select>
            </Form.Item>
            
            <div className="form-hint">
              <p>注：</p>
              <ul>
                <li>用户名、手机号或邮箱至少填写一项</li>
                <li>手机号和邮箱会用于用户登录和找回密码</li>
                <li>公众号OpenID为空时将自动生成</li>
              </ul>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default UserList;