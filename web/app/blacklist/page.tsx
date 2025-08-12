"use client";
import { Button, Card, Form, Input, Select, Space, Table, Modal, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import useSWR from "swr";
import axios from "axios";
import React from "react";

type BlackItem = {
  _id: string;
  type: "user" | "ip" | "email";
  value: string;
  reason: string;
  operator: string;
  created_at: string;
};

type Query = { keyword?: string; type?: BlackItem["type"]; page?: number; pageSize?: number };

const fetcher = (url: string, params?: Query) => axios.get(url, { params }).then((r) => r.data as { items: BlackItem[]; total: number });

export default function BlacklistPage() {
  const [query, setQuery] = React.useState<Query>({ keyword: "", type: undefined, page: 1, pageSize: 10 });
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BlackItem | null>(null);
  const { data, mutate, isLoading } = useSWR(["/api/blacklist", query], ([url, p]) => fetcher(url, p));

  const columns: ColumnsType<BlackItem> = [
    { title: "类型", dataIndex: "type", key: "type" },
    { title: "值", dataIndex: "value", key: "value" },
    { title: "原因", dataIndex: "reason", key: "reason" },
    { title: "操作人", dataIndex: "operator", key: "operator" },
    { title: "录入时间", dataIndex: "created_at", key: "created_at", render: (t: string) => new Date(t).toLocaleString() },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: BlackItem) => (
        <Space>
          <Button type="link" onClick={() => { setEditing(record); setModalOpen(true); }}>编辑</Button>
          <Button type="link" danger onClick={async () => {
            await axios.delete(`/api/blacklist/${record._id}`);
            message.success("已删除");
            mutate();
          }}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <Card className="!mb-4">
        <Form layout="inline" onFinish={(v) => setQuery({ keyword: v.keyword ?? "", type: v.type })}>
          <Form.Item name="type" label="类型">
            <div className="w-[200px]">
              <Select className="w-full" allowClear options={[{ label: "用户", value: "user" }, { label: "IP", value: "ip" }, { label: "邮箱", value: "email" }]} />
            </div>
          </Form.Item>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="值/原因/操作人" allowClear />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={() => { setEditing(null); setModalOpen(true); }}>新建</Button>
              <Button onClick={async () => {
                const res = await axios.get("/api/blacklist/export", { params: query, responseType: "blob" });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement("a");
                link.href = url;
                link.download = "blacklist.csv";
                link.click();
                window.URL.revokeObjectURL(url);
              }}>导出CSV</Button>
              <Button onClick={async () => {
                const res = await axios.get("/api/blacklist/export-json", { params: query, responseType: "blob" });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement("a");
                link.href = url;
                link.download = "blacklist.json";
                link.click();
                window.URL.revokeObjectURL(url);
              }}>导出JSON</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.items ?? []}
          pagination={{ total: data?.total ?? 0, current: query.page, pageSize: query.pageSize, showSizeChanger: true }}
          onChange={(p) => setQuery((q) => ({ ...q, page: p.current ?? 1, pageSize: p.pageSize ?? 10 }))}
        />
      </Card>

      <EditModal
        open={modalOpen}
        initial={editing}
        onCancel={() => setModalOpen(false)}
        onOk={async (values) => {
          if (editing?._id) {
            await axios.put(`/api/blacklist/${editing._id}`, values);
          } else {
            await axios.post(`/api/blacklist`, values);
          }
          message.success("已保存");
          setModalOpen(false);
          mutate();
        }}
      />
    </div>
  );
}

type EditModalProps = { open: boolean; onCancel: () => void; onOk: (v: Partial<BlackItem>) => void; initial: BlackItem | null };
function EditModal({ open, onCancel, onOk, initial }: EditModalProps) {
  const [form] = Form.useForm<Partial<BlackItem>>();
  React.useEffect(() => { form.setFieldsValue(initial ?? { type: "user" }); }, [initial, form]);
  return (
    <Modal open={open} onCancel={onCancel} onOk={() => form.submit()} title={initial?._id ? "编辑条目" : "新建条目"}>
      <Form form={form} layout="vertical" onFinish={onOk}>
        <Form.Item name="type" label="类型" rules={[{ required: true }]}>
          <Select options={[{ label: "用户", value: "user" }, { label: "IP", value: "ip" }, { label: "邮箱", value: "email" }]} />
        </Form.Item>
        <Form.Item name="value" label="值" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="reason" label="原因" rules={[{ required: true }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

