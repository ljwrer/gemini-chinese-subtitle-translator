import stringify from "json-stringify-pretty-compact";
import { Translator } from "./translator.js";

export const getCleanContent = (content) => {
  return content.replace(/\n/g, " ");
};

export const getTranslator = () => {
  // 读取命令行参数
  const args = process.argv.slice(2); // 跳过 node 和脚本路径
  const movieName = args[0]; // 第一个参数是名称
  if (!movieName) {
    throw new Error("请提供电影目录名");
  }
  const translator = new Translator(movieName);
  return translator;
};


export const shortStringify = (obj) => stringify(obj, { maxLength: 200 });