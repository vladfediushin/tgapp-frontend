// frontend/src/store/ts
import { create } from 'zustand'
import api, { DailyProgress, UserOut, ExamSettingsResponse } from '../api/api'

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
  setCachedUser: (user: UserOut) => void;
  clearCachedUser: () => void;

  // Exam settings caching
  cachedExamSettings: ExamSettingsResponse | null;
  setCachedExamSettings: (settings: ExamSettingsResponse) => void;
  clearCachedExamSettings: () => void;

  // Remaining questions count caching
  cachedRemainingCount: number | null;
  remainingCountKey: string | null; // userId-country-language for cache invalidation
  setCachedRemainingCount: (count: number, userId: string, country: string, language: string) => void;
  clearCachedRemainingCount: () => void;

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

  // User caching - simple cache without TTL
  cachedUser: null,
  setCachedUser: (user) => set({ cachedUser: user }),
  clearCachedUser: () => set({ cachedUser: null }),

  // Exam settings caching - simple cache without TTL
  cachedExamSettings: null,
  setCachedExamSettings: (settings) => set({ cachedExamSettings: settings }),
  clearCachedExamSettings: () => set({ cachedExamSettings: null }),

  // Remaining count caching - simple cache with key validation
  cachedRemainingCount: null,
  remainingCountKey: null,
  setCachedRemainingCount: (count, userId, country, language) => {
    const key = `${userId}-${country}-${language}`;
    set({
      cachedRemainingCount: count,
      remainingCountKey: key
    });
  },
  clearCachedRemainingCount: () => set({
    cachedRemainingCount: null,
    remainingCountKey: null
  }),

  examCountry: 'am',
  setExamCountry: (c) => {
    set({ examCountry: c });
    // Clear remaining count cache when country changes
    set({
      cachedRemainingCount: null,
      remainingCountKey: null
    });
  },

  examLanguage: 'ru',
  setExamLanguage: (l) => {
    set({ examLanguage: l });
    // Clear remaining count cache when language changes
    set({
      cachedRemainingCount: null,
      remainingCountKey: null
    });
  },
  
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
  const { cachedUser, setCachedUser } = useSession.getState();
  
  // Return cached user if exists
  if (cachedUser) {
    console.log('🎯 Using cached user data');
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
  const { setCachedUser, clearCachedExamSettings } = useSession.getState();
  setCachedUser(updatedUser);
  
  // If exam settings changed, invalidate exam settings cache
  if (updates.exam_country || updates.exam_language || updates.exam_date || updates.daily_goal) {
    clearCachedExamSettings();
    console.log('♻️ Exam settings cache cleared due to user update');
  }
  
  console.log('✅ User updated and cache refreshed');
  return updatedUser;
};

// Helper function to update exam settings and refresh user cache
export const setExamSettingsAndCache = async (userId: string, settings: any) => {
  // Make the API call to update exam settings
  const response = await api.post(`/users/${userId}/exam-settings`, settings);
  
  // Get session store functions
  const { cachedUser, setExamDate, setManualDailyGoal, setCachedExamSettings } = useSession.getState();
  
  // Update session store with the new settings that were just saved
  if (settings.exam_date !== undefined) {
    setExamDate(settings.exam_date);
  }
  if (settings.daily_goal !== undefined) {
    setManualDailyGoal(settings.daily_goal);
  }
  
  // Cache the exam settings response
  setCachedExamSettings(response.data);
  
  // Also refresh user cache if possible
  if (userId) {
    // Refresh user cache by fetching updated user data
    const userResponse = await api.get<UserOut>(`/users/${userId}`);
    const { setCachedUser } = useSession.getState();
    setCachedUser(userResponse.data);
  }
  
  console.log('✅ Exam settings updated, session store and user cache refreshed');
  return response.data;
};

// Helper function to load exam settings with caching
export const loadExamSettingsWithCache = async (userId: string): Promise<ExamSettingsResponse> => {
  const { cachedExamSettings, setCachedExamSettings } = useSession.getState();
  
  // Return cached settings if exists
  if (cachedExamSettings) {
    console.log('🎯 Using cached exam settings');
    return cachedExamSettings;
  }
  
  // Load fresh data
  console.log('🔄 Loading fresh exam settings...');
  const response = await api.get<ExamSettingsResponse>(`/users/${userId}/exam-settings`);
  const settingsData = response.data;
  
  // Cache the result
  setCachedExamSettings(settingsData);
  
  return settingsData;
};

// Helper function to load remaining count with caching
export const loadRemainingCountWithCache = async (
  userId: string, 
  country: string, 
  language: string
): Promise<number> => {
  const { 
    cachedRemainingCount, 
    remainingCountKey,
    setCachedRemainingCount 
  } = useSession.getState();
  
  const expectedKey = `${userId}-${country}-${language}`;
  
  // Return cached count if exists and key matches (same user/country/language)
  if (cachedRemainingCount !== null && remainingCountKey === expectedKey) {
    console.log('🎯 Using cached remaining count');
    return cachedRemainingCount;
  }
  
  // Load fresh data
  console.log('🔄 Loading fresh remaining count...');
  const response = await api.get<{ remaining_count: number }>(`/questions/remaining-count`, {
    params: {
      user_id: userId,
      country,
      language
    }
  });
  const count = response.data.remaining_count;
  
  // Cache the result
  setCachedRemainingCount(count, userId, country, language);
  
  return count;
};

// Helper function to invalidate remaining count cache (call when user answers correctly)
export const invalidateRemainingCountCache = () => {
  const { clearCachedRemainingCount } = useSession.getState();
  clearCachedRemainingCount();
  console.log('♻️ Remaining count cache cleared');
};