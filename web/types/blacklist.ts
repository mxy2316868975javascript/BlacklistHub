// 共享的黑名单相关类型定义

export type BlacklistType =
	| "user"
	| "ip"
	| "email"
	| "phone"
	| "company"
	| "domain"
	| "other";

export type RiskLevel = "low" | "medium" | "high";

export type BlacklistStatus =
	| "draft"
	| "pending"
	| "published"
	| "rejected"
	| "retracted";

export type SourceType =
	| "user_report"
	| "system_detection"
	| "manual_review"
	| "external_data"
	| "partner"
	| "regulatory"
	| "other";

export type ReasonCode =
	| "fraud.payment"
	| "fraud.chargeback"
	| "fraud.identity"
	| "fraud.account"
	| "abuse.spam"
	| "abuse.harassment"
	| "abuse.phishing"
	| "abuse.malware"
	| "violation.terms"
	| "violation.policy"
	| "violation.legal"
	| "security.breach"
	| "security.suspicious"
	| "quality.fake"
	| "quality.duplicate"
	| "other.manual"
	| "other.system";

export type Region =
	// 直辖市
	| "beijing" // 北京市
	| "shanghai" // 上海市
	| "tianjin" // 天津市
	| "chongqing" // 重庆市
	// 广东省
	| "guangzhou" // 广州市
	| "shenzhen" // 深圳市
	| "dongguan" // 东莞市
	| "foshan" // 佛山市
	| "zhuhai" // 珠海市
	| "zhongshan" // 中山市
	| "huizhou" // 惠州市
	| "jiangmen" // 江门市
	// 江苏省
	| "nanjing" // 南京市
	| "suzhou" // 苏州市
	| "wuxi" // 无锡市
	| "changzhou" // 常州市
	| "nantong" // 南通市
	| "xuzhou" // 徐州市
	| "yangzhou" // 扬州市
	// 浙江省
	| "hangzhou" // 杭州市
	| "ningbo" // 宁波市
	| "wenzhou" // 温州市
	| "jiaxing" // 嘉兴市
	| "huzhou" // 湖州市
	| "shaoxing" // 绍兴市
	// 山东省
	| "jinan" // 济南市
	| "qingdao" // 青岛市
	| "yantai" // 烟台市
	| "weifang" // 潍坊市
	| "zibo" // 淄博市
	| "weihai" // 威海市
	| "jining" // 济宁市
	| "taian" // 泰安市
	| "linyi" // 临沂市
	| "dezhou" // 德州市
	| "liaocheng" // 聊城市
	| "binzhou" // 滨州市
	| "dongying" // 东营市
	| "zaozhuang" // 枣庄市
	| "rizhao" // 日照市
	| "laiwu" // 莱芜市
	| "heze" // 菏泽市
	// 河北省
	| "shijiazhuang" // 石家庄市
	| "tangshan" // 唐山市
	| "baoding" // 保定市
	| "langfang" // 廊坊市
	| "cangzhou" // 沧州市
	| "handan" // 邯郸市
	| "xingtai" // 邢台市
	| "zhangjiakou" // 张家口市
	| "chengde" // 承德市
	| "hengshui" // 衡水市
	// 河南省
	| "zhengzhou" // 郑州市
	| "luoyang" // 洛阳市
	| "kaifeng" // 开封市
	| "anyang" // 安阳市
	| "xinxiang" // 新乡市
	// 湖北省
	| "wuhan" // 武汉市
	| "yichang" // 宜昌市
	| "xiangyang" // 襄阳市
	| "jingzhou" // 荆州市
	// 湖南省
	| "changsha" // 长沙市
	| "zhuzhou" // 株洲市
	| "xiangtan" // 湘潭市
	| "hengyang" // 衡阳市
	// 四川省
	| "chengdu" // 成都市
	| "mianyang" // 绵阳市
	| "deyang" // 德阳市
	| "nanchong" // 南充市
	// 陕西省
	| "xian" // 西安市
	| "baoji" // 宝鸡市
	| "xianyang" // 咸阳市
	| "weinan" // 渭南市
	// 福建省
	| "fuzhou" // 福州市
	| "xiamen" // 厦门市
	| "quanzhou" // 泉州市
	| "zhangzhou" // 漳州市
	// 安徽省
	| "hefei" // 合肥市
	| "wuhu" // 芜湖市
	| "bengbu" // 蚌埠市
	| "anqing" // 安庆市
	// 江西省
	| "nanchang" // 南昌市
	| "ganzhou" // 赣州市
	| "jiujiang" // 九江市
	| "shangrao" // 上饶市
	// 辽宁省
	| "shenyang" // 沈阳市
	| "dalian" // 大连市
	| "anshan" // 鞍山市
	| "fushun" // 抚顺市
	| "benxi" // 本溪市
	| "dandong" // 丹东市
	| "jinzhou" // 锦州市
	| "yingkou" // 营口市
	| "fuxin" // 阜新市
	| "liaoyang" // 辽阳市
	| "panjin" // 盘锦市
	| "tieling" // 铁岭市
	| "chaoyang" // 朝阳市
	| "huludao" // 葫芦岛市
	// 吉林省
	| "changchun" // 长春市
	| "jilin" // 吉林市
	| "siping" // 四平市
	| "liaoyuan" // 辽源市
	| "tonghua" // 通化市
	| "baishan" // 白山市
	| "songyuan" // 松原市
	| "baicheng" // 白城市
	| "yanbian" // 延边朝鲜族自治州
	// 黑龙江省
	| "harbin" // 哈尔滨市
	| "daqing" // 大庆市
	| "qiqihar" // 齐齐哈尔市
	| "jiamusi" // 佳木斯市
	| "mudanjiang" // 牡丹江市
	| "jixi" // 鸡西市
	| "shuangyashan" // 双鸭山市
	| "yichun" // 伊春市
	| "qitaihe" // 七台河市
	| "hegang" // 鹤岗市
	| "heihe" // 黑河市
	| "suihua" // 绥化市
	| "daxinganling" // 大兴安岭地区
	// 内蒙古自治区
	| "hohhot" // 呼和浩特市
	| "baotou" // 包头市
	| "ordos" // 鄂尔多斯市
	// 广西壮族自治区
	| "nanning" // 南宁市
	| "liuzhou" // 柳州市
	| "guilin" // 桂林市
	// 云南省
	| "kunming" // 昆明市
	| "qujing" // 曲靖市
	| "yuxi" // 玉溪市
	// 贵州省
	| "guiyang" // 贵阳市
	| "zunyi" // 遵义市
	// 山西省
	| "taiyuan" // 太原市
	| "datong" // 大同市
	| "changzhi" // 长治市
	// 甘肃省
	| "lanzhou" // 兰州市
	| "tianshui" // 天水市
	// 青海省
	| "xining" // 西宁市
	// 宁夏回族自治区
	| "yinchuan" // 银川市
	// 新疆维吾尔自治区
	| "urumqi" // 乌鲁木齐市
	| "karamay" // 克拉玛依市
	// 西藏自治区
	| "lhasa" // 拉萨市
	// 海南省
	| "haikou" // 海口市
	| "sanya" // 三亚市
	// 特别行政区
	| "hongkong" // 香港特别行政区
	| "macau" // 澳门特别行政区
	// 台湾省
	| "taipei" // 台北市
	| "kaohsiung" // 高雄市
	| "taichung" // 台中市
	// 更多三四线城市
	| "maanshan" // 马鞍山市
	| "huainan" // 淮南市
	| "huaibei" // 淮北市
	| "tongling" // 铜陵市
	| "anqing" // 安庆市
	| "huangshan" // 黄山市
	| "chuzhou" // 滁州市
	| "fuyang" // 阜阳市
	| "suzhou_ah" // 宿州市（安徽）
	| "luan" // 六安市
	| "bozhou" // 亳州市
	| "chizhou" // 池州市
	| "xuancheng" // 宣城市
	| "pingxiang" // 萍乡市
	| "jiujiang" // 九江市
	| "xinyu" // 新余市
	| "yingtan" // 鹰潭市
	| "ganzhou" // 赣州市
	| "jian" // 吉安市
	| "yichun_jx" // 宜春市（江西）
	| "fuzhou_jx" // 抚州市（江西）
	| "shangrao" // 上饶市
	| "jingdezhen" // 景德镇市
	| "pingdingshan" // 平顶山市
	| "jiaozuo" // 焦作市
	| "hebi" // 鹤壁市
	| "puyang" // 濮阳市
	| "xuchang" // 许昌市
	| "luohe" // 漯河市
	| "sanmenxia" // 三门峡市
	| "nanyang" // 南阳市
	| "shangqiu" // 商丘市
	| "xinyang" // 信阳市
	| "zhoukou" // 周口市
	| "zhumadian" // 驻马店市
	| "jiyuan" // 济源市
	| "ezhou" // 鄂州市
	| "jingmen" // 荆门市
	| "xiaogan" // 孝感市
	| "huanggang" // 黄冈市
	| "xianning" // 咸宁市
	| "suizhou" // 随州市
	| "enshi" // 恩施土家族苗族自治州
	| "shennongjia" // 神农架林区
	| "yueyang" // 岳阳市
	| "changde" // 常德市
	| "zhangjiajie" // 张家界市
	| "yiyang" // 益阳市
	| "chenzhou" // 郴州市
	| "yongzhou" // 永州市
	| "huaihua" // 怀化市
	| "loudi" // 娄底市
	| "xiangxi" // 湘西土家族苗族自治州
	| "zigong" // 自贡市
	| "panzhihua" // 攀枝花市
	| "luzhou" // 泸州市
	| "guangyuan" // 广元市
	| "suining" // 遂宁市
	| "neijiang" // 内江市
	| "leshan" // 乐山市
	| "yibin" // 宜宾市
	| "guangan" // 广安市
	| "dazhou" // 达州市
	| "yaan" // 雅安市
	| "bazhong" // 巴中市
	| "ziyang" // 资阳市
	| "aba" // 阿坝藏族羌族自治州
	| "ganzi" // 甘孜藏族自治州
	| "liangshan" // 凉山彝族自治州
	| "zunyi" // 遵义市
	| "liupanshui" // 六盘水市
	| "anshun" // 安顺市
	| "bijie" // 毕节市
	| "tongren" // 铜仁市
	| "qianxinan" // 黔西南布依族苗族自治州
	| "qiandongnan" // 黔东南苗族侗族自治州
	| "qiannan" // 黔南布依族苗族自治州
	| "qujing" // 曲靖市
	| "yuxi" // 玉溪市
	| "baoshan" // 保山市
	| "zhaotong" // 昭通市
	| "lijiang" // 丽江市
	| "puer" // 普洱市
	| "lincang" // 临沧市
	| "chuxiong" // 楚雄彝族自治州
	| "honghe" // 红河哈尼族彝族自治州
	| "wenshan" // 文山壮族苗族自治州
	| "xishuangbanna" // 西双版纳傣族自治州
	| "dali" // 大理白族自治州
	| "dehong" // 德宏傣族景颇族自治州
	| "nujiang" // 怒江傈僳族自治州
	| "diqing" // 迪庆藏族自治州
	| "yangquan" // 阳泉市
	| "changzhi" // 长治市
	| "jincheng" // 晋城市
	| "shuozhou" // 朔州市
	| "jinzhong" // 晋中市
	| "yuncheng" // 运城市
	| "xinzhou" // 忻州市
	| "linfen" // 临汾市
	| "lvliang" // 吕梁市
	| "wuzhong" // 吴忠市
	| "guyuan" // 固原市
	| "zhongwei" // 中卫市
	| "shizuishan" // 石嘴山市
	| "jiayuguan" // 嘉峪关市
	| "jinchang" // 金昌市
	| "baiyin" // 白银市
	| "tianshui" // 天水市
	| "wuwei" // 武威市
	| "zhangye" // 张掖市
	| "pingliang" // 平凉市
	| "jiuquan" // 酒泉市
	| "qingyang" // 庆阳市
	| "dingxi" // 定西市
	| "longnan" // 陇南市
	| "linxia" // 临夏回族自治州
	| "gannan" // 甘南藏族自治州
	| "haidong" // 海东市
	| "haibei" // 海北藏族自治州
	| "huangnan" // 黄南藏族自治州
	| "hainan_qh" // 海南藏族自治州（青海）
	| "guoluo" // 果洛藏族自治州
	| "yushu" // 玉树藏族自治州
	| "haixi" // 海西蒙古族藏族自治州
	| "turpan" // 吐鲁番市
	| "hami" // 哈密市
	| "changji" // 昌吉回族自治州
	| "bortala" // 博尔塔拉蒙古自治州
	| "bayingolin" // 巴音郭楞蒙古自治州
	| "aksu" // 阿克苏地区
	| "kizilsu" // 克孜勒苏柯尔克孜自治州
	| "kashgar" // 喀什地区
	| "hotan" // 和田地区
	| "ili" // 伊犁哈萨克自治州
	| "tacheng" // 塔城地区
	| "altay" // 阿勒泰地区
	| "shihezi" // 石河子市
	| "alar" // 阿拉尔市
	| "tumxuk" // 图木舒克市
	| "wujiaqu" // 五家渠市
	| "beitun" // 北屯市
	| "tiemenguan" // 铁门关市
	| "shuanghe" // 双河市
	| "kokdala" // 可克达拉市
	| "kunyu" // 昆玉市
	| "huyanghe" // 胡杨河市
	| "shannan" // 山南市
	| "shigatse" // 日喀则市
	| "chamdo" // 昌都市
	| "nyingchi" // 林芝市
	| "nagqu" // 那曲市
	| "ali" // 阿里地区
	| "wuzhishan" // 五指山市
	| "qionghai" // 琼海市
	| "danzhou" // 儋州市
	| "wenchang" // 文昌市
	| "wanning" // 万宁市
	| "dongfang" // 东方市
	| "ding_an" // 定安县
	| "tunchang" // 屯昌县
	| "chengmai" // 澄迈县
	| "lingao" // 临高县
	| "baisha" // 白沙黎族自治县
	| "changjiang" // 昌江黎族自治县
	| "ledong" // 乐东黎族自治县
	| "lingshui" // 陵水黎族自治县
	| "baoting" // 保亭黎族苗族自治县
	| "qiongzhong" // 琼中黎族苗族自治县
	// 其他
	| "other"; // 其他

