import mongoose, { Schema, InferSchemaType, models, model } from "mongoose";

const BlacklistSchema = new Schema(
  {
    type: { type: String, enum: ["user", "ip", "email"], required: true },
    value: { type: String, required: true, index: true },
    reason: { type: String, required: true },
    operator: { type: String, required: true },
    created_at: { type: Date, default: () => new Date(), index: true },
  },
  { versionKey: false }
);

export type Blacklist = InferSchemaType<typeof BlacklistSchema> & { _id: string };

export default (models.Blacklist as mongoose.Model<Blacklist>) || model<Blacklist>("Blacklist", BlacklistSchema);

