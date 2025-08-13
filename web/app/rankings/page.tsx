"use client";
import React from "react";
import useSWR from "swr";
import axios from "axios";
import { Card, List, Tag, Row, Col } from "antd";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export default function RankingsPage() {
  const { data } = useSWR("/api/rankings", fetcher);
  return (
    <div className="p-6 space-y-4">
      <Row gutter={[16,16]}>
        <Col span={8}>
          <Card title="Top 贡献者（按录入量）">
            <List
              dataSource={data?.topReporters || []}
              renderItem={(i: any, idx: number) => (
                <List.Item>
                  <span className="w-8 text-neutral-500">#{idx+1}</span>
                  <span className="flex-1">{i._id}</span>
                  <Tag color="blue">总数 {i.total}</Tag>
                  <Tag color="green">已发布 {i.published}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Top 理由码（按出现次数）">
            <List
              dataSource={data?.topReasonCodes || []}
              renderItem={(i: any, idx: number) => (
                <List.Item>
                  <span className="w-8 text-neutral-500">#{idx+1}</span>
                  <span className="flex-1">{i._id}</span>
                  <Tag color="blue">次数 {i.count}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