export interface BlacklistItem {
	_id: string;
	type: BlacklistType;
	value: string;
	reason: string; // Markdown 格式的原因摘要
	reason_html?: string; // HTML 格式的富文本内容
	reason_images?: string[]; // 图片URL数组
	reason_code: ReasonCode;
	risk_level: RiskLevel;
	source?: SourceType;
	region?: Region;
	sources?: string[];
	status: BlacklistStatus;
	operator: string;
	created_at: string;
	updated_at: string;
	expires_at?: string;
	timeline?: TimelineItem[];
	evidence?: EvidenceItem[];
}

export interface TimelineItem {
	action: string;
	by: string;
	at: string;
	note?: string;
}

export interface EvidenceItem {
	images: string[];
	description?: string;
	uploaded_by: string;
	uploaded_at: string;
}

// 来源类型的显示映射
export const SOURCE_LABELS: Record<SourceType, string> = {
	user_report: "用户举报",
	system_detection: "系统检测",
	manual_review: "人工审核",
	external_data: "外部数据",
	partner: "合作伙伴",
	regulatory: "监管要求",
	other: "其他",
};

// 理由码的显示映射
export const REASON_CODE_LABELS: Record<ReasonCode, string> = {
	"fraud.payment": "欺诈 - 支付欺诈",
	"fraud.chargeback": "欺诈 - 拒付欺诈",
	"fraud.identity": "欺诈 - 身份欺诈",
	"fraud.account": "欺诈 - 账户欺诈",
	"abuse.spam": "滥用 - 垃圾信息",
	"abuse.harassment": "滥用 - 骚扰行为",
	"abuse.phishing": "滥用 - 钓鱼攻击",
	"abuse.malware": "滥用 - 恶意软件",
	"violation.terms": "违规 - 违反条款",
	"violation.policy": "违规 - 违反政策",
	"violation.legal": "违规 - 违反法律",
	"security.breach": "安全 - 安全漏洞",
	"security.suspicious": "安全 - 可疑活动",
	"quality.fake": "质量 - 虚假信息",
	"quality.duplicate": "质量 - 重复内容",
	"other.manual": "其他 - 人工标记",
	"other.system": "其他 - 系统标记",
};

