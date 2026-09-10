import { describe, it, expect } from 'vitest'
import { parseMarkdown, parseHTML, parseText } from '../src/parser/index.js'
import * as raw from '../src/raw/index.js'

describe('Formatting Parsers', () => {
  describe('parseMarkdown', () => {
    it('should parse bold text correctly', () => {
      const input = 'Hello **world**!'
      const res = parseMarkdown(input)
      expect(res.text).toBe('Hello world!')
      expect(res.entities).toHaveLength(1)
      expect(res.entities[0]).toBeInstanceOf(raw.types.MessageEntityBold)
      expect((res.entities[0] as any).offset).toBe(6)
      expect((res.entities[0] as any).length).toBe(5)
    })

    it('should parse italic, inline code, and text link', () => {
      const input = 'Welcome __home__ to `nectogram` and [GitHub](https://github.com)'
      const res = parseMarkdown(input)
      expect(res.text).toBe('Welcome home to nectogram and GitHub')
      expect(res.entities).toHaveLength(3)
      expect(res.entities[0]).toBeInstanceOf(raw.types.MessageEntityItalic)
      expect(res.entities[1]).toBeInstanceOf(raw.types.MessageEntityCode)
      expect(res.entities[2]).toBeInstanceOf(raw.types.MessageEntityTextUrl)
      expect((res.entities[2] as any).url).toBe('https://github.com')
    })

    it('should parse pre/code blocks with language', () => {
      const input = '```ts\nconst x = 1\n```'
      const res = parseMarkdown(input)
      expect(res.text).toBe('const x = 1\n')
      expect(res.entities).toHaveLength(1)
      expect(res.entities[0]).toBeInstanceOf(raw.types.MessageEntityPre)
      expect((res.entities[0] as any).language).toBe('ts')
    })

    it('should parse spoiler, strike, and underline', () => {
      const input = '||secret|| ~~old~~ --new--'
      const res = parseMarkdown(input)
      expect(res.text).toBe('secret old new')
      expect(res.entities).toHaveLength(3)
      expect(res.entities[0]).toBeInstanceOf(raw.types.MessageEntitySpoiler)
      expect(res.entities[1]).toBeInstanceOf(raw.types.MessageEntityStrike)
      expect(res.entities[2]).toBeInstanceOf(raw.types.MessageEntityUnderline)
    })
  })

  describe('parseHTML', () => {
    it('should parse HTML tags into entities', () => {
      const input = 'Hello <b>world</b> and <a href="https://example.com">link</a>'
      const res = parseHTML(input)
      expect(res.text).toBe('Hello world and link')
      expect(res.entities).toHaveLength(2)
      expect(res.entities[0]).toBeInstanceOf(raw.types.MessageEntityBold)
      expect(res.entities[1]).toBeInstanceOf(raw.types.MessageEntityTextUrl)
      expect((res.entities[1] as any).url).toBe('https://example.com')
    })
  })

  describe('parseText', () => {
    it('should respect raw parseMode', () => {
      const input = 'Hello **world**'
      const res = parseText(input, 'raw')
      expect(res.text).toBe('Hello **world**')
      expect(res.entities).toHaveLength(0)
    })
  })
})
