import { useState, useEffect } from "react";
import {
  Compass,
  BookOpen,
  FileText,
  HelpCircle,
  Trophy,
  CheckCircle,
  RotateCcw,
  Check,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Sparkles,
  User,
  Edit2,
  Calendar,
  Layers,
  MapPin,
  Map,
  BookOpenCheck,
  CheckSquare,
  ArrowRight
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import { CHAPTERS, QUIZ_QUESTIONS, DISCUSSION_QUESTIONS } from "./data";
import { ActivityProposal } from "./types";
import dokdoHeroImg from "./assets/images/dokdo_bento_hero_1780105894766.png";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Quiz states
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(new Array(QUIZ_QUESTIONS.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);

  // Group activity states
  const [proposal, setProposal] = useState<ActivityProposal>({
    id: "proposal-sandbox",
    authorName: "",
    title: "",
    content: "",
    reflections: {
      "dq-1": "",
      "dq-2": "",
      "dq-3": ""
    }
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Live Clock for Sil-si-gan Bento Grid module
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // AI Reflection Essay Generator states
  const [reflectionName, setReflectionName] = useState<string>("");
  const [reflectionKeywords, setReflectionKeywords] = useState<string>("");
  const [reflectionEmotion, setReflectionEmotion] = useState<string>("진지함");
  const [reflectionLength, setReflectionLength] = useState<string>("medium");
  const [isGeneratingReflection, setIsGeneratingReflection] = useState<boolean>(false);
  const [generatedReflection, setGeneratedReflection] = useState<string>("");
  const [reflectionError, setReflectionError] = useState<string>("");

  useEffect(() => {
    // Load completed topics from localstorage
    const stored = localStorage.getItem("dokdo_completed_topics");
    if (stored) {
      try {
        setCompletedTopics(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }

    // Load proposal state from localstorage to save progress
    const storedProposal = localStorage.getItem("dokdo_proposal_draft");
    if (storedProposal) {
      try {
        setProposal(JSON.parse(storedProposal));
      } catch (e) {
        console.error(e);
      }
    }

    // Load generated reflection state from localstorage
    const storedReflection = localStorage.getItem("dokdo_generated_reflection");
    if (storedReflection) {
      setGeneratedReflection(storedReflection);
    }
    const storedReflKeywords = localStorage.getItem("dokdo_refl_keywords");
    if (storedReflKeywords) {
      setReflectionKeywords(storedReflKeywords);
    }
    const storedReflName = localStorage.getItem("dokdo_refl_name");
    if (storedReflName) {
      setReflectionName(storedReflName);
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const saveProposalToLocalAndState = (updated: ActivityProposal) => {
    setProposal(updated);
    localStorage.setItem("dokdo_proposal_draft", JSON.stringify(updated));
  };

  const handleToggleTopicCompletion = (topicId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    const updated = completedTopics.includes(topicId)
      ? completedTopics.filter((id) => id !== topicId)
      : [...completedTopics, topicId];
    
    setCompletedTopics(updated);
    localStorage.setItem("dokdo_completed_topics", JSON.stringify(updated));
  };

  const handlesQuizOptionSelect = (questionIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    const nextAnswers = [...quizAnswers];
    nextAnswers[questionIndex] = optionIndex;
    setQuizAnswers(nextAnswers);
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    quizAnswers.forEach((ans, idx) => {
      if (ans === QUIZ_QUESTIONS[idx].correctAnswerIndex) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setQuizAnswers(new Array(QUIZ_QUESTIONS.length).fill(null));
    setQuizSubmitted(false);
    setQuizScore(0);
    setActiveQuizIndex(0);
  };

  const handleRequestAIFeedback = async () => {
    if (!proposal.content || proposal.content.trim().length === 0) {
      setErrorMessage("공동 집필 본문을 채워주셔야 AI 피드백을 검증받을 수 있습니다.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);
    setAiFeedback("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: proposal.authorName,
          title: proposal.title,
          content: proposal.content,
          reflections: Object.entries(proposal.reflections)
            .map(([qId, val]) => {
              const qText = DISCUSSION_QUESTIONS.find((q) => q.id === qId)?.question || "";
              return `질문: ${qText}\n답변: ${val}`;
            })
            .join("\n\n")
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAiFeedback(data.feedback);
      } else {
        setErrorMessage(data.error || "피드백을 받아오지 못했습니다.");
      }
    } catch (err: any) {
      setErrorMessage("서버 통신 실패: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateReflection = async () => {
    if (!reflectionKeywords.trim()) {
      setReflectionError("소감문에 녹여내고 싶은 핵심 키워드를 최소 한 단어 이상 입력해 주세요.");
      return;
    }
    setReflectionError("");
    setIsGeneratingReflection(true);
    setGeneratedReflection("");

    try {
      const response = await fetch("/api/reflection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: reflectionName,
          keywords: reflectionKeywords,
          emotion: reflectionEmotion,
          length: reflectionLength
        })
      });

      const data = await response.json();
      if (response.ok) {
        setGeneratedReflection(data.reflection);
        localStorage.setItem("dokdo_generated_reflection", data.reflection);
        localStorage.setItem("dokdo_refl_keywords", reflectionKeywords);
        localStorage.setItem("dokdo_refl_name", reflectionName);
      } else {
        setReflectionError(data.error || "소감문을 자동으로 만드는 데 실패했습니다.");
      }
    } catch (err: any) {
      setReflectionError("서버와의 통신에 에러가 일어났습니다: " + err.message);
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  // Counting total topics across all chapters
  const totalTopicsCount = CHAPTERS.reduce((acc, c) => acc + c.topics.length, 0);

  const activeChapter = CHAPTERS.find((c) => c.id === activeTab);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        completedTopics={completedTopics}
        totalTopicsCount={totalTopicsCount}
      />

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Dynamic Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Edu-Tech Bento Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              {activeTab === "home" && "독도 영토 주권 교육 종합 센터"}
              {activeTab === "quiz" && "주권 지식 테스트 콘솔"}
              {activeTab === "activity" && "평화 공동교과서 집필 교실"}
              {activeChapter && `${activeChapter.number}차시: ${activeChapter.title}`}
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl font-medium">
              {activeTab === "home" && "지리적 특성, 역사적 고사료 비교 및 한일 갈등의 평화 공동 번영을 연구하는 스마트 배움터입니다."}
              {activeTab === "quiz" && "기축 고문서와 지도 분석으로 습득한 지식을 검증하고 마스터 자격을 획득하세요."}
              {activeTab === "activity" && "일방적 비난 대신 팩트 중심의 공동 기술안을 집필하여 인공지능 자문관의 실시간 검증을 받습니다."}
              {activeChapter && activeChapter.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-[#161618] border border-zinc-800 text-zinc-300 font-bold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              실시간 온라인
            </span>
          </div>
        </div>

        {/* Tab 1: Home Dashboard representing Bento Grid */}
        {activeTab === "home" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-min">
            
            {/* Primary Hero Card */}
            <div className="col-span-12 lg:col-span-8 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden text-white min-h-[360px] border border-indigo-500/20">
              {/* Abstract image placement on the right with dark fade overlay */}
              <div className="absolute inset-0 z-0">
                <img
                  src={dokdoHeroImg}
                  alt="독도 수려한 풍경 일러스트"
                  className="w-full h-full object-cover object-right opacity-60 mix-blend-luminosity hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-indigo-950/80 to-transparent"></div>
              </div>

              <div className="z-10 max-w-md">
                <div className="inline-block bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-white/10">
                  융합 교재 v1.2 Release
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold leading-[1.15] tracking-tight text-white mb-4">
                  역사의 거울, <br />
                  <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">독도의 진실</span>을 읽다.
                </h2>
                <p className="text-indigo-200/90 text-sm md:text-base leading-relaxed font-medium mb-6">
                  감정적 해법을 넘어 명확한 공인 조약, 고지도 분석을 통해 동아시아 공동 번영의 평화적 관점을 정립해 나갑니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 z-10 pt-4 border-t border-white/10">
                <p className="text-indigo-100/70 text-xs font-medium">
                  대한민국 동쪽 해양 영토의 역사적 귀속을 올곧게 공부하세요.
                </p>
                <button
                  onClick={() => setActiveTab("chapter-1")}
                  className="bg-white hover:bg-zinc-100 text-[#0A0A0B] transition-colors px-6 py-2.5 rounded-full text-xs font-black inline-flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  지리 아카이브 학습시작
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metric Card 1: Live Observation & Geometry */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-[#161618] border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start">
                <div className="text-zinc-500 font-bold uppercase text-xs tracking-widest">REALTIME UTC (KST)</div>
                <span className="text-indigo-500 text-xs font-bold bg-indigo-500/10 px-2 py-1 rounded-md">Live GPS</span>
              </div>
              
              <div className="my-6">
                <div className="text-4xl font-mono font-bold tracking-tight text-white mb-2">
                  {currentTime.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                </div>
                <div className="text-xs text-zinc-400 flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  북위 37°14'26.8" / 동경 131°52'10.4"
                </div>
              </div>

              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${(currentTime.getSeconds() / 60) * 100}%` }}></div>
              </div>
              <span className="text-[11px] text-zinc-500 font-bold">동도 우산봉 기준 좌표축 정밀 표명</span>
            </div>

            {/* Metric Card 2: Distance Matrix */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-[#161618] border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-lg hover:border-zinc-700 transition-colors">
              <div className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Distance Matrix</div>
              
              <div className="my-5 space-y-2.5">
                <div className="flex justify-between items-center bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-850">
                  <span className="text-xs font-bold text-zinc-300">울릉도 ↔ 독도</span>
                  <span className="text-lg font-black text-rose-400">87.4 <span className="text-xs font-bold text-zinc-400">km</span></span>
                </div>
                <div className="flex justify-between items-center bg-zinc-900/20 p-2 text-xs text-zinc-400">
                  <span>오키섬 ↔ 독도</span>
                  <span className="font-semibold text-zinc-300">157.5 km</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-900/20 p-2 text-xs text-zinc-400">
                  <span>울진(한반도) ↔ 독도</span>
                  <span className="font-semibold text-zinc-300">216.8 km</span>
                </div>
              </div>

              <div className="bg-emerald-500/10 text-emerald-400 text-xs px-3.5 py-2.5 rounded-xl border border-emerald-900/30 flex items-start gap-2">
                <span className="font-bold">✓ 육안 관측성 의의:</span>
                <span className="text-[11px] leading-relaxed text-zinc-300 font-medium">당시 주민 인지 한계를 증명하는 결정적 물리 차이. (오키섬 관측 불가)</span>
              </div>
            </div>

            {/* Bottom Bento Feature Card 1 */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-[#161618] border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-lg hover:border-zinc-700 transition-colors">
              <div>
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/10">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-1.5 text-zinc-100">입체적 삼요소 (Territory)</h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-semibold">
                  현대 국제법 주권 영토(울릉읍 독도리 1~96), 영해(12해리 보위 기선), 영공(KADIZ 구획 보호)을 종합 관리하는 스마트 지위.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-900 flex justify-between items-center text-[11px] text-indigo-400 font-bold">
                <span>자세히 보기</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Bottom Bento Feature Card 2: Light style (Team Sync) */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white rounded-[2.5rem] p-8 text-black flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="flex -space-x-1.5">
                    <div className="w-7 h-7 rounded-full border border-white bg-zinc-200 flex items-center justify-center text-[9px] font-bold text-zinc-800">KR</div>
                    <div className="w-7 h-7 rounded-full border border-white bg-[#0A0A0B] flex items-center justify-center text-[9px] font-bold text-white">JP</div>
                    <div className="w-7 h-7 rounded-full border border-white bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold">+12k</div>
                  </div>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 font-black px-2 py-0.5 rounded-full">한일 학생 활성참여</span>
                </div>
                <h3 className="text-xl font-black tracking-tight mb-2">평화 공동 교과서 집필</h3>
                <p className="text-zinc-650 text-xs font-semibold leading-relaxed">
                  편향을 걷어낸 객관적 보도문서와 막부 지령 등을 발굴·대조하여 한일 간 어업 갈등과 영토 극단을 완충하는 평화 교과서 완성하기.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("activity")}
                className="mt-6 w-full bg-zinc-900 text-white rounded-xl py-2 px-4 text-xs font-bold transition-all hover:bg-black flex justify-between items-center"
              >
                교실 참여하기
                <ArrowRight className="w-4.5 h-4.5 text-zinc-400" />
              </button>
            </div>

            {/* Bottom Bento Feature Card 3: Dashboard Learn Stats */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-[#161618] border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-lg hover:border-zinc-700 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                    <BookOpenCheck className="w-5 h-5" />
                  </div>
                  <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">진척도 추적</span>
                </div>
                <h3 className="text-lg font-bold mb-2">나의 차시 학습 완료</h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-semibold mb-4">
                  총 {totalTopicsCount}개의 핵심 역사 지리 증빙 항목 중 <span className="text-white underline">{completedTopics.length}개</span>를 분석했습니다.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-zinc-800 rounded-full">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${(completedTopics.length / totalTopicsCount) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500 font-bold">
                  <span>지식 정립 지수</span>
                  <span>{Math.round((completedTopics.length / totalTopicsCount) * 100)}% 완료</span>
                </div>
              </div>
            </div>

            {/* AI Reflection Statement Bento Card */}
            <div className="col-span-12 bg-gradient-to-br from-[#101014] via-[#16161a] to-[#0c0c0e] border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
              
              <div className="space-y-4 max-w-xl z-10">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono font-bold tracking-widest uppercase">
                    KOREA-JAPAN DOKDO ECOSYSTEM - REFLECTION COMPOSER
                  </span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white animate-fade">
                  실시간 AI 독도 학습 <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">소감문 자동 생성</span>
                </h3>
                
                <p className="text-zinc-400 text-xs md:text-sm leading-relaxed font-semibold">
                  본 교육 아카이브에서 배운 태정관지령, 명시적 지리 근접성, 평화상생 철학 키워드군을 선택하면, 성숙하고 논리적인 융합 학습 성찰(소감문)을 실시간으로 집필해 줍니다.
                </p>
                
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] bg-zinc-900 border border-zinc-800/85 text-zinc-400 px-2.5 py-1 rounded-full font-bold">#태정관지령</span>
                  <span className="text-[10px] bg-zinc-900 border border-zinc-800/85 text-zinc-400 px-2.5 py-1 rounded-full font-bold">#세종실록지리지</span>
                  <span className="text-[10px] bg-zinc-900 border border-zinc-800/85 text-zinc-400 px-2.5 py-1 rounded-full font-bold">#평화상생</span>
                  <span className="text-[10px] bg-zinc-900 border border-zinc-800/85 text-zinc-400 px-2.5 py-1 rounded-full font-bold">#87.4km_육안가시성</span>
                </div>
              </div>
              
              <button
                onClick={() => setActiveTab("reflection")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-7 py-3 text-xs font-black transition-all shadow-lg shadow-indigo-600/10 active:scale-95 shrink-0 z-10 flex items-center gap-2 group-hover:shadow-indigo-500/25 cursor-pointer"
              >
                소감문 작성하기
                <ArrowRight className="w-4.5 h-4.5 text-indigo-200 animate-pulse" />
              </button>
            </div>

          </div>
        )}

        {/* Tab 2, 3, 4: LearnChapters representation */}
        {activeChapter && (
          <div className="space-y-6">
            <div className="bg-[#161618] border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <span className="inline-block bg-indigo-600/15 text-indigo-400 font-extrabold text-xs px-3.5 py-1 rounded-full border border-indigo-900/30">
                  제 {activeChapter.number}차시 대강률
                </span>
                <p className="text-sm text-zinc-300 font-semibold mt-1">
                  {activeChapter.summary}
                </p>
              </div>
              <div className="bg-zinc-900 px-4 py-3 rounded-2xl border border-zinc-850 text-center shrink-0">
                <div className="text-xs text-zinc-500 font-bold">완료 상태 (차시 내)</div>
                <div className="text-xl font-black text-indigo-400">
                  {activeChapter.topics.filter((t) => completedTopics.includes(t.id)).length} /{" "}
                  {activeChapter.topics.length} 완독
                </div>
              </div>
            </div>

            {/* Grid of Topic Cards - Bento Style Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeChapter.topics.map((topic) => {
                const isCompleted = completedTopics.includes(topic.id);
                const isSelected = selectedTopicId === topic.id;
                return (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedTopicId(isSelected ? null : topic.id)}
                    className={`bg-[#161618] border ${
                      isSelected ? "border-indigo-500" : "border-zinc-800"
                    } hover:border-zinc-700 rounded-3xl p-6 md:p-8 transition-all cursor-pointer flex flex-col justify-between gap-4 h-full relative group shadow-sm`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] bg-zinc-900 border border-zinc-805 text-zinc-400 font-black px-2.5 py-1 rounded-md">
                          {topic.badge}
                        </span>
                        
                        {/* Interactive Completion Trigger */}
                        <button
                          onClick={(e) => handleToggleTopicCompletion(topic.id, e)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors focus:outline-hidden ${
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-zinc-900 hover:bg-zinc-850 text-zinc-500 border border-zinc-800"
                          }`}
                          title={isCompleted ? "학습 미완료로 복원" : "이 항목 학습 완료"}
                        >
                          <Check className={`w-4 h-4 ${isCompleted ? "opacity-100 scale-100" : "opacity-40"}`} />
                        </button>
                      </div>

                      <h3 className="text-xl font-black text-zinc-100 tracking-tight group-hover:text-indigo-400 transition-colors">
                        {topic.title}
                      </h3>
                      <p className="text-zinc-400 text-xs mt-1.5 font-semibold">
                        {topic.subtitle}
                      </p>
                      
                      <p className="text-zinc-300 text-sm mt-3 leading-relaxed font-medium">
                        {topic.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
                      <span className="text-xs text-indigo-400 font-bold group-hover:underline inline-flex items-center gap-1">
                        {isSelected ? "자료 숨기기" : "원문 사료 및 돋보기 분석 읽기"}
                        <ChevronRight className={`w-3.5 h-3.5 transform transition-transform ${isSelected ? "rotate-90" : ""}`} />
                      </span>
                      {isCompleted && (
                        <span className="text-xs text-emerald-400 font-bold inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> 완독
                        </span>
                      )}
                    </div>

                    {/* Rich Details Expanded Pane inside card */}
                    {isSelected && (
                      <div className="mt-5 pt-5 border-t border-zinc-800/80 bg-zinc-900/40 p-4 rounded-2xl text-xs space-y-4 text-zinc-300 leading-relaxed font-mono whitespace-pre-line border border-zinc-800">
                        <span className="text-[10px] text-amber-400 font-black tracking-widest uppercase block mb-1">
                          🔎 사료 대조 및 실체 요증
                        </span>
                        {topic.richContent}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: Quiz testing sandbox */}
        {activeTab === "quiz" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sidebar indicator inside Quiz - Bento Style */}
            <div className="lg:col-span-4 bg-[#161618] border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between gap-6 h-fit shadow-lg">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">지식 모니터링</h3>
                <p className="text-xs text-zinc-400 leading-normal font-semibold mb-4">
                  총 5문항의 공적 검증 퀴즈를 해결하세요. 역사관과 시각적 지리력을 평가합니다.
                </p>

                {/* Vertical Step Indicators */}
                <div className="space-y-2">
                  {QUIZ_QUESTIONS.map((q, idx) => {
                    const isPassed = quizSubmitted && quizAnswers[idx] === q.correctAnswerIndex;
                    const isWrong = quizSubmitted && quizAnswers[idx] !== null && quizAnswers[idx] !== q.correctAnswerIndex;
                    const isSelected = activeQuizIndex === idx;
                    const answered = quizAnswers[idx] !== null;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setActiveQuizIndex(idx)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border text-left ${
                          isSelected
                            ? "bg-indigo-600/10 border-indigo-500 text-white font-extrabold"
                            : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                        }`}
                      >
                        <span className="text-xs flex items-center gap-2">
                          <span className={`w-5 h-5 text-[10px] rounded-full flex items-center justify-center font-bold font-mono ${
                            isSelected ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {idx + 1}
                          </span>
                          문항 {idx + 1}
                        </span>

                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          {quizSubmitted ? (
                            isPassed ? (
                              <span className="text-emerald-400">정답</span>
                            ) : (
                              <span className="text-rose-400">오답</span>
                            )
                          ) : answered ? (
                            <span className="text-zinc-500 font-normal">선택완료</span>
                          ) : (
                            <span className="text-zinc-650 font-normal">미기입</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {quizSubmitted ? (
                <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center space-y-3">
                  <div className="text-xs text-zinc-400 font-bold">나의 최종 획득 스코어</div>
                  <div className="text-3xl font-black text-indigo-400">
                    {quizScore} / {QUIZ_QUESTIONS.length}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold leading-normal">
                    {quizScore === QUIZ_QUESTIONS.length
                      ? "🏆 완벽한 독도 주권 마스터 통달!"
                      : "💡 몇몇 중요 사료를 추가 완독해 재도전해보세요."}
                  </p>
                  <button
                    onClick={handleResetQuiz}
                    className="w-full bg-[#161618] border border-zinc-800 text-zinc-300 font-bold hover:bg-zinc-900 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> 테스트 초기화
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={quizAnswers.some((ans) => ans === null)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-md ${
                    quizAnswers.some((ans) => ans === null)
                      ? "bg-zinc-800/80 text-zinc-500 cursor-not-allowed"
                      : "bg-white hover:bg-zinc-100 text-[#0A0A0B] active:scale-95"
                  }`}
                >
                  기록 제출 및 검증하기
                </button>
              )}
            </div>

            {/* Quiz Content Pane - Bento Main Area */}
            <div className="lg:col-span-8 bg-[#161618] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-lg flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-900/30 px-3 py-1 rounded-full">
                    문항 No. {activeQuizIndex + 1} / {QUIZ_QUESTIONS.length}
                  </span>
                  <span className="text-xs text-zinc-500 font-bold">인식 오류 가드 활성화</span>
                </div>

                <h2 className="text-2xl font-black text-zinc-100 tracking-tight leading-relaxed">
                  {QUIZ_QUESTIONS[activeQuizIndex].question}
                </h2>

                <div className="space-y-3 pt-3">
                  {QUIZ_QUESTIONS[activeQuizIndex].options.map((option, oIdx) => {
                    const isSelected = quizAnswers[activeQuizIndex] === oIdx;
                    const isCorrect = QUIZ_QUESTIONS[activeQuizIndex].correctAnswerIndex === oIdx;
                    const showCorrect = quizSubmitted && isCorrect;
                    const showWrong = quizSubmitted && isSelected && !isCorrect;

                    return (
                      <button
                        key={oIdx}
                        disabled={quizSubmitted}
                        onClick={() => handlesQuizOptionSelect(activeQuizIndex, oIdx)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl text-sm font-semibold tracking-tight transition-all text-left border ${
                          showCorrect
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-extrabold"
                            : showWrong
                            ? "bg-rose-500/10 border-rose-500 text-rose-400 font-extrabold"
                            : isSelected
                            ? "bg-indigo-600/10 border-indigo-500 text-white"
                            : "bg-zinc-905 bg-zinc-900/40 border-zinc-805 hover:bg-zinc-800/40 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 text-xs rounded-full flex items-center justify-center font-bold ${
                            isSelected ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {oIdx + 1}
                          </span>
                          <span>{option}</span>
                        </div>

                        {quizSubmitted && isCorrect && (
                          <span className="text-xs text-emerald-400 font-black">정확한 사료 팩트</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanations shown immediately after submitting */}
              {quizSubmitted && (
                <div className="mt-6 p-5 rounded-2xl bg-zinc-900 border border-zinc-820 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold leading-none">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>역사교사 정통 사실 관계 및 증고 해설</span>
                  </div>
                  <p className="text-zinc-300 text-xs font-mono leading-relaxed whitespace-pre-line">
                    {QUIZ_QUESTIONS[activeQuizIndex].explanation}
                  </p>
                </div>
              )}

              {/* Arrow navigation of questions */}
              <div className="flex justify-between items-center pt-6 border-t border-zinc-900 mt-6 md:mt-12">
                <button
                  disabled={activeQuizIndex === 0}
                  onClick={() => setActiveQuizIndex((idx) => idx - 1)}
                  className="bg-zinc-900 hover:bg-zinc-850 disabled:opacity-30 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed"
                >
                  이전 문항
                </button>
                <button
                  disabled={activeQuizIndex === QUIZ_QUESTIONS.length - 1}
                  onClick={() => setActiveQuizIndex((idx) => idx + 1)}
                  className="bg-zinc-900 hover:bg-zinc-850 disabled:opacity-30 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed"
                >
                  다음 문항
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Tab 6: Collaborative classroom textbook workshop */}
        {activeTab === "activity" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Textbook Guide Sheet - Left Block layout */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#161618] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-lg">
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-extrabold px-3 py-1 rounded-full border border-indigo-900/30">
                  활동 목표 및 안내
                </span>
                <h3 className="text-xl font-black text-zinc-100 tracking-tight leading-snug">
                  한·일 평화 공동 교과서 집필하기
                </h3>
                
                <p className="text-xs text-zinc-350 leading-relaxed font-semibold">
                  한일 양국의 왜곡된 영토주의적 감정 대립을 극복하고, 양국의 청소년 동반자가 공동으로 평화지향적인 역사 공동 교과서 단원을 작성해 봅니다.
                </p>

                <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-830 space-y-3.5 text-xs text-zinc-300">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                    <CheckSquare className="w-4 h-4 shrink-0" />
                    <span>필수 기술 작성 조건</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside font-medium text-zinc-400 leading-normal pl-1">
                    <li>앞서 배운 한일 고사료 중 최소 <strong className="text-zinc-200">2개 이상</strong>을 역사 근거로 지목할 것 (예: 태정관 지령, 세종실록지리지 등)</li>
                    <li>일방적 비방이나 감정을 배제하고 <strong className="text-zinc-200">사실(Fact) 중심의 서술</strong>을 견지할 것</li>
                    <li>공동 번영의 미래지향적 문장(<strong className="text-zinc-200">10줄 이내</strong>)으로 아름답게 기술할 것</li>
                  </ul>
                </div>
              </div>

              {/* Discussion Debate Questions Card */}
              <div className="bg-[#161618] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-lg">
                <h3 className="text-base font-black text-zinc-100 tracking-tight">
                  심도 토론 및 개인 비망 성찰 질문
                </h3>

                <div className="space-y-3.5">
                  {DISCUSSION_QUESTIONS.map((dq, idx) => (
                    <div key={dq.id} className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-850 space-y-2">
                      <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-extrabold">
                        <span className="w-5 h-5 bg-indigo-500/10 text-indigo-400 text-[10px] rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>성찰 토론 질문</span>
                      </div>
                      <p className="text-xs text-zinc-200 leading-normal font-semibold">
                        {dq.question}
                      </p>
                      
                      {/* Reflexive Textarea */}
                      <textarea
                        value={proposal.reflections[dq.id] || ""}
                        onChange={(e) => {
                          const nextRef = { ...proposal.reflections, [dq.id]: e.target.value };
                          saveProposalToLocalAndState({ ...proposal, reflections: nextRef });
                        }}
                        placeholder="이 조항의 한일 갈등 타협 상황과 역사 원인을 참고하여 본인의 입장을 작성해 마스터 지식을 구축하세요..."
                        className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-indigo-500/50 rounded-xl p-3 text-xs text-zinc-100 mt-2 focus:ring-0 placeholder:text-zinc-650 min-h-[90px] leading-relaxed transition-all font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Sheet Form and Realtime Feedback AI - Right Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Proposal Form */}
              <div className="bg-[#161618] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-lg">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                  <span className="text-xs text-indigo-400 font-extrabold inline-flex items-center gap-1.5">
                    <Edit2 className="w-4 h-4 text-indigo-500" />
                    <span>한·일 학생 공동 교과서 - 독도 서술안 초본</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold font-mono">10줄 이내 서술 준수</span>
                </div>

                <div className="space-y-4">
                  
                  {/* Row for Authors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 block">모둠원 이름 (한/일 공동 집필자)</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={proposal.authorName}
                          onChange={(e) => saveProposalToLocalAndState({ ...proposal, authorName: e.target.value })}
                          placeholder="예: 홍길동 (한국 학생) / 사토 미오 (일본 학생)"
                          className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 px-10 text-xs text-zinc-100 focus:ring-0 placeholder:text-zinc-650 tracking-tight font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 block">제안하는 독도 단원 제목</label>
                      <input
                        type="text"
                        value={proposal.title}
                        onChange={(e) => saveProposalToLocalAndState({ ...proposal, title: e.target.value })}
                        placeholder="예: 미래 세대를 위한 평화와 공동 번영의 동해"
                        className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 px-4 text-xs text-zinc-100 focus:ring-0 placeholder:text-zinc-650 tracking-tight font-medium"
                      />
                    </div>
                  </div>

                  {/* Textbook content text area */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-zinc-400 block">공동 집필 본문 (사료 최소 2개 수권 지목)</label>
                      <span className="text-[10px] text-zinc-500 font-bold">작성 예 참조 가능</span>
                    </div>

                    <textarea
                      value={proposal.content}
                      onChange={(e) => saveProposalToLocalAndState({ ...proposal, content: e.target.value })}
                      placeholder={`(예시 서술) 동해의 평화로운 섬 독도는 역사적 사료를 통해 그 지위가 증명된다. 한국의 『세종실록지리지(1454년)』에는 울릉도와 독도(우산)가 서로 거리가 멀지 않아 날씨가 맑으면 육안으로 관측 가능하다고 기록되어 양국의 고대 생활권과 인식을 보여준다. 또한, 일본 메이지 정부 최고 기관이 내린 『태정관 지령(1877년)』에서도 울릉도와 독도가 일본과 관계없는 조선의 영역임을 분명히 명시했다.`}
                      className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-indigo-500 rounded-2xl p-4 text-xs text-zinc-100 placeholder:text-zinc-650 min-h-[160px] leading-relaxed transition-all focus:ring-0 font-mono"
                    />
                  </div>

                  {/* Feedback button trigger */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleRequestAIFeedback}
                      disabled={isSubmitting || !proposal.content.trim()}
                      className={`flex-1 py-3 px-6 rounded-2xl text-xs font-black tracking-tight transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                        isSubmitting || !proposal.content.trim()
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-550 hover:to-violet-550 text-white shadow-indigo-600/10"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                          인공지능 사료 대조 검증 중...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4.5 h-4.5" />
                          🤖 AI 평화교육 비서관의 전방위 피드백 받기
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        saveProposalToLocalAndState({
                          id: "proposal-sandbox",
                          authorName: "",
                          title: "",
                          content: "",
                          reflections: {
                            "dq-1": "",
                            "dq-2": "",
                            "dq-3": ""
                          }
                        });
                        setAiFeedback("");
                        setErrorMessage("");
                      }}
                      className="bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                    >
                      내용 새로고침
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="bg-rose-500/10 border border-rose-900/30 text-rose-400 p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                      <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                </div>
              </div>

              {/* AI Terminal Feedback Board */}
              {(isSubmitting || aiFeedback) && (
                <div className="bg-[#111112] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
                  
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-400 tracking-wider">
                        SECURE FEEDBACK CONSOLE
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono">
                      Gemini Multilateral Evaluation
                    </span>
                  </div>

                  {isSubmitting ? (
                    <div className="py-8 text-center space-y-3.5">
                      <div className="inline-flex py-2 px-4 rounded-full bg-zinc-900 border border-zinc-850 items-center gap-2">
                        <span className="w-4 h-4 border-2 border-indigo-500/25 border-t-indigo-400 rounded-full animate-spin"></span>
                        <span className="text-[11px] font-mono text-zinc-400 font-bold">Analyzing historic data and tone accuracy...</span>
                      </div>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed font-semibold">
                        비서관이 제출하신 서술안에 인용된 한일 양국 사료의 진위성을 체계적으로 검증하고 기록 균형을 체크하고 있습니다. 잠시만 기다려주십시오.
                      </p>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-xs text-zinc-350 leading-relaxed font-mono whitespace-pre-line text-[11px] bg-zinc-950/40 p-4.5 rounded-2xl border border-zinc-850/80 max-h-[460px] overflow-y-auto">
                      {aiFeedback}
                    </div>
                  )}
                </div>
              )}

              {/* Evaluator Sign-off and Print Box */}
              <div className="bg-[#161618] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-lg text-center">
                <div className="text-xs text-zinc-400 font-bold">집필안 평가 및 상호 서명 완결</div>
                
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
                  <div className="border border-zinc-800 rounded-xl p-3 bg-zinc-900/60 flex flex-col justify-end min-h-[80px]">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">한국 학생 위원</span>
                    <div className="text-xs font-bold font-serif text-zinc-300 italic">
                      {proposal.authorName ? proposal.authorName.split("/")[0] || "서명 미완" : "서명대기"}
                    </div>
                  </div>
                  <div className="border border-zinc-800 rounded-xl p-3 bg-zinc-900/60 flex flex-col justify-end min-h-[80px]">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">일본 학생 위원</span>
                    <div className="text-xs font-bold font-serif text-zinc-300 italic">
                      {proposal.authorName && proposal.authorName.includes("/") ? proposal.authorName.split("/")[1] || "서명 미완" : "서명대기"}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-500 font-bold max-w-xs mx-auto leading-normal">
                  본 서술안은 양 세대의 주체적 검인정을 거쳐 동아시아 평화 아카이브에 영구 기록 보존됩니다.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* Tab 7: AI Reflection Essay Writer */}
        {activeTab === "reflection" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade">
            
            {/* Left Column: Settings and keywords */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Settings Card */}
              <div className="bg-[#161618] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-lg">
                <div>
                  <h3 className="text-xl font-bold text-zinc-100">소감문 설정</h3>
                  <p className="text-xs text-zinc-500 mt-1 font-semibold">
                    작성자 이름과 글의 전반적인 어조, 분량을 조정합니다.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">학생 이름</label>
                    <input
                      type="text"
                      value={reflectionName}
                      onChange={(e) => setReflectionName(e.target.value)}
                      placeholder="예: 홍길동 (미입력 시 '배움이'로 지정)"
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs text-zinc-100 focus:ring-0 placeholder:text-zinc-650 tracking-tight font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">글의 감정 선호도 및 톤</label>
                    <select
                      value={reflectionEmotion}
                      onChange={(e) => setReflectionEmotion(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs text-zinc-300 focus:ring-0 font-medium cursor-pointer"
                    >
                      <option value="진지하고 학구적인 분위기">진지하고 학구적인 성찰</option>
                      <option value="미래지향적인 상생의 평화">미래지향적 공존과 평화</option>
                      <option value="역사적 증명과 수호 다짐">고사료 증명과 수호 다짐</option>
                      <option value="한일 세계시민으로서의 다각적 시각">글로벌 세계시민적 대조</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">희망 분량</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "short", label: "단문 (300자)" },
                        { id: "medium", label: "중문 (500자)" },
                        { id: "long", label: "장문 (800자)" }
                      ].map((len) => (
                        <button
                          key={len.id}
                          onClick={() => setReflectionLength(len.id)}
                          className={`py-2 px-3 rounded-lg text-[11px] font-bold border transition-all cursor-pointer text-center ${
                            reflectionLength === len.id
                              ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                              : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-350"
                          }`}
                        >
                          {len.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Keywords Card with Chips */}
              <div className="bg-[#161618] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-lg">
                <div>
                  <h3 className="text-xl font-bold text-zinc-100">핵심 소감 키워드</h3>
                  <p className="text-xs text-zinc-500 mt-1 font-semibold">
                    클릭하여 키워드를 즉시 추가하거나, 직접 쉼표로 구분하여 작성해 주세요.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Quick toggle chips */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">추천 키워드 칩 (클릭 시 추가)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "태정관 지령",
                        "세종실록지리지",
                        "삼국접양지도",
                        "87.4km 지리적 가시성",
                        "동해 평화공동체",
                        "한일 미래세대",
                        "명료한 사료 팩트",
                        "평화적 교류협력",
                        "지리적 근접선",
                        "주체적 역사 연구"
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const trimmed = reflectionKeywords.trim();
                            if (trimmed.includes(tag)) return;
                            const newVal = trimmed
                              ? trimmed.endsWith(",") || trimmed.endsWith(", ")
                                ? `${trimmed} ${tag}`
                                : `${trimmed}, ${tag}`
                              : tag;
                            setReflectionKeywords(newVal);
                          }}
                          className="text-[10px] bg-zinc-900 hover:bg-indigo-950/40 border border-zinc-800 text-zinc-400 hover:text-indigo-400 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer active:scale-95"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">설정된 키워드 목록</label>
                    <textarea
                      value={reflectionKeywords}
                      onChange={(e) => setReflectionKeywords(e.target.value)}
                      placeholder="예: 태정관 지령, 세종실록지리지, 평화상생"
                      className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-650 min-h-[80px] leading-relaxed transition-all focus:ring-0 font-mono font-medium"
                    />
                  </div>

                  <button
                    onClick={handleGenerateReflection}
                    disabled={isGeneratingReflection || !reflectionKeywords.trim()}
                    className={`w-full py-3.5 px-6 rounded-2xl text-xs font-black tracking-tight transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                      isGeneratingReflection || !reflectionKeywords.trim()
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-850"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25"
                    }`}
                  >
                    {isGeneratingReflection ? (
                      <>
                        <span className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        AI 독도 소감문 집필 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4.5 h-4.5 text-indigo-200" />
                        AI 소감문 작성하기 (자동 생성)
                      </>
                    )}
                  </button>

                  {reflectionError && (
                    <div className="bg-rose-500/10 border border-rose-900/30 text-rose-450 p-4.5 rounded-2xl text-xs font-semibold flex items-start gap-2">
                      <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{reflectionError}</span>
                    </div>
                  )}

                  {reflectionKeywords && (
                    <button
                      onClick={() => {
                        setReflectionKeywords("");
                        setGeneratedReflection("");
                        setReflectionError("");
                      }}
                      className="w-full py-2 px-4 rounded-xl text-xs bg-zinc-900 hover:bg-zinc-850 text-zinc-500 hover:text-zinc-300 border border-zinc-850 transition-all font-bold cursor-pointer"
                    >
                      키워드 내용 초기화
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: AI Terminal Statement Sheet */}
            <div className="lg:col-span-7">
              {isGeneratingReflection ? (
                <div className="bg-[#111112] border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 space-y-6 shadow-xl relative overflow-hidden text-center h-full min-h-[460px] flex flex-col justify-center items-center">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl"></div>
                  
                  <div className="space-y-4">
                    <div className="inline-flex p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                      <span className="relative flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 border-2 border-indigo-500/50 border-t-indigo-400 animate-spin"></span>
                      </span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <h4 className="text-lg font-bold text-white">독도 영토성찰 에세이 작성 엔진 가동</h4>
                      <p className="text-xs text-zinc-500 font-bold uppercase font-mono tracking-wider">
                        Gemini 3.5 High Performance Inference
                      </p>
                    </div>

                    <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed font-semibold">
                      학생이 선택한 배움 키워드군 <strong className="text-indigo-400 font-bold">"{reflectionKeywords}"</strong>에 관련된 영토 지리학적 사실과 평화 담론을 교차 분석하여 어조가 반영된 고품격 성찰문을 영문화·국문화 집필하고 있습니다. 잠시만 기다려주세요.
                    </p>
                  </div>
                </div>
              ) : generatedReflection ? (
                <div className="bg-[#111112] border border-zinc-800 rounded-[2.5rem] p-6 md:p-10 space-y-6 shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl"></div>
                  
                  <div className="space-y-4">
                    {/* Header bar */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-4 z-10 relative">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-mono font-bold text-emerald-500 tracking-wider">
                          DOKDO REFLECTION COMPLETED
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono">
                        영토 아카이브 소감 수권서
                      </span>
                    </div>

                    {/* Styled Document content */}
                    <div className="border border-zinc-800 bg-[#0E0E10]/70 p-6 rounded-2xl text-zinc-300 leading-relaxed text-xs max-h-[500px] overflow-y-auto whitespace-pre-wrap font-sans space-y-4">
                      {generatedReflection}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-900/60 z-10 relative">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedReflection);
                        alert("소감문이 클립보드에 성공적으로 복사되었습니다. 숙제나 보고서 제출용으로 자유롭게 활용하세요!");
                      }}
                      className="bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer text-center"
                    >
                      📋 소감문 클립보드 복사
                    </button>
                    
                    <button
                      onClick={() => {
                        const blob = new Blob([generatedReflection], { type: "text/plain;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `${reflectionName || "독도배움소감문"}_소감문.txt`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      메모장 파일(.txt)로 저장
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#111112]/45 border border-zinc-850 border-dashed rounded-[2.5rem] p-8 md:p-12 text-center h-full min-h-[460px] flex flex-col justify-center items-center text-zinc-500">
                  <div className="w-14 h-14 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 mb-4 animate-bounce">
                    <Sparkles className="w-6 h-6 text-zinc-500" />
                  </div>
                  <h4 className="text-zinc-300 font-bold text-base mb-1">소감문 자동 생성 대기 중</h4>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-normal font-semibold">
                    왼쪽 패널에서 학습 과정에서 마음에 와닿은 역사적 사료나 평화 키워드를 입력하시고, <strong className="text-zinc-400 font-semibold">'AI 소감문 작성하기'</strong> 버튼을 클릭하세요.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
