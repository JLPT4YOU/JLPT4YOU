/**
 * Environment Variables Validation
 * Validates required environment variables at build time
 */

// Required environment variables for the application to function
const requiredEnvVars = {
  // Supabase Configuration (Required)
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Encryption (Required)
  APP_ENCRYPT_SECRET: process.env.APP_ENCRYPT_SECRET,
} as const

// Optional environment variables with defaults
const optionalEnvVars = {
  // AI Services
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || '',
  
  // Feature Flags
  NEXT_PUBLIC_USE_NEW_AUTH: process.env.NEXT_PUBLIC_USE_NEW_AUTH || 'true',
  NEXT_PUBLIC_USE_NEW_MIDDLEWARE: process.env.NEXT_PUBLIC_USE_NEW_MIDDLEWARE || 'false',
  NEXT_PUBLIC_USE_NEW_API_AUTH: process.env.NEXT_PUBLIC_USE_NEW_API_AUTH || 'true',
  NEXT_PUBLIC_USE_NEW_AUTH_CONTEXT: process.env.NEXT_PUBLIC_USE_NEW_AUTH_CONTEXT || 'true',
  NEXT_PUBLIC_USE_RBAC: process.env.NEXT_PUBLIC_USE_RBAC || 'false',
  NEXT_PUBLIC_ROLLOUT_PERCENTAGE: process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '100',
  
  // Monitoring
  NEXT_PUBLIC_ENABLE_MONITORING: process.env.NEXT_PUBLIC_ENABLE_MONITORING || 'true',
  NEXT_PUBLIC_ENABLE_DEBUG_LOGS: process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS || 'false',
  NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
  
  // JLPT API
  NEXT_PUBLIC_JLPT_API_URL: process.env.NEXT_PUBLIC_JLPT_API_URL || 'https://jlpt-vocabulary-api-6jmc.vercel.app',
  NEXT_PUBLIC_JLPT_API_KEY: process.env.NEXT_PUBLIC_JLPT_API_KEY || '',
  
  // Dictionary APIs
  TRACAU_API_KEY: process.env.TRACAU_API_KEY || '',
  JDICT_API_BASE: process.env.JDICT_API_BASE || 'https://api.jdict.net/api/v1',
  JDICT_STATIC_BASE: process.env.JDICT_STATIC_BASE || 'https://jdict.net',
} as const

/**
 * Validates required environment variables
 * Throws error if any required variable is missing
 */
export function validateRequiredEnvVars() {
  const missingVars: string[] = []
  
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      missingVars.push(key)
    }
  })
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file or Vercel environment variables.\n' +
      'See VERCEL_DEPLOYMENT_GUIDE.md for setup instructions.'
    )
  }
}

/**
 * Gets validated environment variables
 * Returns object with all environment variables (required + optional)
 */
export function getEnvVars() {
  // Validate required variables first
  validateRequiredEnvVars()
  
  return {
    ...requiredEnvVars,
    ...optionalEnvVars,
  }
}

/**
 * Checks if we're in development mode
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development'
}

/**
 * Checks if we're in production mode
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production'
}

/**
 * Gets safe environment variables for client-side use
 * Only returns NEXT_PUBLIC_ variables
 */
export function getClientEnvVars() {
  const clientVars: Record<string, string> = {}
  
  Object.entries({ ...requiredEnvVars, ...optionalEnvVars }).forEach(([key, value]) => {
    if (key.startsWith('NEXT_PUBLIC_') && value) {
      clientVars[key] = value
    }
  })
  
  return clientVars
}

// Validate environment variables at module load time in production
if (isProduction()) {
  try {
    validateRequiredEnvVars()
    console.log('✅ Environment variables validation passed')
  } catch (error) {
    console.error('❌ Environment variables validation failed:', error)
    // Don't throw in production build, just log the error
    // The actual error will be thrown when the variables are used
  }
}
