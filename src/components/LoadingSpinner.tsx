import { FaSpinner } from 'react-icons/fa'

const spinnerStyle = {
  animation: 'spin 1s linear infinite',
  display: 'inline-block'
}

const LoadingSpinner = ({ size = 24, color = '#2AABEE' }) => (
  <>
    <span style={spinnerStyle}>
      <FaSpinner size={size} color={color} />
    </span>
    <style>
      {`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </>
)

export default LoadingSpinner