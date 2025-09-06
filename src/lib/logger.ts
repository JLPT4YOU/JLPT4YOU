/**
 * Production-ready logging utility for JLPT4YOU
 * Replaces console.log statements with environment-aware logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
  context?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? `[${context}] ` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${contextStr}${message}`
  }

  private shouldLog(level: LogLevel): boolean {
    // In test environment, only log errors
    if (this.isTest) {
      return level === 'error'
    }
    
    // In production, log info, warn, and error
    if (!this.isDevelopment) {
      return ['info', 'warn', 'error'].includes(level)
    }
    
    // In development, log everything
    return true
  }

  debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('debug')) return
    
    const formattedMessage = this.formatMessage('debug', message, context)
    console.log(formattedMessage, data ? data : '')
  }

  info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('info')) return
    
    const formattedMessage = this.formatMessage('info', message, context)
    console.info(formattedMessage, data ? data : '')
  }

  warn(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('warn')) return
    
    const formattedMessage = this.formatMessage('warn', message, context)
    console.warn(formattedMessage, data ? data : '')
  }

  error(message: string, error?: any, context?: string): void {
    if (!this.shouldLog('error')) return
    
    const formattedMessage = this.formatMessage('error', message, context)
    console.error(formattedMessage, error ? error : '')
  }

  // Specialized methods for common use cases
  auth(message: string, data?: any): void {
    this.debug(message, data, 'AUTH')
  }

  api(message: string, data?: any): void {
    this.debug(message, data, 'API')
  }

  performance(message: string, data?: any): void {
    this.debug(message, data, 'PERF')
  }

  session(message: string, data?: any): void {
    this.debug(message, data, 'SESSION')
  }

  migration(message: string, data?: any): void {
    this.info(message, data, 'MIGRATION')
  }

  pdf(message: string, data?: any): void {
    this.debug(message, data, 'PDF')
  }

  translation(message: string, data?: any): void {
    this.debug(message, data, 'I18N')
  }

  ai(message: string, data?: any): void {
    this.debug(message, data, 'AI')
  }
}

// Export singleton instance
export const logger = new Logger()

// Legacy support - gradually replace these
export const debugLog = (message: string, data?: any) => logger.debug(message, data)
export const infoLog = (message: string, data?: any) => logger.info(message, data)
export const warnLog = (message: string, data?: any) => logger.warn(message, data)
export const errorLog = (message: string, error?: any) => logger.error(message, error)
