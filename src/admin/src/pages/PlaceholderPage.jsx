import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const PlaceholderPage = ({ title }) => {
  return (
    <Card className="placeholder-page">
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Title level={2}>{title}</Title>
        <Paragraph>
          该功能模块正在开发中，敬请期待...
        </Paragraph>
      </div>
    </Card>
  );
};

export default PlaceholderPage;