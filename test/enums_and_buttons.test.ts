import { describe, it, expect } from 'vitest'
import {
  ParseMode,
  ChatType,
  MessageEntityType,
  ButtonStyle,
  InlineKeyboardButton,
  RichMessage,
  parseMarkdown,
  parseHTML,
  raw,
} from '../src/index.js'

describe('Enums, Custom Emojis & Colored Buttons', () => {
  it('should export all high-level Enums', () => {
    expect(ParseMode.MARKDOWN).toBe('markdown')
    expect(ParseMode.HTML).toBe('html')
    expect(ChatType.PRIVATE).toBe('private')
    expect(ChatType.CHANNEL).toBe('channel')
    expect(MessageEntityType.CUSTOM_EMOJI).toBe('custom_emoji')
    expect(ButtonStyle.DANGER).toBe('danger')
    expect(ButtonStyle.SUCCESS).toBe('success')
  })

  it('should parse Premium/Custom Emojis in Markdown', () => {
    const input = 'Hello ![thumbsup](5386626303259837583) world'
    const res = parseMarkdown(input)
    expect(res.text).toBe('Hello thumbsup world')
    expect(res.entities).toHaveLength(1)
    expect(res.entities[0]).toBeInstanceOf(raw.types.MessageEntityCustomEmoji)
    expect((res.entities[0] as any).document_id).toBe(5386626303259837583n)
  })

  it('should parse Premium/Custom Emojis in HTML', () => {
    const input = 'Hello <tg-emoji emoji-id="5386626303259837583">👍</tg-emoji> world'
    const res = parseHTML(input)
    expect(res.text).toBe('Hello 👍 world')
    expect(res.entities).toHaveLength(1)
    expect(res.entities[0]).toBeInstanceOf(raw.types.MessageEntityCustomEmoji)
    expect((res.entities[0] as any).document_id).toBe(5386626303259837583n)
  })

  it('should build colored InlineKeyboardButton with styles', () => {
    const btnPrimary = new InlineKeyboardButton({ text: 'Confirm', callbackData: 'ok', style: 'primary' })
    const btnDanger = new InlineKeyboardButton({ text: 'Delete', callbackData: 'del', style: 'danger' })
    const btnSuccess = new InlineKeyboardButton({ text: 'Pay', buy: true, style: 'success' })

    const tlPrimary = btnPrimary.writeTL()
    expect(tlPrimary.style?.bg_primary).toBe(true)

    const tlDanger = btnDanger.writeTL()
    expect(tlDanger.style?.bg_danger).toBe(true)

    const tlSuccess = btnSuccess.writeTL()
    expect(tlSuccess.style?.bg_success).toBe(true)
    expect(tlSuccess.type_).toBeInstanceOf(raw.types.InlineButtonTypeBuy)
  })

  it('should build Copy, WebApp, and SwitchInline buttons', () => {
    const copyBtn = new InlineKeyboardButton({ text: 'Copy Code', copyText: 'CODE123' })
    const webAppBtn = new InlineKeyboardButton({ text: 'Open App', webAppUrl: 'https://app.example.com' })

    const tlCopy = copyBtn.writeTL()
    expect(tlCopy.type_).toBeInstanceOf(raw.types.InlineButtonTypeCopy)
    expect((tlCopy.type_ as any).copy_text).toBe('CODE123')

    const tlWebApp = webAppBtn.writeTL()
    expect(tlWebApp.type_).toBeInstanceOf(raw.types.InlineButtonTypeWebView)
    expect((tlWebApp.type_ as any).url).toBe('https://app.example.com')
  })

  it('should build RichMessage objects', () => {
    const rich = new RichMessage({ markdown: '# Title\n**Rich content**', noAutoLink: true })
    const tlRich = rich.writeTL()
    expect(tlRich).toBeInstanceOf(raw.types.InputRichMessageMarkdown)
    expect((tlRich as any).markdown).toBe('# Title\n**Rich content**')
    expect((tlRich as any).noautolink).toBe(true)
  })
})
