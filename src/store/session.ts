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

  answers: Answer[]
  addAnswer: (answer: Answer) => void
  resetAnswers: () => void
}

export const useSession = create<SessionState>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),

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
