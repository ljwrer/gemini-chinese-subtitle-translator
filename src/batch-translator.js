import {robot} from "./robot";
import {shortStringify} from "./util";

export class BatchTranslator {
  batchSize = 400;

  constructor(translator) {
    this.translator = translator;
  }

  buildBatchFilePath(index) {
    return `cache/${this.translator.name}/batch-${index}.json`;
  }

  async translate(jsonStr) {
    const list = JSON.parse(jsonStr);
    const batches = [];
    const taskLength = Math.ceil(list.length / this.batchSize);
    for (let i = 0; i < taskLength; i++) {
      const start = i * this.batchSize;
      const end = start + this.batchSize;
      const batch = list.slice(start, end);
      const batchStr = shortStringify(batch);
      const batchFilePath = this.buildBatchFilePath(i);
      const file = Bun.file(batchFilePath);
      const exists = await file.exists();
      if (exists) {
        console.log(`批次文件已存在，跳过翻译: ${batchFilePath}`);
        const batchContent = await file.text();
        const batchChunk = await this.safeParseJson(batchContent, batchFilePath);
        batches.push(...batchChunk);
        continue;
      }
      console.log(`开始翻译第 ${i + 1} 批: ${batchFilePath}`);
      const translatedStr = await robot.translate(batchStr);
      await Bun.write(batchFilePath, translatedStr);
      const translatedList = await this.safeParseJson(translatedStr, batchFilePath);
      batches.push(...translatedList);
      console.log(`已生成第 ${i + 1} 批翻译文件: ${batchFilePath}`);
    }
    console.log(`所有批次翻译完成，共 ${batches.length} 条记录`);
    const batchJson = shortStringify(batches);
    return batchJson;
  }

  async safeParseJson(text, filePath) {
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error(err);
      console.warn(`⚠️ JSON 解析失败，尝试调用 AI 修复...`);
      const fixed = await robot.fix(text);
      try {
        const parsed = JSON.parse(fixed);
        // ✅ 保存修复后的内容到缓存文件
        if (filePath) {
          await Bun.write(filePath, shortStringify(parsed));
          console.log(`已将修复后的 JSON 覆盖保存到: ${filePath}`);
        }
        return parsed;
      } catch (err2) {
        console.error(err2);
        console.error(`❌ 修复后的 JSON 仍然解析失败！`);
        console.error(`请手动检查修复后的结果，缓存文件中已保存原始内容。`);
        throw new Error("JSON 无法自动修复，请手工干预");
      }
    }
  }


  async mergeBatches() {
    const mergedList = [];
    let index = 0;
    while (true) {
      const batchFilePath = this.buildBatchFilePath(index);
      try {
        const batchFile = Bun.file(batchFilePath);
        const batchContent = await batchFile.json();
        mergedList.push(...batchContent);
        index++;
      } catch (error) {
        if (error.code === "ENOENT") {
          break; // No more batches
        }
        throw error; // Other errors
      }
    }
    await Bun.write(
      `cache/${this.translator.name}/merged.json`,
      shortStringify(mergedList)
    );
    return mergedList;
  }
}
