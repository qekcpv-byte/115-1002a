export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface StageMeta {
  number: StageNumber;
  name: string;
  badge: string;
  desc: string;
  tag: string;
}

export interface FollowUpItem {
  question: string;
  answer?: string;
  isLoading?: boolean;
}

export interface StageResult {
  stage: StageNumber;
  unit: string;
  content: string;
  followUps: string[];
  userFollowUps: FollowUpItem[];
  timestamp: string;
}

export interface CanvasQuestion {
  id: string;
  number: number;
  type: "choice" | "essay" | "diagram";
  score: number;
  text: string;
  options?: string[];
  difficultySource: string;
  diagnosticNote: string;
  distractorAnalysis: string;
  readingHint: string;
  answer: string;
}

export interface CanvasDocument {
  docTitle: string;
  grade: string;
  school: string;
  timeLimit: string;
  totalScore: number;
  instructions: string;
  questions: CanvasQuestion[];
}

export interface MathTopicPreset {
  title: string;
  grade: string;
  desc: string;
  sampleProblems: string;
  iconName: string;
}

export interface UploadedFileMeta {
  base64: string;
  mimeType: string;
  name: string;
  size?: number;
  type: "image" | "pdf" | "docx" | "text" | "other";
  previewUrl?: string;
  extractedText?: string;
}
