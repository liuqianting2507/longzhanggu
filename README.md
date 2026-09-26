# longzhanggu · 客户健康档案管理系统

客户可在网页端自助打卡记录每日血压、心率与三餐血糖；管理端为每位客户维护一份完整健康档案，包含基础信息、管理过程指标与历次解决方案记录。

## 技术选型

- **前端**：Vue 3（Composition API + `<script setup>`）+ Vite + vue-router + Pinia
- **后端**：第一版不接后端，数据写入浏览器 localStorage；第二版接入 Firebase / Firestore

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物输出到 dist/
```

首次打开会自动写入一条演示客户数据。清除演示数据：浏览器控制台执行 `localStorage.clear()` 后刷新。

## 功能

| 模块 | 说明 |
| --- | --- |
| 概览 | 在管客户数、今日打卡进度、近 7 天超出参考区间的记录 |
| 每日打卡 | 早/晚血压心率；三餐 × 餐前/餐后血糖，录入时实时提示参考区间判定 |
| 客户档案 | 档案列表（搜索、归档）、新建/编辑、删除 |
| 档案详情 | 基础信息、打卡记录、管理过程指标、解决方案记录四个页签 |

参考区间（血压按中国高血压防治指南分级，血糖区分餐前/餐后）仅用于前端提示，不构成医疗诊断。

## 数据结构

五个集合，命名与将来的 Firestore 集合一一对应（见 `src/services/models.js`）：

| 集合 | 内容 |
| --- | --- |
| `clients` | 客户基础档案 |
| `vitals` | 血压 / 心率打卡 |
| `glucose` | 血糖打卡 |
| `metrics` | 管理过程指标（糖化血红蛋白、腰围等） |
| `solutions` | 解决方案记录 |

## 接入 Firebase（第二版）

数据访问全部经由 `src/services/db.js` 这一层门面，适配器可整体替换，业务代码与组件无需改动：

```
src/services/
├── db.js                  # 门面，按 VITE_DATA_SOURCE 选择适配器
├── models.js              # 集合名、字段定义、参考区间
└── adapters/
    ├── local.js           # localStorage 实现（当前默认）
    └── firebase.js        # Firestore 实现（占位，含启用步骤）
```

切换步骤：

1. `npm install firebase`
2. 复制 `.env.example` 为 `.env.local`，填入 Firebase 控制台配置
3. 把 `VITE_DATA_SOURCE` 改为 `firebase`
4. 解开 `src/services/adapters/firebase.js` 中的注释

## 后续可做

- 血压 / 血糖趋势图
- 用户登录与权限（客户只能看自己的档案）
- 档案导出 PDF / Excel
- 超出参考区间时的提醒推送
