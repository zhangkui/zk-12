import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Typography,
  Pagination,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
} from 'antd';
import { SearchOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as api from '../services';
import { Script, ScriptDifficulty, ScriptType } from '../types';
import { useAuthStore } from '../store/useAuthStore';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const difficultyMap: Record<string, { label: string; color: string }> = {
  easy: { label: '简单', color: 'green' },
  medium: { label: '中等', color: 'orange' },
  hard: { label: '困难', color: 'red' },
};

const typeMap: Record<string, { label: string; color: string }> = {
  suspense: { label: '悬疑', color: 'blue' },
  emotion: { label: '情感', color: 'pink' },
  horror: { label: '恐怖', color: 'purple' },
  happy: { label: '欢乐', color: 'gold' },
  mechanism: { label: '机制', color: 'cyan' },
  other: { label: '其他', color: 'default' },
};

const ScriptList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [difficulty, setDifficulty] = useState<string | undefined>();
  const [scriptType, setScriptType] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchScripts();
  }, [page, keyword, difficulty, scriptType]);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const res = await api.getScripts({
        page,
        page_size: pageSize,
        keyword,
        difficulty,
        script_type: scriptType,
        is_active: true,
      });
      setScripts(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error('Failed to fetch scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchScripts();
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    form.setFieldsValue({
      ...script,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteScript(id);
      message.success('删除成功');
      fetchScripts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingScript) {
        await api.updateScript(editingScript.id, values);
        message.success('更新成功');
      } else {
        await api.createScript(values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      setEditingScript(null);
      form.resetFields();
      fetchScripts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>剧本库</Title>
        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingScript(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            添加剧本
          </Button>
        )}
      </div>

      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索剧本名称、作者"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select
              placeholder="难度"
              allowClear
              value={difficulty}
              onChange={setDifficulty}
              style={{ width: '100%' }}
            >
              <Option value="easy">简单</Option>
              <Option value="medium">中等</Option>
              <Option value="hard">困难</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select
              placeholder="类型"
              allowClear
              value={scriptType}
              onChange={setScriptType}
              style={{ width: '100%' }}
            >
              <Option value="suspense">悬疑</Option>
              <Option value="emotion">情感</Option>
              <Option value="horror">恐怖</Option>
              <Option value="happy">欢乐</Option>
              <Option value="mechanism">机制</Option>
              <Option value="other">其他</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleSearch} type="primary">搜索</Button>
              <Button
                onClick={() => {
                  setKeyword('');
                  setDifficulty(undefined);
                  setScriptType(undefined);
                  setPage(1);
                }}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {scripts.map((script) => (
          <Col xs={24} sm={12} md={8} lg={6} key={script.id}>
            <Card
              className="session-card card-shadow"
              hoverable
              onClick={() => navigate(`/scripts/${script.id}`)}
              cover={
                <div
                  style={{
                    height: 180,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 600,
                    padding: 16,
                    textAlign: 'center',
                  }}
                >
                  {script.name}
                </div>
              }
              actions={
                isAdmin
                  ? [
                      <EditOutlined
                        key="edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(script);
                        }}
                      />,
                      <Popconfirm
                        title="确定删除这个剧本吗？"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          handleDelete(script.id);
                        }}
                        onClick={(e) => e?.stopPropagation()}
                      >
                        <DeleteOutlined key="delete" />
                      </Popconfirm>,
                    ]
                  : undefined
              }
            >
              <Card.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{script.name}</span>
                    <Text strong style={{ color: '#f5222d', fontSize: 16 }}>¥{script.price}</Text>
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Space size={[4, 4]} wrap>
                        <Tag color={difficultyMap[script.difficulty]?.color}>
                          {difficultyMap[script.difficulty]?.label}
                        </Tag>
                        <Tag color={typeMap[script.script_type]?.color}>
                          {typeMap[script.script_type]?.label}
                        </Tag>
                        <Tag color="blue">{script.min_players}-{script.max_players}人</Tag>
                        <Tag color="gold">{script.duration_minutes}分钟</Tag>
                      </Space>
                    </div>
                    <Text type="secondary" ellipsis={{ rows: 2 }}>
                      {script.description || '暂无描述'}
                    </Text>
                    {script.tags && (
                      <div style={{ marginTop: 8 }}>
                        {script.tags.split(',').map((tag, i) => (
                          <Tag key={i} style={{ marginBottom: 4 }}>{tag}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger={false}
          onChange={setPage}
        />
      </div>

      <Modal
        title={editingScript ? '编辑剧本' : '添加剧本'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingScript(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
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
                label="剧本名称"
                rules={[{ required: true, message: '请输入剧本名称' }]}
              >
                <Input placeholder="请输入剧本名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="price"
                label="价格（元）"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber
                  placeholder="价格"
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="author"
                label="作者"
              >
                <Input placeholder="作者" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="publisher"
                label="发行商"
              >
                <Input placeholder="发行商" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="difficulty"
                label="难度"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Select placeholder="请选择难度">
                  <Option value="easy">简单</Option>
                  <Option value="medium">中等</Option>
                  <Option value="hard">困难</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="script_type"
                label="类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select placeholder="请选择类型">
                  <Option value="suspense">悬疑</Option>
                  <Option value="emotion">情感</Option>
                  <Option value="horror">恐怖</Option>
                  <Option value="happy">欢乐</Option>
                  <Option value="mechanism">机制</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="duration_minutes"
                label="时长（分钟）"
                rules={[{ required: true, message: '请输入时长' }]}
              >
                <InputNumber
                  placeholder="时长"
                  min={0}
                  style={{ width: '100%' }}
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
                <InputNumber
                  placeholder="最少人数"
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_players"
                label="最多人数"
                rules={[{ required: true, message: '请输入最多人数' }]}
              >
                <InputNumber
                  placeholder="最多人数"
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="剧本描述"
          >
            <TextArea
              rows={4}
              placeholder="请输入剧本描述"
            />
          </Form.Item>
          <Form.Item
            name="tags"
            label="标签（逗号分隔）"
          >
            <Input placeholder="例如：民国,情感,推理" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingScript(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingScript ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScriptList;
