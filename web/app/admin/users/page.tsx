"use client";
import React from "react";
import useSWR from "swr";
import axios from "axios";
import { Card, Table, Select, message } from "antd";

type UserItem = { _id: string; username: string; role: "reporter" | "reviewer" | "admin" };
const fetcher = (url: string) => axios.get(url).then((r) => r.data as { items: UserItem[] });

export default function AdminUsersPage() {
  const { data, mutate, isLoading } = useSWR("/api/users", fetcher);
  return (
    <div className="p-6">
      <Card title="角色管理">
        <Table<UserItem>
          rowKey="_id"
          loading={isLoading}
          dataSource={data?.items || []}
          columns={[
            { title: "用户名", dataIndex: "username" },
            {
              title: "角色",
              dataIndex: "role",
              render: (role: UserItem["role"], record) => (
                <Select
                  value={role}
                  style={{ width: 160 }}
                  options={[
                    { label: "Reporter", value: "reporter" },
                    { label: "Reviewer", value: "reviewer" },
                    { label: "Admin", value: "admin" },
                  ]}
                  onChange={async (v) => {
                    await axios.put(`/api/users/${record._id}`, { role: v });
                    message.success("已更新角色");
                    mutate();
                  }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

