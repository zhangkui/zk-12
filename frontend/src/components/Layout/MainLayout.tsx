import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  CalendarOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  HomeOutlined,
  ScheduleOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const getMenuItems = () => {
    const items = [
      {
        key: '/',
        icon: <DashboardOutlined />,
        label: '工作台',
      },
      {
        key: '/scripts',
        icon: <BookOutlined />,
        label: '剧本库',
      },
      {
        key: '/sessions',
        icon: <CalendarOutlined />,
        label: '场次管理',
      },
      {
        key: '/bookings',
        icon: <TeamOutlined />,
        label: '拼团报名',
      },
      {
        key: '/orders',
        icon: <ShoppingCartOutlined />,
        label: '订单管理',
      },
    ];

    if (user?.role === 'admin' || user?.role === 'owner') {
      items.push(
        {
          key: '/hosts',
          icon: <UserOutlined />,
          label: '主持人管理',
        },
        {
          key: '/host-schedules',
          icon: <ScheduleOutlined />,
          label: '主持人排班',
        },
        {
          key: '/rooms',
          icon: <HomeOutlined />,
          label: '房间管理',
        },
        {
          key: '/users',
          icon: <SettingOutlined />,
          label: '用户管理',
        }
      );
    }

    return items;
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => {
        navigate('/profile');
      },
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 14 : 18, fontWeight: 600 }}>
          {collapsed ? '剧本杀' : '剧本杀管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: 'rgba(0,0,0,0.65)' }}>
              {user?.full_name || user?.username}
            </span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
                icon={<UserOutlined />}
                src={user?.avatar}
              />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