// 地区的显示映射
export const REGION_LABELS: Record<Region, string> = {
	// 直辖市
	beijing: "北京市",
	shanghai: "上海市",
	tianjin: "天津市",
	chongqing: "重庆市",
	// 广东省
	guangzhou: "广州市",
	shenzhen: "深圳市",
	dongguan: "东莞市",
	foshan: "佛山市",
	zhuhai: "珠海市",
	zhongshan: "中山市",
	huizhou: "惠州市",
	jiangmen: "江门市",
	// 江苏省
	nanjing: "南京市",
	suzhou: "苏州市",
	wuxi: "无锡市",
	changzhou: "常州市",
	nantong: "南通市",
	xuzhou: "徐州市",
	yangzhou: "扬州市",
	// 浙江省
	hangzhou: "杭州市",
	ningbo: "宁波市",
	wenzhou: "温州市",
	jiaxing: "嘉兴市",
	huzhou: "湖州市",
	shaoxing: "绍兴市",
	// 山东省
	jinan: "济南市",
	qingdao: "青岛市",
	yantai: "烟台市",
	weifang: "潍坊市",
	zibo: "淄博市",
	weihai: "威海市",
	jining: "济宁市",
	taian: "泰安市",
	linyi: "临沂市",
	dezhou: "德州市",
	liaocheng: "聊城市",
	binzhou: "滨州市",
	dongying: "东营市",
	zaozhuang: "枣庄市",
	rizhao: "日照市",
	laiwu: "莱芜市",
	heze: "菏泽市",
	// 河北省
	shijiazhuang: "石家庄市",
	tangshan: "唐山市",
	baoding: "保定市",
	langfang: "廊坊市",
	cangzhou: "沧州市",
	handan: "邯郸市",
	xingtai: "邢台市",
	zhangjiakou: "张家口市",
	chengde: "承德市",
	hengshui: "衡水市",
	// 河南省
	zhengzhou: "郑州市",
	luoyang: "洛阳市",
	kaifeng: "开封市",
	anyang: "安阳市",
	xinxiang: "新乡市",
	// 湖北省
	wuhan: "武汉市",
	yichang: "宜昌市",
	xiangyang: "襄阳市",
	jingzhou: "荆州市",
	// 湖南省
	changsha: "长沙市",
	zhuzhou: "株洲市",
	xiangtan: "湘潭市",
	hengyang: "衡阳市",
	// 四川省
	chengdu: "成都市",
	mianyang: "绵阳市",
	deyang: "德阳市",
	nanchong: "南充市",
	// 陕西省
	xian: "西安市",
	baoji: "宝鸡市",
	xianyang: "咸阳市",
	weinan: "渭南市",
	// 福建省
	fuzhou: "福州市",
	xiamen: "厦门市",
	quanzhou: "泉州市",
	zhangzhou: "漳州市",
	// 安徽省
	hefei: "合肥市",
	wuhu: "芜湖市",
	bengbu: "蚌埠市",
	anqing: "安庆市",
	// 江西省
	nanchang: "南昌市",
	ganzhou: "赣州市",
	jiujiang: "九江市",
	shangrao: "上饶市",
	// 辽宁省
	shenyang: "沈阳市",
	dalian: "大连市",
	anshan: "鞍山市",
	fushun: "抚顺市",
	benxi: "本溪市",
	dandong: "丹东市",
	jinzhou: "锦州市",
	yingkou: "营口市",
	fuxin: "阜新市",
	liaoyang: "辽阳市",
	panjin: "盘锦市",
	tieling: "铁岭市",
	chaoyang: "朝阳市",
	huludao: "葫芦岛市",
	// 吉林省
	changchun: "长春市",
	jilin: "吉林市",
	siping: "四平市",
	liaoyuan: "辽源市",
	tonghua: "通化市",
	baishan: "白山市",
	songyuan: "松原市",
	baicheng: "白城市",
	yanbian: "延边朝鲜族自治州",
	// 黑龙江省
	harbin: "哈尔滨市",
	daqing: "大庆市",
	qiqihar: "齐齐哈尔市",
	jiamusi: "佳木斯市",
	mudanjiang: "牡丹江市",
	jixi: "鸡西市",
	shuangyashan: "双鸭山市",
	yichun: "伊春市",
	qitaihe: "七台河市",
	hegang: "鹤岗市",
	heihe: "黑河市",
	suihua: "绥化市",
	daxinganling: "大兴安岭地区",
	// 内蒙古自治区
	hohhot: "呼和浩特市",
	baotou: "包头市",
	ordos: "鄂尔多斯市",
	// 广西壮族自治区
	nanning: "南宁市",
	liuzhou: "柳州市",
	guilin: "桂林市",
	// 云南省
	kunming: "昆明市",
	qujing: "曲靖市",
	yuxi: "玉溪市",
	// 贵州省
	guiyang: "贵阳市",
	zunyi: "遵义市",
	// 山西省
	taiyuan: "太原市",
	datong: "大同市",
	changzhi: "长治市",
	// 甘肃省
	lanzhou: "兰州市",
	tianshui: "天水市",
	// 青海省
	xining: "西宁市",
	// 宁夏回族自治区
	yinchuan: "银川市",
	// 新疆维吾尔自治区
	urumqi: "乌鲁木齐市",
	karamay: "克拉玛依市",
	// 西藏自治区
	lhasa: "拉萨市",
	// 海南省
	haikou: "海口市",
	sanya: "三亚市",
	// 特别行政区
	hongkong: "香港特别行政区",
	macau: "澳门特别行政区",
	// 台湾省
	taipei: "台北市",
	kaohsiung: "高雄市",
	taichung: "台中市",
	// 更多三四线城市
	maanshan: "马鞍山市",
	huainan: "淮南市",
	huaibei: "淮北市",
	tongling: "铜陵市",
	huangshan: "黄山市",
	chuzhou: "滁州市",
	fuyang: "阜阳市",
	suzhou_ah: "宿州市",
	luan: "六安市",
	bozhou: "亳州市",
	chizhou: "池州市",
	xuancheng: "宣城市",
	pingxiang: "萍乡市",
	xinyu: "新余市",
	yingtan: "鹰潭市",
	jian: "吉安市",
	yichun_jx: "宜春市",
	fuzhou_jx: "抚州市",
	jingdezhen: "景德镇市",
	pingdingshan: "平顶山市",
	jiaozuo: "焦作市",
	hebi: "鹤壁市",
	puyang: "濮阳市",
	xuchang: "许昌市",
	luohe: "漯河市",
	sanmenxia: "三门峡市",
	nanyang: "南阳市",
	shangqiu: "商丘市",
	xinyang: "信阳市",
	zhoukou: "周口市",
	zhumadian: "驻马店市",
	jiyuan: "济源市",
	ezhou: "鄂州市",
	jingmen: "荆门市",
	xiaogan: "孝感市",
	huanggang: "黄冈市",
	xianning: "咸宁市",
	suizhou: "随州市",
	enshi: "恩施土家族苗族自治州",
	shennongjia: "神农架林区",
	yueyang: "岳阳市",
	changde: "常德市",
	zhangjiajie: "张家界市",
	yiyang: "益阳市",
	chenzhou: "郴州市",
	yongzhou: "永州市",
	huaihua: "怀化市",
	loudi: "娄底市",
	xiangxi: "湘西土家族苗族自治州",
	zigong: "自贡市",
	panzhihua: "攀枝花市",
	luzhou: "泸州市",
	guangyuan: "广元市",
	suining: "遂宁市",
	neijiang: "内江市",
	leshan: "乐山市",
	yibin: "宜宾市",
	guangan: "广安市",
	dazhou: "达州市",
	yaan: "雅安市",
	bazhong: "巴中市",
	ziyang: "资阳市",
	aba: "阿坝藏族羌族自治州",
	ganzi: "甘孜藏族自治州",
	liangshan: "凉山彝族自治州",
	liupanshui: "六盘水市",
	anshun: "安顺市",
	bijie: "毕节市",
	tongren: "铜仁市",
	qianxinan: "黔西南布依族苗族自治州",
	qiandongnan: "黔东南苗族侗族自治州",
	qiannan: "黔南布依族苗族自治州",
	baoshan: "保山市",
	zhaotong: "昭通市",
	lijiang: "丽江市",
	puer: "普洱市",
	lincang: "临沧市",
	chuxiong: "楚雄彝族自治州",
	honghe: "红河哈尼族彝族自治州",
	wenshan: "文山壮族苗族自治州",
	xishuangbanna: "西双版纳傣族自治州",
	dali: "大理白族自治州",
	dehong: "德宏傣族景颇族自治州",
	nujiang: "怒江傈僳族自治州",
	diqing: "迪庆藏族自治州",
	yangquan: "阳泉市",
	jincheng: "晋城市",
	shuozhou: "朔州市",
	jinzhong: "晋中市",
	yuncheng: "运城市",
	xinzhou: "忻州市",
	linfen: "临汾市",
	lvliang: "吕梁市",
	wuzhong: "吴忠市",
	guyuan: "固原市",
	zhongwei: "中卫市",
	shizuishan: "石嘴山市",
	jiayuguan: "嘉峪关市",
	jinchang: "金昌市",
	baiyin: "白银市",
	wuwei: "武威市",
	zhangye: "张掖市",
	pingliang: "平凉市",
	jiuquan: "酒泉市",
	qingyang: "庆阳市",
	dingxi: "定西市",
	longnan: "陇南市",
	linxia: "临夏回族自治州",
	gannan: "甘南藏族自治州",
	haidong: "海东市",
	haibei: "海北藏族自治州",
	huangnan: "黄南藏族自治州",
	hainan_qh: "海南藏族自治州",
	guoluo: "果洛藏族自治州",
	yushu: "玉树藏族自治州",
	haixi: "海西蒙古族藏族自治州",
	turpan: "吐鲁番市",
	hami: "哈密市",
	changji: "昌吉回族自治州",
	bortala: "博尔塔拉蒙古自治州",
	bayingolin: "巴音郭楞蒙古自治州",
	aksu: "阿克苏地区",
	kizilsu: "克孜勒苏柯尔克孜自治州",
	kashgar: "喀什地区",
	hotan: "和田地区",
	ili: "伊犁哈萨克自治州",
	tacheng: "塔城地区",
	altay: "阿勒泰地区",
	shihezi: "石河子市",
	alar: "阿拉尔市",
	tumxuk: "图木舒克市",
	wujiaqu: "五家渠市",
	beitun: "北屯市",
	tiemenguan: "铁门关市",
	shuanghe: "双河市",
	kokdala: "可克达拉市",
	kunyu: "昆玉市",
	huyanghe: "胡杨河市",
	shannan: "山南市",
	shigatse: "日喀则市",
	chamdo: "昌都市",
	nyingchi: "林芝市",
	nagqu: "那曲市",
	ali: "阿里地区",
	wuzhishan: "五指山市",
	qionghai: "琼海市",
	danzhou: "儋州市",
	wenchang: "文昌市",
	wanning: "万宁市",
	dongfang: "东方市",
	ding_an: "定安县",
	tunchang: "屯昌县",
	chengmai: "澄迈县",
	lingao: "临高县",
	baisha: "白沙黎族自治县",
	changjiang: "昌江黎族自治县",
	ledong: "乐东黎族自治县",
	lingshui: "陵水黎族自治县",
	baoting: "保亭黎族苗族自治县",
	qiongzhong: "琼中黎族苗族自治县",
	// 其他
	other: "其他",
};

