"use client";
import { Card, List, Segmented, Tag } from "antd";
import axios from "axios";
import React from "react";
import useSwr from "swr";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export default function RankingSidebar() {
	const [range, setRange] = React.useState<"week" | "all">("week");
	const key = `/api/defaulters?range=${range}&sort=count&pageSize=10`;
	const { data, isLoading } = useSwr(key, fetcher);

	return (
		<Card
			title={
				<div className="flex items-center justify-between">
					<span>黑名单排行榜</span>
					<Segmented
						size="small"
						value={range}
						onChange={(v) => setRange(v as any)}
						options={[
							{ label: "周榜", value: "week" },
							{ label: "总榜", value: "all" },
						]}
					/>
				</div>
			}
		>
			<List
				loading={isLoading}
				dataSource={data?.items || []}
				renderItem={(i: any, idx: number) => (
					<List.Item>
						<div className="flex items-center w-full gap-2">
							<span className="inline-flex w-5 justify-center text-neutral-500">
								{idx + 1}
							</span>
							<span className="flex-1 truncate text-sm">{i._id?.value}</span>
							<Tag color="blue">{i.count}</Tag>
						</div>
					</List.Item>
				)}
			/>
		</Card>
	);
}
