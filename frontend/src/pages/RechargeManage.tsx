import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  message,
  Space,
  Tag,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as api from '../services';
import { RechargeOrder, User } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '处理中', color: 'orange' },
  completed: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'red' },
};

const RechargeManage: React.FC = () => {
  const [recharges, setRecharges] = useState<RechargeOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined as string | undefined,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchRecharges();
  }, [page, filters]);

  const fetchUsers = async () => {
    try {
      const res = await api.getUsers({ page_size: 100 });
      setUsers(res.data);
    } catch (error) {
      message.error('获取用户列表失败');
    }
  };

  const fetchRecharges = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: pageSize,
        keyword: filters.keyword || undefined,
        status: filters.status || undefined,
      };
      const res = await api.getRecharges(params);
      setRecharges(res.data);
      setTotal(res.total);
    } catch (error) {
      message.error('获取充值记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitLoading(true);
    try {
      await api.recharge({
        user_id: values.user_id,
        amount: values.amount,
        remark: values.remark,
      });
      message.success('充值成功');
      setModalOpen(false);
      form.resetFields();
      fetchRecharges();
    } catch (error) {
      message.error('充值失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns: ColumnsType<RechargeOrder> = [
    {
      title: '充值单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      render: (no) => <Text copyable>{no}</Text>,
    },
    {
      title: '充值用户',
      dataIndex: 'user_info',
      key: 'user_info',
      render: (info) => (
        <div>
          <div>{info?.full_name || info?.username}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{info?.phone || ''}</div>
        </div>
      ),
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

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>充值管理</Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchRecharges()}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setModalOpen(true);
            }}
          >
            给用户充值
          </Button>
        </Space>
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Input
              placeholder="搜索单号/用户"
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onPressEnter={() => setPage(1)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6}>
            <Select
              placeholder="状态"
              allowClear
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
              style={{ width: '100%' }}
            >
              <Option value="pending">处理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={() => setPage(1)}>搜索</Button>
          </Col>
        </Row>
      </Card>

      <Card className="card-shadow">
        <Table<RechargeOrder>
          columns={columns}
          dataSource={recharges}
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
        title="给用户充值"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="user_id"
            label="选择用户"
            rules={[{ required: true, message: '请选择用户' }]}
          >
            <Select
              placeholder="请选择要充值的用户"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map((user) => (
                <Option
                  key={user.id}
                  value={user.id}
                  label={`${user.full_name || user.username} (${user.phone || user.email})`}
                >
                  <div>
                    <Text strong>{user.full_name || user.username}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      @{user.username}
                    </Text>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {user.phone || user.email}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="充值金额"
            rules={[
              { required: true, message: '请输入充值金额' },
              { type: 'number', min: 0.01, message: '充值金额必须大于0' },
            ]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入充值金额"
              prefix="¥"
            />
          </Form.Item>
          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入备注（选填）"
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setModalOpen(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                确认充值
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RechargeManage;
