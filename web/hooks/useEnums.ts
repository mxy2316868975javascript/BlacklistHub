import axios from "axios";
import useSwr from "swr";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

// 获取理由码
export function useReasonCodes(category?: string) {
	const url = category
		? `/api/enums/reason-codes?category=${category}&active=true`
		: "/api/enums/reason-codes?active=true";

	const { data, error, isLoading } = useSwr(url, fetcher);

	return {
		reasonCodes: data?.data || [],
		reasonCodeOptions: (data?.data || []).map((item: any) => ({
			label: item.name,
			value: item.code,
		})),
		isLoading,
		error,
	};
}

// 获取来源
export function useSources() {
	const { data, error, isLoading } = useSwr(
		"/api/enums/sources?active=true",
		fetcher,
	);

	return {
		sources: data?.data || [],
		sourceOptions: (data?.data || []).map((item: any) => ({
			label: item.name,
			value: item.code,
		})),
		isLoading,
		error,
	};
}

// 获取地区
export function useRegions(grouped = false) {
	const url = grouped
		? "/api/enums/regions?active=true&grouped=true"
		: "/api/enums/regions?active=true";

	const { data, error, isLoading } = useSwr(url, fetcher);

	return {
		regions: data?.data || [],
		regionOptions: grouped
			? data?.data || []
			: (data?.data || []).map((item: any) => ({
					label: item.name,
					value: item.code,
				})),
		isLoading,
		error,
	};
}

// 获取理由码标签
export function getReasonCodeLabel(reasonCodes: any[], code: string): string {
	const reasonCode = reasonCodes.find((item) => item.code === code);
	return reasonCode?.name || code;
}

// 获取来源标签
export function getSourceLabel(sources: any[], code: string): string {
	const source = sources.find((item) => item.code === code);
	return source?.name || code;
}

// 获取地区标签
export function getRegionLabel(regions: any[], code: string): string {
	const region = regions.find((item) => item.code === code);
	return region?.name || code;
}
