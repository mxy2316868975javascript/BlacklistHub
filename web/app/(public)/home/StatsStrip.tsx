"use client";
import { Card, Col, Row, Statistic } from "antd";
import axios from "axios";
import useSwr from "swr";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export default function StatsStrip() {
	const { data } = useSwr("/api/stats", fetcher);
	return (
		<Row gutter={[16, 16]}>
			<Col span={8}>
				<Card>
					<Statistic title="总条目" value={data?.total || 0} />
				</Card>
			</Col>
			<Col span={8}>
				<Card>
					<Statistic title="已发布" value={data?.published || 0} />
				</Card>
			</Col>
			<Col span={8}>
				<Card>
					<Statistic title="今日新增" value={data?.today || 0} />
				</Card>
			</Col>
		</Row>
	);
}
