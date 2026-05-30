import { BookOpen, Compass, FileText, HelpCircle, Trophy, CheckCircle, Menu, X, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  completedTopics: string[];
  totalTopicsCount: number;
}

export default function Sidebar({ activeTab, setActiveTab, completedTopics, totalTopicsCount }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const progressPercent = Math.round((completedTopics.length / totalTopicsCount) * 100) || 0;

  const menuItems = [
    { id: "home", label: "배움터 대시보드", icon: Compass },
    { id: "chapter-1", label: "1차시: 지리적 특성 & 영토", icon: BookOpen },
    { id: "chapter-2", label: "2차시: 사료 & 역사적 권원", icon: FileText },
    { id: "chapter-3", label: "3차시: 현대 갈등 & 평화 상생", icon: HelpCircle },
    { id: "quiz", label: "주권 지식 테스트 (퀴즈)", icon: Trophy },
    { id: "activity", label: "평화 공동교과서 집필관", icon: CheckCircle },
    { id: "reflection", label: "AI 소감문 실시간 생성관", icon: Sparkles },
  ];

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="flex md:hidden items-center justify-between bg-[#0A0A0B] border-b border-zinc-900 px-4 py-3 sticky top-0 z-50 shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white p-1.5 rounded-lg">
            <Compass className="w-5 h-5" />
          </div>
          <span className="font-bold text-zinc-100 tracking-tight">독도 주권 교육 센터</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-zinc-400 hover:bg-zinc-900 rounded-lg focus:outline-hidden"
          id="mobile-menu-btn"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 w-72 bg-[#0D0D0F] border-r border-zinc-800 flex flex-col transition-transform duration-300 transform md:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 h-screen`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white p-2 rounded-xl shadow-md shadow-indigo-600/10">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-zinc-100 tracking-tight text-lg leading-tight">독도 영유권</h1>
              <p className="text-xs text-zinc-400 font-medium">평화 융합 교육 아카이브</p>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div className="p-6 border-b border-zinc-805 bg-[#161618]/40">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-zinc-400">나의 배움 진행도</span>
            <span className="text-xs font-bold text-indigo-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden mb-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            총 {totalTopicsCount}개의 핵심 지식 중 <strong className="text-zinc-100 font-semibold">{completedTopics.length}개</strong>를 완독하셨습니다.
          </p>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25"
                    : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
                }`}
              >
                <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-zinc-400"}`} />
                <span className="truncate text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Info Footer */}
        <div className="p-6 border-t border-zinc-800 bg-[#080809]">
          <div className="text-[11px] text-zinc-500 space-y-1 text-center font-medium">
            <p className="text-xs text-zinc-300 font-semibold mb-1">대한민국 역사·지리 평화교육위원회</p>
            <p>© 2026 독도 영토 주권 교재</p>
            <p className="text-[10px] text-zinc-600">중·고등 융합 수업 보조 아키이브</p>
          </div>
        </div>
      </aside>
    </>
  );
}
