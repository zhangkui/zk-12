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
  Modal,
  Form,
  InputNumber,
  message,
  DatePicker,
  Statistic,
} from 'antd';
import {
  SearchOutlined,
  PayCircleOutlined,
  CloseOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as api from '../services';
import { Order, Session } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const orderStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待支付', color: 'orange' },
  paid: { label: '已支付', color: 'green' },
  cancelled: { label: '已取消', color: 'red' },
  refunded: { label: '已退款', color: 'purple' },
};

const paymentMethodMap: Record<string, string> = {
  wechat: '微信',
  alipay: '支付宝',
  cash: '现金',
  card: '银行卡',
  other: '其他',
};

const OrderList: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [orders, setOrders] = useState<Order[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined as string | undefined,
    dateRange: [] as dayjs.Dayjs[],
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page, filters]);

  const fetchSessions = async () => {
    try {
      const res = await api.getSessions({ page_size: 100 });
      setSessions(res.data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: pageSize,
        keyword: filters.keyword || undefined,
        status: filters.status || undefined,
      };
      if (filters.dateRange?.length === 2) {
        params.start_date = filters.dateRange[0].format('YYYY-MM-DD');
        params.end_date = filters.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await api.getOrders(params);
      setOrders(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (date?: string) => {
    try {
      const res = await api.getDailyStats(date);
      setStats(res.data);
    } catch (error) {
      message.error('获取统计数据失败');
    }
  };

  const handlePay = (order: Order) => {
    setPayingOrder(order);
    form.setFieldsValue({
      payment_method: 'wechat',
      amount: order.actual_amount,
    });
    setPayModalOpen(true);
  };

  const handlePaySubmit = async (values: any) => {
    if (!payingOrder) return;
    try {
      await api.payOrder(payingOrder.id, values);
      message.success('支付成功');
      setPayModalOpen(false);
      setPayingOrder(null);
      form.resetFields();
      fetchOrders();
    } catch (error) {
      message.error('支付失败');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.cancelOrder(id);
      message.success('取消成功');
      fetchOrders();
    } catch (error) {
      message.error('取消失败');
    }
  };

  const getSessionName = (sessionId: number) => {
    return sessions.find(s => s.id === sessionId)?.script_name || `场次 #${sessionId}`;
  };

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      render: (no) => <Text copyable>{no}</Text>,
    },
    {
      title: '场次',
      dataIndex: 'session_id',
      key: 'session_id',
      render: (sessionId) => getSessionName(sessionId),
    },
    {
      title: '人数',
      dataIndex: 'player_count',
      key: 'player_count',
      width: 80,
    },
    {
      title: '总价',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (amount) => `¥${amount}`,
    },
    {
      title: '优惠',
      dataIndex: 'discount_amount',
      key: 'discount_amount',
      width: 100,
      render: (amount) => amount > 0 ? `¥${amount}` : '-',
    },
    {
      title: '实付',
      dataIndex: 'actual_amount',
      key: 'actual_amount',
      width: 100,
      render: (amount) => (
        <Text strong style={{ color: '#f5222d' }}>¥{amount}</Text>
      ),
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      render: (method) => method ? paymentMethodMap[method] || method : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={orderStatusMap[status]?.color}>
          {orderStatusMap[status]?.label}
        </Tag>
      ),
    },
    {
      title: '创建时间',
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
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<PayCircleOutlined />}
              onClick={() => handlePay(record)}
            >
              支付
            </Button>
          )}
          {record.status === 'pending' && (
            <Popconfirm
              title="确定取消这个订单吗？"
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
        <Title level={3} style={{ margin: 0 }}>订单管理</Title>
        <Space>
          {isAdmin && (
            <Button
              icon={<BarChartOutlined />}
              onClick={() => {
                fetchStats();
                setStatsModalOpen(true);
              }}
            >
              今日统计
            </Button>
          )}
        </Space>
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索订单号"
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
              <Option value="pending">待支付</Option>
              <Option value="paid">已支付</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="refunded">已退款</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange as any}
              onChange={(v) => setFilters({ ...filters, dateRange: v as any })}
            />
          </Col>
          <Col xs={24} sm={24} md={2} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={() => setPage(1)}>搜索</Button>
          </Col>
        </Row>
      </Card>

      <Card className="card-shadow">
        <Table<Order>
          columns={columns}
          dataSource={orders}
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
        title="订单支付"
        open={payModalOpen}
        onCancel={() => {
          setPayModalOpen(false);
          setPayingOrder(null);
          form.resetFields();
        }}
        footer={null}
      >
        {payingOrder && (
          <div style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">订单号:</Text>
                <div><Text strong>{payingOrder.order_no}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">应付金额:</Text>
                <div>
                  <Text strong style={{ color: '#f5222d', fontSize: 18 }}>
                    ¥{payingOrder.actual_amount}
                  </Text>
                </div>
              </Col>
            </Row>
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePaySubmit}
        >
          <Form.Item
            name="payment_method"
            label="支付方式"
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Select placeholder="请选择支付方式">
              <Option value="wechat">微信支付</Option>
              <Option value="alipay">支付宝</Option>
              <Option value="cash">现金</Option>
              <Option value="card">银行卡</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="支付金额"
            rules={[{ required: true, message: '请输入支付金额' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="支付金额" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setPayModalOpen(false);
                  setPayingOrder(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" icon={<PayCircleOutlined />}>
                确认支付
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="今日营业统计"
        open={statsModalOpen}
        onCancel={() => {
          setStatsModalOpen(false);
          setStats(null);
        }}
        footer={[
          <Button key="close" onClick={() => setStatsModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={500}
      >
        {stats && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="今日订单数"
                    value={stats.order_count}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="今日营收"
                    value={stats.total_revenue}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="已支付订单"
                    value={stats.paid_count}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="待支付订单"
                    value={stats.pending_count}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderList;
