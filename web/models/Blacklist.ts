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

const EvidenceSchema = new Schema(
	{
		images: { type: [String], required: true },
		description: { type: String, default: "" },
		uploaded_by: { type: String, required: true },
		uploaded_at: { type: Date, default: () => new Date() },
	},
	{ _id: false },
);

const BlacklistSchema = new Schema(
	{
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
		}, // 公司名称，当type为company时使用
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
		reason: { type: String, required: true }, // 证据摘要/备注（Markdown格式）
		reason_html: { type: String }, // HTML格式的富文本内容
		reason_images: [{ type: String }], // 图片URL数组
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
			required: false, // 地区字段是可选的
			default: null,
			// 移除 enum 限制，允许任何字符串值
			// 这样可以支持所有在 Region 类型中定义的地区
			index: true,
		}, // 地区
		sources: { type: [String], default: [] }, // 多来源合并
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
	},
	{ versionKey: false },
);

// Update updated_at automatically
BlacklistSchema.pre("save", function (next) {
	// biome-ignore lint/suspicious/noExplicitAny: mongoose document typing
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
