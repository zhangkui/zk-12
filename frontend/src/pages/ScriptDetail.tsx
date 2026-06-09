import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Button, Tag, Space, Typography, Row, Col, List, message } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, TeamOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../services';
import { Script, Session } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

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

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待拼团', color: 'orange' },
  confirmed: { label: '已成团', color: 'green' },
  full: { label: '已满员', color: 'purple' },
  cancelled: { label: '已取消', color: 'red' },
  completed: { label: '已完成', color: 'blue' },
};

const ScriptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [script, setScript] = useState<Script | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchScriptDetail(parseInt(id));
    }
  }, [id]);

  const fetchScriptDetail = async (scriptId: number) => {
    setLoading(true);
    try {
      const [scriptRes, sessionsRes] = await Promise.all([
        api.getScript(scriptId),
        api.getSessions({ script_id: scriptId, page_size: 10 }),
      ]);
      setScript(scriptRes.data);
      setSessions(sessionsRes.data);
    } catch (error) {
      message.error('获取剧本详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (!script) {
    return <div>加载中...</div>;
  }

  return (
    <div className="page-container">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/scripts')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="card-shadow" loading={loading}>
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              <div
                style={{
                  width: 200,
                  height: 280,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                  fontWeight: 600,
                  padding: 16,
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {script.name}
              </div>
              <div style={{ flex: 1 }}>
                <Title level={2} style={{ margin: '0 0 16px 0' }}>
                  {script.name}
                </Title>
                <Space size={[8, 8]} wrap style={{ marginBottom: 16 }}>
                  <Tag color={difficultyMap[script.difficulty]?.color}>
                    {difficultyMap[script.difficulty]?.label}
                  </Tag>
                  <Tag color={typeMap[script.script_type]?.color}>
                    {typeMap[script.script_type]?.label}
                  </Tag>
                  <Tag color="blue">
                    <TeamOutlined /> {script.min_players}-{script.max_players}人
                  </Tag>
                  <Tag color="gold">
                    <ClockCircleOutlined /> {script.duration_minutes}分钟
                  </Tag>
                </Space>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">作者：{script.author || '未知'}</Text>
                  <Text type="secondary" style={{ marginLeft: 24 }}>
                    发行：{script.publisher || '未知'}
                  </Text>
                </div>
                <Title level={3} style={{ color: '#f5222d', margin: '16px 0' }}>
                  ¥{script.price} / 人
                </Title>
                {script.tags && (
                  <Space size={[4, 4]} wrap>
                    {script.tags.split(',').map((tag, i) => (
                      <Tag key={i}>{tag}</Tag>
                    ))}
                  </Space>
                )}
              </div>
            </div>

            <Descriptions title="剧本简介" bordered column={1} size="middle">
              <Descriptions.Item label="剧本描述">
                {script.description || '暂无描述'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            className="card-shadow"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarOutlined />
                <span>可约场次</span>
              </div>
            }
            extra={
              <Button type="primary" onClick={() => navigate('/sessions', { state: { scriptId: script.id } })}>
                查看全部
              </Button>
            }
          >
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                暂无场次
              </div>
            ) : (
              <List
                dataSource={sessions}
                renderItem={(item) => (
                  <List.Item
                    className="session-card"
                    onClick={() => navigate(`/sessions/${item.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong>{item.date}</Text>
                          <Tag color={statusMap[item.status]?.color}>
                            {statusMap[item.status]?.label}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div>
                            <Text type="secondary">
                              {item.start_time} - {item.end_time}
                            </Text>
                          </div>
                          <div>
                            <Text type="secondary">
                              {item.current_players}/{item.max_players}人 · {item.room_name || '房间' + item.room_id}
                            </Text>
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <Text strong style={{ color: '#f5222d' }}>¥{item.price}/人</Text>
                          </div>
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
    </div>
  );
};

export default ScriptDetail;
