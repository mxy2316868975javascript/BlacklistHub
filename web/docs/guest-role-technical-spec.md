# 游客角色技术实现规范

## 🏗️ 系统架构

### 认证状态扩展

```typescript
// 扩展认证状态类型
type AuthState = 
  | { type: 'unauthenticated' }
  | { type: 'guest'; session: GuestSession }
  | { type: 'authenticated'; user: UserInfo };

interface GuestSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  limitations: {
    searchCount: number;
    maxSearchPerDay: number;
    viewCount: number;
    maxViewPerDay: number;
  };
  preferences: {
    showTips: boolean;
    dismissedPrompts: string[];
  };
}
```

### 路由配置

```typescript
// 路由访问控制配置
export const ROUTE_CONFIG = {
  // 完全公开路由（无需任何认证）
  public: [
    "/login",
    "/register", 
    "/help",
    "/terms",
    "/privacy"
  ],
  
  // 游客可访问路由（游客模式或已登录）
  guest: [
    "/",                    // 首页
    "/blacklist/public",    // 公开黑名单
    "/search",              // 基础搜索
    "/stats/public"         // 公开统计
  ],
  
  // 需要认证的路由（必须登录）
  protected: [
    "/dashboard",
    "/blacklist/new",
    "/blacklist/edit",
    "/profile"
  ],
  
  // 需要特权的路由（管理员等）
  privileged: [
    "/admin",
    "/users",
    "/system"
  ]
} as const;
```

## 🔧 核心组件设计

### 1. 游客会话管理 Hook

```typescript
// hooks/useGuestSession.ts
export interface UseGuestSessionReturn {
  session: GuestSession | null;
  isLimitReached: (type: 'search' | 'view') => boolean;
  incrementUsage: (type: 'search' | 'view') => boolean;
  getRemainingCount: (type: 'search' | 'view') => number;
  resetSession: () => void;
  updatePreferences: (prefs: Partial<GuestSession['preferences']>) => void;
}

export function useGuestSession(): UseGuestSessionReturn {
  // 实现游客会话管理逻辑
}
```

### 2. 权限检查组件

```typescript
// components/PermissionGate.tsx
interface PermissionGateProps {
  permission: Permission;
  fallback?: React.ReactNode;
  guestFallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ 
  permission, 
  fallback, 
  guestFallback, 
  children 
}: PermissionGateProps) {
  const { user, isGuest } = useAuth();
  
  if (isGuest && guestFallback) {
    return <>{guestFallback}</>;
  }
  
  if (!hasPermission(user?.role, permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
```

### 3. 游客限制提示组件

```typescript
// components/guest/GuestLimitationBanner.tsx
interface GuestLimitationBannerProps {
  type: 'search' | 'view' | 'create';
  remaining?: number;
  total?: number;
  onUpgrade: () => void;
  onDismiss?: () => void;
}

export function GuestLimitationBanner({
  type,
  remaining = 0,
  total = 0,
  onUpgrade,
  onDismiss
}: GuestLimitationBannerProps) {
  const messages = {
    search: `搜索次数：${remaining}/${total} 剩余`,
    view: `查看次数：${remaining}/${total} 剩余`,
    create: '创建功能需要注册账户'
  };
  
  return (
    <Alert
      type={remaining > 0 ? "info" : "warning"}
      showIcon
      message="游客模式 - 功能受限"
      description={
        <div className="flex items-center justify-between">
          <span>{messages[type]}</span>
          <Button type="link" size="small" onClick={onUpgrade}>
            立即注册解锁
          </Button>
        </div>
      }
      closable={onDismiss ? true : false}
      onClose={onDismiss}
    />
  );
}
```

## 🔄 状态管理

### 游客状态机

