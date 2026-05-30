import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// AI Feedback Route
app.post("/api/feedback", async (req, res) => {
  const { authorName, title, content, reflections } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: "본문 내용을 입력해주세요." });
  }

  try {
    const ai = getAIClient();
    
    // Fallback if API key is not configured or mock
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        feedback: `### ℹ️ [안내] AI 피드백 데모 모드
현재 **GEMINI_API_KEY** 설정이 되어 있지 않아 예시 피드백을 제공합니다. (실제 운영 시에는 구글 AI 스튜디오 설정에서 API 키를 비밀 키로 입력하면 고성능 Gemini의 맞춤형 검토가 제공됩니다.)

**[작성글 분석 분석 및 격려]**
*   **사료 검증**: 학생 ${authorName || "무명"}님이 제안한 단원 제목 \`『${title || "독도 서술 제안"}』\`은 왜곡을 지양하고 역사 사실에 잘 가닿아 있습니다.
*   **서술 톤앤매너**: 세종실록지리지, 태정관 지령 등을 근거로 삼았거나, 감정 대신 사실 위주로 논리적인 전개를 보였습니다.
*   **평화 지향성**: 동해를 어업 갈등의 영역이 아닌 미래 협력과 공동 번영의 평화로운 바다로 규정하려는 관점은 양국 공동 교과서 집필 원칙에 매우 부합합니다.
*   **성찰 코멘트**: 작성하신 성찰 답변 또한 역사를 평화 수호와 미래 화해를 위한 도구로 삼고자 하는 깊은 고민이 돋보입니다.`
      });
    }

    const systemPrompt = `당신은 한일 평화 교육 자문가이자 역사 교사입니다. 
학생들이 작성한 '한일 학생 공동 교과서 - 독도 서술안'과 '성찰 질문'에 대한 답변을 면밀히 분석하고, 
친절하고 역사학적으로 명철하며 평화 지향적인 피드백을 작성해 주세요.

[분석 타겟 학생 데이터]
- 학생 이름/모둠명: ${authorName || "미지정"}
- 제안한 독도 단원 제목: ${title || "미지정"}
- 공동 집필 본문 (10줄 이내 목적):
"${content}"
- 성찰 및 토론 질문에 대한 생각:
"${reflections || "미작성"}"

[피드백 작성 지침]
1. 따뜻하고 진지한 격려의 서두로 시작할 것.
2. 다음 세 가지 항목을 명확한 Markdown 소제목과 함께 작성할 것:
   - **🔬 역사적 사실성 및 사료 분석 (Historical Accuracy)**: 세종실록지리지, 신증동국여지승람, 은주시청합기, 태정관지령, 삼국접양지도 등 학생이 언급하거나 사용한 사료가 비판적으로 결합되었는지 평가 및 가이드.
   - **🕊️ 평화지향성 및 균형 잡힌 서술 (Peace Directional Tone)**: 일방적 비난이나 극단적으로 격앙된 감정적 표현이 제어되고, 팩트 중심이자 한일 청소년의 미래지향적 공생을 목적으로 쓰여졌는지 점검.
   - **💡 배움을 넓히는 성찰 길잡이 (Further Inquiry)**: 서술안을 더욱 발전시키기 위해 추가로 대조 분석하면 좋을 자료나, 학생의 성찰 질문 대답에 대한 심화 질문 제시.
3. 한국어 존댓말로 작성하며, 정중하고 신뢰감을 주는 문체를 사용할 것.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "제공된 학생 데이터를 분석해 전문적인 평화 교과서 공동 집필 피드백을 작성해라.",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ feedback: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "피드백을 생성하는 중 서버 오류가 발생했습니다: " + error.message });
  }
});

// AI Reflection Generation Route
app.post("/api/reflection", async (req, res) => {
  const { name, keywords, emotion, length } = req.body;

  if (!keywords || keywords.trim().length === 0) {
    return res.status(400).json({ error: "키워드를 최소 하나 이상 입력해주세요." });
  }

  try {
    const ai = getAIClient();

    // Fallback if API key is not configured
    if (!process.env.GEMINI_API_KEY) {
      const generatedFallback = `### 🕊️ 독도 배움 융합 평화 소감문
