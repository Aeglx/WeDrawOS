import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import AddArticle from './AddArticle';
import './AddArticle.css';

const EditArticle = () => {
  const { id } = useParams();
  const history = useHistory();
  const [articleData, setArticleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  // 模拟获取文章数据
  useEffect(() => {
    const fetchArticleData = async () => {
      try {
        // 这里应该是从API获取文章数据的逻辑
        // 现在使用模拟数据
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟的文章数据
        const mockData = {
          id: id,
          title: '这是一篇待编辑的文章标题',
          author: '编辑者',
          content: '<p>这是文章的初始内容，您可以在这里进行编辑。</p>'
        };
        
        setArticleData(mockData);
      } catch (error) {
        console.error('获取文章数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticleData();
  }, [id]);

  const handleClose = (updatedData) => {
    if (updatedData) {
      // 这里可以处理更新成功后的逻辑
      console.log('文章已更新:', updatedData);
      // 重定向到文章列表或其他页面
      history.push('/admin/articles');
    } else {
      // 取消编辑
      history.goBack();
    }
  };

  if (loading) {
    return (
      <div className="add-article-container">
        <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>
      </div>
    );
  }

  return (
    <AddArticle 
      visible={visible}
      onClose={handleClose}
      articleData={articleData}
    />
  );
};

export default EditArticle;