// frontend/src/store/ts
import { create } from 'zustand'
import api from '../api/api'

interface Answer {
  questionId: string
  selectedIndex: number
  isCorrect: boolean
}

interface AnswersByDay {
  date: string;
  total_answers: number;
  correct_answers: number;
  incorrect_answers: number;
}

interface SessionState {
  userId: string | null;
  setUserId: (id: string) => void

  examCountry: string
  setExamCountry: (c: string) => void

  examLanguage: string
  setExamLanguage: (l: string) => void
  
  uiLanguage: string 
  setUiLanguage: (l: string) => void

  topics: string[]
  setTopics: (topics: string[]) => void

  examDate: string | null
  setExamDate: (date: string | null) => void

  manualDailyGoal: number | null
  setManualDailyGoal: (goal: number | null) => void

  dailyProgress: number | null
  dailyProgressDate: string | null  // дата, для которой кэшированы данные
  setDailyProgress: (count: number, date: string) => void

  answers: Answer[]
  addAnswer: (answer: Answer) => void
  resetAnswers: () => void

  streakDays: AnswersByDay[];
  setStreakDays: (days: AnswersByDay[]) => void;
}

export const useSession = create<SessionState>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),

  examCountry: 'am',
  setExamCountry: (c) => set({ examCountry: c }),

  examLanguage: 'ru',
  setExamLanguage: (l) => set({ examLanguage: l }),
  
  uiLanguage: 'ru',
  setUiLanguage: (l) => set({ uiLanguage: l }),

  topics: [],
  setTopics: (topics) => set({ topics }),

  examDate: null,
  setExamDate: (date) => set({ examDate: date }),
  manualDailyGoal: null,
  setManualDailyGoal: (goal) => set({ manualDailyGoal: goal }),

  dailyProgress: null,
  dailyProgressDate: null,
  setDailyProgress: (count, date) => set({ 
    dailyProgress: count, 
    dailyProgressDate: date 
  }),

  answers: [],
  addAnswer: (answer) =>
    set((state) => {
      if (state.answers.some((a) => a.questionId === answer.questionId)) {
        return state
      }
      return { answers: [...state.answers, answer] }
    }),

  resetAnswers: () => set({ answers: [] }),

  streakDays: [],
  setStreakDays: (days) => set({ streakDays: days }),
}))

export const getDailyProgress = (userId: string, targetDate?: string) => {
  const params = targetDate ? `?target_date=${targetDate}` : ''
  return api.get<DailyProgress>(`/users/${userId}/daily-progress${params}`)
}