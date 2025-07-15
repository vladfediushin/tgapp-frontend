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
  userCacheTimestamp: number;
  setCachedUser: (user: UserOut) => void;
  isUserCacheFresh: (maxAgeMinutes?: number) => boolean;

  // Exam settings caching
  cachedExamSettings: ExamSettingsResponse | null;
  examSettingsTimestamp: number;
  setCachedExamSettings: (settings: ExamSettingsResponse) => void;
  isExamSettingsFresh: (maxAgeMinutes?: number) => boolean;

  // Remaining questions count caching
  cachedRemainingCount: number | null;
  remainingCountTimestamp: number;
  remainingCountKey: string | null; // userId-country-language for cache invalidation
  setCachedRemainingCount: (count: number, userId: string, country: string, language: string) => void;
  isRemainingCountFresh: (userId: string, country: string, language: string, maxAgeMinutes?: number) => boolean;

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

  // Exam settings caching
  cachedExamSettings: null,
  examSettingsTimestamp: 0,
  setCachedExamSettings: (settings) => set({
    cachedExamSettings: settings,
    examSettingsTimestamp: Date.now()
  }),
  isExamSettingsFresh: (maxAgeMinutes = 10) => {
    const { examSettingsTimestamp } = get();
    const maxAge = maxAgeMinutes * 60 * 1000;
    return Date.now() - examSettingsTimestamp < maxAge;
  },

  // Remaining count caching
  cachedRemainingCount: null,
  remainingCountTimestamp: 0,
  remainingCountKey: null,
  setCachedRemainingCount: (count, userId, country, language) => {
    const key = `${userId}-${country}-${language}`;
    set({
      cachedRemainingCount: count,
      remainingCountTimestamp: Date.now(),
      remainingCountKey: key
    });
  },
  isRemainingCountFresh: (userId, country, language, maxAgeMinutes = 10) => {
    const { remainingCountTimestamp, remainingCountKey } = get();
    const expectedKey = `${userId}-${country}-${language}`;
    
    // Check if key matches (same user/country/language combination)
    if (remainingCountKey !== expectedKey) {
      return false;
    }
    
    const maxAge = maxAgeMinutes * 60 * 1000;
    return Date.now() - remainingCountTimestamp < maxAge;
  },

  examCountry: 'am',
  setExamCountry: (c) => {
    set({ examCountry: c });
    // Invalidate remaining count cache when country changes
    set({
      cachedRemainingCount: null,
      remainingCountTimestamp: 0,
      remainingCountKey: null
    });
  },

  examLanguage: 'ru',
  setExamLanguage: (l) => {
    set({ examLanguage: l });
    // Invalidate remaining count cache when language changes
    set({
      cachedRemainingCount: null,
      remainingCountTimestamp: 0,
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
  
  // If exam settings changed, invalidate exam settings cache
  if (updates.exam_country || updates.exam_language || updates.exam_date || updates.daily_goal) {
    useSession.setState({
      cachedExamSettings: null,
      examSettingsTimestamp: 0
    });
    console.log('♻️ Exam settings cache invalidated due to user update');
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
  const { cachedExamSettings, isExamSettingsFresh, setCachedExamSettings } = useSession.getState();
  
  // Return cached settings if fresh (10 minutes)
  if (cachedExamSettings && isExamSettingsFresh(10)) {
    console.log('🎯 Using cached exam settings (10min TTL)');
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
    isRemainingCountFresh, 
    setCachedRemainingCount 
  } = useSession.getState();
  
  // Return cached count if fresh (10 minutes) and for same parameters
  if (cachedRemainingCount !== null && isRemainingCountFresh(userId, country, language, 10)) {
    console.log('🎯 Using cached remaining count (10min TTL)');
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
  const { setCachedRemainingCount } = useSession.getState();
  // Reset cache by setting count to null and timestamp to 0
  useSession.setState({
    cachedRemainingCount: null,
    remainingCountTimestamp: 0,
    remainingCountKey: null
  });
  console.log('♻️ Remaining count cache invalidated');
};