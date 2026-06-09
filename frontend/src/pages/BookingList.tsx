import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Card,
  Tag,
  Typography,
  Popconfirm,
  Row,
  Col,
  message,
} from 'antd';
import {
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as api from '../services';
import { Booking, Session, User } from '../types';
import { useAuthStore } from '../store/useAuthStore';

const { Title } = Typography;
const { Option } = Select;

const bookingStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: 'orange' },
  confirmed: { label: '已确认', color: 'green' },
  cancelled: { label: '已取消', color: 'red' },
  waitlist: { label: '候补', color: 'blue' },
};

const BookingList: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isPlayer = user?.role === 'player';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined as string | undefined,
    session_id: undefined as number | undefined,
  });

  useEffect(() => {
    fetchSessions();
    if (isAdmin) {
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [page, filters]);

  const fetchSessions = async () => {
    try {
      const res = await api.getSessions({ page_size: 100 });
      setSessions(res.data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.getUsers({ page_size: 100 });
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: pageSize,
        keyword: filters.keyword || undefined,
        status: filters.status || undefined,
        session_id: filters.session_id || undefined,
      };
      if (isPlayer && user?.id) {
        params.player_id = user.id;
      }
      const res = await api.getBookings(params);
      setBookings(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await api.confirmBooking(id);
      message.success('确认成功');
      fetchBookings();
    } catch (error) {
      message.error('确认失败');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.cancelBooking(id);
      message.success('取消成功');
      fetchBookings();
    } catch (error) {
      message.error('取消失败');
    }
  };

  const getSessionName = (sessionId: number) => {
    return sessions.find(s => s.id === sessionId)?.script_name || `场次 #${sessionId}`;
  };

  const getUserName = (userId: number) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.full_name || foundUser?.username || `用户 #${userId}`;
  };

  const columns: ColumnsType<Booking> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '场次',
      dataIndex: 'session_id',
      key: 'session_id',
      render: (sessionId) => getSessionName(sessionId),
    },
    {
      title: '玩家',
      dataIndex: 'player_id',
      key: 'player_id',
      render: (playerId) => isAdmin ? getUserName(playerId) : `玩家 #${playerId}`,
    },
    {
      title: '人数',
      dataIndex: 'player_count',
      key: 'player_count',
      width: 80,
    },
    {
      title: '角色',
      dataIndex: 'character_name',
      key: 'character_name',
      render: (name) => name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={bookingStatusMap[status]?.color}>
          {bookingStatusMap[status]?.label}
        </Tag>
      ),
    },
    {
      title: '报名时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => time.substring(0, 16),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          {isAdmin && record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleConfirm(record.id)}
            >
              确认
            </Button>
          )}
          {(isAdmin || (isPlayer && record.player_id === user?.id)) &&
            record.status !== 'cancelled' && (
              <Popconfirm
                title="确定取消这个报名吗？"
                onConfirm={() => handleCancel(record.id)}
              >
                <Button type="link" size="small" danger icon={<CloseOutlined />}>
                  取消
                </Button>
              </Popconfirm>
            )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>拼团报名</Title>
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索"
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onPressEnter={() => setPage(1)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="状态"
              allowClear
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
              style={{ width: '100%' }}
            >
              <Option value="pending">待确认</Option>
              <Option value="confirmed">已确认</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="waitlist">候补</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="场次"
              allowClear
              showSearch
              value={filters.session_id}
              onChange={(v) => setFilters({ ...filters, session_id: v })}
              style={{ width: '100%' }}
            >
              {sessions.map(s => (
                <Option key={s.id} value={s.id}>
                  {s.script_name || `场次 #${s.id}`}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={2} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={() => setPage(1)}>搜索</Button>
          </Col>
        </Row>
      </Card>

      <Card className="card-shadow">
        <Table<Booking>
          columns={columns}
          dataSource={bookings}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            onChange: setPage,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
};

export default BookingList;
