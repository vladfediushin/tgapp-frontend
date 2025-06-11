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
  examLanguage: string
  uiLanguage: string 
  setExamCountry: (c: string) => void
  setExamLanguage: (l: string) => void
  setUiLanguage: (l: string) => void

  answers: Answer[]
  addAnswer: (answer: Answer) => void
  resetAnswers: () => void
}

export const useSession = create<SessionState>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),

  examCountry: 'am',
  examLanguage: 'ru',
  uiLanguage: 'ru',
  setExamCountry: (c) => set({ examCountry: c }),
  setExamLanguage: (l) => set({ examLanguage: l }),
  setUiLanguage: (l) => set({ uiLanguage: l }),

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
