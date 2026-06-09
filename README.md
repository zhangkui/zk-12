# 剧本杀门店拼团成局与主持排班系统

一个完整的剧本杀门店管理系统，实现剧本场次发布、玩家拼团、主持人排班、房间分配和订单结算管理。

## 技术栈

### 后端
- **FastAPI** 0.115.0 - 高性能Python Web框架
- **SQLAlchemy** 2.0.35 - ORM框架
- **PostgreSQL** 15 - 关系型数据库
- **Pydantic** 2.9.2 - 数据验证
- **JWT** - 身份认证
- **bcrypt** - 密码加密

### 前端
- **React** 18 + **TypeScript**
- **Vite** 5 - 构建工具
- **Ant Design** 5 - UI组件库
- **React Router** v6 - 路由管理
- **Zustand** - 状态管理
- **Axios** - HTTP客户端
- **Day.js** - 日期处理

### 部署
- **Docker** + **Docker Compose** - 容器化部署
- **Nginx** - 反向代理

## 项目结构

```
.
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── api/                # API 路由
│   │   │   ├── auth.py         # 认证接口
│   │   │   ├── users.py        # 用户管理
│   │   │   ├── scripts.py      # 剧本管理
│   │   │   ├── rooms.py        # 房间管理
│   │   │   ├── hosts.py        # 主持人管理
│   │   │   ├── host_schedules.py  # 排班管理
│   │   │   ├── sessions.py     # 场次管理
│   │   │   ├── bookings.py     # 报名管理
│   │   │   └── orders.py       # 订单管理
│   │   ├── core/               # 核心配置
│   │   │   ├── config.py       # 配置加载
│   │   │   ├── database.py     # 数据库连接
│   │   │   └── security.py     # 安全认证
│   │   ├── models/             # 数据库模型
│   │   ├── schemas/            # Pydantic 验证模型
│   │   ├── services/           # 业务逻辑层
│   │   └── main.py             # FastAPI 主入口
│   ├── init_db.py              # 数据库初始化脚本
│   ├── requirements.txt        # Python 依赖
│   ├── .env                    # 环境变量
│   └── Dockerfile
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── components/         # 公共组件
│   │   ├── pages/              # 页面组件
│   │   │   ├── Login.tsx       # 登录页
│   │   │   ├── Register.tsx    # 注册页
│   │   │   ├── Dashboard.tsx   # 工作台
│   │   │   ├── ScriptList.tsx  # 剧本列表
│   │   │   ├── ScriptDetail.tsx  # 剧本详情
│   │   │   ├── SessionList.tsx   # 场次管理
│   │   │   ├── SessionDetail.tsx # 场次详情
│   │   │   ├── BookingList.tsx   # 拼团报名
│   │   │   ├── OrderList.tsx     # 订单管理
│   │   │   ├── HostList.tsx      # 主持人管理
│   │   │   ├── HostSchedulePage.tsx  # 主持人排班
│   │   │   ├── RoomList.tsx      # 房间管理
│   │   │   └── UserList.tsx      # 用户管理
│   │   ├── services/           # API 服务
│   │   ├── store/              # 状态管理
│   │   ├── types/              # TypeScript 类型定义
│   │   ├── styles/             # 全局样式
│   │   └── router/             # 路由配置
│   ├── package.json
│   ├── .env                    # 环境变量
│   ├── nginx.conf              # Nginx 配置
│   └── Dockerfile
├── docker-compose.yml          # Docker Compose 配置
└── README.md
```

## 功能特性

### 核心功能
1. **剧本管理** - 剧本的增删改查，支持按类型、难度、人数筛选
2. **场次发布** - 发布剧本场次，自动检测房间和主持人时间冲突
3. **玩家拼团** - 玩家报名参加场次，支持候补队列自动转正
4. **主持人排班** - 主持人排班管理，查询可用时段
5. **房间分配** - 房间管理，时间冲突检测
6. **订单结算** - 订单管理、支付、取消、退款、每日统计
7. **权限控制** - 4级角色系统（player/host/admin/owner）

### 系统特色
- 场次状态自动流转（待拼团 → 已成团 → 已满员）
- 拼团候补机制，有人取消时按报名时间自动转正
- 房间/主持人时间冲突检测
- 订单-报名联动，支付成功自动确认报名
- 基于角色的细粒度权限控制
- 统一的API响应格式

## 快速开始

### 方式一：Docker 部署（推荐）

#### 前置要求
- Docker 20.10+
- Docker Compose 2.0+

#### 启动服务

```bash
# 克隆项目后，在项目根目录执行
docker-compose up -d --build
```

#### 服务访问
- 前端应用: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

