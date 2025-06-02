import axios from 'axios'

// создаём экземпляр axios с базовым URL из .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// -------------------------
// Типы для работы с пользователем
// -------------------------

/** Входная схема для создания/обновления пользователя */
export interface UserCreate {
  telegram_id: number
  username?: string
  first_name?: string
  last_name?: string
}

/** Ответ от сервера при создании/получении пользователя */
export interface UserOut {
  telegram_id: number
  username?: string
  first_name?: string
  last_name?: string
  id: string       // UUID внутреннего пользователя
  created_at: string // timestamp создания
}

/** Создать или обновить пользователя */
export const createUser = (payload: UserCreate) => {
  return api.post<UserOut>('/users/', payload)
}

// -------------------------
// Типы и функции для работы с вопросами
// -------------------------

/** Структура одного вопроса из ответа сервера */
export interface QuestionOut {
  id: string
  data: {
    question: string
    question_image: string | null
    options: string[]
    correct_index: number
  }
  country: string
  language: string
  topic: string
}

/** Параметры фильтра для запроса вопросов */
export interface GetQuestionsParams {
  user_id: string
  country?: string
  language?: string
  mode?: string
  topic?: string
}

/**
 * Получить вопросы с сервера
 */
export const getQuestions = (params: GetQuestionsParams) => {
  return api.get<QuestionOut[]>('/questions/', { params })
}

// -------------------------
// Типы и функции для статистики и ответов
// -------------------------

/** Статистика пользователя */
export interface UserStats {
  user_id: string
  answered: number
  correct: number
  total_questions: number
}

/** Получить статистику пользователя по его ID */
export const getUserStats = (userId: string) => {
  return api.get<UserStats>(`/stats?user_id=${userId}`)
}

/** Параметры для отправки одного ответа */
export interface AnswerSubmit {
  user_id: string
  question_id: number
  is_correct: boolean
}

/** Отправить ответ пользователя */
export const submitAnswer = (payload: AnswerSubmit) => {
  return api.post('/submit_answer', payload)
}

export default api