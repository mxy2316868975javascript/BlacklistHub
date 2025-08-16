const mongoose = require('mongoose');

// 直接设置MongoDB URI
const MONGODB_URI = 'mongodb+srv://sgli19921031:r8d7zuhLbNkLlEcj@blacklisthub-cluster.xctldhp.mongodb.net/?retryWrites=true&w=majority&appName=blacklisthub-cluster';

// 黑名单模型定义
const TimelineSchema = new mongoose.Schema({
  action: { type: String, required: true },
  by: { type: String, required: true },
  at: { type: Date, default: () => new Date() },
  note: { type: String },
}, { _id: false });

const EvidenceSchema = new mongoose.Schema({
  images: { type: [String], required: true },
  description: { type: String, default: "" },
  uploaded_by: { type: String, required: true },
  uploaded_at: { type: Date, default: () => new Date() },
}, { _id: false });

const BlacklistSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["person", "company", "organization", "other"],
    required: true,
    index: true,
  },
  value: { type: String, required: true, index: true },
  company_name: {
    type: String,
    required: false,
    index: true,
  },
  risk_level: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
    index: true,
  },
  reason_code: {
    type: String,
    enum: [
      "fraud.payment",
      "fraud.chargeback", 
      "fraud.identity",
      "fraud.account",
      "abuse.spam",
      "abuse.harassment",
      "abuse.phishing",
      "abuse.malware",
      "violation.terms",
      "violation.policy",
      "violation.legal",
      "security.breach",
      "security.suspicious",
      "quality.fake",
      "quality.duplicate",
      "other.manual",
      "other.system",
    ],
    required: true,
    index: true,
  },
  reason: { type: String, required: true },
  reason_html: { type: String },
  reason_images: [{ type: String }],
  source: {
    type: String,
    enum: [
      "user_report",
      "system_detection", 
      "manual_review",
      "external_data",
      "partner",
      "regulatory",
      "other",
    ],
    index: true,
  },
  region: {
    type: String,
    required: false,
    default: null,
    index: true,
  },
  sources: { type: [String], default: [] },
  status: {
    type: String,
    enum: ["draft", "pending", "published", "rejected", "retracted"],
    default: "draft",
    index: true,
  },
  visibility: {
    type: String,
    enum: ["public", "private", "restricted"],
    default: "public",
    index: true,
  },
  sensitive: {
    type: Boolean,
    default: false,
    index: true,
  },
  operator: { type: String, required: true },
  expires_at: { type: Date, index: true },
  created_at: { type: Date, default: () => new Date(), index: true },
  updated_at: { type: Date, default: () => new Date(), index: true },
  timeline: { type: [TimelineSchema], default: [] },
  evidence: { type: [EvidenceSchema], default: [] },
}, { versionKey: false });

const Blacklist = mongoose.model('Blacklist', BlacklistSchema);

// 测试数据
const testData = [
  {
    type: "person",
    value: "张三",
    risk_level: "high",
    reason_code: "fraud.payment",
    reason: "涉嫌支付欺诈，多次恶意拒付",
    source: "user_report",
    region: "北京市",
    status: "published",
    visibility: "public",
    sensitive: false,
    operator: "system",
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
    timeline: [{
      action: "create",
      by: "system",
      at: new Date(),
      note: "系统自动创建"
    }]
  },
  {
    type: "company",
    value: "某某科技有限公司",
    risk_level: "medium",
    reason_code: "violation.terms",
    reason: "违反服务条款，存在虚假宣传行为",
    source: "manual_review",
    region: "上海市",
    status: "published",
    visibility: "public",
    sensitive: false,
    operator: "admin",
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    timeline: [{
      action: "create",
      by: "admin",
      at: new Date(),
      note: "人工审核创建"
    }]
  },
  {
    type: "person",
    value: "李四",
    risk_level: "low",
    reason_code: "quality.duplicate",
    reason: "重复注册账户，违反平台规则",
    source: "system_detection",
    region: "广东省",
    status: "published",
    visibility: "public",
    sensitive: false,
    operator: "system",
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    timeline: [{
      action: "create",
      by: "system",
      at: new Date(),
      note: "系统检测创建"
    }]
  },
  {
    type: "organization",
    value: "某某基金会",
    risk_level: "high",
    reason_code: "fraud.identity",
    reason: "身份造假，冒充合法机构进行诈骗活动",
    source: "regulatory",
    region: "江苏省",
    status: "published",
    visibility: "public",
    sensitive: false,
    operator: "admin",
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    timeline: [{
      action: "create",
      by: "admin",
      at: new Date(),
      note: "监管部门举报"
    }]
  },
  {
    type: "person",
    value: "王五",
    risk_level: "medium",
    reason_code: "abuse.spam",
    reason: "发送垃圾信息，骚扰其他用户",
    source: "user_report",
    region: "浙江省",
    status: "published",
    visibility: "public",
    sensitive: false,
    operator: "moderator",
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    timeline: [{
      action: "create",
      by: "moderator",
      at: new Date(),
      note: "用户举报处理"
    }]
  }
];

async function seedData() {
  try {
    console.log('连接数据库...');
    await mongoose.connect(MONGODB_URI);
    console.log('数据库连接成功');

    // 清除现有测试数据
    console.log('清除现有数据...');
    await Blacklist.deleteMany({});

    // 插入测试数据
    console.log('插入测试数据...');
    await Blacklist.insertMany(testData);
    
    console.log(`成功插入 ${testData.length} 条测试数据`);
    
    // 验证数据
    const count = await Blacklist.countDocuments({ status: 'published', visibility: 'public' });
    console.log(`数据库中现有 ${count} 条公开记录`);
    
  } catch (error) {
    console.error('数据种子失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

seedData();
