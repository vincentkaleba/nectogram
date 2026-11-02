import { describe, it, expect, vi } from 'vitest'
import { Logger, LogLevel, Client } from '../src/index.js'

describe('Logger & LogLevel Functionality', () => {
  it('should parse and set log levels correctly', () => {
    Logger.setLevel('DEBUG')
    expect(Logger.getLevel()).toBe(LogLevel.DEBUG)

    Logger.setLevel('WARNING')
    expect(Logger.getLevel()).toBe(LogLevel.WARNING)

    Logger.setLevel('OFF')
    expect(Logger.getLevel()).toBe(LogLevel.OFF)

    Logger.setLevel(LogLevel.INFO)
    expect(Logger.getLevel()).toBe(LogLevel.INFO)
  })

  it('should accept logLevel in Client options', () => {
    const client = new Client({
      apiId: 12345,
      apiHash: 'hash',
      logLevel: 'DEBUG',
      inMemory: true,
    })

    expect(client).toBeDefined()
    expect(Logger.getLevel()).toBe(LogLevel.DEBUG)
  })

  it('should respect OFF log level and not call console.log/console.warn/console.error', () => {
    Logger.setLevel(LogLevel.OFF)

    const logSpy = vi.spyOn(console, 'log')
    const warnSpy = vi.spyOn(console, 'warn')
    const errorSpy = vi.spyOn(console, 'error')

    Logger.debug('test', 'message')
    Logger.info('test', 'message')
    Logger.warn('test', 'message')
    Logger.error('test', 'message')

    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()

    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
