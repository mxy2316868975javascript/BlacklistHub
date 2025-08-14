import mongoose, { type InferSchemaType } from "mongoose";

const SourceSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			index: true,
		}, // 来源码，如 "user_report"
		name: {
			type: String,
			required: true,
		}, // 显示名称，如 "用户举报"
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
SourceSchema.pre("save", function (next) {
	this.updated_at = new Date();
	next();
});

SourceSchema.pre("findOneAndUpdate", function (next) {
	this.set({ updated_at: new Date() });
	next();
});

export type Source = InferSchemaType<typeof SourceSchema> & {
	_id: string;
};

export default mongoose.models.Source || mongoose.model("Source", SourceSchema);
