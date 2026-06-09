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
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as api from '../services';
import { Room } from '../types';

const { Title } = Typography;
const { Option } = Select;

const RoomList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    keyword: '',
    min_capacity: undefined as number | undefined,
    is_active: undefined as boolean | undefined,
  });

  useEffect(() => {
    fetchRooms();
  }, [page, filters]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: pageSize,
        keyword: filters.keyword || undefined,
        min_capacity: filters.min_capacity || undefined,
        is_active: filters.is_active,
      };
      const res = await api.getRooms(params);
      setRooms(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    form.setFieldsValue(room);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteRoom(id);
      message.success('删除成功');
      fetchRooms();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingRoom) {
        await api.updateRoom(editingRoom.id, values);
        message.success('更新成功');
      } else {
        await api.createRoom(values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      setEditingRoom(null);
      form.resetFields();
      fetchRooms();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<Room> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '房间名称',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <Space>
          <HomeOutlined />
          {name}
        </Space>
      ),
    },
    {
      title: '容纳人数',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
      render: (capacity) => (
        <Space>
          <UserOutlined />
          {capacity} 人
        </Space>
      ),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      render: (location) => location || '-',
    },
    {
      title: '设备',
      dataIndex: 'equipment',
      key: 'equipment',
      render: (equipment) => equipment || '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (desc) => desc || '-',
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
            title="确定删除这个房间吗？"
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
        <Title level={3} style={{ margin: 0 }}>房间管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRoom(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          添加房间
        </Button>
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索房间名称"
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onPressEnter={() => setPage(1)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <InputNumber
              placeholder="最少人数"
              min={1}
              value={filters.min_capacity}
              onChange={(v) => setFilters({ ...filters, min_capacity: v || undefined })}
              style={{ width: '100%' }}
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
        <Table<Room>
          columns={columns}
          dataSource={rooms}
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
        title={editingRoom ? '编辑房间' : '添加房间'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingRoom(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="房间名称"
                rules={[{ required: true, message: '请输入房间名称' }]}
              >
                <Input placeholder="房间名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="capacity"
                label="容纳人数"
                rules={[{ required: true, message: '请输入容纳人数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="人数" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="location"
            label="位置"
          >
            <Input placeholder="如：二楼东侧" />
          </Form.Item>
          <Form.Item
            name="equipment"
            label="设备"
          >
            <Input placeholder="如：投影仪、音响、空调等，用逗号分隔" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="房间描述" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRoom(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRoom ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomList;
