# Nectogram

**A modern MTProto Telegram client framework for Node.js, written in TypeScript and inspired by [Pyrogram](https://github.com/pyrogram/pyrogram) and Kurigram.**

Nectogram brings Pyrogram's clean, developer-friendly API to the JavaScript ecosystem. It talks to Telegram directly over MTProto (not the HTTP Bot API), so it can drive both bots and user accounts with the full power of the Telegram API.

> **Status:** pre-release (`v0.1.0`), under active development. APIs may change before 1.0, and the package is not yet published on npm.

## Features

- **Full MTProto 2.0 stack**: Diffie-Hellman key exchange, AES-256-IGE encryption, RSA, and Abridged, Intermediate, Padded Intermediate and Obfuscated2 TCP transports.
- **Up-to-date API layer**: a built-in TL compiler generates typed raw classes from Telegram's schema (currently layer 229).
- **Pyrogram-style high-level API**: `sendMessage`, `sendMedia`, `downloadMedia`, `editMessageText`, `forwardMessages`, `copyMessage`, polls, reactions, chat administration, invite links, contacts, stories, business, payments and more.
- **Handlers and composable filters**: `onMessage`, `onCallbackQuery`, `onInlineQuery`, `onChatMemberUpdated` and 20+ other events, with filters combinable through `.and()`, `.or()` and `.invert()`.
- **Pluggable storage**: SQLite (default), file or in-memory, plus import/export of **Pyrogram-compatible session strings**.
- **Rich text**: Markdown and HTML parsing, mentions, inline keyboards, colored buttons and premium emoji.
- **Raw API access**: call any Telegram method with `client.invoke()`.
- **Upload/download progress** callbacks for media methods.

## Requirements

- Node.js **20+**
- A Telegram `api_id` and `api_hash` from [my.telegram.org](https://my.telegram.org)

## Installation

Until the first npm release, install from source:

```bash
git clone https://github.com/vincentkaleba/nectogram.git
cd nectogram
git checkout dev
npm install
npm run generate   # generate the raw TL classes from the schema
npm run build
```

## Quick start

```ts
import { Client, Filters, Message } from 'nectogram'

const app = new Client({
  name: 'my_bot',
  apiId: 12345,
  apiHash: 'your_api_hash',
  botToken: '123456:ABC-DEF...',
})

app.onMessage(Filters.command(['start']), async (client: Client, message: Message) => {
  await message.reply(`Hello ${message.fromUser?.firstName ?? 'there'}!`)
})

app.onMessage(Filters.private.and(Filters.text), async (client, message) => {
  await message.reply(message.text ?? '')
})

// Starts the client and keeps it running until SIGINT/SIGTERM.
await app.run()
```

### Inline keyboards

```ts
import { InlineKeyboardMarkup, InlineKeyboardButton } from 'nectogram'

await message.reply('Pick one:', {
  replyMarkup: new InlineKeyboardMarkup([[
    new InlineKeyboardButton({ text: 'Website', url: 'https://example.com' }),
    new InlineKeyboardButton({ text: 'Click me', callbackData: 'clicked' }),
  ]]),
})

app.onCallbackQuery(async (client, query) => {
  await query.answer('You clicked!')
})
```

### Sessions

```ts
// Export the current session (Pyrogram-compatible format)
const session = await app.exportSessionString()

// Reuse it later, with no new login required
const app2 = new Client({ apiId, apiHash, sessionString: session })

// Or keep everything in memory
const temp = new Client({ apiId, apiHash, botToken, inMemory: true })
```

### Raw API

```ts
import { raw } from 'nectogram'

const users = await app.invoke(
  new raw.functions.users.GetUsers([new raw.types.InputUserSelf()])
)
```

## Example

[`examples/renamer_bot`](examples/renamer_bot) is a complete file-renamer bot ported from a Pyrogram project. It covers plugins, media download and upload with progress, thumbnails, custom captions, broadcast and admin commands.

## Project structure

```
compiler/      TL schema compiler and .tl sources
src/
  connection/  TCP transports and data center connection
  crypto/      AES-IGE, RSA, MTProto crypto helpers
  session/     auth key handshake and encrypted sessions
  raw/         generated TL types and functions (run `npm run generate`)
  client/      Client facade and high-level API methods
  dispatcher/  update dispatcher and handlers
  filters.ts   composable filters
  types/       high-level types (User, Chat, Message, keyboards, ...)
  storage/     SQLite, file and memory storage
  parser/      Markdown and HTML entity parsing
test/          Vitest test suite
```

## Development

```bash
npm run generate    # regenerate raw TL classes
npm run typecheck   # type-check without emitting
npm test            # run the test suite
npm run build       # compile to dist/
```

## Roadmap

- [ ] Interactive user-account login (phone code, 2FA)
- [ ] Complete parity with Pyrogram/Kurigram methods and types
- [ ] Documentation site and Pyrogram migration guide
- [ ] CI and first npm release

## Contributing

Issues and pull requests are welcome. Development happens on the `dev` branch.

## Acknowledgements

Nectogram's API design follows [Pyrogram](https://github.com/pyrogram/pyrogram) by Dan and its community fork Kurigram.

## License

Released under the GNU Lesser General Public License v3.0 or later (LGPL-3.0-or-later). See [LICENSE](LICENSE) and [COPYING](COPYING) (the GPL-3.0 text, which the LGPL supplements).
