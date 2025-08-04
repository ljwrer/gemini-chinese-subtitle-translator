import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

class Robot {
  static batchSize = 400;

  async buildPrompt(template, jsonStr) {
    const head = await Bun.file(`prompts/${template}.txt`).text();
    const systemPrompt = `${head}
\`\`\`json
${jsonStr}
\`\`\`
`;
    return systemPrompt;
  }

  async buildTranslatePrompt(jsonStr) {
    return this.buildPrompt("translate", jsonStr);
  }

  async buildFixPrompt(jsonStr) {
    return this.buildPrompt("fix", jsonStr);
  }


  async callGemini(prompt) {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });
    const text = response.text
    const time = new Date().toISOString().replace(/[:.]/g, "-");
    await Bun.write(`cache/${time}.txt`, text);
    const match = text.match(/```json([\s\S]+?)```/);
    const jsonText = match ? match[1].trim() : text.trim();
    return jsonText;
  }

  async fix(jsonStr) {
    const prompt = await this.buildFixPrompt(jsonStr);
    const fixedText = await this.callGemini(prompt);
    return fixedText;
  }


  async translate(jsonStr) {
    const prompt = await this.buildTranslatePrompt(jsonStr);
    const translatedText = await this.callGemini(prompt);
    return translatedText;
  }
}

export const robot = new Robot();
