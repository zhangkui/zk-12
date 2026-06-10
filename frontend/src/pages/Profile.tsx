import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  message,
  Space,
  Descriptions,
  Modal,
  Row,
  Col,
  Tag,
  Statistic,
  Typography,
} from 'antd';

const { Text } = Typography;
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  SaveOutlined,
  CloseOutlined,
  WalletOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import * as api from '../services';
import { User, UserBalance } from '../types';

const roleMap: Record<string, { label: string; color: string }> = {
  admin: { label: '管理员', color: 'red' },
  owner: { label: '店主', color: 'purple' },
  host: { label: '主持人', color: 'blue' },
  player: { label: '玩家', color: 'green' },
};

const Profile: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [paymentPasswordForm] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [paymentPasswordModalOpen, setPaymentPasswordModalOpen] = useState(false);
  const [paymentPasswordMode, setPaymentPasswordMode] = useState<'set' | 'update'>('set');
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [paymentPasswordLoading, setPaymentPasswordLoading] = useState(false);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [hasPaymentPassword, setHasPaymentPassword] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
      });
      fetchBalance();
      checkPaymentPassword();
    }
  }, [user, form]);

  const fetchBalance = async () => {
    try {
      const res = await api.getBalance();
      setBalance(res.data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const checkPaymentPassword = async () => {
    try {
      const res = await api.hasPaymentPassword();
      setHasPaymentPassword(res.data);
    } catch (error) {
      console.error('Failed to check payment password:', error);
    }
  };

  const openPaymentPasswordModal = (mode: 'set' | 'update') => {
    setPaymentPasswordMode(mode);
    paymentPasswordForm.resetFields();
    setPaymentPasswordModalOpen(true);
  };

  const handlePaymentPasswordSubmit = async (values: any) => {
    setPaymentPasswordLoading(true);
    try {
      if (paymentPasswordMode === 'set') {
        await api.setPaymentPassword({
          payment_password: values.payment_password,
        });
        message.success('支付密码设置成功');
        setHasPaymentPassword(true);
      } else {
        await api.updatePaymentPassword({
          old_payment_password: values.old_payment_password,
          new_payment_password: values.new_payment_password,
        });
        message.success('支付密码修改成功');
      }
      setPaymentPasswordModalOpen(false);
      paymentPasswordForm.resetFields();
    } catch (error) {
      message.error(paymentPasswordMode === 'set' ? '设置失败' : '修改失败');
    } finally {
      setPaymentPasswordLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!user) return;
    setLoading(true);
    try {
      await api.updateUser(user.id, values);
      message.success('更新成功');
      setUser({ ...user, ...values } as User);
      setEditing(false);
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: any) => {
    if (!user) return;
    setPasswordLoading(true);
    try {
      await api.updateUserPassword(user.id, {
        old_password: values.old_password,
        new_password: values.new_password,
      });
      message.success('密码修改成功');
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return <div style={{ padding: 24 }}>请先登录</div>;
  }

  const roleInfo = roleMap[user.role] || { label: user.role, color: 'default' };

  return (
    <div className="page-container">
      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
          <Avatar
            size={80}
            icon={<UserOutlined />}
            src={user.avatar}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <h2 style={{ margin: 0, marginBottom: 8 }}>
              {user.full_name || user.username}
              <Tag color={roleInfo.color} style={{ marginLeft: 12 }}>
                {roleInfo.label}
              </Tag>
            </h2>
            <p style={{ margin: 0, color: '#666' }}>@{user.username}</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Space>
              {!editing ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                >
                  编辑资料
                </Button>
              ) : (
                <>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setEditing(false);
                      form.resetFields();
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={() => form.submit()}
                  >
                    保存
                  </Button>
                </>
              )}
              <Button
                icon={<LockOutlined />}
                onClick={() => setPasswordModalOpen(true)}
              >
                修改密码
              </Button>
            </Space>
          </div>
        </div>

        <Descriptions column={2} bordered>
          <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
          <Descriptions.Item label="角色">
            <Tag color={roleInfo.color}>{roleInfo.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="手机号">{user.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="真实姓名">{user.full_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="注册时间">
            {new Date(user.created_at).toLocaleDateString('zh-CN')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="card-shadow">
            <Statistic
              title="账户余额"
              value={balance?.balance || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 12 }}>
              <Button
                type="link"
                icon={<WalletOutlined />}
                onClick={() => window.location.href = '/wallet'}
                style={{ padding: 0 }}
              >
                查看钱包详情
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="card-shadow">
            <Statistic
              title="累计充值"
              value={balance?.total_recharge || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="card-shadow">
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">支付密码</Text>
            </div>
            <div style={{ marginBottom: 12 }}>
              {hasPaymentPassword ? (
                <Tag color="green">已设置</Tag>
              ) : (
                <Tag color="orange">未设置</Tag>
              )}
            </div>
            <Button
              type="primary"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => openPaymentPasswordModal(hasPaymentPassword ? 'update' : 'set')}
            >
              {hasPaymentPassword ? '修改支付密码' : '设置支付密码'}
            </Button>
          </Card>
        </Col>
      </Row>

      {editing && (
        <Card className="card-shadow" title="编辑资料">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { type: 'email', message: '请输入有效的邮箱地址' },
                  ]}
                >
                  <Input placeholder="请输入邮箱" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="手机号"
                  rules={[
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                  ]}
                >
                  <Input placeholder="请输入手机号" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="full_name"
                  label="真实姓名"
                >
                  <Input placeholder="请输入真实姓名" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      )}

      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordSubmit}
        >
          <Form.Item
            name="old_password"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认新密码"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setPasswordModalOpen(false);
                  passwordForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={passwordLoading}>
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={paymentPasswordMode === 'set' ? '设置支付密码' : '修改支付密码'}
        open={paymentPasswordModalOpen}
        onCancel={() => {
          setPaymentPasswordModalOpen(false);
          paymentPasswordForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={paymentPasswordForm}
          layout="vertical"
          onFinish={handlePaymentPasswordSubmit}
        >
          {paymentPasswordMode === 'update' && (
            <Form.Item
              name="old_payment_password"
              label="原支付密码"
              rules={[
                { required: true, message: '请输入原支付密码' },
                { len: 6, message: '请输入6位数字密码' },
              ]}
            >
              <Input.Password
                placeholder="请输入6位数字原支付密码"
                maxLength={6}
                type="password"
                inputMode="numeric"
                style={{ letterSpacing: 8 }}
              />
            </Form.Item>
          )}
          <Form.Item
            name="payment_password"
            label={paymentPasswordMode === 'set' ? '支付密码' : '新支付密码'}
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
            />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认支付密码"
            dependencies={[paymentPasswordMode === 'set' ? 'payment_password' : 'new_payment_password']}
            rules={[
              { required: true, message: '请确认支付密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const pwdField = paymentPasswordMode === 'set' ? 'payment_password' : 'new_payment_password';
                  if (!value || getFieldValue(pwdField) === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="请再次输入6位数字支付密码"
              maxLength={6}
              type="password"
              inputMode="numeric"
              style={{ letterSpacing: 8 }}
            />
          </Form.Item>
          {paymentPasswordMode === 'update' && (
            <Form.Item
              name="new_payment_password"
              label="新支付密码"
              rules={[
                { required: true, message: '请输入新支付密码' },
                { len: 6, message: '请输入6位数字密码' },
                { pattern: /^\d{6}$/, message: '支付密码必须是6位数字' },
              ]}
            >
              <Input.Password
                placeholder="请输入6位数字新支付密码"
                maxLength={6}
                type="password"
                inputMode="numeric"
                style={{ letterSpacing: 8 }}
              />
            </Form.Item>
          )}
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setPaymentPasswordModalOpen(false);
                  paymentPasswordForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={paymentPasswordLoading}>
                确认{paymentPasswordMode === 'set' ? '设置' : '修改'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
