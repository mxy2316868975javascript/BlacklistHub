黑名单录入网站产品规划文档
1. 项目概述
1.1 项目背景
本项目旨在开发一个黑名单录入网站，用于用户录入、管理和查询黑名单条目（如用户ID、IP地址、邮箱等）。该网站适用于各种场景，例如电商平台的欺诈用户管理、论坛的违规用户封禁等。目标是构建一个简单、高效、安全的Web应用，确保开发过程成本最低化。
1.2 项目目标

功能性：实现黑名单的录入、编辑、删除、查询和导出功能。
技术栈：严格遵守指定的前端技术栈：Next.js（框架）、Tailwind CSS（样式）、Ant Design (antd)（UI组件）、Axios（HTTP请求）、SWR（数据获取与缓存）、PNPM（包管理）、Biome.js（代码格式化和Linting）、AHooks（React Hooks库）、Clsx（类名工具）。
成本控制：整个开发过程使用免费开源工具和平台，避免任何付费服务。开发环境本地化，部署使用免费托管平台。
性能与用户体验：响应式设计、快速加载、易用界面。
安全性：基本认证、数据验证，防止常见Web漏洞。

1.3 假设与约束

假设黑名单条目包括字段：ID、类型（用户/IP/邮箱）、失信人名称、原因、录入时间、操作人。
用户角色：管理员（录入/管理）、普通用户（查询）。
约束：无后端指定，因此规划一个简单的后端；总开发周期控制在2-4周（假设单人开发）；数据规模中小型（<10万条）。

2. 需求分析
2.1 用户需求

核心功能：

录入黑名单：表单提交新条目。
查询黑名单：搜索、过滤、分页显示。
编辑/删除：修改或移除现有条目。

辅助功能：

用户认证：登录/注册（简单JWT）。
仪表盘：统计黑名单总数、最近录入。
通知：录入成功/失败提示。


非功能需求：

响应时间：<1s。
兼容性：主流浏览器（Chrome、Firefox、Safari）。
安全性：输入验证、XSS/CSRF防护。
可扩展性：易于添加新字段。



2.2 风险与 mitigation

风险：数据隐私泄露 → 使用加密存储、访问控制。
风险：开发延期 → 分阶段开发，优先核心功能。
风险：成本超支 → 严格使用免费工具（如MongoDB Atlas免费层、Vercel部署）。

3. 系统架构设计
3.1 整体架构

前端：Next.js SSR/CSR混合模式，实现动态页面。
后端：使用Node.js + Express（免费开源），或直接用Next.js API Routes（无额外服务器，成本最低）。
数据库：MongoDB（云端，使用MongoDB Atlas免费层，支持中小型数据规模，无需本地安装）。
通信：RESTful API，前端使用Axios + SWR进行数据交互。
部署：Vercel（Next.js官方免费托管，支持CI/CD）。

3.2 前端技术栈详情

Next.js：页面路由、API Routes、SSR。
Tailwind CSS：响应式样式，结合Clsx动态类名。
Ant Design (antd)：表单、表格、模态框等UI组件。
React Icons：图标集成。
Axios：HTTP客户端。
SWR：数据获取、缓存、实时更新。
PNPM：高效包管理，减少node_modules大小。
Biome.js：代码格式化、Linting，确保代码质量。
AHooks：自定义Hooks，如useRequest for API调用。
Clsx：条件类名生成。

3.3 后端设计

如果使用Next.js API Routes：内置于前端项目，无需单独服务器。
API端点示例：

POST /api/blacklist：录入。
GET /api/blacklist：查询（带参数）。
PUT /api/blacklist/:id：编辑。
DELETE /api/blacklist/:id：删除。


认证：使用jsonwebtoken（免费库）。

3.4 数据模型

集合：Blacklist（MongoDB文档模型）

_id: ObjectId (主键)
type: String (用户/IP/邮箱)
value: String
reason: String
created_at: Date
operator: String (用户名)


使用Mongoose或Prisma（支持MongoDB）定义Schema，确保数据验证。

4. 开发计划
4.1 开发阶段

准备阶段 (1-2天)：

设置项目：PNPM init, 安装所有指定库。
配置Biome.js for Linting。
搭建Next.js基本结构。
创建MongoDB Atlas免费集群，获取连接字符串。


后端开发 (2-3天)：

配置数据库（MongoDB via Prisma ORM或Mongoose，免费）。
实现API Routes。
添加认证中间件。


前端开发 (5-7天)：

页面布局：使用Tailwind + antd。
表单页：AHooks + antd Form录入。
列表页：antd Table + SWR分页查询。
集成Axios for API调用。
添加React Icons for UI增强。
使用Clsx for动态样式。


集成与测试 (3-4天)：

前后端联调。
单元测试：使用Jest (内置Next.js)。
E2E测试：Cypress (免费)。


部署与优化 (1-2天)：

部署到Vercel。
性能优化：SWR缓存、Next.js Image。



4.2 时间线

周1：准备 + 后端。
周2：前端核心。
周3：集成 + 测试。
周4：部署 + 迭代。

4.3 成本控制措施

工具：所有库免费开源。
开发环境：本地VS Code (免费)。
数据库：MongoDB Atlas免费层 (M0集群，512MB存储，足够开发和小型生产)。
部署：Vercel免费计划 (无限构建，无流量限制 for 小型项目)。
测试：手动 + 免费工具。
避免成本：无云服务器、无付费API、无商业UI库。MongoDB Atlas免费额度覆盖开发需求。

5. 测试计划
5.1 测试类型

单元测试：组件、Hooks (Jest)。
集成测试：API端点 (Supertest免费)。
端到端测试：用户流程 (Cypress)。
安全测试：手动检查OWASP Top 10。

5.2 测试覆盖

覆盖率目标：>80%。
边缘案例：无效输入、空查询。

6. 部署与维护
6.1 部署流程

GitHub仓库 (免费)。
Vercel连接GitHub，自动部署。
环境变量：MongoDB连接字符串。