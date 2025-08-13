import type mongoose from "mongoose";
import { type InferSchemaType, model, models, Schema } from "mongoose";

const TimelineSchema = new Schema(
	{
		action: { type: String, required: true }, // create | submit | publish | reject | retract | update | merge_source
		by: { type: String, required: true },
		at: { type: Date, default: () => new Date() },
		note: { type: String },
	},
	{ _id: false },
);

const BlacklistSchema = new Schema(
	{
		type: {
			type: String,
			enum: ["user", "ip", "email", "phone", "domain"],
			required: true,
			index: true,
		},
		value: { type: String, required: true, index: true },
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
		reason: { type: String, required: true }, // 证据摘要/备注
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
		}, // 最初来源
		region: {
			type: String,
			enum: [
				// 直辖市
				"beijing",
				"shanghai",
				"tianjin",
				"chongqing",
				// 广东省
				"guangzhou",
				"shenzhen",
				"dongguan",
				"foshan",
				"zhuhai",
				"zhongshan",
				"huizhou",
				"jiangmen",
				// 江苏省
				"nanjing",
				"suzhou",
				"wuxi",
				"changzhou",
				"nantong",
				"xuzhou",
				"yangzhou",
				// 浙江省
				"hangzhou",
				"ningbo",
				"wenzhou",
				"jiaxing",
				"huzhou",
				"shaoxing",
				// 山东省
				"jinan",
				"qingdao",
				"yantai",
				"weifang",
				"zibo",
				"weihai",
				// 河北省
				"shijiazhuang",
				"tangshan",
				"baoding",
				"langfang",
				"cangzhou",
				// 河南省
				"zhengzhou",
				"luoyang",
				"kaifeng",
				"anyang",
				"xinxiang",
				// 湖北省
				"wuhan",
				"yichang",
				"xiangyang",
				"jingzhou",
				// 湖南省
				"changsha",
				"zhuzhou",
				"xiangtan",
				"hengyang",
				// 四川省
				"chengdu",
				"mianyang",
				"deyang",
				"nanchong",
				// 陕西省
				"xian",
				"baoji",
				"xianyang",
				"weinan",
				// 福建省
				"fuzhou",
				"xiamen",
				"quanzhou",
				"zhangzhou",
				// 安徽省
				"hefei",
				"wuhu",
				"bengbu",
				"anqing",
				// 江西省
				"nanchang",
				"ganzhou",
				"jiujiang",
				"shangrao",
				// 辽宁省
				"shenyang",
				"dalian",
				"anshan",
				"fushun",
				// 吉林省
				"changchun",
				"jilin",
				"siping",
				// 黑龙江省
				"harbin",
				"daqing",
				"qiqihar",
				// 内蒙古自治区
				"hohhot",
				"baotou",
				"ordos",
				// 广西壮族自治区
				"nanning",
				"liuzhou",
				"guilin",
				// 云南省
				"kunming",
				"qujing",
				"yuxi",
				// 贵州省
				"guiyang",
				"zunyi",
				// 山西省
				"taiyuan",
				"datong",
				"changzhi",
				// 甘肃省
				"lanzhou",
				"tianshui",
				// 青海省
				"xining",
				// 宁夏回族自治区
				"yinchuan",
				// 新疆维吾尔自治区
				"urumqi",
				"karamay",
				// 西藏自治区
				"lhasa",
				// 海南省
				"haikou",
				"sanya",
				// 特别行政区
				"hongkong",
				"macau",
				// 台湾省
				"taipei",
				"kaohsiung",
				"taichung",
				// 其他
				"other",
			],
			index: true,
		}, // 地区
		sources: { type: [String], default: [] }, // 多来源合并
		status: {
			type: String,
			enum: ["draft", "pending", "published", "rejected", "retracted"],
			default: "draft",
			index: true,
		},
		operator: { type: String, required: true },
		expires_at: { type: Date, index: true },
		created_at: { type: Date, default: () => new Date(), index: true },
		updated_at: { type: Date, default: () => new Date(), index: true },
		timeline: { type: [TimelineSchema], default: [] },
	},
	{ versionKey: false },
);

// Update updated_at automatically
BlacklistSchema.pre("save", function (next) {
	(this as any).updated_at = new Date();
	next();
});
BlacklistSchema.pre("findOneAndUpdate", function (next) {
	// biome-ignore lint/suspicious/noExplicitAny: mongoose query typing
	(this as any).set({ updated_at: new Date() });
	next();
});

export type Blacklist = InferSchemaType<typeof BlacklistSchema> & {
	_id: string;
};

export default (models.Blacklist as mongoose.Model<Blacklist>) ||
	model<Blacklist>("Blacklist", BlacklistSchema);
