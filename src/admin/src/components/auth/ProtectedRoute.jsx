import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // 检查是否有管理员token
  const isAuthenticated = localStorage.getItem('adminToken') !== null;

  // 如果未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 如果已登录，渲染子路由
  return <Outlet />;
};

export default ProtectedRoute;