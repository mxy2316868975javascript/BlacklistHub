import { connectDB } from "@/lib/db";
import ReasonCodeModel from "@/models/ReasonCode";
import RegionModel from "@/models/Region";
import SourceModel from "@/models/Source";

// 理由码初始数据
const reasonCodes = [
	// 欺诈类
	{
		code: "fraud.payment",
		name: "欺诈 - 支付欺诈",
		category: "fraud",
		description: "涉及支付相关的欺诈行为",
		sort_order: 1,
	},
	{
		code: "fraud.chargeback",
		name: "欺诈 - 拒付欺诈",
		category: "fraud",
		description: "恶意拒付或拒付欺诈",
		sort_order: 2,
	},
	{
		code: "fraud.identity",
		name: "欺诈 - 身份欺诈",
		category: "fraud",
		description: "冒用他人身份进行欺诈",
		sort_order: 3,
	},
	{
		code: "fraud.account",
		name: "欺诈 - 账户欺诈",
		category: "fraud",
		description: "账户相关的欺诈行为",
		sort_order: 4,
	},

	// 滥用类
	{
		code: "abuse.spam",
		name: "滥用 - 垃圾信息",
		category: "abuse",
		description: "发送垃圾邮件或信息",
		sort_order: 11,
	},
	{
		code: "abuse.harassment",
		name: "滥用 - 骚扰行为",
		category: "abuse",
		description: "骚扰其他用户",
		sort_order: 12,
	},
	{
		code: "abuse.phishing",
		name: "滥用 - 钓鱼攻击",
		category: "abuse",
		description: "进行钓鱼攻击",
		sort_order: 13,
	},
	{
		code: "abuse.malware",
		name: "滥用 - 恶意软件",
		category: "abuse",
		description: "传播恶意软件",
		sort_order: 14,
	},

	// 违规类
	{
		code: "violation.terms",
		name: "违规 - 违反条款",
		category: "violation",
		description: "违反服务条款",
		sort_order: 21,
	},
	{
		code: "violation.policy",
		name: "违规 - 违反政策",
		category: "violation",
		description: "违反平台政策",
		sort_order: 22,
	},
	{
		code: "violation.legal",
		name: "违规 - 违反法律",
		category: "violation",
		description: "违反法律法规",
		sort_order: 23,
	},

	// 安全类
	{
		code: "security.breach",
		name: "安全 - 安全漏洞",
		category: "security",
		description: "存在安全漏洞",
		sort_order: 31,
	},
	{
		code: "security.suspicious",
		name: "安全 - 可疑活动",
		category: "security",
		description: "存在可疑活动",
		sort_order: 32,
	},

	// 质量类
	{
		code: "quality.fake",
		name: "质量 - 虚假信息",
		category: "quality",
		description: "提供虚假信息",
		sort_order: 41,
	},
	{
		code: "quality.duplicate",
		name: "质量 - 重复内容",
		category: "quality",
		description: "重复或低质量内容",
		sort_order: 42,
	},

	// 其他类
	{
		code: "other.manual",
		name: "其他 - 人工标记",
		category: "other",
		description: "人工审核标记",
		sort_order: 51,
	},
	{
		code: "other.system",
		name: "其他 - 系统标记",
		category: "other",
		description: "系统自动标记",
		sort_order: 52,
	},
];

// 来源初始数据
const sources = [
	{
		code: "user_report",
		name: "用户举报",
		description: "用户主动举报",
		sort_order: 1,
	},
	{
		code: "system_detection",
		name: "系统检测",
		description: "系统自动检测发现",
		sort_order: 2,
	},
	{
		code: "manual_review",
		name: "人工审核",
		description: "人工审核发现",
		sort_order: 3,
	},
	{
		code: "external_data",
		name: "外部数据",
		description: "来自外部数据源",
		sort_order: 4,
	},
	{
		code: "partner",
		name: "合作伙伴",
		description: "合作伙伴提供",
		sort_order: 5,
	},
	{
		code: "regulatory",
		name: "监管要求",
		description: "监管部门要求",
		sort_order: 6,
	},
	{ code: "other", name: "其他", description: "其他来源", sort_order: 7 },
];

