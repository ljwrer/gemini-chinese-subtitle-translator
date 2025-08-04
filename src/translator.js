import * as path from "node:path";
import SrtParser2 from "srt-parser-2";
import { getCleanContent, shortStringify } from "./util.js";

const parser = new SrtParser2();

export class Translator {
  constructor(name) {
    this.name = name;
  }

  get dataPath() {
    return path.join("data", this.name);
  }

  get originSrtPath() {
    return path.join(this.dataPath, "origin.srt");
  }

  get originJsonPath() {
    return path.join(this.dataPath, "origin.json");
  }

  get translatedJsonPath() {
    return path.join(this.dataPath, "translated.json");
  }

  get translatedSrtPath() {
    return path.join(this.dataPath, "translated.srt");
  }

  async readOriginSrtAsList() {
    const srtFile = Bun.file(this.originSrtPath);
    const srt = await srtFile.text();
    const srtOriginList = parser.fromSrt(srt);
    srtOriginList.forEach((item) => {
      item.text = getCleanContent(item.text);
    });
    return srtOriginList;
  }

  async createOriginSimpleJson() {
    const list = await this.readOriginSrtAsList();
    const simpleList = list.map((item) => {
      return {
        id: item.id,
        text: item.text,
      };
    });
    const json = shortStringify(simpleList, { maxLength: 200 });
    await Bun.write(this.originJsonPath, json);
    return json;
  }

  async createTranslatedSrt() {
    const translatedJsonFile = Bun.file(this.translatedJsonPath);
    const translatedJson = await translatedJsonFile.json();
    const translatedMap = new Map(
      translatedJson.map((item) => [item.id, item.text])
    );
    const srtOriginList = await this.readOriginSrtAsList();
    srtOriginList.forEach((item) => {
      const id = item.id;
      if (translatedMap.has(id)) {
        const engText = item.text;
        const zhText = translatedMap.get(id);
        item.text = `${zhText}\n${engText}`;
      }
    });
    const srt = parser.toSrt(srtOriginList);
    Bun.write(this.translatedSrtPath, srt);
  }
}
