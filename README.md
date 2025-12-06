# 社团管理系统 API 文档

## 项目简介

这是一个基于 Django 和 Django REST Framework 开发的社团管理系统 API，提供用户认证、社团信息管理和成员管理等功能。

## 技术栈

- **后端框架**：Django 3.x
- **API框架**：Django REST Framework
- **数据库**：SQLite
- **认证方式**：Token Authentication

## 项目结构

```
club_manage/
├── club_manage/         # 项目配置目录
│   ├── settings.py      # 项目配置
│   ├── urls.py          # 主URL配置
│   └── ...
├── clubs/               # 社团应用
│   ├── models.py        # 数据模型
│   ├── serializers.py   # 数据序列化
│   ├── views.py         # API视图
│   ├── urls.py          # 应用URL配置
│   └── ...
├── db.sqlite3           # SQLite数据库文件
└── manage.py            # Django管理脚本
```

## 功能模块

### 1. 用户认证系统

- 用户注册
- 用户登录
- 用户注销
- 个人资料查看

### 2. 社团信息管理

- 创建社团
- 查询社团列表
- 查询单个社团详情
- 更新社团信息
- 删除社团

### 3. 社团成员管理

- 加入社团
- 退出社团

## API 端点

### 用户认证相关

| 端点 | 方法 | 功能描述 | 认证要求 |
|------|------|----------|----------|
| `/api/register/` | `POST` | 用户注册 | 否 |
| `/api/login/` | `POST` | 用户登录 | 否 |
| `/api/logout/` | `POST` | 用户注销 | 是 |
| `/api/profile/` | `GET` | 获取个人资料 | 是 |
| `/api-token-auth/` | `POST` | 获取Token | 否 |

### 社团管理相关

| 端点 | 方法 | 功能描述 | 认证要求 |
|------|------|----------|----------|
| `/api/clubs/` | `GET` | 获取社团列表（搜索、过滤、排序和分页） | 否 |
| `/api/clubs/` | `POST` | 创建社团 | 是 |
| `/api/clubs/<id>/` | `GET` | 获取社团详情 | 否 |
| `/api/clubs/<id>/` | `PUT` | 更新社团信息 | 是（仅负责人） |
| `/api/clubs/<id>/` | `DELETE` | 删除社团 | 是（仅负责人） |
| `/api/clubs/<id>/join/` | `POST` | 加入社团 | 是 |
| `/api/clubs/<id>/leave/` | `POST` | 退出社团 | 是 |

## 数据模型

### Club 模型

- `name`：社团名称（唯一）
- `description`：社团描述
- `leader`：社团负责人（外键关联User）
- `members`：社团成员（多对多关联User）
- `contact_email`：联系邮箱
- `contact_phone`：联系电话
- `category`：社团类别
- `status`：社团状态（活跃/暂停/解散）
- `created_at`：创建时间
- `updated_at`：更新时间

## 使用说明

### 1. 安装依赖

```bash
pip install django djangorestframework django-cors-headers
```

### 2. 数据库迁移

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. 创建超级用户

```bash
python manage.py createsuperuser
```

### 4. 启动服务器

```bash
python manage.py runserver
```

### 5. API 使用示例

#### 用户注册

```bash
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpassword", "email": "test@example.com"}'
```

#### 用户登录

```bash
curl -X POST http://localhost:8000/api-token-auth/ \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpassword"}'
```

#### 创建社团

```bash
curl -X POST http://localhost:8000/api/clubs/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "编程社", "description": "学习编程技术", "contact_email": "program@example.com", "category": "技术", "leader_id": 1}'
```
| 关键字 (Field)       | 数据类型 | 填写内容/约束 | 可选的存储值 (Choices) |
| :--- | :--- | :--- | :--- |
| **`name`** | 字符串 | 社团名称，在数据库中必须是唯一的。 | N/A |
| **`description`** | 字符串 | 社团的详细描述。 | N/A |
| **`leader_id`** | 整数 | 社团负责人的 **User ID**。如果未提供，默认将创建该社团的用户设为负责人。 | 任何有效的 `User` ID |
| **`member_ids`** | 整数数组 | 要立即加入社团的成员的用户 ID 列表。例如 `[1, 5, 8]`。 | 任何有效的 `User` ID 列表 |
| **`contact_email`** | 字符串 | 社团的联系邮箱，格式需有效。 | N/A |
| **`contact_phone`** | 字符串 | 社团的联系电话，最大长度 20。 | N/A |
| **`category`** | 字符串 | 社团的类别。必须填写左侧的**存储值**。 默认值: `other` | `academic` (学术类), `art` (艺术类), `sports` (体育类), `tech` (科技类), `culture` (文化类), `volunteer` (志愿类), `other` (其他) |
| **`status`** | 字符串 | 社团的状态。必须填写左侧的**存储值**。 默认值: `pending` | `active` (活跃), `inactive` (非活跃), `pending` (待审核), `closed` (已关闭) |

#### 查询社团列表 
```bash
curl http://localhost:8000/api/clubs/?search=编程&category=other&status=active&ordering=name&page=1
```
默认返回全部社团列表，

| 关键字 | 解释 |
| :--- | :--- |
| `search` | 匹配社团的 **名称** 或 **描述** 中包含该关键字的记录。 |
| `category` | 根据社团的 **类别** (例如：技术、艺术) 进行筛选。 |
| `status` | 根据社团的 **状态** (例如：活跃、暂停) 进行筛选。 |
| `ordering` | 后跟字段名 (如 `name`) 为升序，后跟 `-` 和字段名 (如 `-created_at`) 为降序。可排序字段包括 `name`、`created_at`、`category`、`status`。 |
| `page` | 指定要获取的页码。默认每页显示 10 条记录。 |

## 权限说明

- 普通用户：可注册、登录、查看社团信息、加入/退出社团
- 社团负责人：可创建社团、编辑/删除自己的社团
- 超级用户：拥有所有权限

## 注意事项

1. 所有需要认证的API必须在请求头中携带有效的Token
2. 社团负责人可以编辑和删除自己创建的社团
3. 用户只能加入/退出自己的社团成员身份
4. 确保在生产环境中配置适当的CORS策略和安全设置

## 开发团队

- 开发日期：2025
- 开发人员：苏州中学软件开发社
- 技术支持：Django & Django REST Framework 社区

---

*本文档由社团管理系统开发团队维护*