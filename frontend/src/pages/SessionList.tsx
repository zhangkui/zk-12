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
  DatePicker,
  TimePicker,
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
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import * as api from '../services';
import { Session, Script, Room, Host } from '../types';
import { useAuthStore } from '../store/useAuthStore';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待拼团', color: 'orange' },
  confirmed: { label: '已成团', color: 'green' },
  full: { label: '已满员', color: 'purple' },
  cancelled: { label: '已取消', color: 'red' },
  completed: { label: '已完成', color: 'blue' },
};

const SessionList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [sessions, setSessions] = useState<Session[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    keyword: '',
    script_id: location.state?.scriptId,
    status: undefined as string | undefined,
    dateRange: [] as dayjs.Dayjs[],
  });
  const [formDate, setFormDate] = useState<dayjs.Dayjs | null>(null);
  const [formStartTime, setFormStartTime] = useState<dayjs.Dayjs | null>(null);
  const [formEndTime, setFormEndTime] = useState<dayjs.Dayjs | null>(null);
  const [availableHosts, setAvailableHosts] = useState<Host[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);

  useEffect(() => {
    fetchScripts();
    fetchRooms();
    fetchHosts();
  }, []);

  useEffect(() => {
    if (formDate && formStartTime && formEndTime) {
      fetchAvailableHosts();
    } else {
      setAvailableHosts([]);
    }
  }, [formDate, formStartTime, formEndTime]);

  const fetchAvailableHosts = async () => {
    if (!formDate || !formStartTime || !formEndTime) return;
    setLoadingHosts(true);
    try {
      const res = await api.getAvailableHosts(
        formDate.format('YYYY-MM-DD'),
        formStartTime.format('HH:mm:ss'),
        formEndTime.format('HH:mm:ss')
      );
      setAvailableHosts(res.data || []);
    } catch (error) {
      console.error('Failed to fetch available hosts:', error);
      setAvailableHosts([]);
    } finally {
      setLoadingHosts(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, filters]);

  const fetchScripts = async () => {
    try {
      const res = await api.getScripts({ page_size: 100 });
      setScripts(res.data);
    } catch (error) {
      console.error('Failed to fetch scripts:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.getRooms({ page_size: 100 });
      setRooms(res.data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const fetchHosts = async () => {
    try {
      const res = await api.getHosts({ page_size: 100 });
      setHosts(res.data);
    } catch (error) {
      console.error('Failed to fetch hosts:', error);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: pageSize,
        keyword: filters.keyword || undefined,
        script_id: filters.script_id || undefined,
        status: filters.status || undefined,
      };
      if (filters.dateRange?.length === 2) {
        params.start_date = filters.dateRange[0].format('YYYY-MM-DD');
        params.end_date = filters.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await api.getSessions(params);
      setSessions(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    const date = dayjs(session.date);
    const startTime = dayjs(session.start_time, 'HH:mm:ss');
    const endTime = dayjs(session.end_time, 'HH:mm:ss');
    setFormDate(date);
    setFormStartTime(startTime);
    setFormEndTime(endTime);
    form.setFieldsValue({
      ...session,
      date,
      start_time: startTime,
      end_time: endTime,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteSession(id);
      message.success('删除成功');
      fetchSessions();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    const data = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
      start_time: values.start_time.format('HH:mm:ss'),
      end_time: values.end_time.format('HH:mm:ss'),
    };
    try {
      if (editingSession) {
        await api.updateSession(editingSession.id, data);
        message.success('更新成功');
      } else {
        await api.createSession(data);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      setEditingSession(null);
      form.resetFields();
      fetchSessions();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<Session> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '剧本',
      dataIndex: 'script_name',
      key: 'script_name',
      render: (_, record) => record.script_name || scripts.find(s => s.id === record.script_id)?.name,
    },
    {
      title: '房间',
      dataIndex: 'room_name',
      key: 'room_name',
      render: (_, record) => record.room_name || rooms.find(r => r.id === record.room_id)?.name,
    },
    {
      title: '主持人',
      dataIndex: 'host_name',
      key: 'host_name',
      render: (_, record) => record.host_name || (record.host_id ? hosts.find(h => h.id === record.host_id)?.nickname : '未指派'),
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
      width: 160,
      render: (_, record) => `${record.start_time.substring(0, 5)} - ${record.end_time.substring(0, 5)}`,
    },
    {
      title: '人数',
      key: 'players',
      width: 100,
      render: (_, record) => (
        <div>
          <div style={{ color: record.current_players >= record.max_players ? '#f5222d' : '#52c41a' }}>
            {record.current_players}/{record.max_players}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            最少{record.min_players}人
          </div>
        </div>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => <span style={{ color: '#f5222d', fontWeight: 600 }}>¥{price}</span>,
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
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/sessions/${record.id}`)}
          >
            详情
          </Button>
          {isAdmin && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定删除这个场次吗？"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>场次管理</Title>
        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingSession(null);
              setFormDate(null);
              setFormStartTime(null);
              setFormEndTime(null);
              setAvailableHosts([]);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            发布场次
          </Button>
        )}
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索剧本名称"
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onPressEnter={() => setPage(1)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="剧本"
              allowClear
              value={filters.script_id}
              onChange={(v) => setFilters({ ...filters, script_id: v })}
              style={{ width: '100%' }}
            >
              {scripts.map(s => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="状态"
              allowClear
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
              style={{ width: '100%' }}
            >
              <Option value="pending">待拼团</Option>
              <Option value="confirmed">已成团</Option>
              <Option value="full">已满员</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
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
        <Table<Session>
          columns={columns}
          dataSource={sessions}
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
        title={editingSession ? '编辑场次' : '发布场次'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingSession(null);
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
            <Col span={16}>
              <Form.Item
                name="script_id"
                label="选择剧本"
                rules={[{ required: true, message: '请选择剧本' }]}
              >
                <Select placeholder="请选择剧本">
                  {scripts.map(s => (
                    <Option key={s.id} value={s.id}>{s.name} ({s.min_players}-{s.max_players}人)</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="price"
                label="价格（元/人）"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="价格" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="room_id"
                label="选择房间"
                rules={[{ required: true, message: '请选择房间' }]}
              >
                <Select placeholder="请选择房间">
                  {rooms.map(r => (
                    <Option key={r.id} value={r.id}>{r.name} (容量{r.capacity}人)</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="host_id"
                label="主持人（可选）"
              >
                <Select
                  placeholder={
                    formDate && formStartTime && formEndTime
                      ? loadingHosts
                        ? '加载中...'
                        : availableHosts.length === 0
                          ? '该时间段暂无可用主持人'
                          : '请选择主持人'
                      : '请先选择日期和时间'
                  }
                  allowClear
                  loading={loadingHosts}
                  disabled={!formDate || !formStartTime || !formEndTime}
                >
                  {availableHosts.map(h => (
                    <Option key={h.id} value={h.id}>{h.nickname} (评分{h.rating})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="date"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="选择日期"
                  onChange={(value) => setFormDate(value)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="start_time"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker
                  style={{ width: '100%' }}
                  format="HH:mm"
                  placeholder="开始时间"
                  onChange={(value) => setFormStartTime(value)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="end_time"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker
                  style={{ width: '100%' }}
                  format="HH:mm"
                  placeholder="结束时间"
                  onChange={(value) => setFormEndTime(value)}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="min_players"
                label="最少人数"
                rules={[{ required: true, message: '请输入最少人数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="最少人数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_players"
                label="最多人数"
                rules={[{ required: true, message: '请输入最多人数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="最多人数" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingSession(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingSession ? '更新' : '发布'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SessionList;
