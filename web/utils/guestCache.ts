/**
 * 游客模式缓存优化工具
 */

// 缓存配置
const CACHE_CONFIG = {
	// 不同类型数据的缓存时间（毫秒）
	ttl: {
		stats: 5 * 60 * 1000, // 统计数据：5分钟
		blacklist: 2 * 60 * 1000, // 黑名单：2分钟
		search: 1 * 60 * 1000, // 搜索结果：1分钟
		session: 30 * 60 * 1000, // 会话数据：30分钟
	},

	// 缓存大小限制
	maxSize: {
		stats: 10, // 最多缓存10个统计查询
		blacklist: 50, // 最多缓存50个黑名单查询
		search: 100, // 最多缓存100个搜索查询
		session: 5, // 最多缓存5个会话
	},

	// 缓存键前缀
	keyPrefix: "guest_cache_",
} as const;

// 缓存项接口
interface CacheItem<T = unknown> {
	data: T;
	timestamp: number;
	ttl: number;
	accessCount: number;
	lastAccess: number;
}

// 缓存管理器类
class GuestCacheManager {
	private cache = new Map<string, CacheItem>();
	private accessLog = new Map<string, number[]>();

	/**
	 * 生成缓存键
	 */
	private generateKey(
		type: keyof typeof CACHE_CONFIG.ttl,
		identifier: string,
	): string {
		return `${CACHE_CONFIG.keyPrefix}${type}_${identifier}`;
	}

	/**
	 * 检查缓存项是否过期
	 */
	private isExpired(item: CacheItem): boolean {
		return Date.now() - item.timestamp > item.ttl;
	}

	/**
	 * 清理过期缓存
	 */
	private cleanupExpired(): void {
		for (const [key, item] of this.cache.entries()) {
			if (this.isExpired(item)) {
				this.cache.delete(key);
				this.accessLog.delete(key);
			}
		}
	}

	/**
	 * 根据LRU策略清理缓存
	 */
	private cleanupByLRU(type: keyof typeof CACHE_CONFIG.maxSize): void {
		const maxSize = CACHE_CONFIG.maxSize[type];
		const typePrefix = `${CACHE_CONFIG.keyPrefix}${type}_`;

		// 获取该类型的所有缓存项
		const typeItems = Array.from(this.cache.entries())
			.filter(([key]) => key.startsWith(typePrefix))
			.sort(([, a], [, b]) => a.lastAccess - b.lastAccess); // 按最后访问时间排序

		// 如果超过限制，删除最久未访问的项
		while (typeItems.length > maxSize) {
			const item = typeItems.shift();
			if (item) {
				const [keyToRemove] = item;
				this.cache.delete(keyToRemove);
				this.accessLog.delete(keyToRemove);
			}
		}
	}

	/**
	 * 设置缓存
	 */
	set<T>(
		type: keyof typeof CACHE_CONFIG.ttl,
		identifier: string,
		data: T,
		customTtl?: number,
	): void {
		const key = this.generateKey(type, identifier);
		const ttl = customTtl || CACHE_CONFIG.ttl[type];
		const now = Date.now();

		const item: CacheItem<T> = {
			data,
			timestamp: now,
			ttl,
			accessCount: 0,
			lastAccess: now,
		};

		this.cache.set(key, item);

		// 清理过期项和超出限制的项
		this.cleanupExpired();
		this.cleanupByLRU(type);
	}

	/**
	 * 获取缓存
	 */
	get<T>(type: keyof typeof CACHE_CONFIG.ttl, identifier: string): T | null {
		const key = this.generateKey(type, identifier);
		const item = this.cache.get(key) as CacheItem<T> | undefined;

		if (!item) {
			return null;
		}

		if (this.isExpired(item)) {
			this.cache.delete(key);
			this.accessLog.delete(key);
			return null;
		}

		// 更新访问统计
		const now = Date.now();
		item.accessCount++;
		item.lastAccess = now;

		// 记录访问日志
		const log = this.accessLog.get(key) || [];
		log.push(now);
		// 只保留最近100次访问记录
		if (log.length > 100) {
			log.splice(0, log.length - 100);
		}
		this.accessLog.set(key, log);

		return item.data;
	}

	/**
	 * 删除缓存
	 */
	delete(type: keyof typeof CACHE_CONFIG.ttl, identifier: string): boolean {
		const key = this.generateKey(type, identifier);
		const deleted = this.cache.delete(key);
		this.accessLog.delete(key);
		return deleted;
	}

	/**
	 * 清空指定类型的缓存
	 */
	clear(type?: keyof typeof CACHE_CONFIG.ttl): void {
		if (type) {
			const typePrefix = `${CACHE_CONFIG.keyPrefix}${type}_`;
			for (const key of this.cache.keys()) {
				if (key.startsWith(typePrefix)) {
					this.cache.delete(key);
					this.accessLog.delete(key);
				}
			}
		} else {
			this.cache.clear();
			this.accessLog.clear();
		}
	}

