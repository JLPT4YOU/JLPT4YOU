/**
 * Console Override for Production
 * Disable debug console logs in production while keeping errors
 */

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  error: console.error
};

const BANNED_PATTERNS_DEV = [
  'Download the React DevTools',
  '[TranslationsContext]',
  '[AuthContext]',
  '[UserStorage.getItem]',
];

/**
 * Initialize console override based on environment
 */
export function initConsoleOverride() {
  if (process.env.NODE_ENV === 'production') {
    // In production, disable all non-error logs completely
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
  } else {
    // In development, filter out specific noisy logs
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const firstArg = args[0];
      if (typeof firstArg === 'string' && BANNED_PATTERNS_DEV.some(pattern => firstArg.includes(pattern))) {
        return;
      }
      originalLog(...args);
    };
  }
}

/**
 * Restore original console methods (for testing)
 */
export function restoreConsole() {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
  console.error = originalConsole.error;
}

/**
 * Development-only console wrapper
 * Use this for debug logs that should only appear in development
 */
export const devConsole = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      originalConsole.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      originalConsole.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      originalConsole.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      originalConsole.debug(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors
    originalConsole.error(...args);
  }
};

// Auto-initialize on import
initConsoleOverride();