#### 停止服务
```bash
docker-compose down
```

#### 查看日志
```bash
docker-compose logs -f
```

### 方式二：本地开发

#### 前置要求
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

#### 1. 启动数据库

```bash
# 使用 Docker 启动 PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_DB=murder_mystery \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 2. 启动后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 安装依赖
pip install -r requirements.txt

# 初始化数据库（创建表和测试数据）
python init_db.py

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 服务访问
- 前端应用: http://localhost:5173
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

## 测试账号

系统初始化时会创建以下测试账号：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | admin | 管理员，拥有所有管理权限 |
| owner | owner123 | owner | 店主，拥有所有管理权限 |
| player1 | player123 | player | 普通玩家，可报名拼团 |

## 角色权限说明

| 功能 | 玩家(player) | 主持人(host) | 管理员(admin) | 店主(owner) |
|------|------------|------------|-------------|------------|
| 查看剧本 | ✅ | ✅ | ✅ | ✅ |
| 查看场次 | ✅ | ✅ | ✅ | ✅ |
| 报名拼团 | ✅ | ✅ | ✅ | ✅ |
| 取消报名 | ✅ | ✅ | ✅ | ✅ |
| 查看自己订单 | ✅ | ✅ | ✅ | ✅ |
| 管理剧本 | ❌ | ❌ | ✅ | ✅ |
| 发布场次 | ❌ | ❌ | ✅ | ✅ |
| 确认报名 | ❌ | ❌ | ✅ | ✅ |
| 管理订单 | ❌ | ❌ | ✅ | ✅ |
| 主持人管理 | ❌ | ❌ | ✅ | ✅ |
| 排班管理 | ❌ | ❌ | ✅ | ✅ |
| 房间管理 | ❌ | ❌ | ✅ | ✅ |
| 用户管理 | ❌ | ❌ | ✅ | ✅ |
| 查看统计 | ❌ | ❌ | ✅ | ✅ |

## API 接口说明

### 认证接口
- `POST /api/v1/auth/login` - 登录
- `POST /api/v1/auth/register` - 注册
- `GET /api/v1/auth/me` - 获取当前用户信息

### 用户管理
- `GET /api/v1/users` - 用户列表
- `POST /api/v1/users` - 创建用户
- `GET /api/v1/users/{id}` - 用户详情
- `PUT /api/v1/users/{id}` - 更新用户
- `DELETE /api/v1/users/{id}` - 删除用户
- `PATCH /api/v1/users/{id}/password` - 修改密码

### 剧本管理
- `GET /api/v1/scripts` - 剧本列表
- `POST /api/v1/scripts` - 创建剧本
- `GET /api/v1/scripts/{id}` - 剧本详情
- `PUT /api/v1/scripts/{id}` - 更新剧本
- `DELETE /api/v1/scripts/{id}` - 删除剧本

### 场次管理
- `GET /api/v1/sessions` - 场次列表
- `POST /api/v1/sessions` - 创建场次
- `GET /api/v1/sessions/{id}` - 场次详情
- `PUT /api/v1/sessions/{id}` - 更新场次
- `DELETE /api/v1/sessions/{id}` - 删除场次
- `PATCH /api/v1/sessions/{id}/status` - 更新场次状态

### 报名管理
- `GET /api/v1/bookings` - 报名列表
- `POST /api/v1/bookings` - 创建报名
- `GET /api/v1/bookings/{id}` - 报名详情
- `POST /api/v1/bookings/{id}/confirm` - 确认报名
- `POST /api/v1/bookings/{id}/cancel` - 取消报名

### 订单管理
- `GET /api/v1/orders` - 订单列表
- `POST /api/v1/orders` - 创建订单
- `GET /api/v1/orders/{id}` - 订单详情
- `POST /api/v1/orders/{id}/pay` - 支付订单
- `POST /api/v1/orders/{id}/cancel` - 取消订单
- `GET /api/v1/orders/stats/daily` - 每日统计

### 主持人管理
- `GET /api/v1/hosts` - 主持人列表
- `POST /api/v1/hosts` - 创建主持人
- `GET /api/v1/hosts/{id}` - 主持人详情
- `PUT /api/v1/hosts/{id}` - 更新主持人
- `DELETE /api/v1/hosts/{id}` - 删除主持人
- `GET /api/v1/hosts/available` - 查询可用主持人

### 排班管理
- `GET /api/v1/host-schedules` - 排班列表
- `POST /api/v1/host-schedules` - 创建排班
- `GET /api/v1/host-schedules/{id}` - 排班详情
- `PUT /api/v1/host-schedules/{id}` - 更新排班
- `DELETE /api/v1/host-schedules/{id}` - 删除排班

### 房间管理
- `GET /api/v1/rooms` - 房间列表
- `POST /api/v1/rooms` - 创建房间
- `GET /api/v1/rooms/{id}` - 房间详情
- `PUT /api/v1/rooms/{id}` - 更新房间
- `DELETE /api/v1/rooms/{id}` - 删除房间

## 数据库设计

### 核心数据表

1. **users** - 用户表
   - 存储系统所有用户信息，支持4种角色
   - 字段: id, username, email, password_hash, full_name, phone, role, is_active

2. **scripts** - 剧本表
   - 存储剧本基本信息
   - 字段: id, name, author, publisher, description, difficulty, script_type, min_players, max_players, duration_minutes, price

3. **rooms** - 房间表
   - 存储房间信息
   - 字段: id, name, capacity, description, equipment, location, is_active

4. **hosts** - 主持人表
   - 存储主持人专业信息
   - 字段: id, user_id, nickname, bio, experience_years, specialties, rating, session_count, hourly_rate

5. **host_schedules** - 主持人排班表
   - 存储主持人可排班时段
   - 字段: id, host_id, date, start_time, end_time, status, session_id, notes

6. **sessions** - 场次表
   - 存储具体场次信息
   - 字段: id, script_id, room_id, host_id, date, start_time, end_time, price, current_players, min_players, max_players, status, notes

7. **bookings** - 报名表
   - 存储玩家报名信息
   - 字段: id, session_id, player_id, player_count, character_name, status, notes

8. **orders** - 订单表
   - 存储订单信息
   - 字段: id, order_no, user_id, session_id, booking_id, total_amount, discount_amount, actual_amount, status, payment_method, paid_at, player_count

## 核心业务流程

### 1. 发布场次流程
1. 管理员进入场次管理页面，点击"发布场次"
2. 选择剧本、房间、主持人（可选）
3. 设置日期、开始时间、结束时间
4. 设置人数限制（最少、最多）和价格
5. 系统自动检测：
   - 房间在该时间段是否已被占用
   - 主持人在该时间段是否已有安排
6. 检测通过，场次创建成功，状态为"待拼团"

### 2. 玩家拼团流程
1. 玩家浏览场次列表，选择感兴趣的场次
2. 进入场次详情页，查看剧本信息、当前报名情况
3. 点击"立即报名"，填写参与人数、想要的角色
4. 提交报名，状态为"待确认"
5. 系统自动计算当前报名人数：
   - 达到最少人数 → 场次状态变为"已成团"
   - 达到最大人数 → 场次状态变为"已满员"

### 3. 报名确认流程
1. 管理员进入拼团报名页面，查看待确认报名
2. 点击"确认"，报名状态变为"已确认"
3. 或点击"取消"，报名状态变为"已取消"
4. 如有候补队列，取消报名后自动将最早的候补转为待确认

### 4. 订单支付流程
1. 玩家进入订单管理页面，查看待支付订单
2. 点击"支付"，选择支付方式
3. 确认支付金额，提交支付
4. 支付成功后：
   - 订单状态变为"已支付"
   - 关联的报名状态自动变为"已确认"

## 开发说明

### 后端开发规范
- 采用 MVC 分层架构：Models → Schemas → Services → API Routes
- 所有 API 接口返回统一格式：`{ code: number, message: string, data: any }`
- 分页接口返回：`{ code, message, data[], total, page, page_size, total_pages }`
- 使用 Pydantic 进行请求参数和响应数据验证
- 数据库操作通过 SQLAlchemy ORM 进行
- 权限控制通过装饰器实现

### 前端开发规范
- 使用 TypeScript 进行类型安全开发
- 组件采用函数式组件 + Hooks
- 状态管理使用 Zustand
- API 请求统一封装在 services 目录
- 路由权限通过 PrivateRoute 组件控制
- UI 组件使用 Ant Design

## 常见问题

### 1. Docker 启动后后端连接数据库失败
确保数据库服务完全启动后再启动后端。可以使用健康检查机制：
```bash
docker-compose up -d db
# 等待数据库就绪后再启动其他服务
docker-compose up -d backend frontend
```

### 2. 前端开发时 API 请求跨域
前端开发时 Vite 已经配置了代理，API 请求会自动代理到 `http://localhost:8000`。

### 3. 忘记管理员密码
可以使用 init_db.py 脚本重新初始化数据库，或者直接修改数据库中的用户密码。

### 4. 如何修改 JWT 密钥
修改 `backend/.env` 文件中的 `SECRET_KEY`，然后重启后端服务。

## 许可证

MIT License
