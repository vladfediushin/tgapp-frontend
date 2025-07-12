// Test script to debug Profile page issues
console.log('Testing Profile page...')

// Test if getUserStats is properly imported and working
import { getUserStats } from '../src/api/api'

try {
  console.log('getUserStats function exists:', typeof getUserStats)
} catch (error) {
  console.error('Error with getUserStats:', error)
}

// Test session store
import { useSession } from '../src/store/session'

try {
  console.log('useSession hook exists:', typeof useSession)
} catch (error) {
  console.error('Error with useSession:', error)
}

console.log('Test complete')
