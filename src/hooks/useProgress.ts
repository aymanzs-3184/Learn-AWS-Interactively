import { useCallback, useEffect, useState } from 'react';
import { LabId, UserProgress } from '../types/aws';

const STORAGE_KEY = 'cloudbench_aws_progress_v1';

const DEFAULT_PROGRESS: UserProgress = {
  completedLabs: [],
  completedStudyModules: [],
  masteredFlashcards: [],
  quizScores: {},
  checkedMilestones: [],
  activeCertId: 'dva-c02',
};

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_PROGRESS;
      const parsed = JSON.parse(raw) as Partial<UserProgress>;
      return {
        completedLabs: Array.isArray(parsed.completedLabs) ? parsed.completedLabs : [],
        completedStudyModules: Array.isArray(parsed.completedStudyModules)
          ? parsed.completedStudyModules
          : [],
        masteredFlashcards: Array.isArray(parsed.masteredFlashcards)
          ? parsed.masteredFlashcards
          : [],
        quizScores: parsed.quizScores && typeof parsed.quizScores === 'object' ? parsed.quizScores : {},
        checkedMilestones: Array.isArray(parsed.checkedMilestones) ? parsed.checkedMilestones : [],
        activeCertId: typeof parsed.activeCertId === 'string' ? parsed.activeCertId : 'dva-c02',
      };
    } catch {
      return DEFAULT_PROGRESS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors in restricted contexts
    }
  }, [progress]);

  const markLabCompleted = useCallback((labId: LabId) => {
    setProgress((prev) => {
      if (prev.completedLabs.includes(labId)) return prev;
      return {
        ...prev,
        completedLabs: [...prev.completedLabs, labId],
      };
    });
  }, []);

  const toggleStudyModule = useCallback((moduleId: string) => {
    setProgress((prev) => {
      const exists = prev.completedStudyModules.includes(moduleId);
      return {
        ...prev,
        completedStudyModules: exists
          ? prev.completedStudyModules.filter((id) => id !== moduleId)
          : [...prev.completedStudyModules, moduleId],
      };
    });
  }, []);

  const toggleFlashcardMastered = useCallback((cardId: string, mastered: boolean) => {
    setProgress((prev) => {
      const exists = prev.masteredFlashcards.includes(cardId);
      if (mastered && !exists) {
        return { ...prev, masteredFlashcards: [...prev.masteredFlashcards, cardId] };
      }
      if (!mastered && exists) {
        return {
          ...prev,
          masteredFlashcards: prev.masteredFlashcards.filter((id) => id !== cardId),
        };
      }
      return prev;
    });
  }, []);

  const recordQuizScore = useCallback((deckId: string, percent: number) => {
    setProgress((prev) => {
      const existing = prev.quizScores[deckId];
      const bestPercent = existing ? Math.max(existing.bestPercent, percent) : percent;
      return {
        ...prev,
        quizScores: {
          ...prev.quizScores,
          [deckId]: {
            bestPercent,
            attempts: (existing?.attempts ?? 0) + 1,
            lastCompletedAt: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const toggleMilestone = useCallback((milestoneId: string) => {
    setProgress((prev) => {
      const exists = prev.checkedMilestones.includes(milestoneId);
      return {
        ...prev,
        checkedMilestones: exists
          ? prev.checkedMilestones.filter((id) => id !== milestoneId)
          : [...prev.checkedMilestones, milestoneId],
      };
    });
  }, []);

  const setActiveCertId = useCallback((certId: string) => {
    setProgress((prev) => ({ ...prev, activeCertId: certId }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
  }, []);

  return {
    progress,
    markLabCompleted,
    toggleStudyModule,
    toggleFlashcardMastered,
    recordQuizScore,
    toggleMilestone,
    setActiveCertId,
    resetProgress,
  };
}
