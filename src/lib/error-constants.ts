/**
 * Error-related constants and configuration
 * Centralized location for error codes, messages, and error handling configuration
 */

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  AUTH: {
    INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    FORBIDDEN: 'AUTH_FORBIDDEN',
    USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
    EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_EXISTS',
    WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
    INVALID_EMAIL: 'AUTH_INVALID_EMAIL'
  },
  // Exam errors
  EXAM: {
    NOT_FOUND: 'EXAM_NOT_FOUND',
    ALREADY_SUBMITTED: 'EXAM_ALREADY_SUBMITTED',
    TIME_EXPIRED: 'EXAM_TIME_EXPIRED',
    INVALID_ANSWER: 'EXAM_INVALID_ANSWER',
    SAVE_FAILED: 'EXAM_SAVE_FAILED',
    LOAD_FAILED: 'EXAM_LOAD_FAILED',
    VIOLATION_LIMIT_EXCEEDED: 'EXAM_VIOLATION_LIMIT_EXCEEDED',
    FULLSCREEN_REQUIRED: 'EXAM_FULLSCREEN_REQUIRED'
  },
  // Network errors
  NETWORK: {
    CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',
    TIMEOUT: 'NETWORK_TIMEOUT',
    SERVER_ERROR: 'NETWORK_SERVER_ERROR',
    BAD_REQUEST: 'NETWORK_BAD_REQUEST',
    NOT_FOUND: 'NETWORK_NOT_FOUND',
    RATE_LIMITED: 'NETWORK_RATE_LIMITED'
  },
  // Validation errors
  VALIDATION: {
    REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
    INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
    MIN_LENGTH: 'VALIDATION_MIN_LENGTH',
    MAX_LENGTH: 'VALIDATION_MAX_LENGTH',
    INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
    PASSWORDS_DONT_MATCH: 'VALIDATION_PASSWORDS_DONT_MATCH'
  },
  // Storage errors
  STORAGE: {
    QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
    ACCESS_DENIED: 'STORAGE_ACCESS_DENIED',
    CORRUPTED_DATA: 'STORAGE_CORRUPTED_DATA',
    SAVE_FAILED: 'STORAGE_SAVE_FAILED',
    LOAD_FAILED: 'STORAGE_LOAD_FAILED'
  },
  // Translation errors
  TRANSLATION: {
    LOAD_FAILED: 'TRANSLATION_LOAD_FAILED',
    MISSING_KEY: 'TRANSLATION_MISSING_KEY',
    INVALID_LANGUAGE: 'TRANSLATION_INVALID_LANGUAGE'
  },
  // Generic errors
  GENERIC: {
    UNKNOWN_ERROR: 'GENERIC_UNKNOWN_ERROR',
    OPERATION_FAILED: 'GENERIC_OPERATION_FAILED',
    INVALID_INPUT: 'GENERIC_INVALID_INPUT',
    PERMISSION_DENIED: 'GENERIC_PERMISSION_DENIED'
  }
} as const

// Error messages (Vietnamese)
export const ERROR_MESSAGES_VN = {
  // Authentication errors
  [ERROR_CODES.AUTH.INVALID_CREDENTIALS]: 'Sai tên đăng nhập hoặc mật khẩu',
  [ERROR_CODES.AUTH.TOKEN_EXPIRED]: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  [ERROR_CODES.AUTH.UNAUTHORIZED]: 'Bạn không có quyền truy cập',
  [ERROR_CODES.AUTH.FORBIDDEN]: 'Truy cập bị từ chối',
  [ERROR_CODES.AUTH.USER_NOT_FOUND]: 'Không tìm thấy người dùng',
  [ERROR_CODES.AUTH.EMAIL_ALREADY_EXISTS]: 'Email này đã được sử dụng',
  [ERROR_CODES.AUTH.WEAK_PASSWORD]: 'Mật khẩu quá yếu, vui lòng chọn mật khẩu mạnh hơn',
  [ERROR_CODES.AUTH.INVALID_EMAIL]: 'Định dạng email không hợp lệ',

  // Exam errors
  [ERROR_CODES.EXAM.NOT_FOUND]: 'Không tìm thấy bài thi',
  [ERROR_CODES.EXAM.ALREADY_SUBMITTED]: 'Bài thi đã được nộp',
  [ERROR_CODES.EXAM.TIME_EXPIRED]: 'Thời gian làm bài đã hết',
  [ERROR_CODES.EXAM.INVALID_ANSWER]: 'Câu trả lời không hợp lệ',
  [ERROR_CODES.EXAM.SAVE_FAILED]: 'Không thể lưu tiến độ bài thi',
  [ERROR_CODES.EXAM.LOAD_FAILED]: 'Không thể tải bài thi',
  [ERROR_CODES.EXAM.VIOLATION_LIMIT_EXCEEDED]: 'Đã vượt quá số lần vi phạm cho phép',
  [ERROR_CODES.EXAM.FULLSCREEN_REQUIRED]: 'Vui lòng bật chế độ toàn màn hình để tiếp tục',

  // Network errors
  [ERROR_CODES.NETWORK.CONNECTION_FAILED]: 'Không thể kết nối đến máy chủ',
  [ERROR_CODES.NETWORK.TIMEOUT]: 'Kết nối bị timeout',
  [ERROR_CODES.NETWORK.SERVER_ERROR]: 'Lỗi máy chủ, vui lòng thử lại sau',
  [ERROR_CODES.NETWORK.BAD_REQUEST]: 'Yêu cầu không hợp lệ',
  [ERROR_CODES.NETWORK.NOT_FOUND]: 'Không tìm thấy tài nguyên',
  [ERROR_CODES.NETWORK.RATE_LIMITED]: 'Quá nhiều yêu cầu, vui lòng thử lại sau',

  // Validation errors
  [ERROR_CODES.VALIDATION.REQUIRED_FIELD]: 'Trường này là bắt buộc',
  [ERROR_CODES.VALIDATION.INVALID_FORMAT]: 'Định dạng không hợp lệ',
  [ERROR_CODES.VALIDATION.MIN_LENGTH]: 'Độ dài tối thiểu không đạt',
  [ERROR_CODES.VALIDATION.MAX_LENGTH]: 'Vượt quá độ dài tối đa',
  [ERROR_CODES.VALIDATION.INVALID_EMAIL]: 'Email không hợp lệ',
  [ERROR_CODES.VALIDATION.PASSWORDS_DONT_MATCH]: 'Mật khẩu không khớp',

  // Storage errors
  [ERROR_CODES.STORAGE.QUOTA_EXCEEDED]: 'Hết dung lượng lưu trữ',
  [ERROR_CODES.STORAGE.ACCESS_DENIED]: 'Không thể truy cập bộ nhớ',
  [ERROR_CODES.STORAGE.CORRUPTED_DATA]: 'Dữ liệu bị hỏng',
  [ERROR_CODES.STORAGE.SAVE_FAILED]: 'Không thể lưu dữ liệu',
  [ERROR_CODES.STORAGE.LOAD_FAILED]: 'Không thể tải dữ liệu',

  // Translation errors
  [ERROR_CODES.TRANSLATION.LOAD_FAILED]: 'Không thể tải bản dịch',
  [ERROR_CODES.TRANSLATION.MISSING_KEY]: 'Thiếu khóa dịch',
  [ERROR_CODES.TRANSLATION.INVALID_LANGUAGE]: 'Ngôn ngữ không hợp lệ',

  // Generic errors
  [ERROR_CODES.GENERIC.UNKNOWN_ERROR]: 'Đã xảy ra lỗi không xác định',
  [ERROR_CODES.GENERIC.OPERATION_FAILED]: 'Thao tác thất bại',
  [ERROR_CODES.GENERIC.INVALID_INPUT]: 'Dữ liệu đầu vào không hợp lệ',
  [ERROR_CODES.GENERIC.PERMISSION_DENIED]: 'Không có quyền thực hiện thao tác này'
} as const

// Error messages (English)
export const ERROR_MESSAGES_EN = {
  // Authentication errors
  [ERROR_CODES.AUTH.INVALID_CREDENTIALS]: 'Incorrect username or password',
  [ERROR_CODES.AUTH.TOKEN_EXPIRED]: 'Session expired, please login again',
  [ERROR_CODES.AUTH.UNAUTHORIZED]: 'You are not authorized to access this resource',
  [ERROR_CODES.AUTH.FORBIDDEN]: 'Access denied',
  [ERROR_CODES.AUTH.USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.AUTH.EMAIL_ALREADY_EXISTS]: 'This email is already in use',
  [ERROR_CODES.AUTH.WEAK_PASSWORD]: 'Password is too weak, please choose a stronger password',
  [ERROR_CODES.AUTH.INVALID_EMAIL]: 'Invalid email format',

  // Exam errors
  [ERROR_CODES.EXAM.NOT_FOUND]: 'Exam not found',
  [ERROR_CODES.EXAM.ALREADY_SUBMITTED]: 'Exam has already been submitted',
  [ERROR_CODES.EXAM.TIME_EXPIRED]: 'Exam time has expired',
  [ERROR_CODES.EXAM.INVALID_ANSWER]: 'Invalid answer',
  [ERROR_CODES.EXAM.SAVE_FAILED]: 'Failed to save exam progress',
  [ERROR_CODES.EXAM.LOAD_FAILED]: 'Failed to load exam',
  [ERROR_CODES.EXAM.VIOLATION_LIMIT_EXCEEDED]: 'Violation limit exceeded',
  [ERROR_CODES.EXAM.FULLSCREEN_REQUIRED]: 'Please enable fullscreen mode to continue',

  // Network errors
  [ERROR_CODES.NETWORK.CONNECTION_FAILED]: 'Failed to connect to server',
  [ERROR_CODES.NETWORK.TIMEOUT]: 'Connection timeout',
  [ERROR_CODES.NETWORK.SERVER_ERROR]: 'Server error, please try again later',
  [ERROR_CODES.NETWORK.BAD_REQUEST]: 'Bad request',
  [ERROR_CODES.NETWORK.NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.NETWORK.RATE_LIMITED]: 'Too many requests, please try again later',

  // Validation errors
  [ERROR_CODES.VALIDATION.REQUIRED_FIELD]: 'This field is required',
  [ERROR_CODES.VALIDATION.INVALID_FORMAT]: 'Invalid format',
  [ERROR_CODES.VALIDATION.MIN_LENGTH]: 'Minimum length not met',
  [ERROR_CODES.VALIDATION.MAX_LENGTH]: 'Maximum length exceeded',
  [ERROR_CODES.VALIDATION.INVALID_EMAIL]: 'Invalid email',
  [ERROR_CODES.VALIDATION.PASSWORDS_DONT_MATCH]: 'Passwords do not match',

  // Storage errors
  [ERROR_CODES.STORAGE.QUOTA_EXCEEDED]: 'Storage quota exceeded',
  [ERROR_CODES.STORAGE.ACCESS_DENIED]: 'Storage access denied',
  [ERROR_CODES.STORAGE.CORRUPTED_DATA]: 'Corrupted data',
  [ERROR_CODES.STORAGE.SAVE_FAILED]: 'Failed to save data',
  [ERROR_CODES.STORAGE.LOAD_FAILED]: 'Failed to load data',

  // Translation errors
  [ERROR_CODES.TRANSLATION.LOAD_FAILED]: 'Failed to load translations',
  [ERROR_CODES.TRANSLATION.MISSING_KEY]: 'Missing translation key',
  [ERROR_CODES.TRANSLATION.INVALID_LANGUAGE]: 'Invalid language',

  // Generic errors
  [ERROR_CODES.GENERIC.UNKNOWN_ERROR]: 'An unknown error occurred',
  [ERROR_CODES.GENERIC.OPERATION_FAILED]: 'Operation failed',
  [ERROR_CODES.GENERIC.INVALID_INPUT]: 'Invalid input',
  [ERROR_CODES.GENERIC.PERMISSION_DENIED]: 'Permission denied'
} as const

