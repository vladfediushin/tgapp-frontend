// frontend/src/api/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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

// User is fetched/created in Home.tsx: fetch(`${import.meta.env.VITE_API_BASE_URL}/users/`

// Тип, которым бэкенд отвечает за один вопрос
export interface QuestionOut {
  id: string          // UUID
  data: {
    question_itself: string
    question_image: string | null
    options: string[]
    correct_index: number
  }
  country: string
  language: string
  topic: string
}

// Параметры фильтрации
export interface GetQuestionsParams {
  country?: string
  language?: string
  topic?: string
}

/**
 * Получить список вопросов с сервера
 * @param params — необязательные параметры country, language, topic
 * @returns Promise<AxiosResponse<QuestionOut[]>>
 */
export const getQuestions = (params: GetQuestionsParams = {}) => {
  return api.get<QuestionOut[]>('/questions/', { params })
}


export default api