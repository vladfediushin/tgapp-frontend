// frontend/src/store/ts
import { create } from 'zustand'
import api, { DailyProgress } from '../api/api'
import { UserOut } from '../types'

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

  // User data caching
  cachedUser: UserOut | null;
  userCacheTimestamp: number;
  setCachedUser: (user: UserOut) => void;
  isUserCacheFresh: (maxAgeMinutes?: number) => boolean;

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

export const useSession = create<SessionState>((set, get) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),

  // User caching
  cachedUser: null,
  userCacheTimestamp: 0,
  setCachedUser: (user) => set({ 
    cachedUser: user, 
    userCacheTimestamp: Date.now() 
  }),
  isUserCacheFresh: (maxAgeMinutes = 10) => {
    const { userCacheTimestamp } = get();
    const maxAge = maxAgeMinutes * 60 * 1000;
    return Date.now() - userCacheTimestamp < maxAge;
  },

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

// Helper function to load user with caching
export const loadUserWithCache = async (telegramId: number): Promise<UserOut> => {
  const { cachedUser, isUserCacheFresh, setCachedUser } = useSession.getState();
  
  // Return cached user if fresh (30 minutes)
  if (cachedUser && isUserCacheFresh(30)) {
    console.log('🎯 Using cached user data (30min TTL)');
    return cachedUser;
  }
  
  // Load fresh data
  console.log('🔄 Loading fresh user data...');
  const response = await api.get<UserOut>(`/users/by-telegram-id/${telegramId}`);
  const userData = response.data;
  
  // Cache the result
  setCachedUser(userData);
  
  return userData;
};

// Helper function to update user data and refresh cache
export const updateUserAndCache = async (userId: string, updates: any): Promise<UserOut> => {
  // Make the API call to update user
  const response = await api.patch<UserOut>(`/users/${userId}`, updates);
  const updatedUser = response.data;
  
  // Update the cache with fresh data
  const { setCachedUser } = useSession.getState();
  setCachedUser(updatedUser);
  
  console.log('✅ User updated and cache refreshed');
  return updatedUser;
};

// Helper function to update exam settings and refresh user cache
export const setExamSettingsAndCache = async (userId: string, settings: any) => {
  // Make the API call to update exam settings
  const response = await api.post(`/users/${userId}/exam-settings`, settings);
  
  // Get current cached user to refresh with telegram_id
  const { cachedUser } = useSession.getState();
  if (cachedUser?.telegram_id) {
    // Refresh user cache by fetching updated user data via telegram_id
    const userResponse = await api.get<UserOut>(`/users/by-telegram-id/${cachedUser.telegram_id}`);
    const { setCachedUser } = useSession.getState();
    setCachedUser(userResponse.data);
    console.log('✅ Exam settings updated and user cache refreshed');
  }
  
  return response.data;
};