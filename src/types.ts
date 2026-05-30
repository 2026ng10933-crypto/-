export interface LearnCard {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  richContent?: string;
  badge?: string;
}

export interface LearnChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  summary: string;
  topics: LearnCard[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ActivityProposal {
  id: string;
  authorName: string;
  title: string;
  content: string;
  reflections: { [questionId: string]: string };
  feedback?: string;
  submittedAt?: string;
}
