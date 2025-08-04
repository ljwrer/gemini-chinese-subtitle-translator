import { getTranslator } from "./util";

const translator = getTranslator()
console.log("开始解析字幕文件:", translator.name);
await translator.createOriginSimpleJson();
console.log("已生成原始字幕简化 JSON 文件:", translator.originJsonPath);