// 地区初始数据（部分示例，实际应包含所有城市）
const regions = [
	// 直辖市
	{
		code: "beijing",
		name: "北京市",
		province: "直辖市",
		province_code: "municipality",
		level: "municipality",
		sort_order: 1,
	},
	{
		code: "shanghai",
		name: "上海市",
		province: "直辖市",
		province_code: "municipality",
		level: "municipality",
		sort_order: 2,
	},
	{
		code: "tianjin",
		name: "天津市",
		province: "直辖市",
		province_code: "municipality",
		level: "municipality",
		sort_order: 3,
	},
	{
		code: "chongqing",
		name: "重庆市",
		province: "直辖市",
		province_code: "municipality",
		level: "municipality",
		sort_order: 4,
	},

	// 广东省主要城市
	{
		code: "guangzhou",
		name: "广州市",
		province: "广东省",
		province_code: "guangdong",
		level: "prefecture",
		sort_order: 11,
	},
	{
		code: "shenzhen",
		name: "深圳市",
		province: "广东省",
		province_code: "guangdong",
		level: "prefecture",
		sort_order: 12,
	},
	{
		code: "dongguan",
		name: "东莞市",
		province: "广东省",
		province_code: "guangdong",
		level: "prefecture",
		sort_order: 13,
	},
	{
		code: "foshan",
		name: "佛山市",
		province: "广东省",
		province_code: "guangdong",
		level: "prefecture",
		sort_order: 14,
	},
	{
		code: "zhuhai",
		name: "珠海市",
		province: "广东省",
		province_code: "guangdong",
		level: "prefecture",
		sort_order: 15,
	},

	// 江苏省主要城市
	{
		code: "nanjing",
		name: "南京市",
		province: "江苏省",
		province_code: "jiangsu",
		level: "prefecture",
		sort_order: 21,
	},
	{
		code: "suzhou",
		name: "苏州市",
		province: "江苏省",
		province_code: "jiangsu",
		level: "prefecture",
		sort_order: 22,
	},
	{
		code: "wuxi",
		name: "无锡市",
		province: "江苏省",
		province_code: "jiangsu",
		level: "prefecture",
		sort_order: 23,
	},

	// 浙江省主要城市
	{
		code: "hangzhou",
		name: "杭州市",
		province: "浙江省",
		province_code: "zhejiang",
		level: "prefecture",
		sort_order: 31,
	},
	{
		code: "ningbo",
		name: "宁波市",
		province: "浙江省",
		province_code: "zhejiang",
		level: "prefecture",
		sort_order: 32,
	},
	{
		code: "wenzhou",
		name: "温州市",
		province: "浙江省",
		province_code: "zhejiang",
		level: "prefecture",
		sort_order: 33,
	},
	{
		code: "jiaxing",
		name: "嘉兴市",
		province: "浙江省",
		province_code: "zhejiang",
		level: "prefecture",
		sort_order: 34,
	},
	{
		code: "huzhou",
		name: "湖州市",
		province: "浙江省",
		province_code: "zhejiang",
		level: "prefecture",
		sort_order: 35,
	},
	{
		code: "shaoxing",
		name: "绍兴市",
		province: "浙江省",
		province_code: "zhejiang",
		level: "prefecture",
		sort_order: 36,
	},

	// 山东省主要城市
	{
		code: "jinan",
		name: "济南市",
		province: "山东省",
		province_code: "shandong",
		level: "prefecture",
		sort_order: 41,
	},
	{
		code: "qingdao",
		name: "青岛市",
		province: "山东省",
		province_code: "shandong",
		level: "prefecture",
		sort_order: 42,
	},
	{
		code: "yantai",
		name: "烟台市",
		province: "山东省",
		province_code: "shandong",
		level: "prefecture",
		sort_order: 43,
	},
	{
		code: "weifang",
		name: "潍坊市",
		province: "山东省",
		province_code: "shandong",
		level: "prefecture",
		sort_order: 44,
	},
	{
		code: "zibo",
		name: "淄博市",
		province: "山东省",
		province_code: "shandong",
		level: "prefecture",
		sort_order: 45,
	},
	{
		code: "weihai",
		name: "威海市",
		province: "山东省",
		province_code: "shandong",
		level: "prefecture",
		sort_order: 46,
	},
	{
		code: "jining",
		name: "济宁市",
		province: "山东省",
		province_code: "shandong",
		level: "prefecture",
		sort_order: 47,
	},
	{
		code: "taian",
		name: "泰安市",
		province: "山东省",
		province_code: "shandong",
		level: "prefecture",
		sort_order: 48,
	},
	{
		code: "linyi",
		name: "临沂市",
		province: "山东省",
		province_code: "shandong",
		level: "prefecture",
		sort_order: 49,
	},

	// 河北省主要城市
	{
		code: "shijiazhuang",
		name: "石家庄市",
		province: "河北省",
		province_code: "hebei",
		level: "prefecture",
		sort_order: 51,
	},
	{
		code: "tangshan",
		name: "唐山市",
		province: "河北省",
		province_code: "hebei",
		level: "prefecture",
		sort_order: 52,
	},
	{
		code: "baoding",
		name: "保定市",
		province: "河北省",
		province_code: "hebei",
		level: "prefecture",
		sort_order: 53,
	},
	{
		code: "langfang",
		name: "廊坊市",
		province: "河北省",
		province_code: "hebei",
		level: "prefecture",
		sort_order: 54,
	},
	{
		code: "cangzhou",
		name: "沧州市",
		province: "河北省",
		province_code: "hebei",
		level: "prefecture",
		sort_order: 55,
	},
	{
		code: "handan",
		name: "邯郸市",
		province: "河北省",
		province_code: "hebei",
		level: "prefecture",
		sort_order: 56,
	},

	// 河南省主要城市
	{
		code: "zhengzhou",
		name: "郑州市",
		province: "河南省",
		province_code: "henan",
		level: "prefecture",
		sort_order: 61,
	},
	{
		code: "luoyang",
		name: "洛阳市",
		province: "河南省",
		province_code: "henan",
		level: "prefecture",
		sort_order: 62,
	},
	{
		code: "kaifeng",
		name: "开封市",
		province: "河南省",
		province_code: "henan",
		level: "prefecture",
		sort_order: 63,
	},
	{
		code: "anyang",
		name: "安阳市",
		province: "河南省",
		province_code: "henan",
		level: "prefecture",
		sort_order: 64,
	},
	{
		code: "xinxiang",
		name: "新乡市",
		province: "河南省",
		province_code: "henan",
		level: "prefecture",
		sort_order: 65,
	},

	// 湖北省主要城市
	{
		code: "wuhan",
		name: "武汉市",
		province: "湖北省",
		province_code: "hubei",
		level: "prefecture",
		sort_order: 71,
	},
	{
		code: "yichang",
		name: "宜昌市",
		province: "湖北省",
		province_code: "hubei",
		level: "prefecture",
		sort_order: 72,
	},
	{
		code: "xiangyang",
		name: "襄阳市",
		province: "湖北省",
		province_code: "hubei",
		level: "prefecture",
		sort_order: 73,
	},
	{
		code: "jingzhou",
		name: "荆州市",
		province: "湖北省",
		province_code: "hubei",
		level: "prefecture",
		sort_order: 74,
	},

	// 湖南省主要城市
	{
		code: "changsha",
		name: "长沙市",
		province: "湖南省",
		province_code: "hunan",
		level: "prefecture",
		sort_order: 81,
	},
	{
		code: "zhuzhou",
		name: "株洲市",
		province: "湖南省",
		province_code: "hunan",
		level: "prefecture",
		sort_order: 82,
	},
	{
		code: "xiangtan",
		name: "湘潭市",
		province: "湖南省",
		province_code: "hunan",
		level: "prefecture",
		sort_order: 83,
	},
	{
		code: "hengyang",
		name: "衡阳市",
		province: "湖南省",
		province_code: "hunan",
		level: "prefecture",
		sort_order: 84,
	},

	// 四川省主要城市
	{
		code: "chengdu",
		name: "成都市",
		province: "四川省",
		province_code: "sichuan",
		level: "prefecture",
		sort_order: 91,
	},
	{
		code: "mianyang",
		name: "绵阳市",
		province: "四川省",
		province_code: "sichuan",
		level: "prefecture",
		sort_order: 92,
	},
	{
		code: "deyang",
		name: "德阳市",
		province: "四川省",
		province_code: "sichuan",
		level: "prefecture",
		sort_order: 93,
	},
	{
		code: "nanchong",
		name: "南充市",
		province: "四川省",
		province_code: "sichuan",
		level: "prefecture",
		sort_order: 94,
	},

	// 陕西省主要城市
	{
		code: "xian",
		name: "西安市",
		province: "陕西省",
		province_code: "shaanxi",
		level: "prefecture",
		sort_order: 101,
	},
	{
		code: "baoji",
		name: "宝鸡市",
		province: "陕西省",
		province_code: "shaanxi",
		level: "prefecture",
		sort_order: 102,
	},
	{
		code: "xianyang",
		name: "咸阳市",
		province: "陕西省",
		province_code: "shaanxi",
		level: "prefecture",
		sort_order: 103,
	},
	{
		code: "weinan",
		name: "渭南市",
		province: "陕西省",
		province_code: "shaanxi",
		level: "prefecture",
		sort_order: 104,
	},

	// 福建省主要城市
	{
		code: "fuzhou",
		name: "福州市",
		province: "福建省",
		province_code: "fujian",
		level: "prefecture",
		sort_order: 111,
	},
	{
		code: "xiamen",
		name: "厦门市",
		province: "福建省",
		province_code: "fujian",
		level: "prefecture",
		sort_order: 112,
	},
	{
		code: "quanzhou",
		name: "泉州市",
		province: "福建省",
		province_code: "fujian",
		level: "prefecture",
		sort_order: 113,
	},
	{
		code: "zhangzhou",
		name: "漳州市",
		province: "福建省",
		province_code: "fujian",
		level: "prefecture",
		sort_order: 114,
	},

	// 安徽省主要城市
	{
		code: "hefei",
		name: "合肥市",
		province: "安徽省",
		province_code: "anhui",
		level: "prefecture",
		sort_order: 121,
	},
	{
		code: "wuhu",
		name: "芜湖市",
		province: "安徽省",
		province_code: "anhui",
		level: "prefecture",
		sort_order: 122,
	},
	{
		code: "bengbu",
		name: "蚌埠市",
		province: "安徽省",
		province_code: "anhui",
		level: "prefecture",
		sort_order: 123,
	},
	{
		code: "anqing",
		name: "安庆市",
		province: "安徽省",
		province_code: "anhui",
		level: "prefecture",
		sort_order: 124,
	},

	// 江西省主要城市
	{
		code: "nanchang",
		name: "南昌市",
		province: "江西省",
		province_code: "jiangxi",
		level: "prefecture",
		sort_order: 131,
	},
	{
		code: "ganzhou",
		name: "赣州市",
		province: "江西省",
		province_code: "jiangxi",
		level: "prefecture",
		sort_order: 132,
	},
	{
		code: "jiujiang",
		name: "九江市",
		province: "江西省",
		province_code: "jiangxi",
		level: "prefecture",
		sort_order: 133,
	},
	{
		code: "shangrao",
		name: "上饶市",
		province: "江西省",
		province_code: "jiangxi",
		level: "prefecture",
		sort_order: 134,
	},

	// 东北地区主要城市
	{
		code: "shenyang",
		name: "沈阳市",
		province: "辽宁省",
		province_code: "liaoning",
		level: "prefecture",
		sort_order: 141,
	},
	{
		code: "dalian",
		name: "大连市",
		province: "辽宁省",
		province_code: "liaoning",
		level: "prefecture",
		sort_order: 142,
	},
	{
		code: "changchun",
		name: "长春市",
		province: "吉林省",
		province_code: "jilin",
		level: "prefecture",
		sort_order: 143,
	},
	{
		code: "harbin",
		name: "哈尔滨市",
		province: "黑龙江省",
		province_code: "heilongjiang",
		level: "prefecture",
		sort_order: 144,
	},
	{
		code: "daqing",
		name: "大庆市",
		province: "黑龙江省",
		province_code: "heilongjiang",
		level: "prefecture",
		sort_order: 145,
	},

	// 西部地区主要城市
	{
		code: "kunming",
		name: "昆明市",
		province: "云南省",
		province_code: "yunnan",
		level: "prefecture",
		sort_order: 151,
	},
	{
		code: "guiyang",
		name: "贵阳市",
		province: "贵州省",
		province_code: "guizhou",
		level: "prefecture",
		sort_order: 152,
	},
	{
		code: "taiyuan",
		name: "太原市",
		province: "山西省",
		province_code: "shanxi",
		level: "prefecture",
		sort_order: 153,
	},
	{
		code: "lanzhou",
		name: "兰州市",
		province: "甘肃省",
		province_code: "gansu",
		level: "prefecture",
		sort_order: 154,
	},
	{
		code: "xining",
		name: "西宁市",
		province: "青海省",
		province_code: "qinghai",
		level: "prefecture",
		sort_order: 155,
	},
	{
		code: "yinchuan",
		name: "银川市",
		province: "宁夏回族自治区",
		province_code: "ningxia",
		level: "prefecture",
		sort_order: 156,
	},
	{
		code: "urumqi",
		name: "乌鲁木齐市",
		province: "新疆维吾尔自治区",
		province_code: "xinjiang",
		level: "prefecture",
		sort_order: 157,
	},
	{
		code: "lhasa",
		name: "拉萨市",
		province: "西藏自治区",
		province_code: "tibet",
		level: "prefecture",
		sort_order: 158,
	},

	// 其他地区
	{
		code: "hohhot",
		name: "呼和浩特市",
		province: "内蒙古自治区",
		province_code: "neimenggu",
		level: "prefecture",
		sort_order: 161,
	},
	{
		code: "nanning",
		name: "南宁市",
		province: "广西壮族自治区",
		province_code: "guangxi",
		level: "prefecture",
		sort_order: 162,
	},
	{
		code: "haikou",
		name: "海口市",
		province: "海南省",
		province_code: "hainan",
		level: "prefecture",
		sort_order: 163,
	},
	{
		code: "sanya",
		name: "三亚市",
		province: "海南省",
		province_code: "hainan",
		level: "prefecture",
		sort_order: 164,
	},
	{
		code: "hongkong",
		name: "香港特别行政区",
		province: "特别行政区",
		province_code: "sar",
		level: "municipality",
		sort_order: 165,
	},
	{
		code: "macau",
		name: "澳门特别行政区",
		province: "特别行政区",
		province_code: "sar",
		level: "municipality",
		sort_order: 166,
	},
	{
		code: "taipei",
		name: "台北市",
		province: "台湾省",
		province_code: "taiwan",
		level: "prefecture",
		sort_order: 167,
	},

	// 其他
	{
		code: "other",
		name: "其他",
		province: "其他",
		province_code: "other",
		level: "prefecture",
		sort_order: 999,
	},
];

async function initEnumData() {
	try {
		await connectDB();
		console.log("Connected to database");

		// 初始化理由码
		console.log("Initializing reason codes...");
		for (const reasonCode of reasonCodes) {
			await ReasonCodeModel.findOneAndUpdate(
				{ code: reasonCode.code },
				reasonCode,
				{ upsert: true, new: true },
			);
		}
		console.log(`Initialized ${reasonCodes.length} reason codes`);

		// 初始化来源
		console.log("Initializing sources...");
		for (const source of sources) {
			await SourceModel.findOneAndUpdate({ code: source.code }, source, {
				upsert: true,
				new: true,
			});
		}
		console.log(`Initialized ${sources.length} sources`);

		// 初始化地区
		console.log("Initializing regions...");
		for (const region of regions) {
			await RegionModel.findOneAndUpdate({ code: region.code }, region, {
				upsert: true,
				new: true,
			});
		}
		console.log(`Initialized ${regions.length} regions`);

		console.log("Enum data initialization completed successfully!");
	} catch (error) {
		console.error("Error initializing enum data:", error);
	}
}

// 如果直接运行此脚本
if (require.main === module) {
	initEnumData().then(() => {
		process.exit(0);
	});
}

export { initEnumData };
