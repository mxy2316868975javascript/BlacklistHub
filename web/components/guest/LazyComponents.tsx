/**
 * 游客组件懒加载配置
 * 优化首屏加载性能
 */

import { Spin } from "antd";
import { type ComponentType, lazy, Suspense } from "react";

// 加载状态组件
const LoadingSpinner = ({
	size = "default",
}: {
	size?: "small" | "default" | "large";
}) => (
	<div className="flex items-center justify-center p-8">
		<Spin size={size} />
	</div>
);

const LoadingCard = () => (
	<div className="animate-pulse">
		<div className="bg-gray-200 rounded-lg h-32 mb-4" />
		<div className="space-y-2">
			<div className="bg-gray-200 rounded h-4 w-3/4" />
			<div className="bg-gray-200 rounded h-4 w-1/2" />
		</div>
	</div>
);

const LoadingTable = () => (
	<div className="animate-pulse space-y-4">
		<div className="bg-gray-200 rounded h-10 w-full" />
		{Array.from({ length: 5 }).map((_, i) => (
			<div key={i} className="bg-gray-200 rounded h-12 w-full" />
		))}
	</div>
);

// 懒加载的游客组件
export const LazyGuestHomePage = lazy(() =>
	import("./GuestHomePage").then((module) => ({ default: module.default })),
);

export const LazyGuestNavigation = lazy(() =>
	import("./GuestNavigation").then((module) => ({ default: module.default })),
);

export const LazyRegistrationGuide = lazy(() =>
	import("./RegistrationGuide").then((module) => ({ default: module.default })),
);

export const LazyFeatureLimitation = lazy(() =>
	import("./FeatureLimitation").then((module) => ({ default: module.default })),
);

// 懒加载的页面组件
export const LazyPublicBlacklistPage = lazy(() =>
	import("../../app/blacklist/public/page").then((module) => ({
		default: module.default,
	})),
);

export const LazySearchPage = lazy(() =>
	import("../../app/search/page").then((module) => ({
		default: module.default,
	})),
);

export const LazyHelpPage = lazy(() =>
	import("../../app/help/page").then((module) => ({ default: module.default })),
);

// 高阶组件：带加载状态的懒加载
function withLazyLoading<T extends object>(
	LazyComponent: ComponentType<T>,
	fallback?: React.ReactNode,
) {
	return function LazyWrapper(props: T) {
		return (
			<Suspense fallback={fallback || <LoadingSpinner />}>
				<LazyComponent {...props} />
			</Suspense>
		);
	};
}

// 预配置的懒加载组件
export const GuestHomePageWithLoading = withLazyLoading(
	LazyGuestHomePage,
	<LoadingCard />,
);

export const GuestNavigationWithLoading = withLazyLoading(
	LazyGuestNavigation,
	<div className="h-16 bg-gray-100 animate-pulse rounded" />,
);

export const RegistrationGuideWithLoading = withLazyLoading(
	LazyRegistrationGuide,
	<LoadingSpinner size="large" />,
);

export const FeatureLimitationWithLoading = withLazyLoading(
	LazyFeatureLimitation,
	<div className="h-20 bg-gray-100 animate-pulse rounded" />,
);

export const PublicBlacklistPageWithLoading = withLazyLoading(
	LazyPublicBlacklistPage,
	<LoadingTable />,
);

export const SearchPageWithLoading = withLazyLoading(
	LazySearchPage,
	<LoadingSpinner />,
);

export const HelpPageWithLoading = withLazyLoading(
	LazyHelpPage,
	<LoadingSpinner />,
);

// 预加载函数
export const preloadGuestComponents = () => {
	// 预加载关键组件
	const preloadPromises = [
		import("./GuestNavigation"),
		import("./RegistrationGuide"),
		import("./FeatureLimitation"),
	];

	return Promise.allSettled(preloadPromises);
};

// 条件预加载
export const conditionalPreload = {
	// 当用户悬停在注册按钮上时预加载注册引导
	onRegisterHover: () => import("./RegistrationGuide"),

	// 当用户接近使用限制时预加载限制组件
	onLimitApproach: () => import("./FeatureLimitation"),

	// 当用户访问首页时预加载搜索页面
	onHomePageVisit: () => import("../../app/search/page"),

	// 当用户进行搜索时预加载黑名单页面
	onSearchAction: () => import("../../app/blacklist/public/page"),
};

