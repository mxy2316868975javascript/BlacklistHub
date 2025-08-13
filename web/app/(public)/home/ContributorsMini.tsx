"use client";
import axios from "axios";
import useSWR from "swr";

const fetcher = (url: string, params?: any) =>
	axios.get(url, { params }).then((r) => r.data);

export default function ContributorsMini() {
	const { data } = useSWR(["/api/contributors", { pageSize: 6 }], ([url, p]) =>
		fetcher(url, p),
	);
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
			{(data?.items || []).map((i: any) => (
				<div key={i.username} className="border rounded-md p-3">
					<div className="font-medium truncate">{i.username}</div>
					<div className="text-xs text-neutral-500 mt-1">
						总录入 {i.total} · 已发布 {i.published}
					</div>
				</div>
			))}
		</div>
	);
}
