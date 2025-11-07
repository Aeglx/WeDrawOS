import React, { useState, useRef, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Switch, message } from 'antd';
import './AddArticle.css';

const { TextArea } = Input;
const { Option } = Select;

// 分类数据
const categoryData = [
  { value: '1', label: '行业动态' },
  { value: '2', label: '平台公告' },
  { value: '3', label: '使用指南' },
  { value: '4', label: '常见问题' },
];

// 富文本编辑器组件，严格按照图片样式实现
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
  
  return (
    <div className="rich-text-editor">
      {/* 工具栏 */}
      <div className="rich-text-toolbar">
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
        <span className="toolbar-separator">|</span>
        
        {/* 列表 */}
        <button 
          className="rich-text-button"
          onClick={() => handleFormat('insertUnorderedList')} 
          title="无序列表"
        >
          •列表
        </button>
        <button 
          className="rich-text-button"
          onClick={() => handleFormat('insertOrderedList')} 
          title="有序列表"
        >
          1.列表
        </button>
        <span className="toolbar-separator">|</span>
        
        {/* 撤销/重做 */}
        <button className="rich-text-button" title="撤销" onClick={() => handleFormat('undo')}>←</button>
        <button className="rich-text-button" title="重做" onClick={() => handleFormat('redo')}>→</button>
        <span className="toolbar-separator">|</span>
        
        {/* 标题 */}
        <button className="rich-text-button" title="H1" onClick={() => handleFormat('formatBlock', 'H1')}>H1</button>
        <button className="rich-text-button" title="H2" onClick={() => handleFormat('formatBlock', 'H2')}>H2</button>
        <button className="rich-text-button" title="段落" onClick={() => handleFormat('formatBlock', 'P')}>P</button>
        <span className="toolbar-separator">|</span>
        
        {/* 清除格式 */}
        <button className="rich-text-button" title="清除格式" onClick={() => handleFormat('removeFormat')}>清除</button>
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

const AddArticle = ({ visible = true, onClose, articleData = null }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  
  // 判断是编辑模式还是新增模式
  const isEditMode = !!articleData;
  
  // 初始化表单数据
  useEffect(() => {
    if (isEditMode && articleData) {
      form.setFieldsValue({
        category: articleData.category || '',
        title: articleData.title || '',
        author: articleData.author || '',
        publishDate: articleData.publishDate ? new Date(articleData.publishDate) : null,
        isTop: articleData.isTop || false,
        sortOrder: articleData.sortOrder || ''
      });
      setEditorContent(articleData.content || '');
    }
  }, [isEditMode, articleData, form]);

  const handleEditorChange = (value) => {
    setEditorContent(value);
  };
  
  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const submitData = {
        ...values,
        content: editorContent,
        publishDate: values.publishDate ? values.publishDate.format('YYYY-MM-DD') : ''
      };
      
      console.log('提交的文章数据:', submitData);
      message.success(isEditMode ? '文章更新成功' : '文章保存成功');
      if (onClose) onClose(submitData);
    } catch (error) {
      message.error('提交失败，请检查表单');
      console.error('提交错误:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理取消
  const handleCancel = () => {
    if (onClose) onClose();
  };
  
  // 处理关闭按钮
  const handleClose = () => {
    if (onClose) onClose();
  };
  
  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* 模态框标题栏 */}
        <div className="modal-header">
          <h2 className="modal-title">{isEditMode ? '编辑文章' : '发布文章'}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        {/* 模态框内容 */}
        <div className="modal-content">
          <Form form={form} layout="vertical" className="article-form">
            {/* 分类 */}
            <Form.Item
              name="category"
              label="分类"
              rules={[{ required: true, message: '请选择文章分类' }]}
            >
              <Select placeholder="请选择文章分类" style={{ width: '200px' }}>
                {categoryData.map(category => (
                  <Option key={category.value} value={category.value}>
                    {category.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 文章标题 */}
            <Form.Item
              name="title"
              label="文章标题"
              rules={[{ required: true, message: '请输入文章标题' }]}
            >
              <Input placeholder="请输入文章标题" />
            </Form.Item>

            {/* 作者 */}
            <Form.Item
              name="author"
              label="作者"
              rules={[{ required: true, message: '请输入作者' }]}
            >
              <Input placeholder="请输入作者" />
            </Form.Item>

            {/* 发布日期 */}
            <Form.Item
              name="publishDate"
              label="发布日期"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <DatePicker style={{ width: '200px' }} placeholder="请选择日期" />
            </Form.Item>

            {/* 是否置顶 */}
            <Form.Item
              name="isTop"
              label="是否置顶"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            {/* 排序 */}
            <Form.Item
              name="sortOrder"
              label="排序"
              rules={[{ required: true, message: '请输入排序号' }]}
            >
              <Input placeholder="请输入排序号" style={{ width: '100px' }} />
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
          </Form>
        </div>
        
        {/* 模态框底部按钮 */}
        <div className="modal-footer">
          <button 
            type="button" 
            onClick={handleCancel} 
            className="cancel-button"
          >
            取消
          </button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            className="submit-button"
            disabled={loading}
          >
            {isEditMode ? '更新' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddArticle;