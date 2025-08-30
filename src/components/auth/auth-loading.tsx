/**
 * Auth Loading Component
 * Provides consistent loading states for authentication operations
 */

interface AuthLoadingProps {
  message?: string
  type?: 'login' | 'register' | 'logout' | 'loading'
  className?: string
}

export function AuthLoading({ 
  message, 
  type = 'loading',
  className = '' 
}: AuthLoadingProps) {
  const getDefaultMessage = () => {
    switch (type) {
      case 'login':
        return 'Đang đăng nhập...'
      case 'register':
        return 'Đang tạo tài khoản...'
      case 'logout':
        return 'Đang đăng xuất...'
      default:
        return 'Đang tải...'
    }
  }

  const displayMessage = message || getDefaultMessage()

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* Spinner */}
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      
      {/* Message */}
      <span className="text-sm text-gray-600">
        {displayMessage}
      </span>
    </div>
  )
}

/**
 * Full Screen Auth Loading
 * For page-level loading states
 */
interface AuthLoadingScreenProps {
  message?: string
  type?: 'login' | 'register' | 'logout' | 'loading'
}

export function AuthLoadingScreen({ 
  message, 
  type = 'loading' 
}: AuthLoadingScreenProps) {
  const getDefaultMessage = () => {
    switch (type) {
      case 'login':
        return 'Đang xác thực thông tin đăng nhập...'
      case 'register':
        return 'Đang tạo tài khoản mới...'
      case 'logout':
        return 'Đang đăng xuất khỏi hệ thống...'
      default:
        return 'Đang tải thông tin người dùng...'
    }
  }

  const displayMessage = message || getDefaultMessage()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {/* Large Spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        
        {/* Message */}
        <p className="text-lg text-gray-700 mb-2">
          {displayMessage}
        </p>
        
        {/* Subtitle */}
        <p className="text-sm text-gray-500">
          Vui lòng đợi trong giây lát...
        </p>
      </div>
    </div>
  )
}

/**
 * Auth Button Loading State
 * For buttons during auth operations
 */
interface AuthButtonLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  type?: 'login' | 'register' | 'logout'
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export function AuthButtonLoading({
  isLoading,
  children,
  loadingText,
  type,
  className = '',
  disabled = false,
  onClick
}: AuthButtonLoadingProps) {
  const getDefaultLoadingText = () => {
    switch (type) {
      case 'login':
        return 'Đang đăng nhập...'
      case 'register':
        return 'Đang tạo tài khoản...'
      case 'logout':
        return 'Đang đăng xuất...'
      default:
        return 'Đang xử lý...'
    }
  }

  const displayLoadingText = loadingText || getDefaultLoadingText()

  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
        relative flex items-center justify-center space-x-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>{displayLoadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

/**
 * Auth Error Display
 * Consistent error display for auth operations
 */
interface AuthErrorProps {
  error: string | null
  className?: string
  onDismiss?: () => void
}

export function AuthError({ 
  error, 
  className = '',
  onDismiss 
}: AuthErrorProps) {
  if (!error) return null

  return (
    <div className={`
      bg-red-50 border border-red-200 rounded-lg p-3 
      ${className}
    `}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Auth Success Display
 * Consistent success display for auth operations
 */
interface AuthSuccessProps {
  message: string
  className?: string
  onDismiss?: () => void
}

export function AuthSuccess({ 
  message, 
  className = '',
  onDismiss 
}: AuthSuccessProps) {
  return (
    <div className={`
      bg-green-50 border border-green-200 rounded-lg p-3 
      ${className}
    `}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-green-700">
            {message}
          </p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="text-green-400 hover:text-green-600"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
