// frontend/src/store/session.ts
import { create } from 'zustand'

interface Answer {
  questionId: string
  selectedIndex: number
  isCorrect: boolean
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

  answers: Answer[]
  addAnswer: (answer: Answer) => void
  resetAnswers: () => void
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

  answers: [],
  addAnswer: (answer) =>
    set((state) => {
      if (state.answers.some((a) => a.questionId === answer.questionId)) {
        return state
      }
      return { answers: [...state.answers, answer] }
    }),

  resetAnswers: () => set({ answers: [] }),
}))
