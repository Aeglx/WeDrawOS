import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Table, Switch, message, Modal, Form, InputNumber, Upload, DatePicker, Select } from 'antd';
import { SearchOutlined, DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
// 内置的简单富文本编辑器组件，避免ReactQuill的findDOMNode警告
const SimpleRichTextEditor = ({ value, onChange, placeholder = '请输入内容' }) => {
  const editorRef = useRef(null);
  
  // 处理内容变化
  const handleChange = (e) => {
    const content = e.target.innerHTML;
    if (onChange) {
      onChange(content);
    }
  };
  
  // 处理格式化操作
  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      // 触发change事件以更新状态
      handleChange({ target: editorRef.current });
    }
  };
  
  // 图标函数，提供更美观的按钮图标
  const getFormatIcon = (type) => {
    const icons = {
      bold: 'B',
      italic: 'I',
      underline: 'U',
      strikeThrough: 'S',
      insertUnorderedList: '•',
      insertOrderedList: '1.',
      justifyLeft: '⇤',
      justifyCenter: '⇔',
      justifyRight: '⇥',
      h1: 'H1',
      h2: 'H2',
      p: 'P',
      removeFormat: '清除'
    };
    return icons[type] || '';
  };
  
  return (
    <div className="rich-text-editor-custom" style={{ border: '1px solid #d9d9d9', borderRadius: '6px', overflow: 'hidden' }}>
      {/* 自定义工具栏 */}
      <div 
        className="editor-toolbar"
        style={{
          padding: '8px 12px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #d9d9d9',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap'
        }}
      >
        {/* 文本格式化按钮组 */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <button 
            onClick={() => handleFormat('bold')} 
            title="加粗"
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '28px',
              textAlign: 'center',
              '&:hover': { borderColor: '#40a9ff' }
            }}
          >
            <strong>{getFormatIcon('bold')}</strong>
          </button>
          <button 
            onClick={() => handleFormat('italic')} 
            title="斜体"
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '28px',
              textAlign: 'center'
            }}
          >
            <em>{getFormatIcon('italic')}</em>
          </button>
          <button 
            onClick={() => handleFormat('underline')} 
            title="下划线"
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '28px',
              textAlign: 'center'
            }}
          >
            <u>{getFormatIcon('underline')}</u>
          </button>
          <button 
            onClick={() => handleFormat('strikeThrough')} 
            title="删除线"
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '28px',
              textAlign: 'center'
            }}
          >
            <s>{getFormatIcon('strikeThrough')}</s>
          </button>
        </div>
        
        <span style={{width: '1px', height: '20px', backgroundColor: '#ddd', margin: '0 8px'}}></span>
        
        {/* 列表按钮组 */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <button 
            onClick={() => handleFormat('insertUnorderedList')} 
            title="无序列表"
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '50px',
              textAlign: 'center'
            }}
          >
            {getFormatIcon('insertUnorderedList')} 列表
          </button>
          <button 
            onClick={() => handleFormat('insertOrderedList')} 
            title="有序列表"
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '50px',
              textAlign: 'center'
            }}
          >
            {getFormatIcon('insertOrderedList')} 列表
          </button>
        </div>
        
        <span style={{width: '1px', height: '20px', backgroundColor: '#ddd', margin: '0 8px'}}></span>
        
        {/* 对齐按钮组 */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <button 
            onClick={() => handleFormat('justifyLeft')} 
            title="左对齐"
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '36px',
              textAlign: 'center'
            }}
          >
            {getFormatIcon('justifyLeft')}
          </button>
          <button 
            onClick={() => handleFormat('justifyCenter')} 
            title="居中对齐"
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '36px',
              textAlign: 'center'
            }}
          >
            {getFormatIcon('justifyCenter')}
          </button>
          <button 
            onClick={() => handleFormat('justifyRight')} 
            title="右对齐"
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '36px',
              textAlign: 'center'
            }}
          >
            {getFormatIcon('justifyRight')}
          </button>
        </div>
        
        <span style={{width: '1px', height: '20px', backgroundColor: '#ddd', margin: '0 8px'}}></span>
        
        {/* 标题按钮组 */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <button 
            onClick={() => handleFormat('formatBlock', 'h1')} 
            title="标题1"
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '36px',
              textAlign: 'center'
            }}
          >
            {getFormatIcon('h1')}
          </button>
          <button 
            onClick={() => handleFormat('formatBlock', 'h2')} 
            title="标题2"
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '36px',
              textAlign: 'center'
            }}
          >
            {getFormatIcon('h2')}
          </button>
          <button 
            onClick={() => handleFormat('formatBlock', 'p')} 
            title="段落"
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '36px',
              textAlign: 'center'
            }}
          >
            {getFormatIcon('p')}
          </button>
        </div>
        
        <span style={{width: '1px', height: '20px', backgroundColor: '#ddd', margin: '0 8px'}}></span>
        
        {/* 其他工具按钮 */}
        <button 
          onClick={() => handleFormat('removeFormat')} 
          title="清除格式"
          style={{
            padding: '4px 8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            minWidth: '48px',
            textAlign: 'center'
          }}
        >
          {getFormatIcon('removeFormat')}
        </button>
      </div>
      
      {/* 编辑区域 */}
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        dangerouslySetInnerHTML={{ __html: value || '' }}
        onInput={handleChange}
        onBlur={handleChange}
        placeholder={placeholder}
        style={{
          minHeight: '250px',
          padding: '16px',
          outline: 'none',
          lineHeight: '1.8',
          backgroundColor: 'white',
          fontSize: '14px'
        }}
      />
    </div>
  );
};
import './ArticleManage.css';

