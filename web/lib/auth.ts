/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
	console.warn(
		"[auth] JWT_SECRET is not set. Auth calls will fail until configured.",
	);
}

export function signToken(payload: object) {
	if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken<T = any>(token?: string | null): T | null {
	if (!token || !JWT_SECRET) return null;
	try {
		return jwt.verify(token, JWT_SECRET) as T;
	} catch {
		return null;
	}
}