	/**
	 * 获取缓存统计信息
	 */
	getStats(): {
		totalItems: number;
		totalSize: number;
		hitRate: number;
		typeStats: Record<string, { count: number; hitRate: number }>;
	} {
		const typeStats: Record<string, { count: number; hitRate: number }> = {};
		let totalHits = 0;
		let totalRequests = 0;

		// 按类型统计
		for (const type of Object.keys(CACHE_CONFIG.ttl)) {
			const typePrefix = `${CACHE_CONFIG.keyPrefix}${type}_`;
			const typeItems = Array.from(this.cache.entries()).filter(([key]) =>
				key.startsWith(typePrefix),
			);

			let typeHits = 0;
			let typeRequests = 0;

			for (const [key, item] of typeItems) {
				const accessLog = this.accessLog.get(key) || [];
				typeRequests += accessLog.length;
				typeHits += item.accessCount;
			}

			typeStats[type] = {
				count: typeItems.length,
				hitRate: typeRequests > 0 ? typeHits / typeRequests : 0,
			};

			totalHits += typeHits;
			totalRequests += typeRequests;
		}

		return {
			totalItems: this.cache.size,
			totalSize: this.calculateCacheSize(),
			hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
			typeStats,
		};
	}

	/**
	 * 计算缓存大小（估算）
	 */
	private calculateCacheSize(): number {
		let size = 0;
		for (const [key, item] of this.cache.entries()) {
			// 简单估算：键长度 + JSON字符串长度
			size += key.length * 2; // 字符串按2字节计算
			size += JSON.stringify(item.data).length * 2;
			size += 64; // 元数据大小估算
		}
		return size;
	}

	/**
	 * 预热缓存
	 */
	async warmup(urls: string[]): Promise<void> {
		const promises = urls.map(async (url) => {
			try {
				const response = await fetch(url);
				if (response.ok) {
					const data = await response.json();
					// 根据URL确定缓存类型
					if (url.includes("/stats")) {
						this.set("stats", url, data);
					} else if (url.includes("/blacklist")) {
						this.set("blacklist", url, data);
					} else if (url.includes("/search")) {
						this.set("search", url, data);
					}
				}
			} catch (error) {
				console.warn(`Failed to warmup cache for ${url}:`, error);
			}
		});

		await Promise.allSettled(promises);
	}
}

// 创建全局缓存实例
export const guestCache = new GuestCacheManager();

// 缓存装饰器函数
export function withCache<T extends (...args: any[]) => Promise<any>>(
	fn: T,
	type: keyof typeof CACHE_CONFIG.ttl,
	keyGenerator: (...args: any[]) => string,
): T {
	return (async (...args: any[]) => {
		const cacheKey = keyGenerator(...args);

		// 尝试从缓存获取
		const cached = guestCache.get(type, cacheKey);
		if (cached !== null) {
			return cached;
		}

		// 执行原函数
		const result = await fn(...args);

		// 缓存结果
		guestCache.set(type, cacheKey, result);

		return result;
	}) as T;
}

// API缓存包装器
export const cachedFetch = withCache(
	async (url: string, options?: RequestInit) => {
		const response = await fetch(url, options);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		return response.json();
	},
	"blacklist", // 默认类型，实际使用时可以根据URL动态确定
	(url: string) => url,
);

// 专用的缓存API函数
export const guestAPI = {
	// 获取统计数据（带缓存）
	getStats: withCache(
		async (type = "overview") => {
			const response = await fetch(`/api/guest/stats?type=${type}`);
			if (!response.ok) throw new Error("Failed to fetch stats");
			return response.json();
		},
		"stats",
		(type: string) => type,
	),

	// 获取黑名单数据（带缓存）
	getBlacklist: withCache(
		async (page = 1, pageSize = 20, filters: Record<string, string> = {}) => {
			const params = new URLSearchParams({
				page: page.toString(),
				pageSize: pageSize.toString(),
				...filters,
			});
			const response = await fetch(`/api/guest/blacklist/public?${params}`);
			if (!response.ok) throw new Error("Failed to fetch blacklist");
			return response.json();
		},
		"blacklist",
		(page: number, pageSize: number, filters: Record<string, string>) =>
			`${page}_${pageSize}_${JSON.stringify(filters)}`,
	),

	// 搜索数据（带缓存）
	search: withCache(
		async (query: string, limit = 20) => {
			const params = new URLSearchParams({ q: query, limit: limit.toString() });
			const response = await fetch(`/api/guest/search?${params}`);
			if (!response.ok) throw new Error("Failed to search");
			return response.json();
		},
		"search",
		(query: string, limit: number) => `${query}_${limit}`,
	),
};

// 缓存管理工具
export const cacheUtils = {
	// 清理所有缓存
	clearAll: () => guestCache.clear(),

	// 清理指定类型缓存
	clearType: (type: keyof typeof CACHE_CONFIG.ttl) => guestCache.clear(type),

	// 获取缓存统计
	getStats: () => guestCache.getStats(),

	// 预热关键缓存
	warmup: async () => {
		const urls = [
			"/api/guest/stats?type=overview",
			"/api/guest/blacklist/public?page=1&pageSize=20",
		];
		await guestCache.warmup(urls);
	},

	// 监控缓存性能
	monitor: () => {
		const stats = guestCache.getStats();
		console.log("[Cache] Performance Stats:", {
			items: stats.totalItems,
			size: `${Math.round(stats.totalSize / 1024)}KB`,
			hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
			types: stats.typeStats,
		});
	},
};

// 初始化缓存系统
export const initializeGuestCache = async () => {
	try {
		// 预热关键缓存
		await cacheUtils.warmup();

		// 在开发环境中启用监控
		if (process.env.NODE_ENV === "development") {
			// 每30秒输出一次缓存统计
			setInterval(() => {
				cacheUtils.monitor();
			}, 30000);
		}

		console.log("[Cache] Guest cache system initialized");
	} catch (error) {
		console.error("[Cache] Failed to initialize guest cache:", error);
	}
};