```typescript
// 游客状态机设计
type GuestState = 
  | 'initial'      // 初始状态
  | 'active'       // 活跃使用中
  | 'limited'      // 达到部分限制
  | 'blocked'      // 达到全部限制
  | 'converting';  // 转化中（准备注册）

const guestStateMachine = {
  initial: {
    on: {
      START_SESSION: 'active',
      REGISTER: 'converting'
    }
  },
  active: {
    on: {
      REACH_LIMIT: 'limited',
      EXCEED_LIMIT: 'blocked',
      REGISTER: 'converting'
    }
  },
  limited: {
    on: {
      EXCEED_LIMIT: 'blocked',
      REGISTER: 'converting',
      RESET_DAILY: 'active'
    }
  },
  blocked: {
    on: {
      REGISTER: 'converting',
      RESET_DAILY: 'active'
    }
  },
  converting: {
    on: {
      COMPLETE_REGISTRATION: 'exit',
      CANCEL: 'active'
    }
  }
};
```

### 本地存储设计

```typescript
// 游客数据本地存储结构
interface GuestLocalStorage {
  session: {
    id: string;
    startTime: number;
    lastActivity: number;
  };
  
  usage: {
    searchCount: number;
    viewCount: number;
    lastResetDate: string;
  };
  
  preferences: {
    showTips: boolean;
    dismissedPrompts: string[];
    language: string;
  };
  
  cache: {
    recentSearches: string[];
    viewedItems: string[];
    favoriteItems: string[];  // 本地收藏
  };
}
```

## 🎨 UI组件库

### 游客专用组件

#### 1. 游客欢迎横幅
```tsx
// components/guest/GuestWelcomeBanner.tsx
<div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-lg font-semibold text-blue-900 mb-2">
        👋 欢迎体验 BlacklistHub
      </h3>
      <p className="text-blue-700">
        您正在以游客模式访问，注册后可享受完整功能
      </p>
    </div>
    <div className="flex gap-3">
      <Button type="default" onClick={onLogin}>登录</Button>
      <Button type="primary" onClick={onRegister}>注册</Button>
    </div>
  </div>
</div>
```

#### 2. 使用统计组件
```tsx
// components/guest/GuestUsageStats.tsx
<Card size="small" className="mb-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-gray-600">今日使用情况</span>
    </div>
    <div className="flex gap-4 text-sm">
      <span className="text-blue-600">
        搜索：{searchCount}/{maxSearch}
      </span>
      <span className="text-green-600">
        查看：{viewCount}/{maxView}
      </span>
    </div>
  </div>
  <Progress 
    percent={(searchCount / maxSearch) * 100} 
    size="small" 
    showInfo={false}
    className="mt-2"
  />
</Card>
```

#### 3. 功能升级提示
```tsx
// components/guest/FeatureUpgradePrompt.tsx
<Modal
  title="🚀 解锁更多功能"
  open={showPrompt}
  footer={null}
  centered
  className="guest-upgrade-modal"
>
  <div className="text-center py-6">
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">游客模式</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 每日搜索 10 次</li>
          <li>• 基础信息查看</li>
          <li>• 功能受限</li>
        </ul>
      </div>
      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <h4 className="font-medium mb-2 text-blue-900">注册用户</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 无限制搜索</li>
          <li>• 完整信息查看</li>
          <li>• 创建和编辑</li>
          <li>• 高级功能</li>
        </ul>
      </div>
    </div>
    
    <Space size="large">
      <Button type="primary" size="large" onClick={onRegister}>
        立即注册
      </Button>
      <Button size="large" onClick={onLogin}>
        已有账户
      </Button>
    </Space>
  </div>
</Modal>
```

## 📱 响应式设计

### 移动端游客体验

```tsx
// 移动端游客导航
<div className="md:hidden">
  <div className="flex items-center justify-between p-4 bg-white border-b">
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center">B</span>
      <span className="font-medium">BlacklistHub</span>
    </div>
    
    <div className="flex items-center gap-2">
      <Badge dot color="orange">
        <Button size="small" type="text">游客</Button>
      </Badge>
      <Button size="small" type="primary">注册</Button>
    </div>
  </div>
</div>
```

## 🔍 搜索功能设计

### 游客搜索限制

```typescript
// 游客搜索配置
const guestSearchConfig = {
  limitations: {
    dailyLimit: 10,           // 每日搜索限制
    rateLimit: 5,             // 每分钟限制
    resultLimit: 20,          // 单次结果限制
    noAdvancedFilters: true   // 禁用高级筛选
  },
  
  features: {
    basicSearch: true,        // 基础关键词搜索
    typeFilter: true,         // 类型筛选
    riskLevelFilter: false,   // 禁用风险等级筛选
    dateRangeFilter: false,   // 禁用日期范围筛选
    exportResults: false      // 禁用结果导出
  }
};
```