const { Search } = Input;

// 模拟分类数据
const mockCategories = [
  { label: '行业动态', value: '行业动态' },
  { label: '平台公告', value: '平台公告' },
  { label: '使用指南', value: '使用指南' },
  { label: '常见问题', value: '常见问题' }
];

// 模拟数据
const mockArticles = [
  {
    id: '1',
    categoryName: '行业动态',
    title: '关于AI绘画技术的发展前景',
    isTop: true,
    sort: 12,
    viewCount: 156,
    author: '系统管理员',
    publishDate: '2023-11-15',
    content: 'AI绘画技术正在快速发展...',
    attachments: []
  },
  {
    id: '2',
    categoryName: '平台公告',
    title: '平台维护通知：2023年12月25日系统升级',
    isTop: false,
    sort: 3,
    viewCount: 234,
    author: '运营团队',
    publishDate: '2023-12-20',
    content: '为了提供更好的服务...',
    attachments: []
  },
  {
    id: '3',
    categoryName: '使用指南',
    title: '设计师入驻流程详细说明',
    isTop: false,
    sort: 2,
    viewCount: 567,
    author: '客服中心',
    publishDate: '2023-11-10',
    content: '欢迎各位设计师加入我们的平台...',
    attachments: []
  },
  {
    id: '4',
    categoryName: '常见问题',
    title: '如何提高作品曝光率？',
    isTop: false,
    sort: 1,
    viewCount: 890,
    author: '内容运营',
    publishDate: '2023-12-05',
    content: '要提高作品曝光率，您可以尝试以下方法...',
    attachments: []
  },
  {
    id: '5',
    categoryName: '行业动态',
    title: '用户最喜爱的设计风格分析报告',
    isTop: true,
    sort: 1,
    viewCount: 1234,
    author: '数据分析组',
    publishDate: '2023-11-30',
    content: '根据我们的数据分析...',
    attachments: []
  },
  {
    id: '6',
    categoryName: '平台公告',
    title: '新功能上线：AI辅助设计工具',
    isTop: false,
    sort: 1234,
    viewCount: 789,
    author: '产品经理',
    publishDate: '2023-12-15',
    content: '我们很高兴地宣布...',
    attachments: []
  }
];