**작성자**: **${name || "배움이"}** 학생
**핵심 키워드**: *${keywords}* (${emotion || "진지하고 학구적임"})

이번 독도 주권 교육 센터의 입체적 아카이브를 탐구하면서, 독도 수권에 관한 진실은 소모적인 감정이나 애국주의적 구호가 아닌 명료한 역사적 증거와 논리적 사료 위에 단단히 지지되어야 함을 실감했습니다.

특히 제가 마음에 남겨놓은 **'${keywords}'**에 관한 생각들이 깊어졌습니다. 대한민국 영토주권의 당위가 역사적 기정사실이자 한일 갈등의 도화선이 아닌, 동해의 해양 질서와 우호적 동반자 관계를 성숙하게 회복하는 '평화상생'의 다리가 되어야 함을 깨달았습니다.

우리가 사료(태정관 지령, 세종실록지리지 등)를 객관적으로 다루는 이유는 갈등을 키우기 위함이 아니라, 잘못된 과거의 인식을 정정하고 미래로 나아가기 위한 주체적 역사관을 갈고닦기 위함입니다. 앞으로도 배운 지식에만 안주하지 않고 세계시민으로서 책임감 있는 평화 담론을 이끄는 글로벌 청소년 일원으로 성장해 나가겠습니다.`;

      return res.json({ reflection: generatedFallback });
    }

    const lengthGuide = length === "short" ? "300자 내외의 깔끔하고 핵심적인 소감" : length === "long" ? "800자 내외의 풍부하고 깊이 있는 학구적 성찰문" : "500자 내외의 가장 대중적인 중등 성찰 에세이";

    const systemPrompt = `당신은 독도 주권 교육 센터의 친절하고 깊이 있는 인문지리 교육 안내자(AI 영토주권 멘토)입니다. 
학생이 입력한 이름, 키워드, 소감 톤을 바탕으로, 논리적이고 깊은 울림을 전하는 '독도 평화 수호 및 지식 습득 소감문(Reflection Essay)'을 생성해 주세요.

[소감문 생성 지침]
1. 단순 나열이나 상투적인 극단적 애국 구호를 지양하고, 역사적 사실(고사료)과 평화 공존 및 지리적 근접성 등에 기반한 성숙하며 다각적인 학생 소감문으로 작성해 주세요.
2. 입력받은 키워드들을 자연스럽고 긴밀하게 글의 맥락에 녹여내야 합니다.
3. 소감문은 다음과 같이 균형 있게 구성되어야 합니다:
   - **도입 (Introduction)**: 독도 교육에 참여하며 평화적 영토 주권을 돌아보게 된 동기와 계기.
   - **전개 (Body)**: 입력된 키워드(예: 사료 이름, 지리적 원리, 동해의 가치)를 학문적이고 객관적으로 활용한 깊은 성찰.
   - **결론 (Conclusion)**: 한일 청소년이 미래 세대로서 갈등을 극복하고 평화와 상생의 동해를 함께 일구어 나가겠다는 성숙한 세계관과 앞으로의 다짐.
4. 분위기 & 톤앤매너: '${emotion || "진지하고 학구적인 분위기"}'에 적극 부합하도록 진실성이 묻어나게 쓰세요.
5. 분량 가이드: ${lengthGuide}.
6. 작성자 명의: '${name || "배움이"}' 학생이 쓴 글로 어울리게 1인칭 시점('~저는', '~느꼈습니다')으로 작성하세요.
7. 친화적 마크다운 포맷(제목, 볼드강조, 인용 등)을 적절히 활용하여 아름답고 품격 있는 소감문으로 완성해 제출하세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `학생 이름: ${name || "배움이"}\n사용할 핵심 키워드군: ${keywords}\n소감문 톤/감정: ${emotion || "진지하고 성실함"}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
      }
    });

    res.json({ reflection: response.text });
  } catch (error: any) {
    console.error("Reflection Generation Error:", error);
    res.status(500).json({ error: "소감문을 생성하는 중 서버 오류가 발생했습니다: " + error.message });
  }
});

// Start integration with Vite dev server or host dist files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
