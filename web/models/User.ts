import mongoose, { Schema, InferSchemaType, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
  },
  { versionKey: false }
);

export type User = InferSchemaType<typeof UserSchema> & { _id: string };

export default (models.User as mongoose.Model<User>) || model<User>("User", UserSchema);

