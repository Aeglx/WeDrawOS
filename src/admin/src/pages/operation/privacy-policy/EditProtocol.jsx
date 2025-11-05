import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Button, Upload, message, Divider } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './EditProtocol.css';

const EditProtocol = ({ visible, onCancel, onSave, initialData = {} }) => {
  const [form] = Form.useForm();
  const [editorContent, setEditorContent] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 初始化数据
  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        title: initialData.title || '店铺入驻协议',
      });
      // 设置编辑器内容
      const defaultContent = `<p>甲方:成都绘梦艺画信息科技有限公司</p><p>XCC:</p><p>地址:成都高新区双柏路6号6栋1层9号</p><p><img src="https://img.alicdn.com/imgextra/i1/O1CN01VQ6YQ629y0tWgWXHw_!!6000000008280-0-tps-1920-1080.jpg" /></p>`;
      setEditorContent(initialData.content || defaultContent);
      setPreviewHtml(initialData.content || defaultContent);
    }
  }, [visible, initialData, form]);

  // 处理编辑器内容变化
  const handleEditorChange = (content) => {
    setEditorContent(content);
    setPreviewHtml(content);
  };

  // 自定义工具栏配置
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // 文本格式
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],               // 标题
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],     // 列表
      [{ 'script': 'sub'}, { 'script': 'super' }],      // 上标/下标
      [{ 'indent': '-1'}, { 'indent': '+1' }],          // 缩进
      [{ 'direction': 'rtl' }],                         // 文本方向
      [{ 'size': ['small', false, 'large', 'huge'] }],  // 字体大小
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],        // 标题级别
      [{ 'color': [] }, { 'background': [] }],          // 文字颜色/背景色
      [{ 'font': [] }],                                 // 字体
      [{ 'align': [] }],                                // 对齐方式
      ['clean'],                                        // 清除格式
      ['link', 'image', 'video']                        // 链接、图片、视频
    ],
  };

  // 格式配置
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  // 处理图片上传
  const handleImageUpload = (file) => {
    // 模拟上传，实际项目中应该调用上传接口
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const imgTag = `<img src="${reader.result}" alt="上传图片" />`;
      setEditorContent(prev => prev + imgTag);
      setPreviewHtml(prev => prev + imgTag);
      setImageUrl(reader.result);
    };
    return false; // 阻止自动上传
  };

  // 处理提交
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const data = {
        title: values.title,
        content: editorContent,
      };
      onSave && onSave(data);
      message.success('保存成功');
    });
  };

  // 计算模态框大小
  const getModalStyle = useCallback(() => {
    // 基于窗口大小计算模态框尺寸，确保有足够的边距
    const width = Math.min(windowWidth - 80, 900);
    const height = Math.min(windowHeight - 100, 700);
    
    return {
      width: width,
      maxHeight: height,
    };
  }, [windowWidth, windowHeight]);

  return (
      <Modal
        title="编辑协议"
        open={visible}
        onCancel={onCancel}
        footer={null}
        width="90%"
        className="edit-protocol-modal"
        styles={{
          body: {
            maxHeight: 'calc(100vh - 150px)',
            overflow: 'auto'
          }
        }}
        destroyOnHidden={true}
      >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="文章标题"
          rules={[{ required: true, message: '请输入文章标题' }]}
        >
          <Input placeholder="请输入文章标题" />
        </Form.Item>

        <Form.Item label="文章内容">
          <div className="content-section">
            {/* 上传图片按钮 */}
            <Upload
              beforeUpload={handleImageUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} className="upload-btn">上传图片</Button>
            </Upload>
            
            {/* 编辑器和预览区域 */}
            <div className="editor-preview-container">
              {/* 左侧编辑器 */}
              <div className="editor-section">
                <ReactQuill
                  theme="snow"
                  value={editorContent}
                  onChange={handleEditorChange}
                  modules={{
                    ...modules,
                    toolbar: {
                      ...modules.toolbar,
                      container: [
                        [{ 'header': [1, 2, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'align': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                      ]
                    }
                  }}
                  formats={formats}
                  placeholder="请输入协议内容"
                  style={{ height: '100%' }}
                  className="quill-editor"
                />
              </div>
              
              <Divider type="vertical" />
              
              {/* 右侧预览 */}
              <div className="preview-section">
                <h3>页面预览</h3>
                <div 
                  className="preview-content"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>
        </Form.Item>
      </Form>
      
      {/* 底部操作按钮 */}
      <div className="form-actions">
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" onClick={handleSubmit} className="submit-btn">
          提交
        </Button>
      </div>
    </Modal>
  );
};

export default EditProtocol;