//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//
//  This file is part of Nectogram.
//
//  Nectogram is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Lesser General Public License as published
//  by the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  Nectogram is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Lesser General Public License for more details.
//
//  You should have received a copy of the GNU Lesser General Public License
//  along with Nectogram.  If not, see <http://www.gnu.org/licenses/>.

import * as raw from '../raw/index.js'
import { Storage, MemoryStorage, FileStorage } from '../storage/index.js'
import { Connection } from '../connection/Connection.js'
import { Session, AuthKey, Handshake } from '../session/index.js'
import {
  Dispatcher,
  Handler,
  MessageHandler,
  CallbackQueryHandler,
  EditedMessageHandler,
  InlineQueryHandler,
  ChosenInlineResultHandler,
  ChatMemberUpdatedHandler,
  ChatJoinRequestHandler,
  MessageReactionHandler,
  MessageReactionCountHandler,
  PollHandler,
  StoryHandler,
  PreCheckoutQueryHandler,
  ShippingQueryHandler,
  UserStatusHandler,
  DeletedMessagesHandler,
  ConnectHandler,
  DisconnectHandler,
  RawUpdateHandler,
  ErrorHandler,
} from '../dispatcher/index.js'
import { Filter } from '../filters.js'
import { User, Message } from '../types/index.js'
import { PeerResolver } from './PeerResolver.js'

import {
  getMe,
  signInBot,
  sendMessage,
  editMessageText,
  deleteMessages,
  forwardMessages,
  sendChatAction,
  sendLocation,
  sendContact,
  sendDice,
  sendPoll,
  copyMessage,
  readHistory,
  pinChatMessage,
  unpinChatMessage,
  unpinAllChatMessages,
  getChat,
  getChatMembers,
  getChatMember,
  banChatMember,
  unbanChatMember,
  setChatTitle,
  joinChat,
  leaveChat,
  answerCallbackQuery,
  setBotCommands,
  getBotCommands,
  deleteBotCommands,
  getUsers,
  blockUser,
  unblockUser,
  sendPhoto,
  sendVideo,
  sendDocument,
  sendAnimation,
  sendAudio,
  sendVoice,
  getChatHistory,
  getChatHistoryCount,
  sendReaction,
  setChatDescription,
  createChannel,
  createGroup,
  createSupergroup,
  answerInlineQuery,
  getCommonChats,
  getChatPhotos,
  saveFile,
  resolvePeer,
  recoverGaps,
  sendCode,
  resendCode,
  signIn,
  signUp,
  logOut,
  acceptTermsOfService,
  changePhoneNumber,
  getActiveSessions,
  resetSession,
  resetSessions,
  sendPhoneNumberCode,
  resendPhoneNumberCode,
  updateProfile,
  setUsername,
  getAccountTtl,
  setAccountTtl,
  getPrivacy,
  setPrivacy,
  getGlobalPrivacySettings,
  setGlobalPrivacySettings,
  setInactiveSessionTtl,
  addProfileAudio,
  removeProfileAudio,
  setProfileAudioPosition,
  createChatInviteLink,
  editChatInviteLink,
  revokeChatInviteLink,
  deleteChatInviteLink,
  approveChatJoinRequest,
  declineChatJoinRequest,
  addContact,
  deleteContacts,
  getContacts,
  searchContacts,
  // Phase 3 - Password, Folders, Premium, Phone
  enableCloudPassword,
  changeCloudPassword,
  removeCloudPassword,
  checkChatFolderInviteLink,
  applyBoost,
  getBoostsStatus,
  getCallMembers,
  // Phase 4 - Business, Stories, Payments
  getBusinessConnection,
  deleteBusinessMessages,
  getBusinessAccountStarBalance,
  getBusinessAccountGifts,
  transferBusinessAccountStars,
  sendStory,
  getStories,
  deleteStories,
  getStarsBalance,
  getAvailableGifts,
  sendGift,
  // Extended Chats
  promoteChatMember,
  restrictChatMember,
  setChatPhoto,
  deleteChatPhoto,
  setChatPermissions,
  setChatProtectedContent,
  setSlowMode,
  setAdministratorTitle,
  setSendAsChat,
  getSendAsChats,
  setChatDiscussionGroup,
  archiveChats,
  unarchiveChats,
  markChatUnread,
  addChatMembers,
  deleteUserHistory,
  deleteChannel,
  deleteSupergroup,
  setChatUsername,
  getChatOnlineCount,
  getChatMembersCount,
  toggleForumTopics,
  toggleJoinToSend,
  getDialogsCount,
  getDialogs,
  transferChatOwnership,
  setChatMemberTag,
  setChatTtl,
  setChatAccentColor,
  setChatProfileAccentColor,
  // Extended Chat Folders
  getFolders,
  createFolder,
  editFolder,
  deleteFolder,
  reorderFolders,
  toggleFolderTags,
  createFolderInviteLink,
  deleteFolderInviteLink,
  getFolderInviteLinks,
  getChatsForFolderInviteLink,
  joinFolder,
  leaveFolder,
  // Extended Chat Forums
  createForumTopic,
  editForumTopic,
  closeForumTopic,
  deleteForumTopic,
  pinForumTopic,
  unpinForumTopic,
  getForumTopics,
  getForumTopicsById,
  getSimilarChannels,
  getSuitableDiscussionChats,
  getChatEventLog,
  // Extended Messages
  getMessages,
  searchMessages,
  searchGlobal,
  readChatHistory,
  readMentions,
  readReactions,
  deleteChatHistory,
  searchMessagesCount,
  sendScreenshotNotification,
  votePoll,
  stopPoll,
  retractVote,
  getAvailableEffects,
  getStickers,
  getCustomEmojiStickers,
  viewMessages,
  getScheduledMessages,
  sendPaidReaction,
  getDiscussionMessage,
  getDiscussionReplies,
  getMediaGroup,
  startBot,
  // Extended Bots
  createInvoiceLink,
  sendInvoice,
  answerShippingQuery,
  answerPreCheckoutQuery,
  getBotInfoDescription,
  setBotInfoDescription,
  getBotInfoShortDescription,
  setBotInfoShortDescription,
  getBotName,
  setBotName,
  getBotDefaultPrivileges,
  setBotDefaultPrivileges,
  getChatMenuButton,
  setChatMenuButton,
  getGameHighScores,
  setGameScore,
  sendGame,
  getInlineBotResults,
  sendInlineBotResult,
  checkBotUsername,
  getOwnedBots,
  refundStarPayment,
  editUserStarSubscription,
} from './methods/index.js'

import { parseText, ParseMode } from '../parser/index.js'

export interface ClientOptions {
  name?: string
  apiId: number
  apiHash: string
  botToken?: string
  sessionString?: string
  storage?: Storage
  testMode?: boolean
  inMemory?: boolean
  workers?: number
  noUpdates?: boolean
  sleepThreshold?: number
  maxMessageCacheSize?: number
  parseMode?: ParseMode
  appVersion?: string
  deviceModel?: string
  systemVersion?: string
  systemLangCode?: string
  langPack?: string
  langCode?: string
}

export class Client {
  public readonly name: string
  public readonly apiId: number
  public readonly apiHash: string
  public readonly botToken?: string
  public readonly testMode: boolean
  public readonly workers: number
  public readonly noUpdates: boolean
  public readonly sleepThreshold: number
  public readonly maxMessageCacheSize: number
  public parseMode: ParseMode
  public appVersion: string
  public deviceModel: string
  public systemVersion: string
  public systemLangCode: string
  public langPack: string
  public langCode: string

  public storage: Storage
  public connection?: Connection
  public session?: Session
  public dispatcher: Dispatcher
  public peerResolver: PeerResolver

  public me?: User
  public isConnected: boolean = false
  public readonly usersCache: Map<bigint, User> = new Map()

  constructor(options: ClientOptions) {
    this.name = options.name ?? 'nectogram'
    this.apiId = options.apiId
    this.apiHash = options.apiHash
    this.botToken = options.botToken
    this.testMode = options.testMode ?? false
    this.workers = options.workers ?? 16
    this.noUpdates = options.noUpdates ?? false
    this.sleepThreshold = options.sleepThreshold ?? 10
    this.maxMessageCacheSize = options.maxMessageCacheSize ?? 1000
    this.parseMode = options.parseMode ?? ParseMode.MARKDOWN
    this.appVersion = options.appVersion ?? '1.0.0'
    this.deviceModel = options.deviceModel ?? 'Node.js'
    this.systemVersion = options.systemVersion ?? process.version
    this.systemLangCode = options.systemLangCode ?? 'en'
    this.langPack = options.langPack ?? ''
    this.langCode = options.langCode ?? 'en'

    if (options.storage) {
      this.storage = options.storage
    } else if (options.inMemory) {
      this.storage = new MemoryStorage()
    } else {
      this.storage = new FileStorage(this.name)
    }

    this.dispatcher = new Dispatcher(this)
    this.peerResolver = new PeerResolver(this.storage, (query) => this.invoke(query))

    if (options.sessionString) {
      this.storage.importSessionString(options.sessionString).catch((err) => {
        console.error('Client constructor: failed to import session string:', err)
      })
    }
  }