// 来源类型选项（用于Select组件）
export const SOURCE_OPTIONS = Object.entries(SOURCE_LABELS).map(
	([value, label]) => ({
		label,
		value: value as SourceType,
	}),
);

// 理由码选项（用于Select组件）
export const REASON_CODE_OPTIONS = Object.entries(REASON_CODE_LABELS).map(
	([value, label]) => ({
		label,
		value: value as ReasonCode,
	}),
);

// 地区选项（用于Select组件，按省份分组）
export const REGION_OPTIONS = [
	{
		label: "直辖市",
		options: [
			{ label: "北京市", value: "beijing" as Region },
			{ label: "上海市", value: "shanghai" as Region },
			{ label: "天津市", value: "tianjin" as Region },
			{ label: "重庆市", value: "chongqing" as Region },
		],
	},
	{
		label: "广东省",
		options: [
			{ label: "广州市", value: "guangzhou" as Region },
			{ label: "深圳市", value: "shenzhen" as Region },
			{ label: "东莞市", value: "dongguan" as Region },
			{ label: "佛山市", value: "foshan" as Region },
			{ label: "珠海市", value: "zhuhai" as Region },
			{ label: "中山市", value: "zhongshan" as Region },
			{ label: "惠州市", value: "huizhou" as Region },
			{ label: "江门市", value: "jiangmen" as Region },
		],
	},
	{
		label: "江苏省",
		options: [
			{ label: "南京市", value: "nanjing" as Region },
			{ label: "苏州市", value: "suzhou" as Region },
			{ label: "无锡市", value: "wuxi" as Region },
			{ label: "常州市", value: "changzhou" as Region },
			{ label: "南通市", value: "nantong" as Region },
			{ label: "徐州市", value: "xuzhou" as Region },
			{ label: "扬州市", value: "yangzhou" as Region },
		],
	},
	{
		label: "浙江省",
		options: [
			{ label: "杭州市", value: "hangzhou" as Region },
			{ label: "宁波市", value: "ningbo" as Region },
			{ label: "温州市", value: "wenzhou" as Region },
			{ label: "嘉兴市", value: "jiaxing" as Region },
			{ label: "湖州市", value: "huzhou" as Region },
			{ label: "绍兴市", value: "shaoxing" as Region },
		],
	},
	{
		label: "山东省",
		options: [
			{ label: "济南市", value: "jinan" as Region },
			{ label: "青岛市", value: "qingdao" as Region },
			{ label: "烟台市", value: "yantai" as Region },
			{ label: "潍坊市", value: "weifang" as Region },
			{ label: "淄博市", value: "zibo" as Region },
			{ label: "威海市", value: "weihai" as Region },
		],
	},
	{
		label: "河北省",
		options: [
			{ label: "石家庄市", value: "shijiazhuang" as Region },
			{ label: "唐山市", value: "tangshan" as Region },
			{ label: "保定市", value: "baoding" as Region },
			{ label: "廊坊市", value: "langfang" as Region },
			{ label: "沧州市", value: "cangzhou" as Region },
		],
	},
	{
		label: "河南省",
		options: [
			{ label: "郑州市", value: "zhengzhou" as Region },
			{ label: "洛阳市", value: "luoyang" as Region },
			{ label: "开封市", value: "kaifeng" as Region },
			{ label: "安阳市", value: "anyang" as Region },
			{ label: "新乡市", value: "xinxiang" as Region },
		],
	},
	{
		label: "湖北省",
		options: [
			{ label: "武汉市", value: "wuhan" as Region },
			{ label: "宜昌市", value: "yichang" as Region },
			{ label: "襄阳市", value: "xiangyang" as Region },
			{ label: "荆州市", value: "jingzhou" as Region },
		],
	},
	{
		label: "湖南省",
		options: [
			{ label: "长沙市", value: "changsha" as Region },
			{ label: "株洲市", value: "zhuzhou" as Region },
			{ label: "湘潭市", value: "xiangtan" as Region },
			{ label: "衡阳市", value: "hengyang" as Region },
		],
	},
	{
		label: "四川省",
		options: [
			{ label: "成都市", value: "chengdu" as Region },
			{ label: "绵阳市", value: "mianyang" as Region },
			{ label: "德阳市", value: "deyang" as Region },
			{ label: "南充市", value: "nanchong" as Region },
		],
	},
	{
		label: "陕西省",
		options: [
			{ label: "西安市", value: "xian" as Region },
			{ label: "宝鸡市", value: "baoji" as Region },
			{ label: "咸阳市", value: "xianyang" as Region },
			{ label: "渭南市", value: "weinan" as Region },
		],
	},
	{
		label: "福建省",
		options: [
			{ label: "福州市", value: "fuzhou" as Region },
			{ label: "厦门市", value: "xiamen" as Region },
			{ label: "泉州市", value: "quanzhou" as Region },
			{ label: "漳州市", value: "zhangzhou" as Region },
		],
	},
	{
		label: "安徽省",
		options: [
			{ label: "合肥市", value: "hefei" as Region },
			{ label: "芜湖市", value: "wuhu" as Region },
			{ label: "蚌埠市", value: "bengbu" as Region },
			{ label: "安庆市", value: "anqing" as Region },
		],
	},
	{
		label: "江西省",
		options: [
			{ label: "南昌市", value: "nanchang" as Region },
			{ label: "赣州市", value: "ganzhou" as Region },
			{ label: "九江市", value: "jiujiang" as Region },
			{ label: "上饶市", value: "shangrao" as Region },
		],
	},
	{
		label: "东北地区",
		options: [
			{ label: "沈阳市", value: "shenyang" as Region },
			{ label: "大连市", value: "dalian" as Region },
			{ label: "长春市", value: "changchun" as Region },
			{ label: "哈尔滨市", value: "harbin" as Region },
			{ label: "大庆市", value: "daqing" as Region },
		],
	},
	{
		label: "西部地区",
		options: [
			{ label: "昆明市", value: "kunming" as Region },
			{ label: "贵阳市", value: "guiyang" as Region },
			{ label: "太原市", value: "taiyuan" as Region },
			{ label: "兰州市", value: "lanzhou" as Region },
			{ label: "西宁市", value: "xining" as Region },
			{ label: "银川市", value: "yinchuan" as Region },
			{ label: "乌鲁木齐市", value: "urumqi" as Region },
			{ label: "拉萨市", value: "lhasa" as Region },
		],
	},
	{
		label: "其他地区",
		options: [
			{ label: "呼和浩特市", value: "hohhot" as Region },
			{ label: "南宁市", value: "nanning" as Region },
			{ label: "海口市", value: "haikou" as Region },
			{ label: "三亚市", value: "sanya" as Region },
			{ label: "香港特别行政区", value: "hongkong" as Region },
			{ label: "澳门特别行政区", value: "macau" as Region },
			{ label: "台北市", value: "taipei" as Region },
			{ label: "其他", value: "other" as Region },
		],
	},
];

