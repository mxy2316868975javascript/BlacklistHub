"use client";
import { Button, message, Space } from "antd";
import axios from "axios";

export default function StatusActions({
	id,
	status,
	onChanged,
}: {
	id: string;
	status: string;
	onChanged: () => void;
}) {
	return (
		<Space wrap>
			<Button
				onClick={async () => {
					await axios.put(`/api/blacklist/${id}`, { status: "pending" });
					message.success("已提交复核");
					onChanged();
				}}
				disabled={status !== "draft"}
			>
				提交复核
			</Button>
			<Button
				onClick={async () => {
					await axios.put(`/api/blacklist/${id}`, { status: "published" });
					message.success("已发布");
					onChanged();
				}}
				disabled={status !== "pending"}
			>
				发布
			</Button>
			<Button
				onClick={async () => {
					await axios.put(`/api/blacklist/${id}`, { status: "rejected" });
					message.success("已退回");
					onChanged();
				}}
				disabled={status !== "pending"}
			>
				退回
			</Button>
			<Button
				danger
				onClick={async () => {
					await axios.put(`/api/blacklist/${id}`, { status: "retracted" });
					message.success("已撤销");
					onChanged();
				}}
				disabled={status !== "published"}
			>
				撤销
			</Button>
		</Space>
	);
}
