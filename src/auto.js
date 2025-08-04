import { getTranslator } from "./util.js";
import { BatchTranslator } from "./batch-translator.js";

const run = async () => {
    const translator = getTranslator();
    const batchTranslator = new BatchTranslator(translator);
    const jsonStr = await translator.createOriginSimpleJson();
    console.log("已生成原始字幕简化 JSON 文件:", translator.originJsonPath);
    const text = await batchTranslator.translate(jsonStr);
    await Bun.write(translator.translatedJsonPath, text);
    console.log("已生成翻译后的 JSON 文件:", translator.translatedJsonPath);
    await translator.createTranslatedSrt();
    console.log("已生成翻译后的 SRT 文件:", translator.translatedSrtPath);
}

await run().catch((err) => {
    console.error("运行出错:", err);
    process.exit(1);
});