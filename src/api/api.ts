// frontend/src/api/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000', // при деплое заменишь на свой домен
})

// Тип для отправки ответа
export interface AnswerSubmit {
  user_id: number
  question_id: number
  selected_index: number
  is_correct: boolean
}

// Отправка одного ответа
export const submitAnswer = (payload: AnswerSubmit) => {
  return api.post('/submit_answer', payload)
}

export interface UserStats {
  user_id: number
  answered: number
  correct: number
  total_questions: number
}

export const getUserStats = (userId: number) => {
  return api.get<UserStats>(`/stats?user_id=${userId}`)
}

export default api