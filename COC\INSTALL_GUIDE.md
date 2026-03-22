# 用户管理系统安装指南

本指南说明如何设置和运行用户管理系统。

## 前置要求

- Node.js 18+
- PostgreSQL 12+
- npm 或 yarn

## 步骤 1: 安装依赖

```bash
npm install
```

## 步骤 2: 配置环境变量

复制 `.env.example` 到 `.env` 并配置数据库连接：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coc_db
DB_USER=coc_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# COC API
COC_API_KEY=your_api_key
PROXY_PORT=3001
```

## 步骤 3: 创建 PostgreSQL 数据库

使用 PostgreSQL 客户端创建数据库和用户：

```sql
CREATE DATABASE coc_db;
CREATE USER coc_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE coc_db TO coc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO coc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO coc_user;
```

## 步骤 4: 初始化数据库模式

运行初始化脚本创建表：

```bash
psql -h localhost -U coc_user -d coc_db -f server/db/init.sql
```

或者使用以下命令手动运行：

```bash
# 连接到数据库
psql -h localhost -U coc_user -d coc_db

# 执行 server/db/init.sql 中的 SQL 语句
```

## 步骤 5: 创建管理员用户（可选）

运行初始化脚本创建默认管理员账户：

```bash
npm run init-admin
```

默认凭证：
- 用户名：`admin`
- 密码：`admin123`

**重要**：登录后请立即更改管理员密码。

## 步骤 6: 启动服务

### 开发环境

终端 1 - 启动后端服务器：

```bash
npm run dev:server
```

终端 2 - 启动前端开发服务器：

```bash
npm run dev
```

访问 `http://localhost:5173`

### 生产环境

```bash
npm run build
npm start
```

## 用户认证流程

### 注册

1. 访问 `/register` 页面
2. 填入用户名（3-50个字符，仅支持字母、数字、下划线）
3. 填入邮箱
4. 设置密码（至少 6 个字符）
5. 确认密码
6. 点击"创建账户"

### 登录

1. 访问 `/login` 页面
2. 输入用户名和密码
3. 点击"登录"

### 刷新 Token

- Access Token 有效期：1 小时
- Refresh Token 有效期：7 天
- 客户端会自动使用 Refresh Token 获取新的 Access Token

## API 端点

### 认证 API

| 方法 | 端点 | 描述 |
|-----|------|------|
| POST | `/api/auth/register` | 注册新用户 |
| POST | `/api/auth/login` | 登录用户 |
| POST | `/api/auth/refresh` | 刷新访问令牌 |
| POST | `/api/auth/logout` | 登出用户 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 用户管理 API（需要管理员权限）

| 方法 | 端点 | 描述 |
|-----|------|------|
| GET | `/api/admin/users` | 获取用户列表 |
| PUT | `/api/admin/users/:id/role` | 修改用户角色 |
| DELETE | `/api/admin/users/:id` | 删除用户 |
| GET | `/api/admin/stats` | 获取统计信息 |

## 数据库表结构

### users 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 用户 ID |
| username | VARCHAR(50) | UNIQUE NOT NULL | 用户名 |
| email | VARCHAR(255) | UNIQUE NOT NULL | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| role | VARCHAR(20) | DEFAULT 'user' | 用户角色（user/admin） |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| last_login_at | TIMESTAMP | NULL | 最后登录时间 |

## 安全建议

1. **生产环境配置**：
   - 更改 `JWT_SECRET` 为强随机字符串
   - 使用强 PostgreSQL 密码
   - 启用 HTTPS
   - 设置安全的 CORS 策略

2. **用户管理**：
   - 定期审计管理员账户
   - 强制更改初始管理员密码
   - 实施强密码策略

3. **数据保护**：
   - 定期备份数据库
   - 使用 SSL/TLS 加密数据库连接
   - 考虑数据加密

## 常见问题

### Q: 如何重置管理员密码？
A: 直接在数据库中修改管理员用户的密码哈希，或删除管理员用户并运行 `npm run init-admin` 重新创建。

### Q: 如何修改用户的角色？
A: 使用管理员账户登录，访问 `/admin/users` 页面进行管理。

### Q: 如何启用邮箱验证？
A: 当前版本不包含邮箱验证功能。可以后续添加实现此功能。

### Q: 数据库连接失败怎么办？
A: 检查以下项：
- PostgreSQL 服务是否运行
- `.env` 文件中的数据库配置是否正确
- 数据库用户是否有足够的权限
- 防火墙是否允许 5432 端口的连接

## 支持

如有任何问题，请查看日志输出或联系开发团队。
