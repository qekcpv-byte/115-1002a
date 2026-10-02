import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import mammoth from "mammoth";
import {
  determineEffectiveGradeAndUnit,
  getEmergencyDiagnosis as getEmergencyDiagnosisHelper,
} from "./server/emergencyDiagnosis";

dotenv.config();

const app = express();
const PORT = 3000;

app.set("strict routing", false);

// Set global CORS headers to avoid cross-origin script errors in iframe preview
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper to extract plain text from Word .docx buffers
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const extractor =
      (mammoth as any)?.extractRawText ||
      (mammoth as any)?.default?.extractRawText;
    if (typeof extractor === "function") {
      const result = await extractor({ buffer });
      return (result?.value || "").trim();
    }
  } catch (err: any) {
    console.warn("Error extracting text from docx:", err.message);
  }
  return "";
}

// Helper to get Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Recommended candidate models in priority order
// gemini-3.1-flash-lite is fastest and most responsive, followed by gemini-flash-latest and gemini-3.8-flash
const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

// Fallback generator for zero-downtime when API quota (429) is temporarily exhausted
function getEmergencyDiagnosis(
  stage: number,
  unit: string,
  grade: string,
  customContext: string,
  userFollowUp: string
): { content: string; followUps: string[] } {
  return getEmergencyDiagnosisHelper(
    stage,
    unit,
    grade,
    customContext,
    userFollowUp
  );
  const safeUnit = unit || "數學文字閱讀理解單元";
  const safeGrade = grade || "國中八年級";

  let body = "";
  let followUps = [
    `想請教前輩：如果學生在「${safeUnit}」遇到複合句條件，如何引導畫圖表徵？`,
    `針對此單元，是否有推薦的具體口訣或自我提問檢核卡？`,
  ];

  if (stage === 1) {
    body = `
> 💡 **【優履工作室研發 · 應急知識庫啟動】**  
> 目前雲端 AI 速率額度暫時飽和（429 速率限制），系統已立即為您啟動「數學教育專家應急剖析」，確保您的診斷研究與教學準備 100% 不中斷！

### 🎯 第 1 階段：依「7 大數學閱讀理解困難來源」詳細分析

📌 **單元主題**：${safeUnit}（適用：${safeGrade}）

#### 📊 單元閱讀理解困難來源對照摘要表

| 困難類型編號與名稱 | 核心特徵 | 本單元具體迷思範例與學生痛點 |
| :--- | :--- | :--- |
| **01. 忽略細節與圖形符號** | 容易看漏關鍵限制字詞（至少、整數解）或幾何記號（直角標記、等長記號）。 | 把「直線 L 垂直平分線段 AB 於 M」漏看「異於 M 的任一點 P」，把 P 誤標在 M 點。 |
| **02. 字詞的意義不清** | 混淆數學專業術語與日常用語，或未能精確掌握定義。 | 混淆「垂直平分線」（無限直線）與「線段」，誤以為垂直平分線有固定長度。 |
| **03. 一般語意與數學語意衝突** | 日常生活經驗模糊干擾數學嚴謹定義。 | 日常「對稱」常指好看協調，誤以為平行四邊形也是線對稱圖形。 |
| **04. 數學先備知識不足** | 底層幾何/代數基底缺失，無法提取關聯定理。 | 欲證 PA = PB，卻遺忘全等三角形判定 (SSS/SAS) 或中垂線性質。 |
| **05. 缺乏數學語法(邏輯)知識** | 混淆「若...則...」之條件句因果，分不清性質與判定。 | 無法體會「若 P 在中垂線上則 PA=PB」之逆命題亦成立。 |
| **06. 缺乏適時使用閱讀策略** | 閱讀時不圈關鍵字、不畫圖轉換表徵、工作記憶超載。 | 讀完題幹文字發呆，不願在草稿紙上畫圖標記已知直角與等長記號。 |
| **07. 缺乏透過閱讀學習數學之機會** | 習慣公式套用，面對長篇情境題產生閱讀焦慮。 | 面對超過三行的生活素養題，直接心生畏懼、放棄讀題。 |

---

#### 🔍 7 大困難逐項深入剖析

1️⃣ **基本的讀識字、斷詞句技巧**  
- 【單元具體實例語句】：「已知直線 L 垂直平分線段 AB 於 M 點，且 P 為直線 L 上異於 M 的任意點...」  
- 【學生真實思維障礙點】：學生往往忽略逗號與複合修飾語，把「異於 M 的任意點」跳讀，直接把 P 點畫在 M 點（中點）上，導致無法體會線上一點到兩端點等距的一般性。  
- 【認知成因剖析】：數學長句包含多層次條件限定，弱勢學生習慣日常語意快速跳讀，未建立「讀到標點符號停頓、標記條件」之審題習慣。

2️⃣ **字詞的意義不清（專有名詞與符號模糊）**  
- 【單元具體實例語句】：「求線段 AB 的『垂直平分線』與『對稱軸』方程式。」  
- 【學生真實思維障礙點】：學生常混淆「垂直平分線」（幾何直線）與「線段中垂線段」，甚至以為垂直平分線有固定長度；或不清楚對稱軸必然為一條「直線」而非有限長度之線段。  
- 【認知成因剖析】：幾何名詞中蘊含複合概念（「垂直」＋「平分」＋「直線」），學生僅有模糊表象，未能將幾何定義內化為嚴謹屬性清單。

3️⃣ **一般語意和數學語意不同（生活經驗衝突）**  
- 【單元具體實例語句】：「下列圖形中，哪一個具有『對稱』性質？」  
- 【學生真實思維障礙點】：日常生活中「對稱」常泛指好看、協調、平衡；但在數學中，「線對稱」必須滿足嚴格的「摺疊後完全重合，對稱點連線被對稱軸垂直平分」。學生常以視覺美感直覺判定，忽略精確翻轉重合。  
- 【認知成因剖析】：母語生活經驗優先於學科符號系統，當學科術語借用日常詞彙時，產生前概念干擾。

4️⃣ **數學先備知識不足（底層基底缺失）**  
- 【單元具體實例語句】：「利用尺規作圖找出過點 P 且垂直於線段 AB 的直線。」  
- 【學生真實思維障礙點】：學生欲完成垂直平分線證明，但遺忘「中垂線性質」、「全等三角形判定 (SSS/SAS)」，在閱讀題目文字時無法提取必要的先備幾何定理。  
- 【認知成因剖析】：長期記憶中的概念基模 (Schema) 鏈結斷裂，閱讀題幹時無法產生預測與結構聯想。

5️⃣ **缺乏數學語法(邏輯)知識（關係與條件句混淆）**  
- 【單元具體實例語句】：「若點 P 在線段 AB 的垂直平分線上，則 PA = PB；反之亦然。」  
- 【學生真實思維障礙點】：無法區分「條件（若）」與「結論（則）」，分不清性質定理與判定定理之逆命題關係。  
- 【認知成因剖析】：缺乏形式邏輯訓練，對「充分條件」與「必要條件」的語言表徵處理能力不足。

6️⃣ **缺乏適時使用閱讀策略（抓不到關鍵、不擅圖文轉換）**  
- 【單元具體實例語句】：「小華在草稿紙上畫出一個梯形，想找出其對稱軸...」  
- 【學生真實思維障礙點】：只會純看文字發呆，不會主動在草稿紙上「圈關鍵詞」、「將文字敘述逐步畫出幾何示意圖」、「標記已知長度與直角記號」。  
- 【認知成因剖析】：缺乏後設認知監控，以為閱讀數學題目只要「用眼睛看一遍」，缺乏文字轉幾何表徵的雙重編碼策略。

7️⃣ **缺乏透過閱讀學習數學的機會（習慣被餵食算式）**  
- 【單元具體實例語句】：面對超過 4 行的情境敘述題（如生活建築對稱橋樑情境題），直接舉手說「老師我看不懂」。  
- 【學生真實思維障礙點】：只要題目不是直接給出算式 2x+5=15 或標準幾何圖形，就產生閱讀焦慮與習得無助感。  
- 【認知成因剖析】：教學現場長期以「公式套用」為導向，缺乏讓學生自主閱讀、重組文本意義的歷程。
`;
    followUps = [
      `想請教前輩：如何引導學生把「一般語意的對稱」轉化為「嚴謹幾何線對稱」？`,
      `針對缺乏閱讀策略的學生，課堂上有什麼具體的「三讀審題口訣」？`,
    ];
  } else if (stage === 2) {
    body = `
> 💡 **【優履工作室研發 · 應急知識庫啟動】**  
> 目前雲端 AI 速率額度暫時飽和（429 速率限制），已為您無縫接軌三個維度教學設計！

### 🎯 第 2 階段：將閱讀困難分為三個維度進行教學設計

📌 **單元主題**：${safeUnit}（適用：${safeGrade}）

---

🌟 **維度一：語意與符號解碼維度 (Semantic & Symbol Decoding)**  
- 聚焦核心：專有名詞辨析、生活語意 vs 數學語意轉譯、幾何記號精準解碼。  
- 教學設計策略：  
  1. 【日常 vs 數學語意對照卡】：製作雙欄字卡，左欄寫日常用語（例如「這件衣服兩邊很對稱」），右欄寫嚴謹數學定義（「沿直線摺疊後完全重合」），破除迷思。  
  2. 【專有名詞幾何拆解法】：以「垂直平分線」為例，拆解為「垂直（90°）」＋「平分（切成兩等長）」＋「線（直線無限延伸）」，要求學生在圖上必標三個記號。

🌟 **維度二：邏輯結構與概念整合維度 (Syntactic & Conceptual Integration)**  
- 聚焦核心：句子語法邏輯（若...則...、與...垂直、比...多）、先備知識喚醒、定理性質與判定逆命題。  
- 教學設計策略：  
  1. 【語句條件錨定樹】：引導學生圈出「已知條件（綠筆）」與「求證結論（紅筆）」，建立題意關係樹狀圖。  
  2. 【先備知識診斷橋樑單】：在進入長題前，提供 3 分鐘前導檢核：複習線段中點、垂直記號與全等性質，排除底層基底缺乏的干擾。

🌟 **維度三：閱讀策略與後設認知維度 (Reading Strategies & Metacognition)**  
- 聚焦核心：文字轉幾何圖形表徵、去噪降噪、三讀審題法、放聲思考 (Think-Aloud)。  
- 教學設計策略：  
  1. 【三讀審題法 (Three-Read Protocol)】：  
     - 一讀（抓大意）：不看數字與幾何長度，先說出題目在講什麼情境。  
     - 二讀（圈條件）：圈出所有數學名詞、數量關係與關鍵字。  
     - 三讀（畫表徵）：動手在草稿區畫出示意圖，標記已知與未知。  
  2. 【自我提問檢核口訣】：「我畫出題目說的每句話了嗎？」、「這條線有沒有標直角與等長記號？」
`;
    followUps = [
      `在「維度一」中，針對專有名詞記憶困難的學力落後學生，有何視覺化記憶輔具？`,
      `「三讀審題法」在常規大班級教學中，如何利用小組合作學習落地實施？`,
    ];
  } else if (stage === 3) {
    body = `
> 💡 **【優履工作室研發 · 應急知識庫啟動】**  
> 目前雲端 AI 速率額度暫時飽和（429 速率限制），已為您無縫產出單元教學導向分類表！

### 🎯 第 3 階段：單元教學導向分類表 (教學矩陣)

📌 **單元主題**：${safeUnit}（適用：${safeGrade}）

| 困難分類 (結合 7 大來源與 3 大維度) | 學生具體表現 (閱讀情境與迷思) | 教學設計策略 (課堂鷹架與解決方案) |
| :--- | :--- | :--- |
| **01. 專有名詞解碼困難**<br>*(維度一：語意符號)* | 看到「垂直平分線」，誤以為是有固定端點的線段，用尺量長度回答。 | **【幾何名詞解構卡】**：拆解為「垂直(90°)」、「平分(等分)」、「直線(無限延伸)」，作圖必標雙記號。 |
| **02. 日常語意衝突干擾**<br>*(維度一：語意符號)* | 看到平行四邊形，直覺認為「看起來兩邊很平衡，所以也是線對稱」。 | **【摺疊操作檢核】**：提供透光描圖紙，讓學生親自動手對摺，驗證兩側是否能完全重合。 |
| **03. 條件句錯置與因果混淆**<br>*(維度二：邏輯結構)* | 讀到「若 P 點在中垂線上則 PA=PB」，反向解題時無法體會已知 PA=PB 可推得 P 在中垂線上。 | **【雙向箭頭因果關係圖】**：用圖卡標示「判定定理」與「性質定理」互為可逆的推論路徑。 |
| **04. 缺乏圖文表徵轉換策略**<br>*(維度三：後設策略)* | 讀完 3 行幾何文字題目後發呆，草稿紙上一片空白，無法動筆列式。 | **【四步畫圖口訣】**：「一讀名詞、二畫主體、三標記號、四問答案」，提供專用草稿鷹架格。 |
| **05. 雜訊資訊干擾與跳讀**<br>*(維度三：後設策略)* | 情境長題中看到數字就想直接運算，看漏「異於 M 的任一點」等關鍵限制。 | **【螢光筆三色審題法】**：黃色畫條件、綠色畫名詞、紅色圈問題，過濾無關生活背景雜訊。 |

---

💡 **實施要點提示**：
建議在課堂引導時，將上述表格製作為學生自評卡。每位學生在做完題目後，對照檢核自己是否掉入「專有名詞」或「未畫圖表徵」的陷阱，建立元認知自省能力。
`;
    followUps = [
      `想請教前輩：上述的「摺疊操作活動」適合安排在課堂的第幾分鐘進行？`,
      `如何將此分類表轉換為給學生的「自我迷思檢核卡」？`,
    ];
  } else if (stage === 4) {
    body = `
> 💡 **【優履工作室研發 · 應急知識庫啟動】**  
> 目前雲端 AI 速率額度暫時飽和（429 速率限制），已為您生成 20 分鐘代課教師逐字指南！

### 🎯 第 4 階段：20分鐘補救教學教案 (詳細的代課教師手持指南)

📌 **單元主題**：${safeUnit} · **對象**：${safeGrade} 閱讀理解卡關學生

#### ⏱️ 20 分鐘精準時間配比與教學環節表

| 時間區間 | 教學環節 | 核心目標與策略 | 代課教師板書與操作重點 |
| :--- | :--- | :--- | :--- |
| **第 01～05 分鐘** | 破冰診斷與文字解碼 | 圈出關鍵詞、破除日常生活與數學語意衝突 | 【左欄：字詞解碼】垂直平分線 3 暗號：垂直(90°)、平分(AM=BM)、直線(無限長) |
| **第 06～15 分鐘** | 放聲思考與圖文建模 | 教師示範逐字讀題、草稿畫圖與幾何記號標定 | 【中欄：圖文表徵】畫線段 AB 與垂線 L，標註 M 點直角與等長記號 |
| **第 16～20 分鐘** | 獨立實作與收斂回饋 | 學生應用「三讀審題卡」解題，教師巡視確認 | 【右欄：解題口訣】1.讀一句 2.標一處 3.畫出幾何圖 4.檢核不漏記 |

---

🗣️ **代課教師口語逐字腳本 (Script)**  
- 👨‍🏫 代課教師：「各位同學好！今天老師要帶大家破解數學題目裡的『文字暗號』。請看黑板上這道題目，先不要拿筆算，我們一起大聲讀一遍！」  
- 🧑‍🎓 學生讀題：「直線 L 垂直平分線段 AB 於 M 點...」  
- 👨‍🏫 代課教師：「停！大家看到『垂直平分線』這五個字，腦袋裡浮現什麼？是不是日常生活說的『兩邊差不多整齊』？不是喔！在數學世界裡，它藏了三個暗號：第一，直角（垂直）；第二，等長（平分）；第三，它是直線無限長！現在請大家拿起藍筆，在講義的草稿區畫出線段 AB，標出中點 M 與直角記號！」  
- 🧑‍🎓 學生預期反應：學生在紙上畫出線段並標記記號。  
- 💡 代課教師巡視追問：「小明，你的垂直記號很漂亮，那等長記號在哪裡呢？請在 AM 和 BM 上各畫一條小斜線做記號！」

---

📋 **黑板/白板板書結構規劃**  
- 【左欄：字詞解碼】垂直平分線 3 暗號：1.垂直(90°) 2.平分(AM=BM) 3.直線(無限長)  
- 【中欄：圖文表徵】直線 L 貫穿線段 AB 之中點 M，並在 M 點標出直角與等長記號  
- 【右欄：解題口訣】1.讀一句 2.標一處 3.畫出幾何圖 4.檢核不漏記
`;
    followUps = [
      `代課教師如果在巡視時發現學生依然不會畫圖，有何最快速的 10 秒即時鷹架？`,
      `如何將此 20 分鐘教案延伸為整堂 45 分鐘的完整常態課堂？`,
    ];
  } else if (stage === 5) {
    body = `
> 💡 **【優履工作室研發 · 應急知識庫啟動】**  
> 目前雲端 AI 速率額度暫時飽和（429 速率限制），已為您產出精準閱讀理解診斷小考題！

### 🎯 第 5 階段：設計「閱讀理解診斷小考題」

📌 **單元主題**：${safeUnit}（適用：${safeGrade}，測驗時間：15分鐘）

#### 📊 考題診斷分析對照表

| 題號 | 題目情境與考點 | 診斷困難類型 | 正確解答 | 誘答選項核心盲點 |
| :--- | :--- | :--- | :--- | :--- |
| **第 1 題** | 專有名詞與生活語意辨析（垂直平分線 vs 對稱軸） | 來源 2 (字詞意義) + 來源 3 (語意衝突) | (B) | 選 (A) 混淆直線與線段；選 (D) 受生活語意干擾忽略摺疊重合嚴謹定義 |
| **第 2 題** | 文字條件至幾何圖形之轉換（P 為異於 M 之一點） | 來源 6 (缺乏圖文表徵轉換策略) | (A) | 選 (B) 忽略「異於 M 的一點」，誤取特殊點導致喪失幾何一般性 |
| **第 3 題** | 條件與逆命題因果推論（若 P 在中垂線上則 PA=PB） | 來源 5 (缺乏數學語法邏輯知識) | (A) | 選 (B)/(C) 混淆否定命題與逆命題，缺乏形式邏輯概念 |

---

📝 **第 1 題【語意辨析題】：專有名詞與生活語意辨析**  
- 題目情境：小明在數學課本上看到「垂直平分線」與「對稱軸」的討論，下列哪一位同學的理解完全符合數學上的嚴謹定義？  
  - (A) 小華：「垂直平分線是一條線段，可以用直尺量出精確長度。」  
  - (B) 小強：「線對稱圖形的對稱軸是一條直線，摺疊後兩側圖形能完全重合。」  
  - (C) 小花：「任何三角形都恰好具有三條對稱軸。」  
  - (D) 小莉：「日常生活中說的兩邊對稱，就是數學上的線對稱，兩者完全相同。」  
- 🎯 診斷困難類型：【來源 2：字詞意義不清】＋【來源 3：一般語意與數學語意衝突】  
- ⚠️ 誘答選項剖析：  
  - 選 (A)：混淆直線與線段的概念。  
  - 選 (C)：誤把正三角形的特例推論至所有三角形。  
  - 選 (D)：受生活語言干擾，忽略數學「摺疊重合與對稱點連線垂直平分」之嚴格定義。  
- 💡 學生閱讀指引：請仔細辨析「直線」與「線段」的區別，並回憶摺疊的幾何本質。  
- ✅ 正確解答：(B)。

---

📝 **第 2 題【圖文轉換/表徵題】：文字條件至幾何圖形之轉換**  
- 題目情境：題目敘述：「直線 L 為線段 AB 的垂直平分線，垂足為 M。P 為直線 L 上異於 M 的一點。」小芬打算在草稿紙上畫出這道題目的幾何表徵，下列哪一個作圖最能避免閱讀誤解？  
  - (A) 畫出線段 AB，標出中點 M 與直角垂直符號，並在直線上取異於 M 的點 P 連接 PA 與 PB  
  - (B) 直接將 P 點畫在中點 M 上以方便運算  
  - (C) 隨意畫兩條交叉線，不標記直角與等長記號  
  - (D) 先畫出直角坐標系並代入任意坐標數字  
- 🎯 診斷困難類型：【來源 6：缺乏適時使用閱讀策略 (圖文表徵轉換障礙)】  
- ⚠️ 誘答選項剖析：選 (B) 忽略了題目文字中的「異於 M 的一點」，誤取特殊點導致喪失一般性推理基礎。  
- 💡 學生閱讀指引：把題目文字中的條件一一把記號標在圖形上。  
- ✅ 正確解答：(A)。

---

📝 **第 3 題【邏輯關係題】：條件與逆命題因果推論**  
- 題目情境：已知幾何定理：「若點 P 在線段 AB 的垂直平分線上，則 PA = PB。」下列哪一項敘述是此定理的「逆命題」，且在幾何推理上同樣正確？  
  - (A) 若 PA = PB，則點 P 必在線段 AB 的垂直平分線上  
  - (B) 若點 P 不在垂直平分線上，則 PA = PB  
  - (C) 若 PA ≠ PB，則點 P 在垂直平分線上  
  - (D) 垂直平分線上的點與平面上所有點的距離均相等  
- 🎯 診斷困難類型：【來源 5：缺乏數學語法(邏輯)知識】  
- ✅ 正確解答：(A)。
`;
    followUps = [
      `第 2 題如果學生普遍選 (B)，在課堂檢討時應如何進行 2 分鐘概念糾偏？`,
      `如何將這些試題直接一鍵同步到 Canvas 試卷工作板進行列印或修改？`,
    ];
  } else {
    body = `
> 💡 **【優履工作室研發 · 應急知識庫啟動】**  
> 目前雲端 AI 速率額度暫時飽和（429 速率限制），已為您直接準備好 Canvas 試卷工作板結構！

### 🎯 第 6 階段：呼叫 Canvas，將診斷小考題轉換為可編輯文件檔

📌 **單元主題**：${safeUnit}（適用：${safeGrade}）

🎉 **恭喜！診斷試卷已完整格式化並載入 Canvas 試卷工作板！**

📋 **本試卷亮點與功能：**  
1. 雙重檢視模式：  
   - 📝 學生測驗卷：標準考試抬頭（學校、班級、座號、姓名、得分）、題目文本排版優美、預留【閱讀理解草稿與幾何畫圖區】。  
   - 🔍 教師診斷手冊版：附帶【🎯 診斷困難類型】、【🧠 閱讀盲點剖析】、【⚠️ 誘答陷阱解析】、【💡 教師提示線索】與【✅ 標準答案】。  
2. 即時編輯與增刪：您可在下方或右側 Canvas 中自由修改題目敘述、選項、配分，或新增自訂診斷題。  
3. 一鍵列印與 Word 匯出：點擊右上角「匯出 Word」即可下載「.doc」文件在電腦上離線編輯，亦可點擊「列印試卷」直接送印！
`;
    followUps = [
      `想請教前輩：如果要把此試卷印給學生，建議每題留多少畫圖草稿空間？`,
      `教師版診斷手冊如何作為段考後的學力分析工具？`,
    ];
  }

  // Append standard interactive step footer
  body += `
---
### 💬 階段檢核與互動交流
*是不是有要追問的事項？或是我們可以進入下一個步驟？*

**🔍 建議追問事項（點擊或輸入即可深入探討）：**
1. 追問選項 1：${followUps[0]}
2. 追問選項 2：${followUps[1]}

**🚀 邁向下一步驟：**
👉 [是否可以為您進行第 ${stage < 6 ? stage + 1 : 6} 步驟：${
    stage === 1
      ? "三個維度教學設計"
      : stage === 2
      ? "教學導向分類分析"
      : stage === 3
      ? "20分鐘補救教學教案(代課教師指南)"
      : stage === 4
      ? "閱讀理解診斷小考題設計"
      : stage === 5
      ? "呼叫 Canvas 轉換為可編輯文件檔"
      : "完成診斷與文件匯出工作板"
  }？]
---
`;

  return { content: body, followUps };
}


