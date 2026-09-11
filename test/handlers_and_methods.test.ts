import { describe, it, expect } from 'vitest'
import {
  EditedMessageHandler,
  InlineQueryHandler,
  ChatMemberUpdatedHandler,
  MessageReactionHandler,
  PreCheckoutQueryHandler,
  unparseText,
  ParseMode,
  raw,
} from '../src/index.js'

describe('Handlers, Parser & API Methods Expansion', () => {
  it('should instantiate and check newly ported handlers', async () => {
    let handledEdit = false
    const editHandler = new EditedMessageHandler(async (client, msg) => {
      handledEdit = true
    })
    expect(editHandler).toBeDefined()
    expect(await editHandler.check({}, {} as any)).toBe(true)

    const inlineHandler = new InlineQueryHandler(async () => {})
    expect(inlineHandler).toBeDefined()

    const chatMemberHandler = new ChatMemberUpdatedHandler(async () => {})
    expect(chatMemberHandler).toBeDefined()

    const reactionHandler = new MessageReactionHandler(async () => {})
    expect(reactionHandler).toBeDefined()

    const checkoutHandler = new PreCheckoutQueryHandler(async () => {})
    expect(checkoutHandler).toBeDefined()
  })

  it('should unparse MTProto entities back to Markdown and HTML', () => {
    const boldEntity = new raw.types.MessageEntityBold(6, 5) // "world"
    const text = 'Hello world!'

    const md = unparseText(text, [boldEntity], ParseMode.MARKDOWN)
    expect(md).toBe('Hello **world**!')

    const html = unparseText(text, [boldEntity], ParseMode.HTML)
    expect(html).toBe('Hello <b>world</b>!')
  })
})
