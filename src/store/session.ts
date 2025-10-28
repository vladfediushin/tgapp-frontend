// frontend/src/store/ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api, { DailyProgress, UserOut, ExamSettingsResponse, getUserByTelegramId } from '../api/api'

interface Answer {
  questionId: string
  selectedIndex: number
  isCorrect: boolean
  timestamp: number  // Добавляем timestamp для дедупликации
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

  // Topics caching
  cachedTopics: string[] | null;
  topicsKey: string | null; // country-language for cache validation
  setCachedTopics: (topics: string[], country: string, language: string) => void;
  clearCachedTopics: () => void;

  examCountry: string
  setExamCountry: (c: string) => void

  examLanguage: string
  setExamLanguage: (l: string) => void
  
  uiLanguage: string 
  setUiLanguage: (l: string) => void

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

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
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

  // Topics caching - simple cache with key validation
  cachedTopics: null,
  topicsKey: null,
  setCachedTopics: (topics, country, language) => {
    const key = `${country}-${language}`;
    set({
      cachedTopics: topics,
      topicsKey: key
    });
  },
  clearCachedTopics: () => set({
    cachedTopics: null,
    topicsKey: null
  }),

  examCountry: 'am',
  setExamCountry: (c) => {
    const currentState = get();
    console.log(`🌍 setExamCountry called:`, c, `current:`, currentState.examCountry);
    
    // Only clear caches if country actually changed
    if (currentState.examCountry !== c) {
      console.log(`🔄 Country changed, clearing caches`);
      set({ examCountry: c });
      // Clear remaining count cache when country changes
      set({
        cachedRemainingCount: null,
        remainingCountKey: null
      });
      // Clear topics cache when country changes
      set({
        cachedTopics: null,
        topicsKey: null
      });
    } else {
      console.log(`✅ Country unchanged, keeping caches`);
    }
  },

  examLanguage: 'ru',
  setExamLanguage: (l) => {
    const currentState = get();
    console.log(`🗣️ setExamLanguage called:`, l, `current:`, currentState.examLanguage);
    
    // Only clear caches if language actually changed
    if (currentState.examLanguage !== l) {
      console.log(`🔄 Language changed, clearing caches`);
      set({ examLanguage: l });
      // Clear remaining count cache when language changes
      set({
        cachedRemainingCount: null,
        remainingCountKey: null
      });
      // Clear topics cache when language changes
      set({
        cachedTopics: null,
        topicsKey: null
      });
    } else {
      console.log(`✅ Language unchanged, keeping caches`);
    }
  },
  
  uiLanguage: 'ru',
  setUiLanguage: (l) => set({ uiLanguage: l }),

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
}),
{
  name: 'session-storage', // localStorage key
  partialize: (state) => ({
    // Сохраняем только критичные данные для кеширования
    cachedUser: state.cachedUser,
    userId: state.userId,
    examCountry: state.examCountry,
    examLanguage: state.examLanguage,
    uiLanguage: state.uiLanguage,
    cachedTopics: state.cachedTopics,
    topicsKey: state.topicsKey,
  }),
}
))

export const getDailyProgress = (userId: string, targetDate?: string) => {
  const params = targetDate ? `?target_date=${targetDate}` : ''
  return api.get<DailyProgress>(`/users/${userId}/daily-progress${params}`)
}

// Helper function to load user with caching
export const loadUserWithCache = async (telegramId: number): Promise<UserOut> => {
  const { cachedUser, setCachedUser, setUserId } = useSession.getState();
  
  console.log(`📋 loadUserWithCache called for telegramId: ${telegramId}`);
  console.log(`🗂️ Current cachedUser:`, cachedUser ? `exists (id: ${cachedUser.id})` : 'null');
  
  // Return cached user if exists and still valid
  if (cachedUser && cachedUser.id) {
    console.log('🎯 Using cached user data');
    // Ensure userId is set from cache
    setUserId(cachedUser.id);
    return cachedUser;
  }
  
  // Load fresh data
  console.log('🔄 Loading fresh user data...');
  const response = await getUserByTelegramId(telegramId); // Теперь с встроенным retry
  const userData = response.data;
  
  console.log(`✅ Fresh user data loaded (id: ${userData.id}), caching now...`);
  
  // Set userId and cache the result
  setUserId(userData.id);
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

// Helper function to load topics with caching
export const loadTopicsWithCache = async (
  country: string,
  language: string
): Promise<string[]> => {
  const {
    cachedTopics,
    topicsKey,
    setCachedTopics
  } = useSession.getState();
  
  const expectedKey = `${country}-${language}`;
  
  console.log(`📋 loadTopicsWithCache called for: ${expectedKey}`);
  console.log(`� Call stack:`, new Error().stack);
  console.log(`�🗂️ Current cachedTopics:`, cachedTopics ? `exists (${cachedTopics.length} topics)` : 'null');
  console.log(`🔑 Current topicsKey:`, topicsKey, `expected:`, expectedKey);
  
  // Return cached topics if exists and key matches (same country/language)
  if (cachedTopics && topicsKey === expectedKey) {
    console.log('🎯 Using cached topics');
    return cachedTopics;
  }
  
  // Load fresh data
  console.log('🔄 Loading fresh topics...');
  const response = await api.get<{ topics: string[] }>(`/topics`, {
    params: {
      country,
      language
    }
  });
  const topics = response.data.topics;
  
  console.log(`✅ Fresh topics loaded (${topics.length} topics), caching now...`);
  
  // Cache the result
  setCachedTopics(topics, country, language);
  
  return topics;
};

// Helper function to submit all accumulated answers
export const submitAnswers = async (userId: string): Promise<void> => {
  const { answers } = useSession.getState();
  
  if (answers.length === 0) {
    console.log('📭 No answers to submit');
    return;
  }
  
  console.log(`📤 Submitting ${answers.length} answers for user ${userId}`);
  
  try {
    await api.post(`/users/${userId}/submit_answers`, {
      answers: answers.map(a => ({
        question_id: a.questionId,
        is_correct: a.isCorrect,
        timestamp: a.timestamp
      }))
    });
    
    console.log(`✅ ${answers.length} answers submitted successfully`);
    
    // Инвалидируем кеш remaining count, так как ответы могли изменить статистику
    invalidateRemainingCountCache();
    
    // Обновляем дневной прогресс после отправки ответов
    await refreshDailyProgress(userId);
    
  } catch (error) {
    console.error('❌ Error submitting answers:', error);
    throw error; // Пробрасываем ошибку для обработки в UI
  }
};

// Helper function to refresh daily progress
export const refreshDailyProgress = async (userId: string): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await getDailyProgress(userId, today);
    const { setDailyProgress } = useSession.getState();
    setDailyProgress(response.data.questions_mastered_today, response.data.date);
    console.log(`📊 Daily progress updated: ${response.data.questions_mastered_today} questions`);
  } catch (error) {
    console.error('❌ Error refreshing daily progress:', error);
  }
};