// 性能监控
export const performanceMonitor = {
	// 记录组件加载时间
	recordLoadTime: (componentName: string, startTime: number) => {
		const endTime = performance.now();
		const loadTime = endTime - startTime;

		console.log(
			`[Performance] ${componentName} loaded in ${loadTime.toFixed(2)}ms`,
		);

		// 在生产环境中，这里可以发送到分析服务
		if (typeof window !== "undefined" && (window as any).gtag) {
			(window as any).gtag("event", "component_load_time", {
				component_name: componentName,
				load_time: Math.round(loadTime),
			});
		}
	},

	// 记录首屏渲染时间
	recordFirstContentfulPaint: () => {
		if (typeof window !== "undefined" && "PerformanceObserver" in window) {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					if (entry.name === "first-contentful-paint") {
						console.log(
							`[Performance] First Contentful Paint: ${entry.startTime.toFixed(2)}ms`,
						);
					}
				});
			});

			observer.observe({ entryTypes: ["paint"] });
		}
	},

	// 记录最大内容绘制时间
	recordLargestContentfulPaint: () => {
		if (typeof window !== "undefined" && "PerformanceObserver" in window) {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1];
				console.log(
					`[Performance] Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`,
				);
			});

			observer.observe({ entryTypes: ["largest-contentful-paint"] });
		}
	},
};

// 资源优化
export const resourceOptimization = {
	// 图片懒加载
	lazyLoadImages: () => {
		if (typeof window !== "undefined" && "IntersectionObserver" in window) {
			const imageObserver = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const img = entry.target as HTMLImageElement;
						if (img.dataset.src) {
							img.src = img.dataset.src;
							img.removeAttribute("data-src");
							imageObserver.unobserve(img);
						}
					}
				});
			});

			document.querySelectorAll("img[data-src]").forEach((img) => {
				imageObserver.observe(img);
			});
		}
	},

	// 预连接到重要域名
	preconnectDomains: () => {
		const domains = [
			"https://fonts.googleapis.com",
			"https://fonts.gstatic.com",
		];

		domains.forEach((domain) => {
			const link = document.createElement("link");
			link.rel = "preconnect";
			link.href = domain;
			document.head.appendChild(link);
		});
	},

	// 预加载关键资源
	preloadCriticalResources: () => {
		const resources = [{ href: "/api/guest/stats?type=overview", as: "fetch" }];

		resources.forEach(({ href, as }) => {
			const link = document.createElement("link");
			link.rel = "preload";
			link.href = href;
			link.as = as;
			document.head.appendChild(link);
		});
	},
};

// 内存优化
export const memoryOptimization = {
	// 清理未使用的组件
	cleanupUnusedComponents: () => {
		// 这里可以实现组件的清理逻辑
		// 例如清理事件监听器、定时器等
	},

	// 监控内存使用
	monitorMemoryUsage: () => {
		if (
			typeof window !== "undefined" &&
			"performance" in window &&
			"memory" in (window.performance as any)
		) {
			const memory = (window.performance as any).memory;
			console.log(
				"[Memory] Used:",
				Math.round(memory.usedJSHeapSize / 1024 / 1024),
				"MB",
			);
			console.log(
				"[Memory] Total:",
				Math.round(memory.totalJSHeapSize / 1024 / 1024),
				"MB",
			);
			console.log(
				"[Memory] Limit:",
				Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
				"MB",
			);
		}
	},
};

// 初始化性能优化
export const initializePerformanceOptimizations = () => {
	if (typeof window !== "undefined") {
		// 记录性能指标
		performanceMonitor.recordFirstContentfulPaint();
		performanceMonitor.recordLargestContentfulPaint();

		// 资源优化
		resourceOptimization.preconnectDomains();
		resourceOptimization.preloadCriticalResources();

		// 图片懒加载
		setTimeout(() => {
			resourceOptimization.lazyLoadImages();
		}, 100);

		// 内存监控（仅在开发环境）
		if (process.env.NODE_ENV === "development") {
			setTimeout(() => {
				memoryOptimization.monitorMemoryUsage();
			}, 5000);
		}
	}
};

// 导出所有优化工具
export { LoadingSpinner, LoadingCard, LoadingTable, withLazyLoading };
