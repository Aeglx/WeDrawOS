import React, { useState } from 'react';
import { Table, Button, Tag, message, Modal, Form, Input } from 'antd';
import './AfterSaleReasons.css';

// 模拟数据
const generateMockReasons = () => {
  const reasons = [
    { id: '1', type: 'refund', creator: 'admin', reason: '不满意的产品', time: '2025-09-17 15:55:37' },
    { id: '2', type: 'refund', creator: 'admin', reason: '买多了', time: '2025-08-07 10:54:16' },
    { id: '3', type: 'refund', creator: 'admin', reason: '我是好人1', time: '2025-07-31 15:55:25' },
    { id: '4', type: 'refund', creator: 'admin', reason: '不想要了1', time: '2025-07-16 14:25:40' },
    { id: '5', type: 'refund', creator: 'admin', reason: '买贵了', time: '2025-07-03 09:39:53' },
    { id: '6', type: 'refund', creator: 'admin', reason: '未签收已拒收', time: '2024-01-12 20:31:12' }
  ];
  return reasons;
};

const AfterSaleReasons = () => {
  const [activeTab, setActiveTab] = useState('refund');
  const [reasons, setReasons] = useState(generateMockReasons());
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const pageSize = 10;

  // 过滤当前标签页的原因
  const filteredReasons = reasons.filter(item => item.type === activeTab);

  // 分页数据
  const paginatedReasons = filteredReasons.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 切换标签页
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // 打开添加模态框
  const handleAdd = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // 提交表单，添加新原因
  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        // 生成新ID
        const newId = String(reasons.length + 1);
        // 创建新原因对象
        const newReason = {
          id: newId,
          type: activeTab,
          creator: 'admin', // 假设当前用户是admin
          reason: values.reason,
          time: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(/\//g, '-')
        };
        
        // 更新数据
        setReasons([...reasons, newReason]);
        
        // 关闭模态框并提示成功
        setIsModalVisible(false);
        message.success('添加成功');
      })
      .catch(info => {
        message.error('表单验证失败');
      });
  };

  // 编辑原因
  const handleEdit = (id) => {
    message.info(`编辑原因 ID: ${id}`);
  };

  // 删除原因
  const handleDelete = (id) => {
    message.info(`删除原因 ID: ${id}`);
  };

  // 表格列配置
  const columns = [
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 100,
      align: 'left',
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px', fontWeight: 'normal' } })
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px', fontWeight: 'normal' } })
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 180,
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px', fontWeight: 'normal' } })
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'left',
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px', fontWeight: 'normal' } }),
      render: (_, record) => (
        <span>
          <Button 
            type="link" 
            style={{ 
              color: '#ff4d4f',
              fontSize: '12px',
              padding: '0 4px',
              marginRight: '8px'
            }}
            onClick={() => handleEdit(record.id)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            style={{ 
              color: '#ff4d4f',
              fontSize: '12px',
              padding: '0 4px'
            }}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </span>
      )
    }
  ];

  return (
    <div className="after-sale-reasons-container">
      {/* 标签页 */}
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'refund' ? 'active' : ''}`}
          onClick={() => handleTabChange('refund')}
        >
          退款
        </div>
        <div 
          className={`tab ${activeTab === 'cancel' ? 'active' : ''}`}
          onClick={() => handleTabChange('cancel')}
        >
          取消
        </div>
        <div 
          className={`tab ${activeTab === 'return' ? 'active' : ''}`}
          onClick={() => handleTabChange('return')}
        >
          退货
        </div>
        <div 
          className={`tab ${activeTab === 'complaint' ? 'active' : ''}`}
          onClick={() => handleTabChange('complaint')}
        >
          投诉
        </div>
      </div>

      {/* 添加按钮 */}
      <div className="add-button-container">
        <Button 
          type="primary" 
          onClick={handleAdd}
          style={{
            backgroundColor: '#1890ff', // 修改为蓝色按钮
            borderColor: '#1890ff',
            color: '#fff',
            height: '32px',
            fontSize: '12px'
          }}
        >
          添加
        </Button>
      </div>

      {/* 添加原因模态框 */}
      <Modal
        title="添加售后原因"
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="确定"
        cancelText="取消"
        width={520}
        styles={{
          body: {
            padding: '20px 24px',
            fontSize: '12px'
          },
          footer: {
            padding: '16px 24px 16px 0',
            justifyContent: 'flex-end'
          }
        }}
        okButtonProps={{
          style: {
            backgroundColor: '#1890ff',
            borderColor: '#1890ff',
            fontSize: '12px',
            height: '32px'
          }
        }}
        cancelButtonProps={{
          style: {
            fontSize: '12px',
            height: '32px'
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ reason: '' }}
          style={{ fontSize: '12px' }}
        >
          <Form.Item
            label="售后类型"
            style={{
              marginBottom: '16px',
              fontSize: '12px'
            }}
          >
            <Input
              value={getTabName(activeTab)}
              disabled
              style={{
                fontSize: '12px',
                height: '32px'
              }}
            />
          </Form.Item>
          <Form.Item
            label="原因"
            name="reason"
            rules={[
              { required: true, message: '请输入原因' },
              { max: 50, message: '原因长度不能超过50个字符' }
            ]}
            style={{
              marginBottom: '0',
              fontSize: '12px'
            }}
          >
            <Input
              placeholder="请输入原因"
              maxLength={50}
              style={{
                fontSize: '12px',
                height: '32px'
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={paginatedReasons}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: filteredReasons.length,
          onChange: (page) => setCurrentPage(page),
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
          style: { fontSize: '12px' }
        }}
        style={{ fontSize: '12px' }}
        bordered
      />
    </div>
  );
};

// 根据类型获取标签名称
const getTabName = (type) => {
  const tabMap = {
    refund: '退款',
    cancel: '取消',
    return: '退货',
    complaint: '投诉'
  };
  return tabMap[type] || '';
};

export default AfterSaleReasons;