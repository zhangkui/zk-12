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
  Modal,
  Form,
  InputNumber,
} from 'antd';
import {
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  PayCircleOutlined,
  WalletOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as api from '../services';
import { Booking, Session, User, Order } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const bookingStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: 'orange' },
  confirmed: { label: '已确认', color: 'green' },
  cancelled: { label: '已取消', color: 'red' },
  waitlist: { label: '候补', color: 'blue' },
};

const BookingList: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isPlayer = user?.role === 'player';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined as string | undefined,
    session_id: undefined as number | undefined,
  });
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [hasPaymentPassword, setHasPaymentPassword] = useState(false);
  const [payForm] = Form.useForm();

  useEffect(() => {
    fetchSessions();
    fetchOrders();
    if (isAdmin) {
      fetchUsers();
    }
    if (isPlayer) {
      fetchBalance();
      checkPaymentPassword();
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

  const fetchOrders = async () => {
    try {
      const res = await api.getOrders({ page_size: 100 });
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await api.getBalance();
      setBalance(Number(res.data.balance) || 0);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance(0);
    }
  };

  const checkPaymentPassword = async () => {
    try {
      const res = await api.hasPaymentPassword();
      setHasPaymentPassword(!!res.data);
    } catch (error) {
      console.error('Failed to check payment password:', error);
      setHasPaymentPassword(false);
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
      fetchOrders();
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

  const getPendingOrder = (bookingId: number) => {
    return orders.find((o) => o.booking_id === bookingId && o.status === 'pending');
  };

  const getPaidOrder = (bookingId: number) => {
    return orders.find((o) => o.booking_id === bookingId && o.status === 'paid');
  };

  const getSessionName = (sessionId: number) => {
    return sessions.find((s) => s.id === sessionId)?.script_name || `场次 #${sessionId}`;
  };

  const getSessionPrice = (sessionId: number) => {
    return Number(sessions.find((s) => s.id === sessionId)?.price || 0);
  };

  const getUserName = (userId: number) => {
    const foundUser = users.find((u) => u.id === userId);
    return foundUser?.full_name || foundUser?.username || `用户 #${userId}`;
  };

  const handlePay = async (booking: Booking) => {
    setPayingBooking(booking);
    if (isPlayer) {
      await Promise.all([fetchBalance(), checkPaymentPassword()]);
    }
    const order = getPendingOrder(booking.id);
    setPendingOrder(order || null);
    const sessionPrice = getSessionPrice(booking.session_id);
    const amount = order?.actual_amount || sessionPrice * booking.player_count;
    payForm.setFieldsValue({
      amount: Number(amount).toFixed(2),
      payment_password: '',
    });
    setPayModalOpen(true);
  };

  const handlePaySubmit = async (values: any) => {
    if (!payingBooking) return;
    try {
      let order = pendingOrder;
      if (!order) {
        const orderRes = await api.createOrder({
          user_id: payingBooking.player_id,
          session_id: payingBooking.session_id,
          booking_id: payingBooking.id,
          total_amount: Number(values.amount),
          discount_amount: 0,
          actual_amount: Number(values.amount),
          player_count: payingBooking.player_count,
        });
        order = orderRes.data;
      }
      if (isAdmin) {
        await api.payOrder(order.id, {
          payment_method: 'balance',
          amount: Number(values.amount),
          transaction_no: `ADMIN_${Date.now()}`,
        });
      } else {
        await api.payWithBalance(order.id, {
          payment_password: values.payment_password,
          amount: Number(values.amount),
        });
      }
      message.success('支付成功');
      setPayModalOpen(false);
      setPayingBooking(null);
      setPendingOrder(null);
      payForm.resetFields();
      fetchBookings();
      fetchOrders();
      if (isPlayer) {
        fetchBalance();
      }
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '支付失败，请检查支付密码和余额');
    }
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
      render: (sessionId) => (
        <a onClick={() => navigate(`/sessions/${sessionId}`)}>{getSessionName(sessionId)}</a>
      ),
    },
    {
      title: '玩家',
      dataIndex: 'player_id',
      key: 'player_id',
      render: (playerId) => (isAdmin ? getUserName(playerId) : `玩家 #${playerId}`),
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
      title: '支付状态',
      key: 'payment_status',
      width: 100,
      render: (_, record) => {
        const paidOrder = getPaidOrder(record.id);
        const pendingOrder = getPendingOrder(record.id);
        if (paidOrder) {
          return <Tag color="green">已支付</Tag>;
        }
        if (pendingOrder) {
          return <Tag color="orange">待支付</Tag>;
        }
        if (record.status === 'confirmed') {
          return <Tag color="red">待支付</Tag>;
        }
        return <Tag>-</Tag>;
      },
    },
    {
      title: '报名时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => (time ? String(time).substring(0, 16) : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const paidOrder = getPaidOrder(record.id);
        const canPay = !paidOrder && record.status === 'confirmed';
        return (
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
            {canPay && (isAdmin || (isPlayer && record.player_id === user?.id)) && (
              <Button
                type="link"
                size="small"
                icon={<PayCircleOutlined />}
                onClick={() => handlePay(record)}
              >
                支付
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
        );
      },
    },
  ];

  const payableAmount = payingBooking
    ? getSessionPrice(payingBooking.session_id) * payingBooking.player_count
    : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>拼团报名</Title>
        {isPlayer && (
          <Space>
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
              <WalletOutlined /> 余额: ¥{balance.toFixed(2)}
            </Tag>
          </Space>
        )}
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
              {sessions.map((s) => (
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

      <Modal
        title="余额支付"
        open={payModalOpen}
        onCancel={() => {
          setPayModalOpen(false);
          setPayingBooking(null);
          setPendingOrder(null);
          payForm.resetFields();
        }}
        footer={null}
      >
        {payingBooking && (
          <>
            <Row gutter={[16, 12]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Text type="secondary">场次</Text>
                <div><Text strong>{getSessionName(payingBooking.session_id)}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">参与人数</Text>
                <div><Text strong>{payingBooking.player_count} 人</Text></div>
              </Col>
              <Col span={24}>
                <Text type="secondary">应付金额</Text>
                <div>
                  <Text strong style={{ color: '#f5222d', fontSize: 22 }}>
                    ¥{payableAmount.toFixed(2)}
                  </Text>
                </div>
              </Col>
            </Row>

            {isPlayer && (
              <Card size="small" style={{ marginBottom: 24, backgroundColor: '#f0f5ff', borderColor: '#adc6ff' }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Row justify="space-between" align="middle">
                    <Space>
                      <WalletOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                      <Text strong>账户余额</Text>
                    </Space>
                    <Text strong style={{ color: '#1890ff', fontSize: 18 }}>¥{balance.toFixed(2)}</Text>
                  </Row>
                  <Row gutter={[8, 8]}>
                    {!hasPaymentPassword && (
                      <Col span={24}>
                        <Tag color="warning" style={{ width: '100%', textAlign: 'center', padding: '4px 8px' }}>
                          ⚠️ 请先设置支付密码
                        </Tag>
                      </Col>
                    )}
                    {hasPaymentPassword && balance < payableAmount && (
                      <Col span={24}>
                        <Tag color="error" style={{ width: '100%', textAlign: 'center', padding: '4px 8px' }}>
                          ❌ 余额不足，请联系管理员充值
                        </Tag>
                      </Col>
                    )}
                    {hasPaymentPassword && balance >= payableAmount && (
                      <Col span={24}>
                        <Tag color="success" style={{ width: '100%', textAlign: 'center', padding: '4px 8px' }}>
                          ✅ 余额充足，可以支付
                        </Tag>
                      </Col>
                    )}
                  </Row>
                </Space>
              </Card>
            )}

            <Form
              form={payForm}
              layout="vertical"
              onFinish={handlePaySubmit}
            >
              <Form.Item
                name="amount"
                label="支付金额"
                rules={[{ required: true, message: '请输入支付金额' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="支付金额"
                  prefix="¥"
                  disabled={!isAdmin}
                />
              </Form.Item>
              {isPlayer && (
                <Form.Item
                  name="payment_password"
                  label="支付密码"
                  rules={[
                    { required: true, message: '请输入支付密码' },
                    { len: 6, message: '请输入6位数字密码' },
                    { pattern: /^\d{6}$/, message: '支付密码必须是6位数字' },
                  ]}
                >
                  <Input.Password
                    placeholder="请输入6位数字支付密码"
                    maxLength={6}
                    type="password"
                    inputMode="numeric"
                    style={{ letterSpacing: 8 }}
                    disabled={!hasPaymentPassword || balance < payableAmount}
                  />
                </Form.Item>
              )}
              <Form.Item style={{ marginBottom: 0 }}>
                {isPlayer && !hasPaymentPassword ? (
                  <Button
                    type="primary"
                    block
                    icon={<KeyOutlined />}
                    onClick={() => {
                      setPayModalOpen(false);
                      navigate('/profile');
                    }}
                  >
                    去设置支付密码
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    icon={<PayCircleOutlined />}
                    disabled={isPlayer && (!hasPaymentPassword || balance < payableAmount)}
                  >
                    确认支付
                  </Button>
                )}
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default BookingList;
