export type AppTab = 'overview' | 'labs' | 'quizzes' | 'roadmap';

export type LabId =
  | 'iam-policy'
  | 's3-static-cors'
  | 'serverless-api'
  | 'vpc-networking'
  | 'compute-sizing';

export interface LabMeta {
  id: LabId;
  number: string;
  title: string;
  category: string;
  duration: string;
  difficulty: 'Foundational' | 'Intermediate';
  devAnalogy: string;
  summary: string;
  objectives: string[];
  cliSnippet: string;
  sdkSnippet: string;
  sdkPackage: string;
}

export interface MentalModelItem {
  id: string;
  category: 'compute' | 'storage' | 'networking' | 'security';
  devConcept: string;
  devContext: string;
  awsService: string;
  awsCode: string;
  whenToUse: string;
  gotcha: string;
  relatedLabId?: LabId;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  codeContext?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  distractorNote: string;
  domain: string;
}

export interface QuizDeck {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Developer Associate' | 'Exam Simulation';
  estimatedMinutes: number;
  description: string;
  questions: QuizQuestion[];
}

export interface CertDomainWeight {
  name: string;
  percentage: number;
  focus: string;
}

export interface CertMilestone {
  id: string;
  label: string;
  detail: string;
  actionType: 'lab' | 'quiz' | 'study';
  targetId?: string;
}

export interface CertificationTrack {
  id: string;
  code: string;
  title: string;
  level: 'Foundational' | 'Associate' | 'Professional';
  recommendedOrder: number;
  devVerdict: string;
  examFeeUsd: number;
  durationMinutes: number;
  questionCount: number;
  passingScore: number;
  prepWeeks: string;
  overview: string;
  keyServices: string[];
  domains: CertDomainWeight[];
  milestones: CertMilestone[];
}

export interface UserProgress {
  completedLabs: LabId[];
  quizScores: Record<string, { bestPercent: number; attempts: number; lastCompletedAt: string }>;
  checkedMilestones: string[];
  activeCertId: string;
}
