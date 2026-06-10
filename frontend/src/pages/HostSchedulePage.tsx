import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Select,
  Card,
  Tag,
  Modal,
  Form,
  message,
  Typography,
  Popconfirm,
  Row,
  Col,
  DatePicker,
  TimePicker,
  Input,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import * as api from '../services';
import { HostSchedule, Host, Session } from '../types';

const { Title } = Typography;
const { Option } = Select;

const scheduleStatusMap: Record<string, { label: string; color: string }> = {
  available: { label: '可接单', color: 'green' },
  scheduled: { label: '已排期', color: 'blue' },
  unavailable: { label: '不可用', color: 'red' },
};

const HostSchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<HostSchedule[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<HostSchedule | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    host_id: undefined as number | undefined,
    start_date: undefined as string | undefined,
    end_date: undefined as string | undefined,
    status: undefined as string | undefined,
  });

  useEffect(() => {
    fetchHosts();
    fetchSessions();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [page, filters]);

  const fetchHosts = async () => {
    try {
      const res = await api.getHosts({ page_size: 100 });
      setHosts(res.data);
    } catch (error) {
      console.error('Failed to fetch hosts:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await api.getSessions({ page_size: 100 });
      setSessions(res.data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: pageSize,
        host_id: filters.host_id || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        status: filters.status || undefined,
      };
      const res = await api.getHostSchedules(params);
      setSchedules(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHostName = (hostId: number) => {
    return hosts.find(h => h.id === hostId)?.nickname || `主持人 #${hostId}`;
  };

  const getSessionName = (sessionId?: number) => {
    if (!sessionId) return '-';
    const session = sessions.find(s => s.id === sessionId);
    return session?.script_name || `场次 #${sessionId}`;
  };

  const handleEdit = (schedule: HostSchedule) => {
    setEditingSchedule(schedule);
    form.setFieldsValue({
      ...schedule,
      date: dayjs(schedule.date),
      start_time: dayjs(schedule.start_time, 'HH:mm:ss'),
      end_time: dayjs(schedule.end_time, 'HH:mm:ss'),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteHostSchedule(id);
      message.success('删除成功');
      fetchSchedules();
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
      if (editingSchedule) {
        await api.updateHostSchedule(editingSchedule.id, data);
        message.success('更新成功');
      } else {
        await api.createHostSchedule(data);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      setEditingSchedule(null);
      form.resetFields();
      fetchSchedules();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<HostSchedule> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '主持人',
      dataIndex: 'host_id',
      key: 'host_id',
      render: (hostId) => getHostName(hostId),
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {date}
        </Space>
      ),
    },
    {
      title: '时间',
      key: 'time',
      width: 160,
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined />
          {record.start_time.substring(0, 5)} - {record.end_time.substring(0, 5)}
        </Space>
      ),
    },
    {
      title: '关联场次',
      dataIndex: 'session_id',
      key: 'session_id',
      render: (sessionId) => getSessionName(sessionId),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={scheduleStatusMap[status]?.color}>
          {scheduleStatusMap[status]?.label}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes) => notes || '-',
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
            title="确定删除这个排班吗？"
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
        <Title level={3} style={{ margin: 0 }}>主持人排班</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingSchedule(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          添加排班
        </Button>
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="主持人"
              allowClear
              showSearch
              value={filters.host_id}
              onChange={(v) => setFilters({ ...filters, host_id: v })}
              style={{ width: '100%' }}
            >
              {hosts.map(h => (
                <Option key={h.id} value={h.id}>{h.nickname}</Option>
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
              <Option value="available">可接单</Option>
              <Option value="scheduled">已排期</Option>
              <Option value="unavailable">不可用</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setFilters({
                    ...filters,
                    start_date: dates[0].format('YYYY-MM-DD'),
                    end_date: dates[1].format('YYYY-MM-DD'),
                  });
                } else {
                  setFilters({
                    ...filters,
                    start_date: undefined,
                    end_date: undefined,
                  });
                }
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={2} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={() => setPage(1)}>搜索</Button>
          </Col>
        </Row>
      </Card>

      <Card className="card-shadow">
        <Table<HostSchedule>
          columns={columns}
          dataSource={schedules}
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
        title={editingSchedule ? '编辑排班' : '添加排班'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingSchedule(null);
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
                name="host_id"
                label="选择主持人"
                rules={[{ required: true, message: '请选择主持人' }]}
              >
                <Select placeholder="请选择主持人">
                  {hosts.map(h => (
                    <Option key={h.id} value={h.id}>{h.nickname}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态" defaultValue="available">
                  <Option value="available">可接单</Option>
                  <Option value="scheduled">已排期</Option>
                  <Option value="unavailable">不可用</Option>
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
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="start_time"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" placeholder="开始时间" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="end_time"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" placeholder="结束时间" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="session_id"
            label="关联场次（可选）"
          >
            <Select placeholder="选择场次" allowClear showSearch>
              {sessions.filter(s => s.status !== 'cancelled' && s.status !== 'completed').map(s => (
                <Option key={s.id} value={s.id}>
                  {s.script_name || `场次 #${s.id}`} - {s.date}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingSchedule(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingSchedule ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HostSchedulePage;
