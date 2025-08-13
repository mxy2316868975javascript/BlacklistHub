"use client";
import axios from "axios";
import React from "react";
import useSWR from "swr";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export default function ReasonsTicker() {
	const { data } = useSWR("/api/rankings", fetcher);
	const reasons = data?.topReasonCodes || [];
	return (
		<div className="h-8 overflow-hidden text-sm text-neutral-600">
			<div className="animate-[ticker_15s_linear_infinite] space-y-1">
				{reasons.map((i: any) => (
					<div key={i._id} className="truncate">
						{i._id} · {i.count}
					</div>
				))}
			</div>
			<style jsx>{`
        @keyframes ticker { 0% { transform: translateY(0); } 100% { transform: translateY(-100%); } }
      `}</style>
		</div>
	);
}