const ArticleManage = () => {
  // 初始化状态
  const [articles, setArticles] = useState([]);
  // Removed richTextRef as SimpleRichTextEditor doesn't require it
  const [searchValue, setSearchValue] = useState('');
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [sortValue, setSortValue] = useState(0);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPublishModalVisible, setIsPublishModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'edit' or 'publish'
  const [form] = Form.useForm();
  const [uploadFileList, setUploadFileList] = useState([]);
  const [editorContent, setEditorContent] = useState(''); // 富文本内容

  // 富文本编辑器配置已在RichTextEditor组件中定义

  // 处理富文本内容变化
  const handleEditorChange = (content) => {
    setEditorContent(content);
  };

  // 初始化加载数据
  useEffect(() => {
    setArticles(mockArticles);
    setFilteredArticles(mockArticles);
  }, []);

  // 处理搜索
  const handleSearch = (value) => {
    setSearchValue(value);
    if (value.trim() === '') {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(article => 
        article.title.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredArticles(filtered);
    }
  };

  // 处理置顶状态切换
  const handleTopChange = (checked, record) => {
    const updatedArticles = articles.map(article => 
      article.id === record.id ? { ...article, isTop: checked } : article
    );
    setArticles(updatedArticles);
    handleSearch(searchValue); // 重新应用搜索过滤
    message.success(`${checked ? '置顶' : '取消置顶'}成功`);
  };

  // 打开排序对话框
  const handleOpenSortModal = (record) => {
    setCurrentArticle(record);
    setSortValue(record.sort);
    form.setFieldsValue({ sort: record.sort });
    setSortModalVisible(true);
  };

  // 处理排序更新
  const handleUpdateSort = () => {
    form.validateFields().then(values => {
      const updatedArticles = articles.map(article => 
        article.id === currentArticle.id ? { ...article, sort: values.sort } : article
      );
      setArticles(updatedArticles);
      handleSearch(searchValue); // 重新应用搜索过滤
      setSortModalVisible(false);
      message.success('排序更新成功');
    });
  };

  // 处理编辑
  const handleEdit = (record) => {
    form.setFieldsValue({
      categoryName: record.categoryName,
      title: record.title,
      author: record.author,
      publishDate: dayjs(record.publishDate),
      viewCount: record.viewCount,
      isTop: record.isTop,
      sort: record.sort
    });
    // 富文本内容单独处理
    setEditorContent(record.content || '');
    setUploadFileList(record.attachments || []);
    setCurrentArticle(record);
    setModalType('edit');
    setIsEditModalVisible(true);
  };

  // 处理发布文章
  const handlePublishArticle = () => {
    form.resetFields();
    setEditorContent(''); // 重置富文本内容
    setUploadFileList([]);
    setModalType('publish');
    setIsPublishModalVisible(true);
  };

  // 处理表单提交（编辑或发布）
  const handleFormSubmit = () => {
    form.validateFields().then(values => {
      let updatedArticles;
      const articleData = {
        ...values,
        publishDate: values.publishDate ? values.publishDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        attachments: uploadFileList,
        content: editorContent // 添加富文本内容
      };

      if (modalType === 'edit') {
        // 编辑现有文章
        updatedArticles = articles.map(article => 
          article.id === currentArticle.id ? { ...article, ...articleData } : article
        );
        message.success('文章编辑成功');
        setIsEditModalVisible(false);
      } else {
        // 发布新文章
        const newArticle = {
          id: String(Date.now()),
          ...articleData,
          viewCount: 0 // 新文章初始点击率为0
        };
        updatedArticles = [newArticle, ...articles];
        message.success('文章发布成功');
        setIsPublishModalVisible(false);
      }

      setArticles(updatedArticles);
      handleSearch(searchValue);
    });
  };

  // 处理文件上传
  const handleUploadChange = ({ fileList }) => {
    setUploadFileList(fileList);
  };

  // 渲染文章编辑/发布表单
  const renderArticleForm = () => {
    const isPublish = modalType === 'publish';
    const visible = isPublish ? isPublishModalVisible : isEditModalVisible;
    const onCancel = isPublish ? () => setIsPublishModalVisible(false) : () => setIsEditModalVisible(false);

    return (
      <Modal
        title={isPublish ? '发布文章' : '编辑文章'}
        open={visible}
        onOk={handleFormSubmit}
        onCancel={onCancel}
        width={900}
        okText="保存"
        cancelText="取消"
        centered
        styles={{
          body: {
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: '24px'
          }
        }}
      >
        <Form form={form} layout="horizontal" style={{ maxWidth: '850px', margin: '0 auto' }}>
          {/* 优化布局的表单 */}
          <div style={{ marginBottom: '24px' }}>
            <Form.Item
              name="categoryName"
              label="分类名称"
              rules={[{ required: true, message: '请选择文章分类' }]}
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Select placeholder="请选择文章分类" style={{ width: '30%' }}>
                {mockCategories.map(cat => (
                  <Select.Option key={cat.value} value={cat.value}>{cat.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* 第一行：标题和作者 - 优化样式 */}
          <div style={{ marginBottom: '24px' }}>
            <Form.Item
              name="title"
              label="文章标题"
              rules={[{ required: true, message: '请输入文章标题' }]}
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 14 }}
            >
              <Input placeholder="请输入文章标题" style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="author"
              label="作者"
              rules={[{ required: true, message: '请输入作者' }]}
              labelCol={{ span: 4, offset: 14 }}
              wrapperCol={{ span: 6 }}
            >
              <Input placeholder="请输入作者" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          {/* 第二行：发布日期、是否置顶和排序 - 优化布局 */}
          <div style={{ marginBottom: '24px' }}>
            <Form.Item
              name="publishDate"
              label="发布日期"
              rules={[{ required: true, message: '请选择发布日期' }]}
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 6 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="isTop"
              label="是否置顶"
              valuePropName="checked"
              labelCol={{ span: 4, offset: 2 }}
              wrapperCol={{ span: 6 }}
            >
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>

            <Form.Item
              name="sort"
              label="排序"
              rules={[{ required: true, message: '请输入排序值' }]}
              labelCol={{ span: 4, offset: 2 }}
              wrapperCol={{ span: 2 }}
            >
              <InputNumber min={1} placeholder="排序" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          {/* 点击率（仅编辑时显示） */}
          {!isPublish && (
            <div style={{ marginBottom: '24px' }}>
              <Form.Item
                name="viewCount"
                label="点击率"
                rules={[{ required: true, message: '请输入点击率' }]}
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 6 }}
              >
                <InputNumber min={0} placeholder="点击率" style={{ width: '100%' }} />
              </Form.Item>
            </div>
          )}

          {/* 文章内容 - 优化布局和样式 */}
          <div style={{ marginBottom: '24px' }}>
            <Form.Item
              label="文章内容"
              rules={[{ required: true, message: '请输入文章内容' }]}
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <SimpleRichTextEditor
                value={editorContent}
                onChange={handleEditorChange}
                placeholder="请输入文章内容"
              />
            </Form.Item>
          </div>

          {/* 附件上传 - 优化样式 */}
          <div style={{ marginBottom: '16px' }}>
            <Form.Item
              label="附件上传"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Upload
                multiple
                fileList={uploadFileList}
                onChange={handleUploadChange}
                beforeUpload={() => false} // 阻止自动上传，实际项目中根据需求调整
                showUploadList={true}
              >
                <Button type="primary" icon={<UploadOutlined />}>
                  选择文件
                </Button>
              </Upload>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    );
  };

  // 处理删除
  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文章${record.title}吗？`,
      onOk: () => {
        const updatedArticles = articles.filter(article => article.id !== record.id);
        setArticles(updatedArticles);
        handleSearch(searchValue); // 重新应用搜索过滤
        message.success('文章删除成功');
      }
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '分类名称',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 120
    },
    {
      title: '文章标题',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '点击率',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
      render: (viewCount) => (
        <span className="view-count">{viewCount}</span>
      )
    },
    {
      title: '是否置顶',
      dataIndex: 'isTop',
      key: 'isTop',
      width: 100,
      render: (isTop, record) => (
        <Switch
          checked={isTop}
          onChange={(checked) => handleTopChange(checked, record)}
          checkedChildren="是"
          unCheckedChildren="否"
        />
      )
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 100,
      render: (sort, record) => (
        <InputNumber
          min={1}
          value={sort}
          onChange={() => handleOpenSortModal(record)}
          className="sort-input"
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <span>
          <Button
            type="primary"
            size="small"
            onClick={() => handleEdit(record)}
            className="edit-button"
          >
            编辑
          </Button>
          <Button
            danger
            size="small"
            onClick={() => handleDelete(record)}
            className="delete-button"
          >
            删除
          </Button>
        </span>
      )
    }
  ];

  return (
    <div className="article-manage-container">
      {/* 操作区域 */}
      <div className="operation-area">
        {/* 搜索区域 */}
        <div className="search-area">
          <Search
            placeholder="输入文章标题搜索"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={handleSearch}
            onChange={(e) => setSearchValue(e.target.value)}
            className="article-search-input"
          />
          <Button type="primary" className="search-button" onClick={() => handleSearch(searchValue)}>
            搜索
          </Button>
        </div>
        
        {/* 发布按钮 */}
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          className="publish-button"
          onClick={handlePublishArticle}
        >
          发布文章
        </Button>
      </div>

      {/* 表格区域 */}
      <div className="table-area">
        <Table
          columns={columns}
          dataSource={filteredArticles}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: false
          }}
          className="article-table"
        />
      </div>

      {/* 排序对话框 */}
      <Modal
        title="修改排序"
        open={sortModalVisible}
        onOk={handleUpdateSort}
        onCancel={() => setSortModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="sort"
            label="排序值"
            rules={[{ required: true, message: '请输入排序值' }]}
          >
            <InputNumber
              min={1}
              onChange={(value) => setSortValue(value)}
              placeholder="请输入排序值"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 文章编辑/发布对话框 */}
      {renderArticleForm()}
    </div>
  );
};

export default ArticleManage;