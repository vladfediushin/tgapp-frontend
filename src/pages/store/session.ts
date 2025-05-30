// frontend/src/store/session.ts
import { create } from 'zustand'

// Ответ пользователя на один вопрос
interface Answer {
  questionId: string  // UUID вопроса
  selectedIndex: number
  isCorrect: boolean
}

// Состояние сессии пользователя
interface SessionState {
  // Внутренний UUID пользователя
  userId: string | null
  setUserId: (id: string) => void

  answers: Answer[]
  addAnswer: (answer: Answer) => void
  resetAnswers: () => void
}

export const useSession = create<SessionState>((set) => ({
  userId: null,
  setUserId: (id: string) => set({ userId: id }),

  answers: [],
  addAnswer: (answer) =>
    set((state) => {
      // Не дублировать ответы
      if (state.answers.some((a) => a.questionId === answer.questionId)) {
        return state
      }
      return { answers: [...state.answers, answer] }
    }),

  resetAnswers: () => set({ answers: [] }),
}))
