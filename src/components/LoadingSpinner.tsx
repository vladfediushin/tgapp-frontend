import { Loader2 } from 'lucide-react'

const LoadingSpinner = ({ size = 24, color = '#059669' }) => (
  <Loader2 
    size={size} 
    color={color}
    className="animate-spin"
    style={{
      animation: 'spin 1s linear infinite'
    }}
  />
)

export default LoadingSpinner