  /**
   * Connect to Telegram MTProto servers, perform Diffie-Hellman handshake if needed, and start MTProto Session.
   */
  public async connect(): Promise<void> {
    if (this.isConnected) return

    await this.storage.open()
    await this.storage.setApiId(this.apiId)
    await this.storage.setTestMode(this.testMode)

    const dcId = await this.storage.getDcId()
    let authKey = await this.storage.getAuthKey()

    if (!authKey) {
      const hsConnection = new Connection({ dcId, testMode: this.testMode })
      await hsConnection.connect()
      const handshake = new Handshake(hsConnection)
      const hsRes = await handshake.execute()
      authKey = hsRes.authKey
      await this.storage.setAuthKey(authKey)
      hsConnection.close()
    }

    this.connection = new Connection({
      dcId,
      testMode: this.testMode,
    })

    this.session = new Session(this.connection, authKey)
    await this.session.start()

    // Bind incoming session updates to dispatcher and storage
    this.session.on('update', (update: any, users: Map<bigint, any>, chats: Map<bigint, any>) => {
      this._savePeersFromUpdate(users, chats).catch((err) => {
        console.error('Error saving peers from update:', err)
      })
      this.dispatcher.feedUpdate(update, users, chats)
    })

    this.isConnected = true

    // Initialize MTProto connection session with Layer & Client info
    try {
      await this.invoke(
        new raw.functions.InvokeWithLayer(
          raw.layer,
          new raw.functions.InitConnection(
            this.apiId,
            this.deviceModel,
            this.systemVersion,
            this.appVersion,
            this.systemLangCode,
            this.langPack,
            this.langCode,
            new raw.functions.help.GetConfig()
          )
        )
      )
    } catch (err: any) {
      if (err && typeof err.value === 'string' && (err.value.startsWith('USER_MIGRATE_') || err.value.startsWith('PHONE_MIGRATE_'))) {
        const targetDc = Number(err.value.split('_')[2])
        if (!isNaN(targetDc) && targetDc > 0) {
          console.log(`🔄 Migrating connection to target DC ${targetDc}...`)
          this.isConnected = false
          if (this.session) {
            await this.session.stop()
            this.session = undefined
          }
          if (this.connection) {
            await this.connection.close()
            this.connection = undefined
          }
          await this.storage.setDcId(targetDc)
          await this.storage.setAuthKey(null)
          return await this.connect()
        }
      }
      throw err
    }
  }

