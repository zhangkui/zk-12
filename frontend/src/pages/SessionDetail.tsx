import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  List,
  Avatar,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Typography,
  Divider,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services';
import { SessionDetail, Booking } from '../types';
import { useAuthStore } from '../store/useAuthStore';

const { Title, Text } = Typography;

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待拼团', color: 'orange' },
  confirmed: { label: '已成团', color: 'green' },
  full: { label: '已满员', color: 'purple' },
  cancelled: { label: '已取消', color: 'red' },
  completed: { label: '已完成', color: 'blue' },
};

const bookingStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: 'orange' },
  confirmed: { label: '已确认', color: 'green' },
  cancelled: { label: '已取消', color: 'red' },
  waitlist: { label: '候补', color: 'blue' },
};

const SessionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchSessionDetail(parseInt(id));
    }
  }, [id]);

  const fetchSessionDetail = async (sessionId: number) => {
    setLoading(true);
    try {
      const res = await api.getSession(sessionId);
      setSession(res.data);
    } catch (error) {
      message.error('获取场次详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (values: any) => {
    if (!id) return;
    try {
      await api.createBooking({
        session_id: parseInt(id),
        player_count: values.player_count,
        character_name: values.character_name,
        notes: values.notes,
      });
      message.success('报名成功');
      setBookingModalOpen(false);
      form.resetFields();
      fetchSessionDetail(parseInt(id));
    } catch (error) {
      message.error('报名失败');
    }
  };

  const handleConfirmBooking = async (bookingId: number) => {
    try {
      await api.confirmBooking(bookingId);
      message.success('确认成功');
      if (id) fetchSessionDetail(parseInt(id));
    } catch (error) {
      message.error('确认失败');
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await api.cancelBooking(bookingId);
      message.success('取消成功');
      if (id) fetchSessionDetail(parseInt(id));
    } catch (error) {
      message.error('取消失败');
    }
  };

  const canBook = session?.status === 'pending' || session?.status === 'confirmed';
  const isFull = session?.current_players === session?.max_players;

  if (!session) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/sessions')}
        >
          返回列表
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          {session.script?.name} - 场次详情
        </Title>
        <Tag color={statusMap[session.status]?.color} style={{ fontSize: 14, padding: '4px 12px' }}>
          {statusMap[session.status]?.label}
        </Tag>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="card-shadow" loading={loading}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="剧本名称" span={2}>
                {session.script?.name}
              </Descriptions.Item>
              <Descriptions.Item label="剧本类型">
                {session.script?.script_type}
              </Descriptions.Item>
              <Descriptions.Item label="难度">
                {session.script?.difficulty}
              </Descriptions.Item>
              <Descriptions.Item label="时长">
                {session.script?.duration_minutes} 分钟
              </Descriptions.Item>
              <Descriptions.Item label="价格">
                <Text strong style={{ color: '#f5222d', fontSize: 16 }}>
                  ¥{session.price} / 人
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="日期">
                <Space>
                  <CalendarOutlined />
                  {session.date}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="时间">
                <Space>
                  <ClockCircleOutlined />
                  {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="房间">
                <Space>
                  <EnvironmentOutlined />
                  {session.room?.name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="主持人">
                <Space>
                  <UserOutlined />
                  {session.host?.nickname || '未指派'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="人数限制" span={2}>
                <Space>
                  <TeamOutlined />
                  {session.min_players} - {session.max_players} 人
                </Space>
              </Descriptions.Item>
              {session.notes && (
                <Descriptions.Item label="备注" span={2}>
                  {session.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            {session.script?.description && (
              <>
                <Divider />
                <Title level={5}>剧本简介</Title>
                <Text type="secondary">{session.script.description}</Text>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="card-shadow" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="当前报名"
                  value={session.current_players}
                  suffix={`/ ${session.max_players}`}
                  valueStyle={{ color: session.current_players >= session.max_players ? '#f5222d' : '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="最少成团"
                  value={session.min_players}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              {canBook ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setBookingModalOpen(true)}
                  disabled={isFull}
                  block
                >
                  {isFull ? '已满员' : '立即报名'}
                </Button>
              ) : (
                <Button type="primary" size="large" disabled block>
                  {session.status === 'cancelled' ? '场次已取消' : '报名已结束'}
                </Button>
              )}
            </div>
          </Card>

          <Card
            className="card-shadow"
            title={
              <Space>
                <TeamOutlined />
                报名列表 ({session.bookings?.length || 0})
              </Space>
            }
          >
            {!session.bookings || session.bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无报名
              </div>
            ) : (
              <List
                dataSource={session.bookings}
                renderItem={(booking: Booking) => (
                  <List.Item
                    key={booking.id}
                    actions={
                      isAdmin && booking.status === 'pending'
                        ? [
                            <Button
                              key="confirm"
                              type="link"
                              size="small"
                              icon={<CheckOutlined />}
                              onClick={() => handleConfirmBooking(booking.id)}
                            >
                              确认
                            </Button>,
                            <Button
                              key="cancel"
                              type="link"
                              size="small"
                              danger
                              icon={<CloseOutlined />}
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              取消
                            </Button>,
                          ]
                        : booking.status !== 'cancelled' && booking.player_id === user?.id
                        ? [
                            <Button
                              key="cancel"
                              type="link"
                              size="small"
                              danger
                              icon={<CloseOutlined />}
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              取消报名
                            </Button>,
                          ]
                        : []
                    }
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <Space>
                          <span>玩家 {booking.player_id}</span>
                          <Tag color={bookingStatusMap[booking.status]?.color}>
                            {bookingStatusMap[booking.status]?.label}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>人数: {booking.player_count} 人</div>
                          {booking.character_name && (
                            <div>角色: {booking.character_name}</div>
                          )}
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            报名时间: {booking.created_at.substring(0, 16)}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="报名参加"
        open={bookingModalOpen}
        onCancel={() => {
          setBookingModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleBooking}
        >
          <Form.Item
            name="player_count"
            label="参与人数"
            rules={[{ required: true, message: '请输入参与人数' }]}
          >
            <InputNumber min={1} max={session.max_players - session.current_players} style={{ width: '100%' }} placeholder="请输入人数" />
          </Form.Item>
          <Form.Item
            name="character_name"
            label="想要的角色（可选）"
          >
            <Input placeholder="角色名称" />
          </Form.Item>
          <Form.Item
            name="notes"
            label="备注（可选）"
          >
            <Input.TextArea rows={3} placeholder="其他需求或备注" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setBookingModalOpen(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                提交报名
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SessionDetailPage;
