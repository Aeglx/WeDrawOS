import React, { useState, useEffect } from 'react';
import { Table, Pagination, Card, message } from 'antd';
import './Feedback.css';

// 模拟反馈数据
const mockFeedbackData = [
  {
    key: '1',
    memberName: 'GOODS',
    phoneNumber: '130******111',
    feedbackContent: '系统需要优化',
    type: '功能建议',
    createTime: '2025-11-07 14:27:10'
  },
  {
    key: '2',
    memberName: 'GOODS',
    phoneNumber: '130******111',
    feedbackContent: '入住流程有些繁琐，建议改进一下',
    type: '优化反馈',
    createTime: '2025-05-09 15:45:53'
  },
  {
    key: '3',
    memberName: '微信用户',
    phoneNumber: '',
    feedbackContent: '审批可以快一点吗',
    type: '功能建议',
    createTime: '2025-07-16 15:55:34'
  },
  {
    key: '4',
    memberName: 'Super God',
    phoneNumber: '130******561',
    feedbackContent: '能不能多增加些不同等级的使用权限',
    type: '功能建议',
    createTime: '2025-06-27 10:04:42'
  },
  {
    key: '5',
    memberName: '用户4147187',
    phoneNumber: '159******661',
    feedbackContent: '2222222222222',
    type: '功能建议',
    createTime: '2025-06-25 14:14:25'
  },
  {
    key: '6',
    memberName: '用户4147187',
    phoneNumber: '159******661',
    feedbackContent: '111111111',
    type: '其他意见',
    createTime: '2025-06-25 14:14:03'
  },
  {
    key: '7',
    memberName: '用户4147187',
    phoneNumber: '157******882',
    feedbackContent: 'q',
    type: '功能建议',
    createTime: '2025-06-25 14:15:09'
  },
  {
    key: '8',
    memberName: '微信用户',
    phoneNumber: '157******4300',
    feedbackContent: '测试',
    type: '功能建议',
    createTime: '2025-06-25 17:02:03'
  },
  {
    key: '9',
    memberName: '微信用户',
    phoneNumber: '',
    feedbackContent: '工作',
    type: '功能建议',
    createTime: '2025-06-25 09:12:18'
  },
  {
    key: '10',
    memberName: '张三',
    phoneNumber: '138******978',
    feedbackContent: '123',
    type: '功能建议',
    createTime: '2025-06-25 06:14:02'
  }
];

// 反馈类型映射
const feedbackTypeMap = {
  '功能建议': '功能建议',
  '优化反馈': '优化反馈',
  '其他意见': '其他意见'
};

const Feedback = () => {
  // 状态管理
  const [feedbackData, setFeedbackData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(274); // 总条数，模拟274条

  // 表格列配置
  const columns = [
    {
      title: '会员名称',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 150,
      ellipsis: true
    },
    {
      title: '手机号码',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 150,
      ellipsis: true
    },
    {
      title: '反馈内容',
      dataIndex: 'feedbackContent',
      key: 'feedbackContent',
      width: 300,
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      ellipsis: true,
      render: (text) => feedbackTypeMap[text] || text
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      ellipsis: true,
      render: (text, record) => (
        <button className="view-button">
          查看
        </button>
      )
    }
  ];

  // 组件挂载时初始化数据
  useEffect(() => {
    // 模拟API请求
    setTimeout(() => {
      setFeedbackData(mockFeedbackData);
    }, 500);
  }, []);

  // 处理页码变化
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
    // 这里可以添加实际的API请求，根据页码和每页条数获取数据
    message.info(`切换到第 ${page} 页，每页 ${size} 条`);
  };

  // 处理查看按钮点击
  const handleView = (record) => {
    message.info(`查看反馈: ${record.key}`);
    // 这里可以添加查看详情的逻辑，比如打开模态框展示详细内容
  };

  return (
    <div className="feedback-container">
      <Card title="意见反馈" className="feedback-card">
        <Table
          columns={columns}
          dataSource={feedbackData}
          pagination={false}
          bordered={false}
          rowKey="key"
          scroll={{ x: 1000 }}
        />
        <div className="feedback-pagination">
          <span className="total-count">共 {totalItems} 条</span>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onChange={handlePageChange}
            showSizeChanger
            pageSizeOptions={['10', '20', '50', '100']}
            showTotal={(total) => `共 ${total} 条`}
          />
        </div>
      </Card>
    </div>
  );
};

export default Feedback;