// 扁平化的地区选项（用于简单的Select组件）
export const REGION_OPTIONS_FLAT = Object.entries(REGION_LABELS).map(
	([value, label]) => ({
		label,
		value: value as Region,
	}),
);

// 类型选项
export const TYPE_OPTIONS: Array<{ label: string; value: BlacklistType }> = [
	{ label: "用户", value: "user" },
	{ label: "IP", value: "ip" },
	{ label: "邮箱", value: "email" },
	{ label: "手机号", value: "phone" },
	{ label: "公司", value: "company" },
	{ label: "域名", value: "domain" },
	{ label: "其他", value: "other" },
];

// 风险等级选项
export const RISK_LEVEL_OPTIONS: Array<{ label: string; value: RiskLevel }> = [
	{ label: "低", value: "low" },
	{ label: "中", value: "medium" },
	{ label: "高", value: "high" },
];

// 状态选项
export const STATUS_OPTIONS: Array<{ label: string; value: BlacklistStatus }> =
	[
		{ label: "草稿", value: "draft" },
		{ label: "待复核", value: "pending" },
		{ label: "已发布", value: "published" },
		{ label: "已退回", value: "rejected" },
		{ label: "已撤销", value: "retracted" },
	];

// 获取来源的显示文本
export function getSourceLabel(source?: SourceType): string {
	if (!source) return "未知";
	return SOURCE_LABELS[source] || "未知";
}

// 获取理由码的显示文本
export function getReasonCodeLabel(reasonCode?: ReasonCode): string {
	if (!reasonCode) return "未知";
	return REASON_CODE_LABELS[reasonCode] || reasonCode;
}

// 获取地区的显示文本
export function getRegionLabel(region?: Region): string {
	if (!region) return "未知";
	return REGION_LABELS[region] || region;
}
