import React, { useState } from 'react';
import './ESSegment.css';
import { Table, Button, Modal, Form, Input, Pagination } from 'antd';

const ESSegment = () => {
  // 状态管理
  const [segments, setSegments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalItems = 977;

  // 模拟初始数据
  React.useEffect(() => {
    const mockData = Array.from({ length: 10 }, (_, index) => ({
      key: index + 1,
      word: `测试分词${index + 1}`,
      createTime: '2025-11-04 14:48:14',
      updateTime: '2025-11-04 14:48:14',
      operator: 'SYSTEM'
    }));
    setSegments(mockData);
  }, []);

  // 打开添加弹窗
  const showAddModal = () => {
    setIsModalVisible(true);
    form.resetFields();
  };

  // 关闭添加弹窗
  const handleCancelModal = () => {
    setIsModalVisible(false);
  };

  // 提交添加表单
  const handleSubmitForm = () => {
    form.validateFields()
      .then(values => {
        // 处理添加逻辑
        const newSegment = {
          key: segments.length + 1,
          word: values.word,
          createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          operator: 'SYSTEM'
        };
        setSegments([...segments, newSegment]);
        setIsModalVisible(false);
      })
      .catch(errorInfo => {
        console.log('表单验证失败:', errorInfo);
      });
  };

  // 分页变化
  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    // 这里应该调用API获取对应页的数据
    console.log('页码:', page, '每页条数:', pageSize);
  };

  // 表格列配置
  const columns = [
    {
      title: '自定义分词',
      dataIndex: 'word',
      key: 'word',
      width: 200
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 180
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 120
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <>
          <Button type="link" danger size="small">修改</Button>
          <Button type="link" danger size="small">删除</Button>
        </>
      )
    }
  ];

  return (
    <div className="es-segment-container">
      <div className="es-segment-header">
        <Button type="primary" onClick={showAddModal}>
          添加
        </Button>
      </div>

      <Table
        className="es-segment-table"
        columns={columns}
        dataSource={segments}
        pagination={false}
        bordered={false}
      />

      <div className="es-segment-pagination">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalItems}
          onChange={handlePageChange}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `共${total}条`}
          pageSizeOptions={['10', '20', '50', '100']}
        />
      </div>

      {/* 添加弹窗 */}
      <Modal
        title="添加"
        visible={isModalVisible}
        onCancel={handleCancelModal}
        footer={[
          <Button key="back" onClick={handleCancelModal}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmitForm}>
            提交
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="word"
            label="自定义分词"
            rules={[{ required: true, message: '请输入自定义分词' }]}
          >
            <Input placeholder="请输入自定义分词" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ESSegment;