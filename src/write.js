import { getTranslator } from "./util";

const translator = getTranslator()
await translator.createTranslatedSrt();
console.log("已生成翻译后的 SRT 文件:", translator.translatedSrtPath);