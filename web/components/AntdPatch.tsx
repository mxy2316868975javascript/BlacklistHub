"use client";

// 这个组件的唯一目的是确保 Ant Design React 19 兼容性补丁被加载
// 必须在任何 Ant Design 组件之前导入
import "@ant-design/v5-patch-for-react-19";

export default function AntdPatch() {
	return null;
}