  /**
   * Disconnect from Telegram MTProto servers and save storage state.
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) return
    this.isConnected = false

    if (this.session) {
      await this.session.stop()
      this.session = undefined
    }

    if (this.connection) {
      await this.connection.close()
      this.connection = undefined
    }

    await this.storage.close()
  }

  /**
   * Start the client: connect, perform auto-login if botToken provided, fetch self user info (getMe), and start update dispatcher.
   */
  public async start(): Promise<User> {
    await this.connect()

    if (this.botToken) {
      try {
        const isBot = await this.storage.getIsBot()
        const userId = await this.storage.getUserId()
        if (!isBot || !userId) {
          await this.signInBot(this.botToken)
        }
      } catch {
        await this.signInBot(this.botToken)
      }
    }

    const selfUser = await this.getMe()
    if (!this.noUpdates) {
      this.dispatcher.start()
    }
    return selfUser
  }

  /**
   * Stop the client: stop dispatcher and disconnect session/socket.
   */
  public async stop(): Promise<void> {
    this.dispatcher.stop()
    await this.disconnect()
  }

  /**
   * Restart the client session and dispatcher.
   */
  public async restart(): Promise<User> {
    await this.stop()
    return await this.start()
  }

  /**
   * Run the client: start, execute optional startup callback, and wait for SIGINT/SIGTERM signals to gracefully stop.
   */
  public async run(callback?: (client: Client) => any): Promise<void> {
    await this.start()
    if (callback) {
      await callback(this)
    }
    return new Promise<void>((resolve) => {
      const shutdown = async () => {
        process.off('SIGINT', shutdown)
        process.off('SIGTERM', shutdown)
        await this.stop()
        resolve()
      }
      process.on('SIGINT', shutdown)
      process.on('SIGTERM', shutdown)
    })
  }

  /**
   * Invoke a raw TL query via the MTProto session.
   */
  public async invoke<T = any>(query: raw.TLObject, retries: number = 3): Promise<T> {
    if (!this.session) {
      throw new Error('Client: Cannot invoke query when client is disconnected')
    }
    const res = await this.session.invoke<T>(query, retries)
    if (res && typeof res === 'object') {
      if ('users' in res || 'chats' in res) {
        this._savePeersFromUpdate((res as any).users, (res as any).chats).catch(() => { })
      }
    }
    return res
  }

  private async _savePeersFromUpdate(users?: Map<bigint, any> | any[], chats?: Map<bigint, any> | any[]): Promise<void> {
    if (users) {
      const userList = users instanceof Map ? Array.from(users.values()) : users
      for (const u of userList) {
        if (u && u.id !== undefined) {
          const userId = BigInt(u.id)
          const accessHash = u.access_hash !== undefined ? BigInt(u.access_hash) : 0n
          await this.storage.updatePeer({
            id: userId,
            accessHash,
            type: 'user',
            username: u.username,
            phone: u.phone,
            firstName: u.first_name ?? u.firstName,
            lastName: u.last_name ?? u.lastName,
          })
          if (u instanceof raw.types.User) {
            this.usersCache.set(userId, User._parse(u))
          } else if (u instanceof User) {
            this.usersCache.set(userId, u)
          }
        }
      }
    }
    if (chats) {
      const chatList = chats instanceof Map ? Array.from(chats.values()) : chats
      for (const c of chatList) {
        if (c && c.id !== undefined) {
          const chatId = BigInt(c.id)
          const accessHash = c.access_hash !== undefined ? BigInt(c.access_hash) : 0n
          const isChannel = c.QUALNAME === 'types.Channel' || (c.constructor && c.constructor.name === 'Channel')
          await this.storage.updatePeer({
            id: chatId,
            accessHash,
            type: isChannel ? 'channel' : 'chat',
            username: c.username,
            title: c.title,
          })
        }
      }
    }
  }

  /**
   * Export Pyrogram-compatible base64url session string.
   */
  public async exportSessionString(): Promise<string> {
    return await this.storage.exportSessionString()
  }

  // Dispatcher & Handler Decorators / Helpers
  public addHandler(handler: Handler, group: number = 0): void {
    this.dispatcher.addHandler(handler, group)
  }

