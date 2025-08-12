import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blacklist from "@/models/Blacklist";

export const runtime = "nodejs";

export async function GET() {
  await connectDB();
  const items = await Blacklist.find({}).sort({ created_at: -1 }).lean();
  const header = "type,value,reason,operator,created_at\n";
  const body = items
    .map((i) => [i.type, i.value, i.reason, i.operator, new Date(i.created_at).toISOString()].map(escapeCsv).join(","))
    .join("\n");
  const csv = header + body + "\n";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=blacklist.csv",
    },
  });
}

function escapeCsv(value: unknown) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replaceAll('"', '""') + '"';
  }
  return s;
}