// Error messages (Japanese)
export const ERROR_MESSAGES_JP = {
  // Authentication errors
  [ERROR_CODES.AUTH.INVALID_CREDENTIALS]: 'ユーザー名またはパスワードが正しくありません',
  [ERROR_CODES.AUTH.TOKEN_EXPIRED]: 'セッションが期限切れです。再度ログインしてください',
  [ERROR_CODES.AUTH.UNAUTHORIZED]: 'このリソースにアクセスする権限がありません',
  [ERROR_CODES.AUTH.FORBIDDEN]: 'アクセスが拒否されました',
  [ERROR_CODES.AUTH.USER_NOT_FOUND]: 'ユーザーが見つかりません',
  [ERROR_CODES.AUTH.EMAIL_ALREADY_EXISTS]: 'このメールアドレスは既に使用されています',
  [ERROR_CODES.AUTH.WEAK_PASSWORD]: 'パスワードが弱すぎます。より強いパスワードを選択してください',
  [ERROR_CODES.AUTH.INVALID_EMAIL]: 'メールアドレスの形式が正しくありません',

  // Exam errors
  [ERROR_CODES.EXAM.NOT_FOUND]: '試験が見つかりません',
  [ERROR_CODES.EXAM.ALREADY_SUBMITTED]: '試験は既に提出されています',
  [ERROR_CODES.EXAM.TIME_EXPIRED]: '試験時間が終了しました',
  [ERROR_CODES.EXAM.INVALID_ANSWER]: '無効な回答です',
  [ERROR_CODES.EXAM.SAVE_FAILED]: '試験の進捗を保存できませんでした',
  [ERROR_CODES.EXAM.LOAD_FAILED]: '試験を読み込めませんでした',
  [ERROR_CODES.EXAM.VIOLATION_LIMIT_EXCEEDED]: '違反回数の上限を超えました',
  [ERROR_CODES.EXAM.FULLSCREEN_REQUIRED]: '続行するにはフルスクリーンモードを有効にしてください',

  // Network errors
  [ERROR_CODES.NETWORK.CONNECTION_FAILED]: 'サーバーに接続できませんでした',
  [ERROR_CODES.NETWORK.TIMEOUT]: '接続がタイムアウトしました',
  [ERROR_CODES.NETWORK.SERVER_ERROR]: 'サーバーエラーです。後でもう一度お試しください',
  [ERROR_CODES.NETWORK.BAD_REQUEST]: '不正なリクエストです',
  [ERROR_CODES.NETWORK.NOT_FOUND]: 'リソースが見つかりません',
  [ERROR_CODES.NETWORK.RATE_LIMITED]: 'リクエストが多すぎます。後でもう一度お試しください',

  // Validation errors
  [ERROR_CODES.VALIDATION.REQUIRED_FIELD]: 'この項目は必須です',
  [ERROR_CODES.VALIDATION.INVALID_FORMAT]: '形式が正しくありません',
  [ERROR_CODES.VALIDATION.MIN_LENGTH]: '最小文字数に達していません',
  [ERROR_CODES.VALIDATION.MAX_LENGTH]: '最大文字数を超えています',
  [ERROR_CODES.VALIDATION.INVALID_EMAIL]: 'メールアドレスが正しくありません',
  [ERROR_CODES.VALIDATION.PASSWORDS_DONT_MATCH]: 'パスワードが一致しません',

  // Storage errors
  [ERROR_CODES.STORAGE.QUOTA_EXCEEDED]: 'ストレージ容量を超えました',
  [ERROR_CODES.STORAGE.ACCESS_DENIED]: 'ストレージへのアクセスが拒否されました',
  [ERROR_CODES.STORAGE.CORRUPTED_DATA]: 'データが破損しています',
  [ERROR_CODES.STORAGE.SAVE_FAILED]: 'データの保存に失敗しました',
  [ERROR_CODES.STORAGE.LOAD_FAILED]: 'データの読み込みに失敗しました',

  // Translation errors
  [ERROR_CODES.TRANSLATION.LOAD_FAILED]: '翻訳の読み込みに失敗しました',
  [ERROR_CODES.TRANSLATION.MISSING_KEY]: '翻訳キーが見つかりません',
  [ERROR_CODES.TRANSLATION.INVALID_LANGUAGE]: '無効な言語です',

  // Generic errors
  [ERROR_CODES.GENERIC.UNKNOWN_ERROR]: '不明なエラーが発生しました',
  [ERROR_CODES.GENERIC.OPERATION_FAILED]: '操作に失敗しました',
  [ERROR_CODES.GENERIC.INVALID_INPUT]: '無効な入力です',
  [ERROR_CODES.GENERIC.PERMISSION_DENIED]: 'この操作を実行する権限がありません'
} as const

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const

