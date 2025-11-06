import React, { useState, useRef } from 'react';
import { Input, Button, Form, Select, Switch, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './AddArticle.css';

// 模拟分类数据
const mockCategories = [
  { label: '行业动态', value: '行业动态' },
  { label: '平台公告', value: '平台公告' },
  { label: '使用指南', value: '使用指南' },
  { label: '常见问题', value: '常见问题' }
];

// 富文本编辑器组件，根据截图实现
const RichTextEditor = ({ value, onChange, placeholder = '请输入内容' }) => {
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
      handleChange({ target: editorRef.current });
    }
  };
  
  // 处理图片上传（模拟）
  const handleImageUpload = () => {
    message.info('图片上传功能待实现');
  };
  
  return (
    <div className="rich-text-editor">
      {/* 上传图片按钮 */}
      <div className="rich-text-toolbar rich-text-toolbar-top">
        <Button 
          type="link" 
          icon={<UploadOutlined />} 
          onClick={handleImageUpload}
          style={{ color: '#1890ff' }}
        >
          上传图片
        </Button>
      </div>
      
      {/* 工具栏 */}
      <div className="rich-text-toolbar">
        <div className="rich-text-toolbar-main">
          {/* 文本格式化 */}
          <button 
            className="rich-text-button"
            onClick={() => handleFormat('bold')} 
            title="加粗"
          >
            <strong>B</strong>
          </button>
          <button 
            className="rich-text-button"
            onClick={() => handleFormat('italic')} 
            title="斜体"
          >
            <em>I</em>
          </button>
          <button 
            className="rich-text-button"
            onClick={() => handleFormat('underline')} 
            title="下划线"
          >
            <u>U</u>
          </button>
          
          <span className="rich-text-toolbar-separator">|</span>
          
          {/* 对齐 */}
          <button 
            className="rich-text-button"
            onClick={() => handleFormat('justifyLeft')} 
            title="左对齐"
          >
            ≡
          </button>
          <button 
            className="rich-text-button"
            onClick={() => handleFormat('justifyCenter')} 
            title="居中对齐"
          >
            ≡|
          </button>
          <button 
            className="rich-text-button"
            onClick={() => handleFormat('justifyRight')} 
            title="右对齐"
          >
            |≡
          </button>
          
          <span className="rich-text-toolbar-separator">|</span>
          
          {/* 列表 */}
          <button 
            className="rich-text-button"
            onClick={() => handleFormat('insertUnorderedList')} 
            title="无序列表"
          >
            •
          </button>
          <button 
            className="rich-text-button"
            onClick={() => handleFormat('insertOrderedList')} 
            title="有序列表"
          >
            1.
          </button>
          
          {/* 更多按钮按照截图要求 */}
          <span className="rich-text-toolbar-separator">|</span>
          <button className="rich-text-button" title="减少缩进" onClick={() => handleFormat('outdent')}>-</button>
          <button className="rich-text-button" title="增加缩进" onClick={() => handleFormat('indent')}>+</button>
          <span className="rich-text-toolbar-separator">|</span>
          <button className="rich-text-button" title="撤销" onClick={() => handleFormat('undo')}>↶</button>
          <button className="rich-text-button" title="重做" onClick={() => handleFormat('redo')}>↷</button>
          <span className="rich-text-toolbar-separator">|</span>
          <button className="rich-text-button" title="清除格式" onClick={() => handleFormat('removeFormat')}>⨯</button>
        </div>
      </div>
      
      {/* 编辑区域 */}
      <div
        ref={editorRef}
        className="rich-text-editor-content"
        contentEditable
        dangerouslySetInnerHTML={{ __html: value || '' }}
        onInput={handleChange}
        onBlur={handleChange}
        placeholder={placeholder}
      />
    </div>
  );
};

const AddArticle = () => {
  const [form] = Form.useForm();
  const [editorContent, setEditorContent] = useState('');
  const [showStatus, setShowStatus] = useState(false);
  
  // 处理富文本内容变化
  const handleEditorChange = (content) => {
    setEditorContent(content);
  };
  
  // 处理开关变化
  const handleShowChange = (checked) => {
    setShowStatus(checked);
  };
  
  // 处理表单提交
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const articleData = {
        ...values,
        content: editorContent,
        show: showStatus,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      };
      
      console.log('提交的文章数据:', articleData);
      message.success('文章添加成功');
      
      // 重置表单
      form.resetFields();
      setEditorContent('');
      setShowStatus(false);
    }).catch(error => {
      console.error('表单验证失败:', error);
    });
  };
  
  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setEditorContent('');
    setShowStatus(false);
    message.info('已取消操作');
  };
  
  return (
    <div className="add-article-container">
      <h2 className="add-article-header">添加文章</h2>
      
      <Form form={form} layout="vertical" className="add-article-form">
        {/* 文章标题 */}
        <Form.Item
          name="title"
          label="文章标题"
          rules={[{ required: true, message: '请输入文章标题' }]}
        >
          <Input placeholder="请输入文章标题" style={{ width: '300px' }} />
        </Form.Item>
        
        {/* 文章分类 */}
        <Form.Item
          name="category"
          label="文章分类"
          rules={[{ required: true, message: '请选择文章分类' }]}
        >
          <Select placeholder="请选择" style={{ width: '200px' }}>
            {mockCategories.map(cat => (
              <Select.Option key={cat.value} value={cat.value}>{cat.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        
        {/* 文章排序 */}
        <Form.Item
          name="sort"
          label="文章排序"
          rules={[{ required: true, message: '请输入排序值' }]}
        >
          <Input type="number" defaultValue={1} style={{ width: '100px' }} />
        </Form.Item>
        
        {/* 点击率（新增） */}
        <Form.Item
          name="viewCount"
          label="点击率"
          rules={[{ required: true, message: '请输入点击率' }]}
        >
          <Input type="number" defaultValue={0} style={{ width: '100px' }} />
        </Form.Item>
        
        {/* 发布时间（新增） */}
        <Form.Item
          name="publishTime"
          label="发布时间"
          rules={[{ required: true, message: '请输入发布时间' }]}
        >
          <Input 
            defaultValue={dayjs().format('YYYY-MM-DD HH:mm:ss')} 
            style={{ width: '200px' }} 
            placeholder="YYYY-MM-DD HH:mm:ss"
          />
        </Form.Item>
        
        {/* 文章内容 */}
        <Form.Item
          name="content"
          label="文章内容"
          rules={[{ required: true, message: '请输入文章内容' }]}
        >
          <RichTextEditor
            value={editorContent}
            onChange={handleEditorChange}
            placeholder="请输入文章内容"
          />
        </Form.Item>
        
        {/* 是否展示 */}
        <Form.Item
          name="show"
          label="是否展示"
        >
          <Switch 
            checked={showStatus} 
            onChange={handleShowChange}
            checkedChildren="显示" 
            unCheckedChildren="隐藏"
          />
        </Form.Item>
        
        {/* 操作按钮 */}
        <Form.Item className="add-article-actions">
          <Button onClick={handleCancel} style={{ marginRight: '8px' }}>
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            提交
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddArticle;