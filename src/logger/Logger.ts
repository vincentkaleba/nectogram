//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  OFF = 4,
}

export type LogLevelInput =
  | LogLevel
  | 'DEBUG'
  | 'INFO'
  | 'WARNING'
  | 'WARN'
  | 'ERROR'
  | 'OFF'
  | 'SILENT'
  | 'debug'
  | 'info'
  | 'warning'
  | 'warn'
  | 'error'
  | 'off'
  | 'silent'
  | number

export function parseLogLevel(input: LogLevelInput): LogLevel {
  if (typeof input === 'number') {
    return input as LogLevel
  }
  if (typeof input === 'string') {
    const s = input.toUpperCase()
    switch (s) {
      case 'DEBUG':
        return LogLevel.DEBUG
      case 'INFO':
        return LogLevel.INFO
      case 'WARN':
      case 'WARNING':
        return LogLevel.WARNING
      case 'ERROR':
        return LogLevel.ERROR
      case 'OFF':
      case 'SILENT':
        return LogLevel.OFF
      default:
        return LogLevel.INFO
    }
  }
  return LogLevel.INFO
}

/**
 * High-level logger for Nectogram library components.
 */
export class Logger {
  private static level: LogLevel = LogLevel.INFO

  /**
   * Set the global logging level for Nectogram.
   */
  public static setLevel(level: LogLevelInput): void {
    Logger.level = parseLogLevel(level)
  }

  /**
   * Get the current global logging level.
   */
  public static getLevel(): LogLevel {
    return Logger.level
  }

  /**
   * Log debug messages.
   */
  public static debug(tag: string, ...args: any[]): void {
    if (Logger.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] [${tag}]`, ...args)
    }
  }

  /**
   * Log info messages.
   */
  public static info(tag: string, ...args: any[]): void {
    if (Logger.level <= LogLevel.INFO) {
      console.log(`[INFO] [${tag}]`, ...args)
    }
  }

  /**
   * Log warning messages.
   */
  public static warn(tag: string, ...args: any[]): void {
    if (Logger.level <= LogLevel.WARNING) {
      console.warn(`[WARN] [${tag}]`, ...args)
    }
  }

  /**
   * Log error messages.
   */
  public static error(tag: string, ...args: any[]): void {
    if (Logger.level <= LogLevel.ERROR) {
      console.error(`[ERROR] [${tag}]`, ...args)
    }
  }
}