### 搜索结果展示

```tsx
// 游客搜索结果组件
<div className="space-y-4">
  {/* 游客提示 */}
  <GuestLimitationBanner 
    type="search"
    remaining={remainingSearches}
    total={10}
    onUpgrade={showUpgradeModal}
  />
  
  {/* 搜索结果 */}
  <div className="grid gap-4">
    {results.map(item => (
      <GuestBlacklistCard 
        key={item.id}
        item={item}
        onViewDetails={handleViewDetails}
        showUpgradePrompt={showUpgradePrompt}
      />
    ))}
  </div>
  
  {/* 结果限制提示 */}
  {hasMoreResults && (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="text-gray-600 mb-2">
        游客模式仅显示前 {resultLimit} 条结果
      </p>
      <Button type="primary" onClick={showUpgradeModal}>
        注册查看全部结果
      </Button>
    </div>
  )}
</div>
```

## 📊 数据分析设计

### 游客行为追踪

```typescript
// 游客分析事件
interface GuestAnalyticsEvent {
  sessionId: string;
  timestamp: number;
  event: 
    | 'session_start'
    | 'page_view'
    | 'search_performed'
    | 'item_viewed'
    | 'limitation_reached'
    | 'upgrade_prompted'
    | 'registration_started'
    | 'session_end';
  
  metadata: {
    page?: string;
    searchQuery?: string;
    itemType?: string;
    limitationType?: string;
    userAgent?: string;
    referrer?: string;
  };
}
```

### 转化分析

```typescript
// 转化漏斗分析
interface ConversionFunnel {
  stage: 'visit' | 'engage' | 'limit' | 'prompt' | 'register';
  count: number;
  conversionRate: number;
  dropOffReasons: string[];
}

const conversionMetrics = {
  visitToEngage: 0.85,      // 访问到参与
  engageToLimit: 0.65,      // 参与到限制
  limitToPrompt: 0.45,      // 限制到提示
  promptToRegister: 0.25    // 提示到注册
};
```

## 🛡️ 安全实现

### API安全中间件

```typescript
// middleware/guestSecurity.ts
export function guestSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIP = getClientIP(req);
  const sessionId = req.headers['x-guest-session-id'];
  
  // IP级别速率限制
  if (isRateLimited(clientIP)) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: getRateLimitResetTime(clientIP)
    });
  }
  
  // 游客会话验证
  if (sessionId && !isValidGuestSession(sessionId)) {
    return res.status(401).json({ 
      error: 'Invalid guest session' 
    });
  }
  
  // 使用限制检查
  if (sessionId && isUsageLimitExceeded(sessionId, req.path)) {
    return res.status(403).json({ 
      error: 'Usage limit exceeded',
      upgradeRequired: true
    });
  }
  
  next();
}
```

### 数据过滤中间件

```typescript
// middleware/dataFilter.ts
export function guestDataFilter(data: any[], userRole: UserRole | 'guest') {
  if (userRole === 'guest') {
    return data
      .filter(item => item.status === 'published' && item.visibility === 'public')
      .map(item => ({
        ...item,
        // 移除敏感字段
        operator: undefined,
        internal_notes: undefined,
        source_details: undefined,
        reviewer_notes: undefined,
        
        // 脱敏处理
        value: maskSensitiveData(item.value, item.type),
        
        // 添加游客标识
        _isGuestView: true
      }));
  }
  
  return data; // 注册用户看到完整数据
}
```

## 🎯 用户引导策略

### 智能提示时机

```typescript
// 引导提示策略
const promptStrategy = {
  // 首次访问后5分钟
  timeBasedPrompt: {
    delay: 5 * 60 * 1000,
    message: "体验如何？注册后享受更多功能！",
    type: "gentle"
  },
  
  // 搜索达到80%限制
  usageBasedPrompt: {
    threshold: 0.8,
    message: "搜索次数即将用完，注册后无限制搜索！",
    type: "urgent"
  },
  
  // 尝试访问受限功能
  featureBasedPrompt: {
    trigger: "restricted_access",
    message: "此功能需要注册账户，立即注册解锁！",
    type: "blocking"
  },
  
  // 退出页面时
  exitIntentPrompt: {
    trigger: "page_exit",
    message: "等等！注册只需30秒，解锁全部功能",
    type: "retention"
  }
};
```

