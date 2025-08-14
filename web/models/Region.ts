import mongoose, { type InferSchemaType } from "mongoose";

const RegionSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			index: true,
		}, // 地区码，如 "beijing"
		name: {
			type: String,
			required: true,
		}, // 显示名称，如 "北京市"
		province: {
			type: String,
			required: true,
			index: true,
		}, // 省份，如 "直辖市"、"广东省"
		province_code: {
			type: String,
			required: true,
			index: true,
		}, // 省份代码，如 "municipality"、"guangdong"
		level: {
			type: String,
			required: true,
			enum: ["municipality", "prefecture", "county"],
			default: "prefecture",
		}, // 行政级别：直辖市、地级市、县级市
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
RegionSchema.pre("save", function (next) {
	this.updated_at = new Date();
	next();
});

RegionSchema.pre("findOneAndUpdate", function (next) {
	this.set({ updated_at: new Date() });
	next();
});

export type Region = InferSchemaType<typeof RegionSchema> & {
	_id: string;
};

export default mongoose.models.Region || mongoose.model("Region", RegionSchema);
