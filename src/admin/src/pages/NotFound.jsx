import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="not-found-container">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <div className="not-found-actions">
            <Button type="default" onClick={goBack}>
              返回上一页
            </Button>
            <Button type="primary" onClick={goHome}>
              回到首页
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default NotFound;