### A/B测试配置

```typescript
// A/B测试变体
const abTestVariants = {
  promptTiming: {
    A: { showAfter: 5 * 60 * 1000 },    // 5分钟后显示
    B: { showAfter: 10 * 60 * 1000 },   // 10分钟后显示
    C: { showOnLimit: true }             // 达到限制时显示
  },
  
  limitationStrategy: {
    A: { searchLimit: 10, viewLimit: 50 },
    B: { searchLimit: 15, viewLimit: 30 },
    C: { searchLimit: 5, viewLimit: 100 }
  },
  
  upgradeMessage: {
    A: "注册解锁更多功能",
    B: "立即注册，享受无限制访问",
    C: "加入我们，体验完整功能"
  }
};
```

## 📈 监控和分析

### 关键指标定义

```typescript
// 游客模式关键指标
interface GuestMetrics {
  // 访问指标
  dailyGuestVisits: number;        // 每日游客访问量
  averageSessionDuration: number;  // 平均会话时长
  pageViewsPerSession: number;     // 每会话页面浏览量
  bounceRate: number;              // 跳出率
  
  // 使用指标
  searchUtilization: number;       // 搜索功能使用率
  limitReachedRate: number;        // 限制触达率
  featureAttemptRate: number;      // 受限功能尝试率
  
  // 转化指标
  promptDisplayRate: number;       // 提示显示率
  promptClickRate: number;         // 提示点击率
  registrationStartRate: number;   // 注册开始率
  registrationCompleteRate: number; // 注册完成率
  
  // 留存指标
  returnVisitorRate: number;       // 回访率
  multiSessionRate: number;        // 多会话率
}
```

### 数据收集策略

```typescript
// 匿名数据收集
const analyticsConfig = {
  // 收集的数据
  collect: [
    'page_views',
    'search_queries',      // 匿名化处理
    'feature_attempts',
    'limitation_triggers',
    'prompt_interactions',
    'session_duration'
  ],
  
  // 不收集的数据
  exclude: [
    'personal_information',
    'ip_addresses',        // 仅用于安全，不存储
    'device_fingerprints',
    'detailed_user_behavior'
  ],
  
  // 数据保留策略
  retention: {
    sessionData: 24 * 60 * 60 * 1000,      // 24小时
    aggregatedMetrics: 90 * 24 * 60 * 60 * 1000, // 90天
    conversionData: 30 * 24 * 60 * 60 * 1000     // 30天
  }
};
```

## 🔄 实施路线图

### 第1周：基础架构
- [ ] 扩展用户角色枚举系统
- [ ] 创建游客会话管理Hook
- [ ] 实现基础的路由保护逻辑
- [ ] 设计游客数据过滤机制

### 第2周：核心组件
- [ ] 开发游客导航组件
- [ ] 创建功能限制提示组件
- [ ] 实现注册引导模态框
- [ ] 开发使用统计显示组件

### 第3周：页面开发
- [ ] 重构首页支持游客模式
- [ ] 创建游客专用黑名单页面
- [ ] 开发游客搜索功能
- [ ] 实现游客帮助页面

### 第4周：后端API
- [ ] 开发游客专用API端点
- [ ] 实现数据过滤中间件
- [ ] 添加使用限制检查
- [ ] 实现安全防护机制

### 第5周：优化和测试
- [ ] 性能优化和测试
- [ ] 用户体验测试和调优
- [ ] 安全测试和加固
- [ ] 跨浏览器兼容性测试

### 第6周：分析和发布
- [ ] 集成分析系统
- [ ] 实施A/B测试框架
- [ ] 文档完善和培训
- [ ] 正式发布和监控

---

**文档版本**：v1.0  
**创建日期**：2024-08-14  
**预计开发周期**：6周  
**开发优先级**：高  
**风险评估**：中等
