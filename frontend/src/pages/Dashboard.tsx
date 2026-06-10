import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Button, Space, Typography, DatePicker } from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import * as api from '../services';
import { Session, Booking, Order } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySessions: 0,
    todayBookings: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, bookingsRes, ordersRes, statsRes] = await Promise.all([
        api.getSessions({ page_size: 5, status: 'pending' }),
        api.getBookings({ page_size: 5 }),
        api.getOrders({ page_size: 5 }),
        api.getDailyStats(),
      ]);
      setRecentSessions(sessionsRes.data);
      setRecentBookings(bookingsRes.data);
      setRecentOrders(ordersRes.data);
      setStats({
        todaySessions: statsRes.data.session_count || 0,
        todayBookings: statsRes.data.order_count || 0,
        todayOrders: statsRes.data.paid_count || 0,
        todayRevenue: statsRes.data.total_revenue || 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待确认' },
      confirmed: { color: 'green', text: '已确认' },
      cancelled: { color: 'red', text: '已取消' },
      completed: { color: 'blue', text: '已完成' },
      full: { color: 'purple', text: '已满员' },
      paid: { color: 'green', text: '已支付' },
      waitlist: { color: 'purple', text: '候补' },
      refunded: { color: 'orange', text: '已退款' },
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const sessionColumns: ColumnsType<Session> = [
    {
      title: '剧本',
      dataIndex: 'script_name',
      key: 'script_name',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '时间',
      key: 'time',
      width: 140,
      render: (_, record) => `${record.start_time} - ${record.end_time}`,
    },
    {
      title: '人数',
      key: 'players',
      width: 100,
      render: (_, record) => `${record.current_players}/${record.max_players}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/sessions/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  const bookingColumns: ColumnsType<any> = [
    {
      title: '场次',
      dataIndex: ['session_info', 'script_name'],
      key: 'script',
    },
    {
      title: '玩家',
      dataIndex: ['player_info', 'full_name'],
      key: 'player',
      render: (name, record) => name || record.player_info?.username,
    },
    {
      title: '人数',
      dataIndex: 'player_count',
      key: 'player_count',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '报名时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const orderColumns: ColumnsType<any> = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
    },
    {
      title: '场次',
      dataIndex: ['session_info', 'script_name'],
      key: 'script',
    },
    {
      title: '金额',
      dataIndex: 'actual_amount',
      key: 'amount',
      width: 100,
      render: (amount) => `¥${amount}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const statCards = [
    {
      title: '今日场次',
      value: stats.todaySessions,
      icon: <CalendarOutlined />,
      color: 'primary',
      link: '/sessions',
    },
    {
      title: '今日订单',
      value: stats.todayOrders,
      icon: <ShoppingCartOutlined />,
      color: 'info',
      link: '/orders',
    },
    {
      title: '今日预约',
      value: stats.todayBookings,
      icon: <TeamOutlined />,
      color: 'warning',
      link: '/bookings',
    },
    {
      title: '今日营收',
      value: `¥${stats.todayRevenue.toFixed(2)}`,
      icon: <DollarOutlined />,
      color: 'success',
      link: '/orders',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>工作台</Title>
          <Text type="secondary">欢迎回来，今天也要加油哦！</Text>
        </div>
        <Space>
          <RangePicker />
          <Button type="primary" onClick={fetchDashboardData} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              className="stat-card card-shadow"
              onClick={() => navigate(card.link)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="stat-label">{card.title}</div>
                  <div className="stat-value">{card.value}</div>
                </div>
                <div className={`stat-icon ${card.color}`}>{card.icon}</div>
              </div>
              <div style={{ marginTop: 12, textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  查看详情 <RightOutlined />
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            className="card-shadow"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarOutlined style={{ color: '#1890ff' }} />
                <span>即将开场</span>
              </div>
            }
            extra={
              <Button type="link" onClick={() => navigate('/sessions')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            <Table<Session>
              columns={sessionColumns}
              dataSource={recentSessions}
              rowKey="id"
              size="small"
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            className="card-shadow"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TeamOutlined style={{ color: '#52c41a' }} />
                <span>最新报名</span>
              </div>
            }
            extra={
              <Button type="link" onClick={() => navigate('/bookings')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            <Table
              columns={bookingColumns}
              dataSource={recentBookings as any[]}
              rowKey="id"
              size="small"
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            className="card-shadow"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCartOutlined style={{ color: '#722ed1' }} />
                <span>最新订单</span>
              </div>
            }
            extra={
              <Button type="link" onClick={() => navigate('/orders')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            <Table
              columns={orderColumns}
              dataSource={recentOrders as any[]}
              rowKey="id"
              size="small"
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
