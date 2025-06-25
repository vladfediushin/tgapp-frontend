import axios, { AxiosResponse } from 'axios'

// создаём экземпляр axios с базовым URL из .env
export const api = axios.create({
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
  id: string
  created_at: string
  username?: string
  first_name?: string
  last_name?: string
  exam_country?: string
  exam_language?: string
  ui_language?: string
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
  batch_size?: number
  topic?: string | string[]
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
  answered: number
  correct: number
  total_questions: number
}

/** Получить статистику пользователя по его ID */
export const getUserStats = (userId: string) => {
  return api.get<UserStats>(`/users/${userId}/stats`)
}

/** Параметры для отправки одного ответа */
export interface AnswerSubmit {
  user_id: string
  question_id: number
  is_correct: boolean
}

/** Отправить ответ пользователя */
export const submitAnswer = (payload: AnswerSubmit) => {
  return api.post('/user_progress/submit_answer', payload)
}

export default api


/**Получить юзера по Telegram ID */

/**
 * Возвращает объект пользователя по его telegram_id
 */
export const getUserByTelegramId = async (
  telegramId: number
): Promise<AxiosResponse<UserOut>> => {
  return api.get<UserOut>(`/users/by-telegram-id/${telegramId}`)
}

/** Получить список тем для юзера */
export const getTopics = (country: string, language: string) =>
  api.get<{ topics: string[] }>(
    `/topics?country=${country}&language=${language}`,
  )