import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Card,
  Tag,
  Modal,
  Form,
  InputNumber,
  message,
  Typography,
  Popconfirm,
  Row,
  Col,
  Rate,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as api from '../services';
import { Host, User } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

const HostList: React.FC = () => {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    keyword: '',
    is_active: undefined as boolean | undefined,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchHosts();
  }, [page, filters]);

  const fetchUsers = async () => {
    try {
      const res = await api.getUsers({ page_size: 100 });
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchHosts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: pageSize,
        keyword: filters.keyword || undefined,
        is_active: filters.is_active,
      };
      const res = await api.getHosts(params);
      setHosts(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error('Failed to fetch hosts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: number) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.full_name || foundUser?.username || `用户 #${userId}`;
  };

  const handleEdit = (host: Host) => {
    setEditingHost(host);
    form.setFieldsValue(host);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteHost(id);
      message.success('删除成功');
      fetchHosts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingHost) {
        await api.updateHost(editingHost.id, values);
        message.success('更新成功');
      } else {
        await api.createHost(values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      setEditingHost(null);
      form.resetFields();
      fetchHosts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<Host> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar) => (
        <Avatar icon={<UserOutlined />} src={avatar} />
      ),
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '关联用户',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (userId) => getUserName(userId),
    },
    {
      title: '从业年限',
      dataIndex: 'experience_years',
      key: 'experience_years',
      width: 100,
      render: (years) => `${years} 年`,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      render: (rating) => (
        <Space>
          <Rate disabled value={rating} allowHalf />
          <Text>{rating}</Text>
        </Space>
      ),
    },
    {
      title: '带本场次',
      dataIndex: 'session_count',
      key: 'session_count',
      width: 100,
    },
    {
      title: '时薪',
      dataIndex: 'hourly_rate',
      key: 'hourly_rate',
      width: 100,
      render: (rate) => <span style={{ color: '#f5222d' }}>¥{rate}/小时</span>,
    },
    {
      title: '接单状态',
      dataIndex: 'accept_type',
      key: 'accept_type',
      width: 100,
      render: (type) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          all: { label: '接受所有', color: 'green' },
          weekday: { label: '仅工作日', color: 'blue' },
          weekend: { label: '仅周末', color: 'orange' },
          none: { label: '暂停接单', color: 'red' },
        };
        const info = typeMap[type] || { label: type, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个主持人吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>主持人管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingHost(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          添加主持人
        </Button>
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索昵称"
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
              value={filters.is_active}
              onChange={(v) => setFilters({ ...filters, is_active: v })}
              style={{ width: '100%' }}
            >
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={2} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={() => setPage(1)}>搜索</Button>
          </Col>
        </Row>
      </Card>

      <Card className="card-shadow">
        <Table<Host>
          columns={columns}
          dataSource={hosts}
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
        title={editingHost ? '编辑主持人' : '添加主持人'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingHost(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="user_id"
                label="关联用户"
                rules={[{ required: true, message: '请选择关联用户' }]}
              >
                <Select placeholder="请选择用户">
                  {users.map(u => (
                    <Option key={u.id} value={u.id}>
                      {u.full_name || u.username} ({u.username})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nickname"
                label="艺名/昵称"
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input placeholder="昵称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="experience_years"
                label="从业年限"
                rules={[{ required: true, message: '请输入从业年限' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="从业年限" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="hourly_rate"
                label="时薪（元/小时）"
                rules={[{ required: true, message: '请输入时薪' }]}
              >
                <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="时薪" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="rating"
                label="初始评分"
                rules={[{ required: true, message: '请输入评分' }]}
              >
                <InputNumber min={0} max={5} step={0.5} style={{ width: '100%' }} placeholder="评分" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="specialties"
            label="擅长类型"
          >
            <Input placeholder="如：古风、推理、情感等，用逗号分隔" />
          </Form.Item>
          <Form.Item
            name="bio"
            label="个人简介"
          >
            <Input.TextArea rows={3} placeholder="个人简介" />
          </Form.Item>
          <Form.Item
            name="avatar"
            label="头像URL"
          >
            <Input placeholder="头像链接" />
          </Form.Item>
          <Form.Item
            name="accept_type"
            label="接单设置"
            rules={[{ required: true, message: '请选择接单设置' }]}
          >
            <Select placeholder="请选择接单设置">
              <Option value="all">接受所有时间</Option>
              <Option value="weekday">仅工作日接单</Option>
              <Option value="weekend">仅周末接单</Option>
              <Option value="none">暂停接单</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingHost(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingHost ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HostList;
