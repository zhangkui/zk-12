import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tabs,
  Button,
  Modal,
  Form,
  Input,
  Statistic,
  Row,
  Col,
  Tag,
  Typography,
  message,
  Space,
} from 'antd';
import {
  WalletOutlined,
  KeyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as api from '../services';
import { UserBalance, RechargeOrder, TransactionRecord } from '../types';

const { Title, Text } = Typography;

const typeMap: Record<string, { label: string; color: string }> = {
  recharge: { label: '充值', color: 'green' },
  payment: { label: '消费', color: 'red' },
  refund: { label: '退款', color: 'blue' },
};

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '处理中', color: 'orange' },
  completed: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'red' },
};

const Wallet: React.FC = () => {
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [recharges, setRecharges] = useState<RechargeOrder[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [rechargePage, setRechargePage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [pageSize] = useState(10);
  const [rechargeTotal, setRechargeTotal] = useState(0);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'set' | 'update'>('set');
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchBalance();
    checkHasPassword();
  }, []);

  useEffect(() => {
    fetchRecharges();
  }, [rechargePage]);

  useEffect(() => {
    fetchTransactions();
  }, [transactionPage]);

  const fetchBalance = async () => {
    try {
      const res = await api.getBalance();
      setBalance(res.data);
    } catch (error) {
      message.error('获取余额失败');
    }
  };

  const checkHasPassword = async () => {
    try {
      const res = await api.hasPaymentPassword();
      setHasPassword(res.data);
    } catch (error) {
      console.error('Failed to check payment password:', error);
    }
  };

  const fetchRecharges = async () => {
    setLoading(true);
    try {
      const res = await api.getRecharges({
        page: rechargePage,
        page_size: pageSize,
      });
      setRecharges(res.data);
      setRechargeTotal(res.total);
    } catch (error) {
      message.error('获取充值记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.getTransactions({
        page: transactionPage,
        page_size: pageSize,
      });
      setTransactions(res.data);
      setTransactionTotal(res.total);
    } catch (error) {
      message.error('获取交易记录失败');
    } finally {
      setLoading(false);
    }
  };

  const openPasswordModal = (mode: 'set' | 'update') => {
    setPasswordMode(mode);
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async (values: any) => {
    setPasswordLoading(true);
    try {
      if (passwordMode === 'set') {
        await api.setPaymentPassword({
          payment_password: values.payment_password,
        });
        message.success('支付密码设置成功');
        setHasPassword(true);
      } else {
        await api.updatePaymentPassword({
          old_payment_password: values.old_payment_password,
          new_payment_password: values.new_payment_password,
        });
        message.success('支付密码修改成功');
      }
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error(passwordMode === 'set' ? '设置失败' : '修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  const rechargeColumns: ColumnsType<RechargeOrder> = [
    {
      title: '充值单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      render: (no) => <Text copyable>{no}</Text>,
    },
    {
      title: '充值金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>¥{amount}</Text>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator_info',
      key: 'operator_info',
      render: (info) => info?.full_name || info?.username || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (remark) => remark || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusMap[status]?.color}>
          {statusMap[status]?.label}
        </Tag>
      ),
    },
    {
      title: '充值时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => time.substring(0, 16),
    },
  ];

  const transactionColumns: ColumnsType<TransactionRecord> = [
    {
      title: '交易单号',
      dataIndex: 'transaction_no',
      key: 'transaction_no',
      width: 180,
      render: (no) => <Text copyable>{no}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => (
        <Tag color={typeMap[type]?.color}>
          {typeMap[type]?.label}
        </Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount, record) => (
        <Text
          strong
          style={{ color: record.type === 'recharge' ? '#52c41a' : '#f5222d' }}
        >
          {record.type === 'recharge' ? '+' : '-'}¥{amount}
        </Text>
      ),
    },
    {
      title: '交易后余额',
      dataIndex: 'balance_after',
      key: 'balance_after',
      width: 120,
      render: (balance) => `¥${balance}`,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (remark) => remark || '-',
    },
    {
      title: '交易时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => time.substring(0, 16),
    },
  ];

  const tabItems = [
    {
      key: 'recharges',
      label: '充值记录',
      children: (
        <Table<RechargeOrder>
          columns={rechargeColumns}
          dataSource={recharges}
          rowKey="id"
          loading={loading}
          pagination={{
            current: rechargePage,
            pageSize,
            total: rechargeTotal,
            showSizeChanger: false,
            onChange: setRechargePage,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      ),
    },
    {
      key: 'transactions',
      label: '交易明细',
      children: (
        <Table<TransactionRecord>
          columns={transactionColumns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: transactionPage,
            pageSize,
            total: transactionTotal,
            showSizeChanger: false,
            onChange: setTransactionPage,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>
          <WalletOutlined style={{ marginRight: 8 }} />
          我的钱包
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchBalance();
              fetchRecharges();
              fetchTransactions();
            }}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<KeyOutlined />}
            onClick={() => openPasswordModal(hasPassword ? 'update' : 'set')}
          >
            {hasPassword ? '修改支付密码' : '设置支付密码'}
          </Button>
        </Space>
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="账户余额"
                value={balance?.balance || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
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
            <Card size="small">
              <Statistic
                title="累计消费"
                value={balance?.total_consumption || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card className="card-shadow">
        <Tabs defaultActiveKey="recharges" items={tabItems} />
      </Card>

      <Modal
        title={passwordMode === 'set' ? '设置支付密码' : '修改支付密码'}
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
          {passwordMode === 'update' && (
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
            label={passwordMode === 'set' ? '支付密码' : '新支付密码'}
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
            dependencies={[passwordMode === 'set' ? 'payment_password' : 'new_payment_password']}
            rules={[
              { required: true, message: '请确认支付密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const pwdField = passwordMode === 'set' ? 'payment_password' : 'new_payment_password';
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
          {passwordMode === 'update' && (
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
                  setPasswordModalOpen(false);
                  passwordForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={passwordLoading}>
                确认{passwordMode === 'set' ? '设置' : '修改'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Wallet;
