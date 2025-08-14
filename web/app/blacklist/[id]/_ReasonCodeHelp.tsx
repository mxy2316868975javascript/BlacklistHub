"use client";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Popover } from "antd";

const COMMON = [
	{ key: "abuse.spam", desc: "垃圾信息/骚扰" },
	{ key: "abuse.attack", desc: "恶意攻击/暴力破解" },
	{ key: "fraud.chargeback", desc: "拒付/欺诈" },
	{ key: "fraud.stolen", desc: "盗号/盗刷" },
];

export default function ReasonCodeHelp() {
	return (
		<Popover
			placement="right"
			title="常见理由码"
			content={
				<div className="text-sm space-y-1">
					{COMMON.map((i) => (
						<div key={i.key} className="flex justify-between gap-4">
							<span className="font-mono">{i.key}</span>
							<span className="text-neutral-500">{i.desc}</span>
						</div>
					))}
					<div className="text-neutral-400 mt-2">可按“类别.子类”扩展自定义</div>
				</div>
			}
		>
			<span className="float-right ml-[6px] text-neutral-500 cursor-pointer inline-flex items-center">
				<InfoCircleOutlined className="mr-1" />
				理由码说明
			</span>
		</Popover>
	);
}
