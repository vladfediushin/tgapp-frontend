// utils/examSync.ts - Helper functions for exam-related caching
import { ExamSettingsResponse } from '../api/api'
import { loadExamSettingsWithCache, loadRemainingCountWithCache } from '../store/session'

export interface ExamData {
  examSettings: ExamSettingsResponse | null;
  remainingCount: number | null;
  fromCache: boolean;
}

/**
 * Load exam data (settings + remaining count) with caching
 * Returns both pieces of data commonly needed in Statistics and other components
 */
export const loadExamDataWithCache = async (
  userId: string,
  country: string,
  language: string
): Promise<ExamData> => {
  try {
    console.log('🔄 Loading exam data...');
    
    // Load both pieces of data in parallel
    const [examSettings, remainingCount] = await Promise.all([
      loadExamSettingsWithCache(userId),
      loadRemainingCountWithCache(userId, country, language)
    ]);

    console.log('✅ Exam data loaded successfully');
    
    return {
      examSettings,
      remainingCount,
      fromCache: true // Both functions handle their own cache logic
    };
  } catch (error) {
    console.error('❌ Error loading exam data:', error);
    return {
      examSettings: null,
      remainingCount: null,
      fromCache: false
    };
  }
};

/**
 * Hook-like function for components that need exam data
 * Returns loading state and data
 */
export const useExamData = () => {
  // This could be extended to return a custom hook with loading states
  // For now, it's just a placeholder for future enhancement
  return {
    loadExamDataWithCache
  };
};
