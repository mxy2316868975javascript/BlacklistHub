"use client";
import { Card, Col, Row, Statistic } from "antd";
import axios from "axios";
import useSWR from "swr";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export default function Dashboard() {
	const { data } = useSWR("/api/stats", fetcher);

	return (
		<div className="p-6 space-y-6">
			<Row gutter={[16, 16]}>
				<Col span={6}>
					<Card>
						<Statistic title="黑名单总数" value={data?.total ?? 0} />
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic title="今日新增" value={data?.today ?? 0} />
					</Card>
				</Col>
			</Row>
		</div>
	);
}