  public removeHandler(handler: Handler, group: number = 0): void {
    this.dispatcher.removeHandler(handler, group)
  }

  private _resolveHandlerArgs(filter?: any, callback?: any): { cb: any; flt: any } {
    const cb = typeof filter === 'function' ? filter : callback
    const flt = typeof filter === 'function' ? undefined : filter
    return { cb, flt }
  }

  public onMessage(filter?: Filter | ((client: Client, message: Message) => any), callback?: (client: Client, message: Message) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new MessageHandler(cb, flt))
  }

  public onEditedMessage(filter?: Filter | ((client: Client, message: Message) => any), callback?: (client: Client, message: Message) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new EditedMessageHandler(cb, flt))
  }

  public onCallbackQuery(filter?: Filter | ((client: Client, query: any) => any), callback?: (client: Client, query: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new CallbackQueryHandler(cb, flt))
  }

  public onInlineQuery(filter?: Filter | ((client: Client, query: any) => any), callback?: (client: Client, query: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new InlineQueryHandler(cb, flt))
  }

  public onChosenInlineResult(filter?: Filter | ((client: Client, result: any) => any), callback?: (client: Client, result: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new ChosenInlineResultHandler(cb, flt))
  }

  public onChatMemberUpdated(filter?: Filter | ((client: Client, update: any) => any), callback?: (client: Client, update: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new ChatMemberUpdatedHandler(cb, flt))
  }

  public onChatJoinRequest(filter?: Filter | ((client: Client, request: any) => any), callback?: (client: Client, request: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new ChatJoinRequestHandler(cb, flt))
  }

  public onMessageReaction(filter?: Filter | ((client: Client, reaction: any) => any), callback?: (client: Client, reaction: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new MessageReactionHandler(cb, flt))
  }

  public onPoll(filter?: Filter | ((client: Client, poll: any) => any), callback?: (client: Client, poll: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new PollHandler(cb, flt))
  }

  public onStory(filter?: Filter | ((client: Client, story: any) => any), callback?: (client: Client, story: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new StoryHandler(cb, flt))
  }

  public onPreCheckoutQuery(filter?: Filter | ((client: Client, query: any) => any), callback?: (client: Client, query: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new PreCheckoutQueryHandler(cb, flt))
  }

  public onShippingQuery(filter?: Filter | ((client: Client, query: any) => any), callback?: (client: Client, query: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new ShippingQueryHandler(cb, flt))
  }

  public onUserStatus(filter?: Filter | ((client: Client, status: any) => any), callback?: (client: Client, status: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new UserStatusHandler(cb, flt))
  }

  public onDeletedMessages(filter?: Filter | ((client: Client, messages: any) => any), callback?: (client: Client, messages: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new DeletedMessagesHandler(cb, flt))
  }

  public onConnect(callback: (client: Client) => any): void {
    this.addHandler(new ConnectHandler(callback))
  }

  public onDisconnect(callback: (client: Client) => any): void {
    this.addHandler(new DisconnectHandler(callback))
  }

  public onRawUpdate(filter?: Filter | ((client: Client, update: any) => any), callback?: (client: Client, update: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new RawUpdateHandler(cb, flt))
  }

  public onError(filter?: Filter | ((client: Client, error: any) => any), callback?: (client: Client, error: any) => any): void {
    const { cb, flt } = this._resolveHandlerArgs(filter, callback)
    if (cb) this.addHandler(new ErrorHandler(cb, flt))
  }

  // API Methods
  public getMe = getMe.bind(this)
  public signInBot = signInBot.bind(this)
  public sendMessage = sendMessage.bind(this)
  public editMessageText = editMessageText.bind(this)
  public deleteMessages = deleteMessages.bind(this)
  public forwardMessages = forwardMessages.bind(this)
  public sendChatAction = sendChatAction.bind(this)
  public sendLocation = sendLocation.bind(this)
  public sendContact = sendContact.bind(this)
  public sendDice = sendDice.bind(this)
  public sendPoll = sendPoll.bind(this)
  public copyMessage = copyMessage.bind(this)
  public readHistory = readHistory.bind(this)
  public pinChatMessage = pinChatMessage.bind(this)
  public unpinChatMessage = unpinChatMessage.bind(this)
  public unpinAllChatMessages = unpinAllChatMessages.bind(this)
  public getChat = getChat.bind(this)
  public getChatMembers = getChatMembers.bind(this)
  public getChatMember = getChatMember.bind(this)
  public banChatMember = banChatMember.bind(this)
  public unbanChatMember = unbanChatMember.bind(this)
  public setChatTitle = setChatTitle.bind(this)
  public joinChat = joinChat.bind(this)
  public leaveChat = leaveChat.bind(this)
  public answerCallbackQuery = answerCallbackQuery.bind(this)
  public setBotCommands = setBotCommands.bind(this)
  public getBotCommands = getBotCommands.bind(this)
  public deleteBotCommands = deleteBotCommands.bind(this)
  public getUsers = getUsers.bind(this)
  public blockUser = blockUser.bind(this)
  public unblockUser = unblockUser.bind(this)
  public sendPhoto = sendPhoto.bind(this)
  public sendVideo = sendVideo.bind(this)
  public sendDocument = sendDocument.bind(this)
  public sendAnimation = sendAnimation.bind(this)
  public sendAudio = sendAudio.bind(this)
  public sendVoice = sendVoice.bind(this)
  public getChatHistory = getChatHistory.bind(this)
  public getChatHistoryCount = getChatHistoryCount.bind(this)
  public sendReaction = sendReaction.bind(this)
  public setChatDescription = setChatDescription.bind(this)
  public createChannel = createChannel.bind(this)
  public createGroup = createGroup.bind(this)
  public createSupergroup = createSupergroup.bind(this)
  public answerInlineQuery = answerInlineQuery.bind(this)
  public getCommonChats = getCommonChats.bind(this)
  public getChatPhotos = getChatPhotos.bind(this)
  public saveFile = saveFile.bind(this)
  public sendCode = sendCode.bind(this)
  public resendCode = resendCode.bind(this)
  public signIn = signIn.bind(this)
  public signUp = signUp.bind(this)
  public logOut = logOut.bind(this)
  public acceptTermsOfService = acceptTermsOfService.bind(this)
  public updateProfile = updateProfile.bind(this)
  public setUsername = setUsername.bind(this)
  public getAccountTtl = getAccountTtl.bind(this)
  public setAccountTtl = setAccountTtl.bind(this)
  public getPrivacy = getPrivacy.bind(this)
  public setPrivacy = setPrivacy.bind(this)
  public createChatInviteLink = createChatInviteLink.bind(this)
  public editChatInviteLink = editChatInviteLink.bind(this)
  public revokeChatInviteLink = revokeChatInviteLink.bind(this)
  public deleteChatInviteLink = deleteChatInviteLink.bind(this)
  public approveChatJoinRequest = approveChatJoinRequest.bind(this)
  public declineChatJoinRequest = declineChatJoinRequest.bind(this)
  public addContact = addContact.bind(this)
  public deleteContacts = deleteContacts.bind(this)
  public getContacts = getContacts.bind(this)
  public searchContacts = searchContacts.bind(this)

  // Phase 3 - Password / 2FA
  public enableCloudPassword = enableCloudPassword.bind(this)
  public changeCloudPassword = changeCloudPassword.bind(this)
  public removeCloudPassword = removeCloudPassword.bind(this)

  // Phase 3 - Folders (check invite link)
  public checkChatFolderInviteLink = checkChatFolderInviteLink.bind(this)

  // Phase 3 - Premium
  public applyBoost = applyBoost.bind(this)
  public getBoostsStatus = getBoostsStatus.bind(this)

  // Phase 3 - Phone / Group Calls
  public getCallMembers = getCallMembers.bind(this)

  // Phase 4 - Business
  public getBusinessConnection = getBusinessConnection.bind(this)

  // Phase 4 - Stories
  public sendStory = sendStory.bind(this)
  public getStories = getStories.bind(this)
  public deleteStories = deleteStories.bind(this)

  // Phase 4 - Payments
  public getStarsBalance = getStarsBalance.bind(this)
  public getAvailableGifts = getAvailableGifts.bind(this)
  public sendGift = sendGift.bind(this)

  // Extended Chat Management
  public promoteChatMember = promoteChatMember.bind(this)
  public restrictChatMember = restrictChatMember.bind(this)
  public setChatPhoto = setChatPhoto.bind(this)
  public deleteChatPhoto = deleteChatPhoto.bind(this)
  public setChatPermissions = setChatPermissions.bind(this)
  public setChatProtectedContent = setChatProtectedContent.bind(this)
  public setSlowMode = setSlowMode.bind(this)
  public setAdministratorTitle = setAdministratorTitle.bind(this)
  public setSendAsChat = setSendAsChat.bind(this)
  public getSendAsChats = getSendAsChats.bind(this)
  public setChatDiscussionGroup = setChatDiscussionGroup.bind(this)
  public archiveChats = archiveChats.bind(this)
  public unarchiveChats = unarchiveChats.bind(this)
  public markChatUnread = markChatUnread.bind(this)
  public addChatMembers = addChatMembers.bind(this)
  public deleteUserHistory = deleteUserHistory.bind(this)
  public deleteChannel = deleteChannel.bind(this)
  public deleteSupergroup = deleteSupergroup.bind(this)
  public setChatUsername = setChatUsername.bind(this)
  public getChatOnlineCount = getChatOnlineCount.bind(this)
  public getChatMembersCount = getChatMembersCount.bind(this)
  public toggleForumTopics = toggleForumTopics.bind(this)
  public toggleJoinToSend = toggleJoinToSend.bind(this)
  public getDialogsCount = getDialogsCount.bind(this)
  public getDialogs = getDialogs.bind(this)
  public transferChatOwnership = transferChatOwnership.bind(this)
  public setChatMemberTag = setChatMemberTag.bind(this)
  public setChatTtl = setChatTtl.bind(this)
  public setChatAccentColor = setChatAccentColor.bind(this)
  public setChatProfileAccentColor = setChatProfileAccentColor.bind(this)

  // Extended Chat Folders
  public getFolders = getFolders.bind(this)
  public createFolder = createFolder.bind(this)
  public editFolder = editFolder.bind(this)
  public deleteFolder = deleteFolder.bind(this)
  public reorderFolders = reorderFolders.bind(this)
  public toggleFolderTags = toggleFolderTags.bind(this)
  public createFolderInviteLink = createFolderInviteLink.bind(this)
  public deleteFolderInviteLink = deleteFolderInviteLink.bind(this)
  public getFolderInviteLinks = getFolderInviteLinks.bind(this)
  public getChatsForFolderInviteLink = getChatsForFolderInviteLink.bind(this)
  public joinFolder = joinFolder.bind(this)
  public leaveFolder = leaveFolder.bind(this)

  // Extended Forum Topics
  public createForumTopic = createForumTopic.bind(this)
  public editForumTopic = editForumTopic.bind(this)
  public closeForumTopic = closeForumTopic.bind(this)
  public deleteForumTopic = deleteForumTopic.bind(this)
  public pinForumTopic = pinForumTopic.bind(this)
  public unpinForumTopic = unpinForumTopic.bind(this)
  public getForumTopics = getForumTopics.bind(this)
  public getForumTopicsById = getForumTopicsById.bind(this)
  public getSimilarChannels = getSimilarChannels.bind(this)
  public getSuitableDiscussionChats = getSuitableDiscussionChats.bind(this)
  public getChatEventLog = getChatEventLog.bind(this)

  // Extended Messages
  public getMessages = getMessages.bind(this)
  public searchMessages = searchMessages.bind(this)
  public searchGlobal = searchGlobal.bind(this)
  public readChatHistory = readChatHistory.bind(this)
  public readMentions = readMentions.bind(this)
  public readReactions = readReactions.bind(this)
  public deleteChatHistory = deleteChatHistory.bind(this)
  public searchMessagesCount = searchMessagesCount.bind(this)
  public sendScreenshotNotification = sendScreenshotNotification.bind(this)
  public votePoll = votePoll.bind(this)
  public stopPoll = stopPoll.bind(this)
  public retractVote = retractVote.bind(this)
  public getAvailableEffects = getAvailableEffects.bind(this)
  public getStickers = getStickers.bind(this)
  public getCustomEmojiStickers = getCustomEmojiStickers.bind(this)
  public viewMessages = viewMessages.bind(this)
  public getScheduledMessages = getScheduledMessages.bind(this)
  public sendPaidReaction = sendPaidReaction.bind(this)
  public getDiscussionMessage = getDiscussionMessage.bind(this)
  public getDiscussionReplies = getDiscussionReplies.bind(this)
  public getMediaGroup = getMediaGroup.bind(this)
  public startBot = startBot.bind(this)

  // Extended Bots
  public createInvoiceLink = createInvoiceLink.bind(this)
  public sendInvoice = sendInvoice.bind(this)
  public answerShippingQuery = answerShippingQuery.bind(this)
  public answerPreCheckoutQuery = answerPreCheckoutQuery.bind(this)
  public getBotInfoDescription = getBotInfoDescription.bind(this)
  public setBotInfoDescription = setBotInfoDescription.bind(this)
  public getBotInfoShortDescription = getBotInfoShortDescription.bind(this)
  public setBotInfoShortDescription = setBotInfoShortDescription.bind(this)
  public getBotName = getBotName.bind(this)
  public setBotName = setBotName.bind(this)
  public getBotDefaultPrivileges = getBotDefaultPrivileges.bind(this)
  public setBotDefaultPrivileges = setBotDefaultPrivileges.bind(this)
  public getChatMenuButton = getChatMenuButton.bind(this)
  public setChatMenuButton = setChatMenuButton.bind(this)
  public getGameHighScores = getGameHighScores.bind(this)
  public setGameScore = setGameScore.bind(this)
  public sendGame = sendGame.bind(this)
  public getInlineBotResults = getInlineBotResults.bind(this)
  public sendInlineBotResult = sendInlineBotResult.bind(this)
  public checkBotUsername = checkBotUsername.bind(this)
  public getOwnedBots = getOwnedBots.bind(this)
  public refundStarPayment = refundStarPayment.bind(this)
  public editUserStarSubscription = editUserStarSubscription.bind(this)

  // Account
  public getGlobalPrivacySettings = getGlobalPrivacySettings.bind(this)
  public setGlobalPrivacySettings = setGlobalPrivacySettings.bind(this)
  public setInactiveSessionTtl = setInactiveSessionTtl.bind(this)
  public addProfileAudio = addProfileAudio.bind(this)
  public removeProfileAudio = removeProfileAudio.bind(this)
  public setProfileAudioPosition = setProfileAudioPosition.bind(this)

  // Advanced
  public resolvePeer = resolvePeer.bind(this)
  public recoverGaps = recoverGaps.bind(this)

  // Auth
  public changePhoneNumber = changePhoneNumber.bind(this)
  public getActiveSessions = getActiveSessions.bind(this)
  public resetSession = resetSession.bind(this)
  public resetSessions = resetSessions.bind(this)
  public sendPhoneNumberCode = sendPhoneNumberCode.bind(this)
  public resendPhoneNumberCode = resendPhoneNumberCode.bind(this)

  // Business
  public deleteBusinessMessages = deleteBusinessMessages.bind(this)
  public getBusinessAccountStarBalance = getBusinessAccountStarBalance.bind(this)
  public getBusinessAccountGifts = getBusinessAccountGifts.bind(this)
  public transferBusinessAccountStars = transferBusinessAccountStars.bind(this)
}
