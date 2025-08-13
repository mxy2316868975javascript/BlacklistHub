import mongoose, { type InferSchemaType } from "mongoose";

const ReasonCodeSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			index: true,
		}, // 理由码，如 "fraud.payment"
		name: {
			type: String,
			required: true,
		}, // 显示名称，如 "欺诈 - 支付欺诈"
		category: {
			type: String,
			required: true,
			enum: ["fraud", "abuse", "violation", "security", "quality", "other"],
			index: true,
		}, // 分类
		description: {
			type: String,
		}, // 详细描述
		is_active: {
			type: Boolean,
			default: true,
			index: true,
		}, // 是否启用
		sort_order: {
			type: Number,
			default: 0,
		}, // 排序
		created_at: {
			type: Date,
			default: Date.now,
		},
		updated_at: {
			type: Date,
			default: Date.now,
		},
	},
	{ versionKey: false },
);

// Update updated_at automatically
ReasonCodeSchema.pre("save", function (next) {
	this.updated_at = new Date();
	next();
});

ReasonCodeSchema.pre("findOneAndUpdate", function (next) {
	this.set({ updated_at: new Date() });
	next();
});

export type ReasonCode = InferSchemaType<typeof ReasonCodeSchema> & {
	_id: string;
};

export default mongoose.models.ReasonCode ||
	mongoose.model("ReasonCode", ReasonCodeSchema);