export type ErrorSeverity = typeof ERROR_SEVERITY[keyof typeof ERROR_SEVERITY]

// Error categories
export const ERROR_CATEGORIES = {
  USER: 'user',
  SYSTEM: 'system',
  NETWORK: 'network',
  VALIDATION: 'validation',
  SECURITY: 'security'
} as const

export type ErrorCategory = typeof ERROR_CATEGORIES[keyof typeof ERROR_CATEGORIES]

// Helper functions
export function getErrorMessage(
  errorCode: string,
  language: 'vn' | 'en' | 'jp' = 'vn'
): string {
  const messages = {
    vn: ERROR_MESSAGES_VN,
    en: ERROR_MESSAGES_EN,
    jp: ERROR_MESSAGES_JP
  }

  return messages[language][errorCode as keyof typeof messages[typeof language]] || 
         messages[language][ERROR_CODES.GENERIC.UNKNOWN_ERROR]
}

export function isAuthError(errorCode: string): boolean {
  return Object.values(ERROR_CODES.AUTH).includes(errorCode as any)
}

export function isExamError(errorCode: string): boolean {
  return Object.values(ERROR_CODES.EXAM).includes(errorCode as any)
}

export function isNetworkError(errorCode: string): boolean {
  return Object.values(ERROR_CODES.NETWORK).includes(errorCode as any)
}

export function isValidationError(errorCode: string): boolean {
  return Object.values(ERROR_CODES.VALIDATION).includes(errorCode as any)
}

export function getErrorSeverity(errorCode: string): ErrorSeverity {
  // Critical errors
  if ([
    ERROR_CODES.AUTH.UNAUTHORIZED,
    ERROR_CODES.EXAM.VIOLATION_LIMIT_EXCEEDED,
    ERROR_CODES.NETWORK.SERVER_ERROR
  ].includes(errorCode as any)) {
    return ERROR_SEVERITY.CRITICAL
  }

  // High severity errors
  if ([
    ERROR_CODES.AUTH.TOKEN_EXPIRED,
    ERROR_CODES.EXAM.TIME_EXPIRED,
    ERROR_CODES.STORAGE.QUOTA_EXCEEDED
  ].includes(errorCode as any)) {
    return ERROR_SEVERITY.HIGH
  }

  // Medium severity errors
  if ([
    ERROR_CODES.AUTH.INVALID_CREDENTIALS,
    ERROR_CODES.EXAM.SAVE_FAILED,
    ERROR_CODES.NETWORK.CONNECTION_FAILED
  ].includes(errorCode as any)) {
    return ERROR_SEVERITY.MEDIUM
  }

  // Default to low severity
  return ERROR_SEVERITY.LOW
}

export function getErrorCategory(errorCode: string): ErrorCategory {
  if (isAuthError(errorCode)) return ERROR_CATEGORIES.SECURITY
  if (isExamError(errorCode)) return ERROR_CATEGORIES.SYSTEM
  if (isNetworkError(errorCode)) return ERROR_CATEGORIES.NETWORK
  if (isValidationError(errorCode)) return ERROR_CATEGORIES.VALIDATION
  return ERROR_CATEGORIES.USER
}