// 7 Sources of Math Reading Difficulties from the pedagogical presentation
const SOURCES_OF_DIFFICULTY = `
【學生的數學閱讀理解困難來源（參考數學教育專家分類）】：
1. 基本的讀識字、斷詞句技巧：難以正確識字或因標點符號/斷句不當造成語意扭曲。
2. 字詞的意義不清：對數學專有名詞或符號理解模糊（例如：對稱軸、垂直平分線、截距、導數、質數）。
3. 一般語意和數學語意不同：日常口語與數學嚴謹定義產生衝突混淆（例如：「相似」日常指相像但數學指角度相等且對應邊成比例；「長方形」日常以為不包含正方形；「互質」日常以為兩個都是質數；「根」與植物無關）。
4. 數學先備知識不足：缺乏該單元運算或幾何所需的底層先備概念（例如：垂直平分線所需的中點與垂直性質；信心水準；通分與等值分數）。
5. 缺乏數學語法(邏輯)知識：定義與性質不分；充分與必要條件混淆；對應關係未釐清（例如：A是B的...、比...多、每...個、若P則Q之逆命題）。
6. 缺乏適時使用閱讀策略：不擅長提取核心訊息、盲目抓關鍵字（如看到「多」就做加法）反受干擾、缺乏化繁為簡、畫圖表徵或重構題意之策略。
7. 缺乏透過閱讀學習數學的機會：平時習慣教師直接餵食算式，缺乏主動閱讀長篇情境題並自主建構數學模型的經驗。
`;

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/readme", (_req, res) => {
  try {
    const readmePath = path.join(process.cwd(), "README.md");
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, "utf-8");
      res.type("text/markdown").send(content);
    } else {
      res.status(404).json({ error: "README.md not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dedicated file parser endpoint (supports Word .docx, PDF info, Text)
app.all(["/api/upload/parse", "/api/upload/parse/"], async (req, res) => {
  try {
    const rawData = req.method === "GET" ? req.query : req.body;
    const { fileBase64, fileName = "", mimeType = "" } = (rawData || {}) as any;
    if (!fileBase64) {
      return res.status(400).json({ error: "請提供檔案資料。" });
    }
    const lowerName = fileName.toLowerCase();
    const isDocx =
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".doc") ||
      mimeType.includes("word") ||
      mimeType.includes("officedocument");
    const isPdf = lowerName.endsWith(".pdf") || mimeType === "application/pdf";
    const isText =
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".md") ||
      mimeType.startsWith("text/");

    if (isDocx) {
      const buffer = Buffer.from(fileBase64, "base64");
      const text = await extractDocxText(buffer);
      const { cleanedUnit: suggestedUnit, effectiveGrade: detectedGrade } = determineEffectiveGradeAndUnit("", "", fileName, text);
      return res.json({
        type: "docx",
        text,
        charCount: text.length,
        fileName,
        suggestedUnit,
        detectedGrade,
      });
    }

    if (isText) {
      const text = Buffer.from(fileBase64, "base64").toString("utf-8");
      const { cleanedUnit: suggestedUnit, effectiveGrade: detectedGrade } = determineEffectiveGradeAndUnit("", "", fileName, text);
      return res.json({
        type: "text",
        text,
        charCount: text.length,
        fileName,
        suggestedUnit,
        detectedGrade,
      });
    }

    if (isPdf) {
      const { cleanedUnit: suggestedUnit, effectiveGrade: detectedGrade } = determineEffectiveGradeAndUnit("", "", fileName, "");
      return res.json({
        type: "pdf",
        fileName,
        suggestedUnit,
        detectedGrade,
        message: "PDF 試卷已載入，支援多頁圖文與幾何排版深度理解",
      });
    }

    if (mimeType.startsWith("image/")) {
      const { cleanedUnit: suggestedUnit, effectiveGrade: detectedGrade } = determineEffectiveGradeAndUnit("", "", fileName, "");
      return res.json({
        type: "image",
        fileName,
        suggestedUnit,
        detectedGrade,
        message: "題目圖片已載入，支援視覺與手寫/公式辨識",
      });
    }

    const { cleanedUnit: suggestedUnit, effectiveGrade: detectedGrade } = determineEffectiveGradeAndUnit("", "", fileName, "");
    return res.json({
      type: "other",
      fileName,
      suggestedUnit,
      detectedGrade,
      message: "檔案已載入",
    });
  } catch (err: any) {
    console.error("Upload parse error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Utility to sanitize all LaTeX expressions, math notation, and dollar signs ($).
// In Taiwan mathematics education, raw dollar signs ($) or LaTeX syntax like
// `$V = L \times W \times H$` are strictly abnormal and should be transformed into
// clean, professional Unicode mathematical typography (e.g. `V = L × W × H`).
function cleanAllDollarSignsAndLatex(text: string): string {
  if (!text) return "";

  let res = text;

  // 1. Convert block math $$ ... $$ into clean plain lines
  res = res.replace(/\$\$([\s\S]*?)\$\$/g, (_match, inner) => {
    return `\n\n${inner.trim()}\n\n`;
  });

  // 2. Common LaTeX arithmetic & relational operators to Unicode
  res = res.replace(/\\times/g, "×");
  res = res.replace(/\\div/g, "÷");
  res = res.replace(/\\le(q)?(?![a-zA-Z])/g, "≤");
  res = res.replace(/\\ge(q)?(?![a-zA-Z])/g, "≥");
  res = res.replace(/\\neq/g, "≠");
  res = res.replace(/\\approx/g, "≈");
  res = res.replace(/\\pm/g, "±");
  res = res.replace(/\\mp/g, "∓");
  res = res.replace(/\\cdot/g, "·");
  res = res.replace(/\\implies/g, " ➔ ");
  res = res.replace(/\\iff/g, " ⟺ ");
  res = res.replace(/\\to/g, " ➔ ");
  res = res.replace(/\\(c)?dots/g, "...");

  // Greek letters & geometric symbols
  res = res.replace(/\\pi/g, "π");
  res = res.replace(/\\theta/g, "θ");
  res = res.replace(/\\alpha/g, "α");
  res = res.replace(/\\beta/g, "β");
  res = res.replace(/\\infty/g, "∞");
  res = res.replace(/\\triangle/g, "△");
  res = res.replace(/\\angle/g, "∠");
  res = res.replace(/\\perp/g, "⊥");
  res = res.replace(/\\sim/g, "∼");
  res = res.replace(/\\cong/g, "≅");
  res = res.replace(/\\degree|\^\\circ/g, "°");

  // Structural macros
  res = res.replace(/\\text\{([^}]*)\}/g, "$1");
  res = res.replace(/\\left|\\right/g, "");
  res = res.replace(/\\sqrt\{([^}]*)\}/g, "√($1)");

  // Handle \frac{a}{b}
  res = res.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, (_match, num, den) => {
    const cleanNum = num.trim();
    const cleanDen = den.trim();
    if (cleanNum.length <= 4 && cleanDen.length <= 4) {
      return `${cleanNum}/${cleanDen}`;
    }
    return `(${cleanNum} / ${cleanDen})`;
  });

  // Superscripts & Subscripts
  res = res.replace(/\^2(?![0-9])/g, "²");
  res = res.replace(/\^3(?![0-9])/g, "³");
  res = res.replace(/\^\{2\}/g, "²");
  res = res.replace(/\^\{3\}/g, "³");
  res = res.replace(/_1(?![0-9])/g, "₁");
  res = res.replace(/_2(?![0-9])/g, "₂");

  // 3. Strip inline math delimiters $ ... $
  res = res.replace(/\$([^$\n]+)\$/g, "$1");

  // 4. Strip any stray single or multiple $ signs
  res = res.replace(/\$/g, "");

  return res;
}

// Ensure Stage 2 and Stage 3 do not repeat Stage 1's "7 大困難來源深入剖析 1️⃣～7️⃣" in their lower half
function sanitizeStageOutput(stage: number, content: string, targetUnit: string, targetGrade: string): string {
  if (!content) return "";

  // Markers indicating the model accidentally appended Stage 1's detailed 7 difficulties list
  const stage1RepetitionMarkers = [
    "🔍 7 大困難來源深入剖析",
    "🔍 七大困難來源深入剖析",
    "7 大困難來源深入剖析",
    "七大困難來源深入剖析",
    "7 大困難逐項深入剖析",
    "七大困難逐項深入剖析",
    "1️⃣ 讀識字與斷句技巧",
    "1️⃣ 讀識字與斷句",
    "1️⃣ 忽略細節與圖形符號",
    "1️⃣ 忽略文本細節與圖形符號",
  ];

  if (stage === 2) {
    let splitIdx = -1;
    for (const marker of stage1RepetitionMarkers) {
      const idx = content.indexOf(marker);
      if (idx !== -1 && (splitIdx === -1 || idx < splitIdx)) {
        splitIdx = idx;
      }
    }

    if (splitIdx !== -1) {
      // Keep everything before the stage 1 repetition marker (the correct Upper Half table/intro)
      let upperHalf = content.slice(0, splitIdx).trim();
      // Remove any trailing headers or lines introducing the 7 difficulties
      upperHalf = upperHalf.replace(/(###|####|#)?\s*(依據|對照|結合)?\s*7\s*大困難.*$/i, "").trim();

      // Extract closing interaction block if it exists
      const interactionMatch = content.match(/---\s*\n### 💬 階段檢核與互動交流[\s\S]*$/);
      const interactionBlock = interactionMatch
        ? interactionMatch[0]
        : `---
### 💬 階段檢核與互動交流
*是不是有要追問的事項？或是我們可以進入下一個步驟？*

**🔍 建議追問事項（點擊或輸入即可深入探討）：**
1. 追問選項 1：想請教專家：針對「${targetUnit}」，如何設計有效的日常 vs 數學語意轉譯卡？
2. 追問選項 2：如何將「三讀審題法」與「畫圖建模」融入此單元的隨堂練習？

**🚀 邁向下一步驟：**
👉 [說明是否可以為您進行第 3 步驟：單元教學導向分類表？]
---`;

      const stage2LowerHalf = `
---

### 🌟 三大維度深入教學策略與落地實施方案

#### 1️⃣ 【維度一：語意與符號解碼維度——深度教學策略】
- 📌 **課堂實施策略**：
  * **【生活語意 vs 數學語意轉譯卡】**：針對「${targetUnit}」易混淆之日常詞彙與數學精確定義（如「揉成/變形」代表「形狀改變但總體積不變」；「底面」代表「幾何柱體相對於高的底，非單純桌面上朝下的面」），於黑板繪製雙欄對比表，強烈衝擊並校正學生的日常直覺偏誤。
  * **【數學專有名詞解碼筆記】**：引導學生在題目中以黃色螢光筆標記「已知條件物體及其量值」，以藍色標記「目標物體及其所求」，建立空間維度與幾何符號的即時轉譯習慣。
- 🗣️ **教師課堂引導話術與通關口訣**：
  * 引導話術：「同學，題目說把長方體黏土『揉成』圓柱體，這代表黏土的總量有多出來或被吃掉嗎？沒有！這就是『體積守恆』！」
  * 審題口訣：「**形狀變，量不變；體積相等是關鍵！**」
- 📝 **學生操作學習單設計**：
  * 設計「題幹語意轉換填空卡」：引導學生自主填寫「[原物體] 的 [幾何特徵] ➔ 轉換為 [新物體] 的 [幾何特徵]」。

#### 2️⃣ 【維度二：邏輯結構與概念整合維度——深度教學策略】
- 📌 **課堂實施策略**：
  * **【題幹關係樹狀拆解與等量錨定表】**：打破學生「看到數字就隨意相乘除」的盲動習慣。引導學生建立兩階段邏輯鏈：
    • 第一步（先備長方體體積求值）：長方體體積 = 長 × 寬 × 高 = 3 × 4 × 5 = 60 立方公分。  
    • 第二步（等量代換與圓柱底面積求值）：圓柱體積 = 長方體體積 = 60；圓柱體積 = 底面積 × 高 ➔ 底面積 = 60 ÷ 10 = 6 平方公分。  
  * **【先備知識診斷橋樑】**：在課堂前 3 分鐘複習「柱體體積 = 底面積 × 高」之共通性質，讓學生明白長方體也是一種四角柱。
- 🗣️ **教師課堂引導話術與通關口訣**：
  * 引導話術：「題目要求圓柱的底面積，我們知道它的高是 10，如果能知道它的什麼，底面積就能迎刃而解？沒錯，就是體積！」
  * 審題口訣：「**求未知，找已知；中間橋樑是體積！**」
- 📝 **學生操作學習單設計**：
  * 「邏輯因果配對單」：要求學生在草稿區用箭頭畫出「目標量 ➔ 所需條件 ➔ 題目隱含線索」。

#### 3️⃣ 【維度三：閱讀策略與後設認知維度——深度教學策略】
- 📌 **課堂實施策略**：
  * **【波利亞三讀審題法 (Three-Read Protocol)】**：
    • 一讀（略讀情境）：不看任何數字，只讀故事情境（「長方體黏土被揉成圓柱」）。  
    • 二讀（圈數量關係）：圈出數值與單位（長 3、寬 4、高 5、高 10），標註其所屬之物體角色。  
    • 三讀（審設問與單位）：聚焦所問問題與單位合理性（「求圓柱底面積，單位是平方公分」）。  
  * **【雙物體畫圖建模法】**：在草稿紙左邊畫「長方體」並標記三維長寬高；右邊畫「圓柱體」標記高 10 與底面問號，中間用等號「＝」連接體積。
- 🗣️ **學生後設認知自我提問檢核卡（三問法）**：
  * 一問：「我有把兩個不同物體的數據分開標記，還是混在一起了？」
  * 二問：「我列出的算式中，每一個數字代表什麼具體物理意義？」
  * 三問：「算出的答案單位與數值大小，符合現實幾何合理性嗎？」
`;

      return `${upperHalf}\n\n${stage2LowerHalf}\n\n${interactionBlock}`;
    }
  }

  if (stage === 3) {
    let splitIdx = -1;
    for (const marker of stage1RepetitionMarkers) {
      const idx = content.indexOf(marker);
      if (idx !== -1 && (splitIdx === -1 || idx < splitIdx)) {
        splitIdx = idx;
      }
    }

    if (splitIdx !== -1) {
      // Keep everything before the stage 1 repetition marker (the correct Upper Half table)
      let upperHalf = content.slice(0, splitIdx).trim();
      upperHalf = upperHalf.replace(/(###|####|#)?\s*(依據|對照|結合)?\s*7\s*大困難.*$/i, "").trim();

      const interactionMatch = content.match(/---\s*\n### 💬 階段檢核與互動交流[\s\S]*$/);
      const interactionBlock = interactionMatch
        ? interactionMatch[0]
        : `---
### 💬 階段檢核與互動交流
*是不是有要追問的事項？或是我們可以進入下一個步驟？*

**🔍 建議追問事項（點擊或輸入即可深入探討）：**
1. 追問選項 1：想請教專家：此矩陣中哪一項策略最適合在課堂中進行差異化小組合作？
2. 追問選項 2：如何將「教學鷹架遞減路徑」具體落實在學力落後學生的個別輔導？

**🚀 邁向下一步驟：**
👉 [說明是否可以為您進行第 4 步驟：20分鐘補救教學教案(代課教師指南)？]
---`;

      const stage3LowerHalf = `
---

### 🏫 單元教學實施指南與課堂落地方案

#### 1️⃣ 課堂實施時機與分組教學建議
- **全班一般教學（前置預防）**：於「${targetUnit}」新單元授課前，將本矩陣之「維度一（專有名詞與語意衝突）」納入暖身導入活動，透過雙欄圖卡先期排除常見迷思。
- **異質分組合作學習（破除盲點）**：針對「維度二（邏輯結構與等量建立）」，讓各組進行「條件拆解拼圖任務」，組內學生互相口述並驗證彼此算式中每個數字的幾何意義。
- **個別化補救教學（資源班/學力落後）**：針對「維度三（缺乏閱讀策略）」，提供「三讀審題提示單」與實體教具（如黏土、積木），藉由觸覺與操作表徵輔助抽象數學心像建構。

#### 2️⃣ 教學鷹架遞減路徑 (Scaffolding Fading)
- **階段一：教師顯性示範 (Modeling)**：教師於黑板示範「邊讀邊畫圖」、「用不同顏色粉筆標示不同物體數據」，放聲思考口述解題推論歷程。
- **階段二：同儕鷹架協同 (Coaching)**：同儕兩兩配對，一人扮演「審題出題者」提問關鍵隱含條件，一人扮演「解題者」口述因果邏輯。
- **階段三：獨立自主建模 (Fading)**：逐步移除彩色提示與口訣提示，由學生獨立在白紙上繪製幾何簡圖並列出兩步等量算式。

#### 3️⃣ 差異化教學指導方針
- **針對基礎弱勢學生**：
  * **降低認知負荷**：將複合題幹拆解為兩個單一子問題（「先算長方體體積是多少？」➔「若這體積等於圓柱體積，高是10，底面積是多少？」）。
  * **具象操作支持**：提供 1 立方公分積木或黏土親手操作捏塑，感受「體積不滅」物理現實。
- **針對中高階成就學生**：
  * **逆向提問探究**：「如果圓柱的底面積是 12 平方公分，高會變成多少公分？底面積和高之間有什麼關係？」
  * **形式化概括**：引導將具體數值泛化為代數符號，推導 V = A × h 之泛化關係式與函數變化思維。

#### 4️⃣ 單元閱讀理解自我檢核表 (Student Self-Checklist)
- [  ] **物體分離檢核**：我有清楚分出「原來的物體」和「改變後的物體」嗎？  
- [  ] **關鍵隱含條件**：我是否找到題幹中沒直接寫出來，但「始終沒變的量」（如體積）？  
- [  ] **未知目標定位**：最後問句到底要我求什麼？（是高、是體積、還是底面積？）  
- [  ] **單位合理性檢核**：面積單位是「平方」，長度是「公分」，體積是「立方」，我有寫對嗎？
`;

      return `${upperHalf}\n\n${stage3LowerHalf}\n\n${interactionBlock}`;
    }
  }

  return content;
}

// In-memory session store for cross-redirect and retry continuity
let lastDiagnosisSession: any = {
  unit: "112數學會考#1（疫苗效力與代數素養題）",
  grade: "國中教育會考（九年級）",
  customContext: "",
  stage: 1,
};

app.all(["/api/diagnose/stage", "/api/diagnose/stage/"], async (req, res) => {
  try {
    const isGet = req.method === "GET";
    const sourceData = isGet
      ? { ...lastDiagnosisSession, ...req.query }
      : { ...lastDiagnosisSession, ...req.body };

    const {
      unit = lastDiagnosisSession?.unit || "112數學會考#1（疫苗效力與代數素養題）",
      grade = lastDiagnosisSession?.grade || "國中教育會考（九年級）",
      customContext = lastDiagnosisSession?.customContext || "",
      imageBase64 = lastDiagnosisSession?.imageBase64,
      imageMimeType = lastDiagnosisSession?.imageMimeType || "image/png",
      fileName = lastDiagnosisSession?.fileName || "",
      history = [],
      userFollowUp = "",
    } = (sourceData || {}) as any;

    const stage = Number(sourceData?.stage) || 1;

    // Cache latest session for continuity
    if (!isGet && req.body && (req.body.unit || req.body.imageBase64 || req.body.customContext)) {
      lastDiagnosisSession = {
        unit: req.body.unit || unit,
        grade: req.body.grade || grade,
        customContext: req.body.customContext || customContext,
        imageBase64: req.body.imageBase64 || imageBase64,
        imageMimeType: req.body.imageMimeType || imageMimeType,
        fileName: req.body.fileName || fileName,
        stage,
      };
    }

    // Process multimodal attachments: Word (.docx), Text (.txt, .md), PDF, Images
    let enrichedContext = customContext;
    const lowerName = (fileName || "").toLowerCase();
    const isDocx =
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".doc") ||
      (imageMimeType &&
        (imageMimeType.includes("word") ||
          imageMimeType.includes("officedocument")));
    const isText =
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".md") ||
      (imageMimeType && imageMimeType.startsWith("text/"));
    const isPdf =
      lowerName.endsWith(".pdf") || imageMimeType === "application/pdf";

    if (imageBase64 && isDocx) {
      try {
        const buffer = Buffer.from(imageBase64, "base64");
        const docxText = await extractDocxText(buffer);
        if (docxText) {
          enrichedContext += `\n\n【使用者上傳 Word 文件（${fileName || "題目檔案"}）內容】：\n${docxText}`;
        }
      } catch (err: any) {
        console.warn("Docx parsing error in diagnose stage:", err.message);
      }
    } else if (imageBase64 && isText) {
      try {
        const textContent = Buffer.from(imageBase64, "base64").toString("utf-8");
        if (textContent.trim()) {
          enrichedContext += `\n\n【使用者上傳文字文件（${fileName || "題目檔案"}）內容】：\n${textContent}`;
        }
      } catch (err: any) {
        console.warn("Text parsing error in diagnose stage:", err.message);
      }
    }

    // Accurately determine and calibrate grade and unit based on file name and content
    const { effectiveGrade, cleanedUnit, isCalibrated } =
      determineEffectiveGradeAndUnit(unit, grade, fileName, enrichedContext);
    const targetUnit = cleanedUnit || unit;
    const targetGrade = effectiveGrade || grade;

    const ai = getGeminiClient();

    // Determine system prompt according to stage
    let stageInstructions = "";
    if (stage === 1) {
      stageInstructions = `
【當前執行步驟：第 1️⃣ 階段 - 依「數學閱讀理解困難來源」進行詳細分析列表（舉例、困難點）】
本部分是全套診斷的核心靈魂！請依使用者設定的數學主題「${targetUnit}」（年級：${targetGrade}），嚴格對照「7 大數學閱讀理解困難來源」，產出具備頂級專業深度、具體針對本單元的詳細分析（含具體舉例、真實困難點列表）：

【最高品質輸出規範 - 必須讓使用者感到驚艷】：
1. 必須先以結構嚴密的 Markdown 表格呈現【單元 7 大閱讀理解困難來源與障礙點全面對照總表】：
   欄位規範：
   | 困難來源編號與名稱 | 核心認知特徵 | 本單元題目具體實例語句 (舉例) | 學生真實思維障礙與卡關困難點 (困難點列表) |
   - 每一個來源都必須填入【具體實例】與【條列困難點】，嚴禁寫泛泛空話。若使用者有上傳檔案或題目，必須 100% 提取該題目中的真實字句！
   - 表格前後務必保留空行，每行資料獨立一行。

2. 表格之後，必須對 7 大困難來源展開【逐項深入剖析與課堂教學鷹架 (詳細分析列表)】：
   針對 1️⃣～7️⃣ 每一個困難來源，完整包含以下 4 大區塊：
   * 📌 【單元具體實例題型/語句（舉例）】：真實試題中的題幹敘述、條件句、幾何標記或選項陷阱文字（直接對準「${targetUnit}」）。
   * ⚠️ 【學生卡關困難點與迷思表現（困難點列表）】：以清晰條列（• 點 1、• 點 2）剖析學生在讀到這句話時，大腦直覺哪裡卡住？為什麼會忽略？為什麼會跟生活經驗或前置概念打架？列出學生常見的錯誤直覺算式或作圖。
   * 🧠 【深層認知成因剖析】：從認知負荷理論、基模提取、工作記憶或形式邏輯轉換視角給予專業理論診斷。
   * 💡 【教師課堂即時引導提問（口語鷹架）】：提供 2 句一線教師在課堂上可直接口語向學生提問的鷹架句子，以及 1 個好記好念的審題檢核口訣！
`;
    } else if (stage === 2) {
      stageInstructions = `
【當前執行步驟：第 2️⃣ 階段 - 三個維度教學設計與對應教學策略】
本階段由【上半部：三個維度架構總覽表】與【下半部：三大維度深入教學策略與落地實施方案】構成：

【上半部：三個維度教學設計總覽表】：
必須先以標準 Markdown 表格呈現整體維度架構：
| 維度名稱與核心聚焦 | 涵蓋的閱讀理解困難面向 | 本單元專屬教學設計策略與鷹架工具 | 課堂實施成效指標 |
- 必須完整納入：
  1. 維度一：語意與符號解碼維度 (Semantic & Symbol Decoding)
  2. 維度二：邏輯結構與概念整合維度 (Syntactic & Conceptual Integration)
  3. 維度三：閱讀策略與後設認知維度 (Reading Strategies & Metacognition)
- 表格前後請保留空行，每行資料獨立一行。

【下半部：三大維度深入教學策略與落地實施方案】：
在總覽表之後，必須依序深入展開以下三大維度的課堂實施細節：
1. 🌟 【維度一：語意與符號解碼維度——深度教學策略】
   - 📌 課堂實施策略：例如針對本單元專有名詞或日常 vs 數學語意衝突設計的「概念對比圖」、「數學辭典筆記」或「日常 vs 數學語意轉譯卡」。
   - 🗣️ 教師課堂引導話術與通關口訣：提供 1~2 句具體生動的課堂引導話術與好記的審題口訣。
   - 📝 學生操作學習單設計範例：提供 1 個課堂上讓學生動手填寫或圈劃的微型學習單範例。
2. 🌟 【維度二：邏輯結構與概念整合維度——深度教學策略】
   - 📌 課堂實施策略：針對本單元條件句、對應關係或先備知識設計的「語句結構拆解樹」、「關係對應錨定表」或「先備知識診斷橋樑」。
   - 🗣️ 教師課堂引導話術與通關口訣。
   - 📝 學生操作學習單設計範例。
3. 🌟 【維度三：閱讀策略與後設認知維度——深度教學策略】
   - 📌 課堂實施策略：針對題意重構、表徵轉換（文字轉圖表/圖表轉算式）設計的「放聲思考法 (Think-Aloud)」、「三讀審題法 (Three-Read Protocol)」或「畫圖建模四步法」。
   - 🗣️ 學生後設認知自我提問檢核卡（三問法）。
   - 📝 學生操作學習單設計範例。

【極度重要禁令 - 絕對禁止重複第 1 階段內容】：
本階段為第 2 階段（三個維度教學設計），下半部絕不可出現「7 大困難來源深入剖析」、「七大困難來源深入剖析與教學鷹架」、「1️⃣ 讀識字與斷句...」等第 1 階段的內容！下半部必須嚴格按照上述三大維度的深入教學策略展開！
`;
    } else if (stage === 3) {
      stageInstructions = `
【當前執行步驟：第 3️⃣ 階段 - 單元教學導向分類表 (教學矩陣)】
本階段由【上半部：單元教學導向分類矩陣表】與【下半部：單元教學實施指南與課堂落地方案】構成：

【上半部：單元教學導向分類矩陣表】：
必須以標準 Markdown 表格呈現完整的教學導向分類矩陣（6～8 列完整對照）：
| 困難分類 (結合困難特徵與維度) | 學生具體表現 (閱讀情境與迷思) | 教學設計策略 (課堂鷹架與解決方案) | 評量檢核要點 |
- 整合 7 大閱讀理解障礙特徵與三大教學維度，針對本單元題目情境深度拆解。
- 表格前後請保留空行，每行資料獨立一行。

【下半部：單元教學實施指南與課堂落地方案】：
在分類矩陣表之後，必須深入展開以下 4 大實施指導方針：
1. 🏫 【課堂實施時機與分組教學建議】：說明如何在大班教學、異質分組合作學習或資源班/個別化補救教學中靈活運用此矩陣。
2. 🪜 【教學鷹架遞減路徑 (Scaffolding Fading)】：規劃清晰的三步釋放責任路徑（教師示範解碼 -> 同儕合作鷹架 -> 學生自主審題建模）。
3. 🎯 【差異化教學指導方針】：針對「基礎落後學生」（如何簡化題幹、降低工作記憶負擔）與「中高階學生」（如何提升形式化建模、逆向驗算）提供具體教學指引。
4. 📋 【單元閱讀理解自我檢核表 (Student Self-Checklist)】：提供 4 點讓學生在作答本單元時能進行自我後設監控的檢核清單。

【極度重要禁令 - 絕對禁止重複第 1 階段內容】：
本階段為第 3 階段（單元教學導向分類表），下半部絕不可出現「7 大困難來源深入剖析」、「七大困難來源深入剖析與教學鷹架」、「1️⃣ 讀識字與斷句...」等第 1 階段的內容！下半部必須嚴格按照上述教學實施指南與落地方案展開！
`;
    } else if (stage === 4) {
      stageInstructions = `
【當前執行步驟：第 4️⃣ 階段 - 提供一份 20 分鐘的「補救教學教案」(詳細的代課教師指南)】
這是一份代課教師或補救教學教師走進教室時，「可以直接拿在手上照著念與操作」的 20 分鐘精準教學指南：
- 【教案基本資訊】：單元主題、教學對象、核心閱讀理解突破目標、所需教具（白板、彩色筆、工作卡）。
- 【20分鐘精準時間配比與教學環節表】：請以標準 Markdown 表格呈現（欄位：| 時間區間 | 教學環節 | 核心目標與策略 | 代課教師板書與操作重點 |），表格前後保留空行。
- 【代課教師口語逐字腳本（Script）】：用對話標註【👨‍🏫教師台詞】、【🧑‍🎓學生預期回應】、【💡教師即時回饋與追問】。
- 【黑板/白板板書結構規劃】：用清晰條列標註白板左中右該寫什麼、畫什麼圖。
`;
    } else if (stage === 5) {
      stageInstructions = `
【當前執行步驟：第 5️⃣ 階段 - 設計一份這個單元的「閱讀理解診斷小考題」】
請針對主題「${unit}」設計一份 3～4 題具有精準診斷力的閱讀理解測驗卷：
- 題目定位：不是考察複雜冗長的純數字代數運算，而是「專門檢測學生的閱讀理解障礙」。
- 【考題診斷分析對照表】：請務必在題目開頭附上一份標準 Markdown 表格（欄位：| 題號 | 題目情境與考點 | 診斷困難類型 | 正確解答 | 誘答選項核心盲點 |），表格前後保留空行。
- 每一題詳細展開必須包含：
  * 【題號與題目情境文本】
  * 【診斷之閱讀理解障礙類型】（標註對應 7 大來源之哪一項）
  * 【選項設計與易錯誘答陷阱分析】（詳細分析學生選 A、B、C 或誤解的原因，對應哪種閱讀盲點）
  * 【給予學生的閱讀引導提示 (Hint)】
  * 【正確解答與閱卷診斷指引】
`;
    } else if (stage === 6) {
      stageInstructions = `
【當前執行步驟：第 6️⃣ 階段 - 呼叫 Canvas，將診斷小考題轉換為可編輯文件檔】
請將第 5 階段設計的診斷小考題，整理為最專業、排版優良的「可編輯試卷與教師診斷手冊」完整文件，並在系統的 Canvas 編輯器中呈現：
- 包含完整的考卷抬頭（學校/補習班名稱空白欄、班級、座號、姓名、測驗時間：15分鐘、得分）。
- 學生作答區（字體清晰、預留畫圖與計算思考草稿區）。
- 題目文本排版乾淨、支援 LaTeX / 數學符號風格表示法。
- 特別提供雙重檢視模式的文字排版：
  [模式A：學生考試用正式卷 (純情境、作答空間)]
  [模式B：教師診斷與評估用卷 (含閱讀障礙診斷碼、誘答陷阱對照表、補救指引)]
- 文末詳細告知使用者：「此考題已同步加載至右側/下方 Canvas 編輯工作板，您可即時線上編輯文字、增減題目、切換學生/教師版本，並一鍵匯出 Word 或直接列印！」
`;
    }

    const promptText = `
你是一位資深數學教育專家兼認知心理學學者（優履工作室研發核心成員）。
請根據使用者輸入的資料與上下文，提供具有極高專業度、具體可操作、充滿教育前輩溫度的診斷報告與教學指引。

【回覆重要規範】：
1. 嚴禁自我介紹：絕對不要在回覆中提到「我是數學專家」、「我是…的小幫手」或重複此段指令的內容。
2. 禁止直接給答案：面對提問，請優先使用「波利亞 (George Pólya) 解題策略」或「提問引導法」或「拆解步驟法」。
3. 口吻：請使用親切、像資深前輩般的口吻，多鼓勵，但對邏輯推理維持極高嚴謹度。
4. 善用 Emoji 當作視覺重點：在關鍵字、標題或需要強調的句子開頭，加入適當的 Emoji 吸引讀者注意。保持版面和諧（每行或每點建議 1~2 個，避免流於凌亂）。
5. 表格呈現規範：在該呈現對照表、矩陣、流程配比或摘要統計的地方（如第 1 階段困難來源對照表、第 3 階段單元教學導向分類表、第 4 階段時間配比表、第 5 階段考題診斷分析表），【請務必使用標準 Markdown 表格】（以 | 欄位 1 | 欄位 2 | 與 | :--- | :--- | 語法呈現）。表格前後保留空行，每行資料獨立一行，確保排版清晰易讀。
6. 請不要出現 <br> 標籤，要斷行時直接 2 個空白鍵加換行（在表格欄位內需要換行請使用純文字逗號或分點符號）。

【使用者輸入的數學單元】：${targetUnit}
【適用年級/學段】：${targetGrade}
【使用者額外補充/情境】：${enrichedContext || "無額外補充"}
${userFollowUp ? `【使用者當前追問/指示】：${userFollowUp}` : ""}

${stage === 1 ? SOURCES_OF_DIFFICULTY : ""}

【極度重要禁令 - 嚴禁跨階段內容污染】：
- 當前為第 ${stage} 階段！
- 嚴禁在第 2 階段、第 3 階段等後續階段的下半部中，重複輸出第 1 階段的「7 大困難來源深入剖析與教學鷹架」、「七大困難來源深入剖析」、「1️⃣ 讀識字與斷句...」等內容！
- 每個階段的下半部必須 100% 聚焦該階段所要求的教學策略與實施架構！

【數學符號格式規範 - 最高優先度，全篇絕對嚴格執行】：
絕對嚴禁在任何算式、變數、數字或文字中使用任何錢字號「$」或「$$」（例如嚴禁輸出 $V = L \times W \times H$、$x \le 5$、$A$ 與 $B$ 等）！在台灣教學現場出現「$」符號屬於異常嚴重瑕疵。
所有數學公式與符號請一律以清晰純文字表示：
- 乘號請使用「×」
- 除號請使用「÷」
- 不等號請使用「≤」、「≥」、「≠」
- 次方請使用「²」、「³」或直接寫「平方」、「立方」
- 圓周率請使用「π」
- 變數與公式請直接寫純文字（如「長方體體積 V = 長 × 寬 × 高」、「圓柱底面積 = 體積 ÷ 高」），全篇絕對不可出現任何「$」符號！

${stageInstructions}

【極度重要規則 - 階段結尾必備追問與下一步】：
在回答該階段的最後，你【必須】嚴格按照以下格式輸出，停下來詢問使用者：
---
### 💬 階段檢核與互動交流
*是不是有要追問的事項？或是我們可以進入下一個步驟？*

**🔍 建議追問事項（點擊或輸入即可深入探討）：**
1. 追問選項 1：[針對本階段內容，具體深入的一個追問，例如「如何針對資源班/學力落後學生調整字詞辨析教學？」]
2. 追問選項 2：[針對本階段內容，另一個具體的追問，例如「如果學生在斷句時常忽略分號或轉折詞，有什麼口訣？」]

**🚀 邁向下一步驟：**
👉 [說明是否可以為您進行第 ${stage < 6 ? stage + 1 : 6} 步驟：${
      stage === 1
        ? "三個維度教學設計"
        : stage === 2
        ? "單元教學導向分類表"
        : stage === 3
        ? "20分鐘補救教學教案(代課教師指南)"
        : stage === 4
        ? "閱讀理解診斷小考題設計"
        : stage === 5
        ? "呼叫 Canvas 轉換為可編輯文件檔"
        : "完成診斷與文件匯出工作板"
    }？]
---
`;

    const parts: any[] = [];
    if (imageBase64 && !isDocx && !isText) {
      const effectiveMimeType = isPdf
        ? "application/pdf"
        : imageMimeType?.startsWith("image/")
        ? imageMimeType
        : "image/png";
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: effectiveMimeType,
        },
      });
    }
    parts.push({ text: promptText });

    let outputText = "";
    let lastError: any = null;

    // Try candidate models with timeout
    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[Diagnose Stage ${stage}] Attempting with model: ${modelName}`);
        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents: { parts },
          config: {
            systemInstruction:
              "你是一位親切且專業的資深數學教育專家（優履工作室研發核心顧問）。在所有回覆中，請遵循以下視覺與風格原則：1.【嚴禁自我介紹】：絕對不要提到「我是數學專家」或類似詞句。2.【禁止直接給答案】：優先使用「波利亞 (George Pólya) 解題策略」或提問引導拆解。3.【口吻】：親切、像資深前輩般多鼓勵，但對邏輯推理維持極高嚴謹度。4.【善用 Emoji 當作視覺重點】：關鍵字或標題開頭加入適當 Emoji（每行 1~2 個，避免凌亂）。5.【表格呈現規範】：在該呈現對照表、矩陣、流程配比或摘要處，請務必使用標準 Markdown 表格（表格前後保留空行），確保資訊結構清晰。不要出現 <br> 標籤，換行直接使用兩個空白加換行。6.【數學符號格式規範】：絕對嚴禁使用任何錢字號「$」或「$$」來包覆算式或變數（嚴禁出現 $V = L \\times W \\times H$ 等）。所有數學式一律使用純文字與標準 Unicode 符號（如 ×、÷、≤、≥、²、³、π 等）。全篇回覆絕對不可出現任何「$」符號！始終使用繁體中文（台灣繁體教學術語）作答。",
            temperature: 0.7,
          },
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Model request timeout")), 25000)
        );
        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        if (response.text && response.text.trim().length > 0) {
          outputText = response.text;
          console.log(`[Diagnose Stage ${stage}] Successfully generated with: ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Diagnose Stage ${stage}] Model ${modelName} failed or timeout:`, err.message || err);
      }
    }

    // If all online models failed (e.g. 429 rate limit or quota exceeded across models)
    let followUps: string[] = [];
    if (!outputText) {
      console.warn(`[Diagnose Stage ${stage}] All models exhausted, invoking Emergency Diagnosis generator.`);
      const emergency = getEmergencyDiagnosis(
        stage,
        targetUnit,
        targetGrade,
        enrichedContext,
        userFollowUp
      );
      outputText = emergency.content;
      followUps = emergency.followUps;
    } else {
      // Extract suggested follow-ups from model output
      const followUpMatches = outputText.match(/追問選項\s*[12一二][:：]\s*([^\n\r]+)/g);
      if (followUpMatches) {
        followUpMatches.forEach((m) => {
          const cleaned = m.replace(/追問選項\s*[12一二][:：]\s*/, "").replace(/[\[\]]/g, "").trim();
          if (cleaned) followUps.push(cleaned);
        });
      }
    }

    // Sanitize output to remove any dollar signs and ensure stage separation
    const sanitizedContent = cleanAllDollarSignsAndLatex(
      sanitizeStageOutput(stage, outputText, targetUnit, targetGrade)
    );

    res.json({
      stage,
      unit: targetUnit,
      effectiveGrade: targetGrade,
      correctedUnit: isCalibrated ? targetUnit : undefined,
      content: sanitizedContent,
      followUps: followUps.length >= 2 ? followUps.slice(0, 2) : [
        `想請教專家：如果學生在「${targetUnit}」遇到長文字情境，如何訓練自我提問？`,
        `針對此單元，是否有推薦的具體教具或圖卡視覺化教法？`,
      ],
      nextStage: stage < 6 ? stage + 1 : null,
      nextStageName:
        stage === 1
          ? "第 2 步驟：三個維度教學設計"
          : stage === 2
          ? "第 3 步驟：教學導向分類表"
          : stage === 3
          ? "第 4 步驟：20分鐘補救教學教案(代課教師指南)"
          : stage === 4
          ? "第 5 步驟：閱讀理解診斷小考題"
          : stage === 5
          ? "第 6 步驟：呼叫 Canvas 可編輯文件工作板"
          : "已完成所有步驟",
    });
  } catch (error: any) {
    console.error("Diagnosis error:", error);
    let cleanMessage = "伺服器運作發生錯誤，請稍後重試。";
    try {
      const parsedErr = typeof error.message === "string" ? JSON.parse(error.message) : error;
      if (parsedErr?.error?.message) {
        cleanMessage = `Gemini API 速率限制（429）：${parsedErr.error.message}`;
      } else if (error.message) {
        cleanMessage = error.message;
      }
    } catch {
      cleanMessage = error.message || cleanMessage;
    }
    res.status(500).json({ error: cleanMessage });
  }
});

// Canvas document generation endpoint
app.all(["/api/canvas/structure", "/api/canvas/structure/"], async (req, res) => {
  try {
    const rawData = req.method === "GET" ? req.query : req.body;
    const { unit = "112數學會考#1", grade = "國中教育會考（九年級）", quizContent = "" } = (rawData || {}) as any;
    const ai = getGeminiClient();

    const prompt = `
請將以下數學單元「${unit}」（${grade}）的閱讀理解小考題內容，解析並格式化為乾淨結構化的 JSON 文件，以便在 Canvas 可編輯試卷編輯器中載入。
原始內容：
${quizContent}

請回傳純 JSON 格式，不要有 markdown code block 標記：
{
  "docTitle": "${unit} - 數學閱讀理解診斷測驗卷",
  "grade": "${grade}",
  "school": "國民中學 / 國民小學",
  "timeLimit": "20分鐘",
  "totalScore": 100,
  "instructions": "本測驗著重檢測數學情境閱讀、題目關鍵字解構與圖文轉換能力。請仔細閱讀題目敘述，畫出關鍵字再作答。",
  "questions": [
    {
      "id": "q1",
      "number": 1,
      "type": "choice",
      "score": 25,
      "text": "題目敘述...",
      "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
      "difficultySource": "對應困難來源 (如：字詞意義不清、一般語意與數學語意不同...)",
      "diagnosticNote": "本題診斷學生是否能區分...的差異。",
      "distractorAnalysis": "(A) 陷阱分析...；(B) 陷阱分析...",
      "readingHint": "閱讀引導提示...",
      "answer": "正確答案與解題思考"
    }
  ]
}
`;

    let parsed: any = null;
    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[Canvas Structure] Attempting with model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });
        if (response.text) {
          parsed = JSON.parse(response.text);
          if (parsed && parsed.questions && parsed.questions.length > 0) {
            console.log(`[Canvas Structure] Success with model: ${modelName}`);
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[Canvas Structure] Model ${modelName} failed or quota exceeded:`, err.message || err);
      }
    }

    // If model failed or quota exceeded, provide structured fallback
    if (!parsed || !parsed.questions) {
      parsed = {
        docTitle: `${unit || "數學單元"} - 數學閱讀理解診斷測驗卷`,
        grade: grade || "國中八年級",
        school: "國民中學 / 國民小學",
        timeLimit: "20分鐘",
        totalScore: 100,
        instructions:
          "本測驗著重檢測數學情境閱讀、題目關鍵字解構與圖文轉換能力。請在題目草稿區畫出關鍵字與幾何示意圖再作答。",
        questions: [
          {
            id: "q1",
            number: 1,
            type: "choice",
            score: 30,
            text: `【語意辨析題】：在「${unit}」概念中，下列哪一位同學對於幾何定義與名詞的理解最為嚴謹正確？`,
            options: [
              "(A) 小華：垂直平分線是一條可以量出精準長度的線段",
              "(B) 小強：對稱軸必然是一條直線，摺疊後兩側圖形能完全對合",
              "(C) 小明：任何三角形均恰好具有三條對稱軸",
              "(D) 小美：日常生活中的左右平衡，在數學上就是線對稱",
            ],
            difficultySource: "字詞的意義不清與一般語意衝突",
            diagnosticNote: "檢驗學生是否能區別線段與直線，並破除日常美感對稱與幾何線對稱之混淆。",
            distractorAnalysis: "(A) 混淆線段與直線；(C) 只有正三角形才是；(D) 日常語意干擾。",
            readingHint: "請仔細確認「直線」與「線段」的幾何定義特徵。",
            answer: "(B) 正確。對稱軸為直線，幾何摺疊後完全重合。",
          },
          {
            id: "q2",
            number: 2,
            type: "choice",
            score: 35,
            text: `【圖文表徵轉換題】：小芬閱讀題目：「直線 L 垂直平分線段 AB 於 M 點，P 為直線 L 上異於 M 的任一點」，小芬在草稿紙上作圖，下列哪一個畫圖表徵最能防止誤解？`,
            options: [
              "(A) 畫出線段 AB、標出中點 M 與直角記號，並在直線上取異於 M 的點 P 連接 PA 與 PB",
              "(B) 直接將 P 點畫在中點 M 處以簡化運算",
              "(C) 隨意畫兩條交叉線，不標記垂直與等長符號",
              "(D) 先設坐標值再決定幾何圖形外觀",
            ],
            difficultySource: "缺乏適時使用閱讀策略 (圖文表徵轉換)",
            diagnosticNote: "檢測學生是否能將文字中的「垂直」、「平分」、「異於 M 的任一點」逐一轉化為幾何圖形記號。",
            distractorAnalysis: "(B) 誤取特殊點導致喪失一般性；(C) 忽略題意限制條件。",
            readingHint: "請在草稿紙上把題目說到的所有幾何條件都標出對應符號。",
            answer: "(A) 正確。完整表徵了文字題中的所有條件。",
          },
          {
            id: "q3",
            number: 3,
            type: "choice",
            score: 35,
            text: `【邏輯關係題】：已知「若點 P 在線段 AB 的垂直平分線上，則 PA = PB」。下列敘述何者是其正確的逆命題？`,
            options: [
              "(A) 若 PA = PB，則點 P 必在線段 AB 的垂直平分線上",
              "(B) 若點 P 不在垂直平分線上，則 PA = PB",
              "(C) 若 PA ≠ PB，則點 P 在線段 AB 的垂直平分線上",
              "(D) 垂直平分線上的點與平面上所有點之距離均相等",
            ],
            difficultySource: "缺乏數學語法(邏輯)知識 (條件與逆命題因果關係)",
            diagnosticNote: "檢測學生對「若 P 則 Q」與「若 Q 則 P」逆命題邏輯之掌握程度。",
            distractorAnalysis: "(B) 條件否定錯誤；(C) 結論否定混淆；(D) 過度泛化。",
            readingHint: "逆命題即交換原命題之條件與結論。",
            answer: "(A) 正確。中垂線性質之逆命題成立。",
          },
        ],
      };
    }

    res.json({ document: parsed });
  } catch (error: any) {
    console.error("Canvas structure error:", error);
    res.status(500).json({ error: error.message || "無法轉換為 Canvas 文件結構" });
  }
});

// Fallback handler for /api routes with smart forwarding to avoid spurious 404s
app.all("/api/*", (req, res) => {
  const cleanPath = req.path.toLowerCase().replace(/\/+$/, "");
  if (cleanPath.startsWith("/api/diagnose")) {
    return res.redirect(307, "/api/diagnose/stage");
  }
  if (cleanPath.startsWith("/api/canvas")) {
    return res.redirect(307, "/api/canvas/structure");
  }
  if (cleanPath.startsWith("/api/upload")) {
    return res.redirect(307, "/api/upload/parse");
  }
  res.status(404).json({ error: `API 端點不存在：${req.method} ${req.path}` });
});

// Global Express error handler to guarantee JSON response
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Global express error:", err);
  res.status(err.status || 500).json({ error: err.message || "伺服器內部錯誤" });
});

// Setup Vite or Static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, cors: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

setupServer();
