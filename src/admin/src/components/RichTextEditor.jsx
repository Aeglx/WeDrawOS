import React, { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';

// 简单的富文本编辑器实现，避免ReactQuill的findDOMNode警告
const RichTextEditor = forwardRef(({ value, onChange, placeholder = '请输入内容' }, ref) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const editorRef = useRef(null);
  
  // 当外部value变化时更新内部状态
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value || '');
    }
  }, [value]);
  
  // 处理内容变化
  const handleChange = (e) => {
    const content = e.target.innerHTML;
    setInternalValue(content);
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
  
  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    getValue: () => internalValue,
    setValue: (newValue) => {
      setInternalValue(newValue);
      if (editorRef.current) {
        editorRef.current.innerHTML = newValue || '';
      }
      if (onChange) {
        onChange(newValue);
      }
    },
    focus: () => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  }));
  
  return (
    <div className="rich-text-editor-custom">
      {/* 自定义工具栏 */}
      <div className="editor-toolbar">
        <button onClick={() => handleFormat('bold')} title="加粗">
          <strong>B</strong>
        </button>
        <button onClick={() => handleFormat('italic')} title="斜体">
          <em>I</em>
        </button>
        <button onClick={() => handleFormat('underline')} title="下划线">
          <u>U</u>
        </button>
        <button onClick={() => handleFormat('strikeThrough')} title="删除线">
          <s>S</s>
        </button>
        <span className="toolbar-divider"></span>
        <button onClick={() => handleFormat('insertUnorderedList')} title="无序列表">
          • 列表
        </button>
        <button onClick={() => handleFormat('insertOrderedList')} title="有序列表">
          1. 列表
        </button>
        <span className="toolbar-divider"></span>
        <button onClick={() => handleFormat('justifyLeft')} title="左对齐">
          ⇤
        </button>
        <button onClick={() => handleFormat('justifyCenter')} title="居中">
          ⇔
        </button>
        <button onClick={() => handleFormat('justifyRight')} title="右对齐">
          ⇥
        </button>
        <span className="toolbar-divider"></span>
        <button onClick={() => handleFormat('formatBlock', 'h1')} title="标题1">H1</button>
        <button onClick={() => handleFormat('formatBlock', 'h2')} title="标题2">H2</button>
        <button onClick={() => handleFormat('formatBlock', 'p')} title="段落">P</button>
        <span className="toolbar-divider"></span>
        <button onClick={() => handleFormat('removeFormat')} title="清除格式">
          清除
        </button>
      </div>
      
      {/* 编辑区域 */}
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        dangerouslySetInnerHTML={{ __html: internalValue }}
        onInput={handleChange}
        onBlur={handleChange}
        placeholder={placeholder}
        style={{
          minHeight: '200px',
          padding: '12px',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          outline: 'none',
          lineHeight: '1.6'
        }}
      />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;