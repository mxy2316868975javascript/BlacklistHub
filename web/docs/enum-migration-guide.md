# 枚举系统迁移指南

## 概述

本指南说明如何从旧的字符串常量系统迁移到新的统一枚举系统。新系统提供了更好的类型安全性、代码一致性和维护性。

## 主要变更

### 1. 统一的枚举定义

**旧方式** (分散在各个文件中):
```typescript
// types/user.ts
export type UserRole = "reporter" | "reviewer" | "admin" | "super_admin";

// types/blacklist.ts  
export type BlacklistType = "user" | "ip" | "email" | "phone" | "company" | "domain" | "other";
export type RiskLevel = "low" | "medium" | "high";
export type BlacklistStatus = "draft" | "pending" | "published" | "rejected" | "retracted";
```

**新方式** (统一在 `types/enums.ts`):
```typescript
// types/enums.ts
export enum UserRole {
    REPORTER = "reporter",
    REVIEWER = "reviewer", 
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}

export enum BlacklistType {
    USER = "user",
    IP = "ip",
    EMAIL = "email",
    PHONE = "phone",
    COMPANY = "company",
    DOMAIN = "domain",
    OTHER = "other"
}

export enum RiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}

export enum BlacklistStatus {
    DRAFT = "draft",
    PENDING = "pending",
    PUBLISHED = "published",
    REJECTED = "rejected",
    RETRACTED = "retracted"
}
```

### 2. 统一的工具函数

**旧方式** (重复的函数定义):
```typescript
// 在多个文件中重复定义
const getRiskLevelColor = (level: string) => {
    switch (level) {
        case "high": return "error";
        case "medium": return "warning";
        case "low": return "success";
        default: return "default";
    }
};
```

**新方式** (统一的工具函数):
```typescript
// types/enums.ts
export function getRiskLevelColor(level: RiskLevel | string): string {
    return RISK_LEVEL_COLORS[level as RiskLevel] || "default";
}

// 使用
import { getRiskLevelColor, RiskLevel } from '@/types/enums';
const color = getRiskLevelColor(RiskLevel.HIGH);
```

### 3. 权限系统

**新增功能** - 统一的权限管理:
```typescript
// types/enums.ts
export enum Permission {
    VIEW_USERS = "view_users",
    CREATE_BLACKLIST = "create_blacklist",
    EDIT_BLACKLIST = "edit_blacklist",
    // ... 更多权限
}

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

export function canEditBlacklistItem(
    userRole: UserRole, 
    itemOperator: string, 
    currentUsername: string
): boolean {
    // 统一的编辑权限逻辑
}
```

## 迁移步骤

### 步骤 1: 更新导入语句

**旧方式**:
```typescript
import { UserRole } from '@/types/user';
import { BlacklistType, RiskLevel, BlacklistStatus } from '@/types/blacklist';
```

**新方式**:
```typescript
import { UserRole, BlacklistType, RiskLevel, BlacklistStatus } from '@/types/enums';
// 或者保持原有导入 (向后兼容)
import { UserRole } from '@/types/user';
import { BlacklistType, RiskLevel, BlacklistStatus } from '@/types/blacklist';
```

### 步骤 2: 更新枚举值使用

**旧方式**:
```typescript
const userRole: UserRole = "reporter";
const blacklistType: BlacklistType = "email";
```

**新方式**:
```typescript
const userRole: UserRole = UserRole.REPORTER;
const blacklistType: BlacklistType = BlacklistType.EMAIL;
```

### 步骤 3: 更新工具函数调用

**旧方式**:
```typescript
// 自定义函数
const getRiskLevelColor = (level: string) => { /* ... */ };
const color = getRiskLevelColor(item.risk_level);
```

**新方式**:
```typescript
import { getRiskLevelColor } from '@/types/enums';
const color = getRiskLevelColor(item.risk_level);
```

### 步骤 4: 更新权限检查

**旧方式**:
```typescript
// 硬编码的权限检查
const canEdit = ["reviewer", "admin", "super_admin"].includes(userRole);
```

**新方式**:
```typescript
import { hasPermission, Permission, canEditBlacklistItem } from '@/types/enums';

// 使用权限枚举
const canEdit = hasPermission(userRole, Permission.EDIT_BLACKLIST);

// 或使用专门的函数
const canEditItem = canEditBlacklistItem(userRole, itemOperator, currentUsername);
```

## 向后兼容性

为了确保平滑迁移，我们保持了向后兼容性：

1. **类型导入**: 原有的类型导入路径仍然有效
2. **字符串值**: 枚举值仍然是原来的字符串，不影响API
3. **选项常量**: 原有的选项常量名称保持不变

## 最佳实践

### 1. 使用枚举值而不是字符串

**推荐**:
```typescript
const status = BlacklistStatus.PUBLISHED;
if (status === BlacklistStatus.PUBLISHED) {
    // 处理已发布状态
}
```

**不推荐**:
```typescript
const status = "published";
if (status === "published") {
    // 容易出现拼写错误
}
```

### 2. 使用统一的工具函数

**推荐**:
```typescript
import { getRiskLevelColor, getRiskLevelLabel } from '@/types/enums';

<Tag color={getRiskLevelColor(level)}>
    {getRiskLevelLabel(level)}
</Tag>
```

**不推荐**:
```typescript
// 重复定义相同的逻辑
const getColor = (level) => { /* ... */ };
```

### 3. 使用权限系统

**推荐**:
```typescript
import { hasPermission, Permission } from '@/types/enums';

if (hasPermission(userRole, Permission.DELETE_USERS)) {
    // 显示删除按钮
}
```

**不推荐**:
```typescript
// 硬编码权限检查
if (userRole === "admin" || userRole === "super_admin") {
    // 权限逻辑分散，难以维护
}
```

## 常见问题

### Q: 是否需要立即迁移所有代码？
A: 不需要。新系统保持向后兼容，可以逐步迁移。

### Q: 枚举值是否会影响现有API？
A: 不会。枚举的字符串值与原来完全相同。

### Q: 如何处理动态的枚举值？
A: 使用类型守卫函数进行验证：
```typescript
function isValidUserRole(role: string): role is UserRole {
    return Object.values(UserRole).includes(role as UserRole);
}
```

### Q: 权限系统如何扩展？
A: 在 `Permission` 枚举中添加新权限，并更新 `ROLE_PERMISSIONS` 映射。

## 总结

新的枚举系统提供了：
- ✅ 更好的类型安全性
- ✅ 统一的代码风格
- ✅ 集中的状态管理
- ✅ 强大的权限系统
- ✅ 向后兼容性

建议在新代码中使用枚举系统，并逐步迁移现有代码以获得更好的开发体验。
