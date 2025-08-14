import type mongoose from "mongoose";
import { type InferSchemaType, model, models, Schema } from "mongoose";
import type { UserRole } from "@/types/user";

const UserSchema = new Schema(
	{
		username: { type: String, required: true, unique: true },
		password_hash: { type: String, required: true },
		role: {
			type: String,
			enum: ["reporter", "reviewer", "admin", "super_admin"] as const,
			default: "reporter" as UserRole,
			index: true,
		},
	},
	{ versionKey: false },
);

export type User = InferSchemaType<typeof UserSchema> & { _id: string };

export default (models.User as mongoose.Model<User>) ||
	model<User>("User", UserSchema);
