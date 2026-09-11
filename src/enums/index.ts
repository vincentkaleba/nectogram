//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//  LGPL-3.0-or-later

/**
 * All High-level Enums ported from Pyrogram for Nectogram.
 */

/**
 * Block list enumeration
 */
export enum BlockList {
  MAIN = 'main',
  STORIES = 'stories',
}

/**
 * Business away enumeration used in :obj:`~pyrogram.types.BusinessMessage`.
 */
export enum BusinessSchedule {
  ALWAYS = 'always',
  OUTSIDE_WORK_HOURS = 'outside_work_hours',
  CUSTOM = 'custom',
}

/**
 * Button style type enumeration used in :obj:`~pyrogram.types.KeyboardButton` and :obj:`~pyrogram.types.InlineKeyboardButton`.
 */
export enum ButtonStyle {
  DEFAULT = 'default',
  PRIMARY = 'primary',
  DANGER = 'danger',
  SUCCESS = 'success',
}

/**
 * Chat action enumeration used in :obj:`~pyrogram.types.ChatEvent`.
 */
export enum ChatAction {
  TYPING = 'typing',
  UPLOAD_PHOTO = 'upload_photo',
  RECORD_VIDEO = 'record_video',
  UPLOAD_VIDEO = 'upload_video',
  RECORD_AUDIO = 'record_audio',
  UPLOAD_AUDIO = 'upload_audio',
  UPLOAD_DOCUMENT = 'upload_document',
  FIND_LOCATION = 'find_location',
  RECORD_VIDEO_NOTE = 'record_video_note',
  UPLOAD_VIDEO_NOTE = 'upload_video_note',
  PLAYING = 'playing',
  CHOOSE_CONTACT = 'choose_contact',
  SPEAKING = 'speaking',
  IMPORT_HISTORY = 'import_history',
  CHOOSE_STICKER = 'choose_sticker',
  CANCEL = 'cancel',
}

/**
 * Chat event action enumeration used in :meth:`~pyrogram.Client.get_chat_event_log`.
 */
export enum ChatEventAction {
  DESCRIPTION_CHANGED = 'description_changed',
  HISTORY_TTL_CHANGED = 'history_ttl_changed',
  LINKED_CHAT_CHANGED = 'linked_chat_changed',
  PHOTO_CHANGED = 'photo_changed',
  TITLE_CHANGED = 'title_changed',
  USERNAME_CHANGED = 'username_changed',
  CHAT_PERMISSIONS_CHANGED = 'chat_permissions_changed',
  MESSAGE_DELETED = 'message_deleted',
  MESSAGE_EDITED = 'message_edited',
  INVITE_LINK_EDITED = 'invite_link_edited',
  INVITE_LINK_REVOKED = 'invite_link_revoked',
  INVITE_LINK_DELETED = 'invite_link_deleted',
  MEMBER_INVITED = 'member_invited',
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  ADMINISTRATOR_PRIVILEGES_CHANGED = 'administrator_privileges_changed',
  MEMBER_PERMISSIONS_CHANGED = 'member_permissions_changed',
  POLL_STOPPED = 'poll_stopped',
  INVITES_ENABLED = 'invites_enabled',
  HISTORY_HIDDEN = 'history_hidden',
  SIGNATURES_ENABLED = 'signatures_enabled',
  SLOW_MODE_CHANGED = 'slow_mode_changed',
  MESSAGE_PINNED = 'message_pinned',
  MESSAGE_UNPINNED = 'message_unpinned',
  MESSAGE_PIN_CHANGED = 'message_pin_changed',
  CREATED_FORUM_TOPIC = 'created_forum_topic',
  EDITED_FORUM_TOPIC = 'edited_forum_topic',
  DELETED_FORUM_TOPIC = 'deleted_forum_topic',
  UNKNOWN = 'unknown',
}

/**
 * Media area type enumeration used in :meth:`~pyrogram.Client.answer_chat_join_request_query`.
 */
export enum ChatJoinRequestQueryResult {
  APPROVE = 'approve',
  DECLINE = 'decline',
  QUEUE = 'queue',
}

/**
 * How the service message :obj:`~pyrogram.enums.MessageServiceType.NEW_CHAT_MEMBERS` was used for the member to join the chat.
 */
export enum ChatJoinType {
  BY_ADD = 'by_add',
  BY_LINK = 'by_link',
  BY_REQUEST = 'by_request',
}

/**
 * Chat member status enumeration used in :obj:`~pyrogram.types.ChatMember`.
 */
export enum ChatMemberStatus {
  OWNER = 'owner',
  ADMINISTRATOR = 'administrator',
  MEMBER = 'member',
  RESTRICTED = 'restricted',
  LEFT = 'left',
  BANNED = 'banned',
}

/**
 * Chat members filter enumeration used in :meth:`~pyrogram.Client.get_chat_members`
 */
export enum ChatMembersFilter {
  SEARCH = 'search',
  BANNED = 'banned',
  RESTRICTED = 'restricted',
  BOTS = 'bots',
  RECENT = 'recent',
  ADMINISTRATORS = 'administrators',
}

/**
 * Chat photo sticker type enumeration used in :obj:`~pyrogram.types.ChatPhotoSticker`.
 */
export enum ChatPhotoStickerType {
  REGULAR_OR_MASK = 'regular_or_mask',
  CUSTOM_EMOJI = 'custom_emoji',
}

/**
 * Chat type enumeration used in :obj:`~pyrogram.types.Chat`.
 */
export enum ChatType {
  PRIVATE = 'private',
  BOT = 'bot',
  GROUP = 'group',
  SUPERGROUP = 'supergroup',
  CHANNEL = 'channel',
  FORUM = 'forum',
  DIRECT = 'direct',
}

/**
 * Valid platforms for a :obj:`~pyrogram.Client`.
 */
export enum ClientPlatform {
  ANDROID = 'android',
  IOS = 'ios',
  WP = 'wp',
  BB = 'bb',
  DESKTOP = 'desktop',
  WEB = 'web',
  UBP = 'ubp',
  OTHER = 'other',
}

/**
 * Folder color enumeration used in :obj:`~pyrogram.types.Folder`.
 */
export enum FolderColor {
  NO_COLOR = 'no_color',
  RED = 'red',
  ORANGE = 'orange',
  VIOLET = 'violet',
  GREEN = 'green',
  CYAN = 'cyan',
  BLUE = 'blue',
  PINK = 'pink',
}

/**
 * Star gift attribute type enumeration used in :obj:`~pyrogram.types.GiftAttribute`.
 */
export enum GiftAttributeType {
  MODEL = 'model',
  SYMBOL = 'symbol',
  BACKDROP = 'backdrop',
  ORIGINAL_DETAILS = 'original_details',
}

/**
 * Describes order in which upgraded gifts for resale will be sorted. Used in :meth:`~pyrogram.Client.search_gifts_for_resale`.
 */
export enum GiftForResaleOrder {
  PRICE = 'price',
  CHANGE_DATE = 'change_date',
  NUMBER = 'number',
}

/**
 * Gift purchase offer state enumeration used in :obj:`~pyrogram.types.UpgradedGiftPurchaseOffer`.
 */
export enum GiftPurchaseOfferState {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

/**
 * Gift type enumeration used in :obj:`~pyrogram.types.Gift`.
 */
export enum GiftType {
  REGULAR = 'regular',
  UPGRADED = 'upgraded',
}

/**
 * Mask point type enumeration used in :obj:`~pyrogram.types.MaskPosition`.
 */
export enum MaskPointType {
  FOREHEAD = 'forehead',
  EYES = 'eyes',
  MOUTH = 'mouth',
  CHIN = 'chin',
}

/**
 * Media area type enumeration used in :obj:`~pyrogram.types.MediaArea`.
 */
export enum MediaAreaType {
  POST = 'post',
  LOCATION = 'location',
  REACTION = 'reaction',
  URL = 'url',
  VENUE = 'venue',
  WEATHER = 'weather',
  GIFT = 'gift',
}

/**
 * Message entity type enumeration used in :obj:`~pyrogram.types.MessageEntity`.
 */
export enum MessageEntityType {
  MENTION = 'mention',
  HASHTAG = 'hashtag',
  CASHTAG = 'cashtag',
  BOT_COMMAND = 'bot_command',
  URL = 'url',
  EMAIL = 'email',
  PHONE_NUMBER = 'phone_number',
  BOLD = 'bold',
  ITALIC = 'italic',
  UNDERLINE = 'underline',
  STRIKETHROUGH = 'strikethrough',
  SPOILER = 'spoiler',
  CODE = 'code',
  PRE = 'pre',
  BLOCKQUOTE = 'blockquote',
  TEXT_LINK = 'text_link',
  TEXT_MENTION = 'text_mention',
  BANK_CARD = 'bank_card',
  CUSTOM_EMOJI = 'custom_emoji',
  DATE_TIME = 'date_time',
  UNKNOWN = 'unknown',
}

/**
 * Message media type enumeration used in :obj:`~pyrogram.types.Message`.
 */
export enum MessageMediaType {
  UNSUPPORTED = 'unsupported',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  PHOTO = 'photo',
  LIVE_PHOTO = 'live_photo',
  STICKER = 'sticker',
  VIDEO = 'video',
  ANIMATION = 'animation',
  VOICE = 'voice',
  VIDEO_NOTE = 'video_note',
  CONTACT = 'contact',
  LOCATION = 'location',
  VENUE = 'venue',
  POLL = 'poll',
  WEB_PAGE = 'web_page',
  DICE = 'dice',
  GAME = 'game',
  GIVEAWAY = 'giveaway',
  GIVEAWAY_WINNERS = 'giveaway_winners',
  STORY = 'story',
  INVOICE = 'invoice',
  PAID_MEDIA = 'paid_media',
  CHECKLIST = 'checklist',
}

/**
 * Message origin type enumeration used in :obj:`~pyrogram.types.MessageOrigin`.
 */
export enum MessageOriginType {
  CHANNEL = 'channel',
  CHAT = 'chat',
  HIDDEN_USER = 'hidden_user',
  IMPORT = 'import',
  USER = 'user',
}

/**
 * Message service type enumeration used in :obj:`~pyrogram.types.Message`.
 */
export enum MessageServiceType {
  UNSUPPORTED = 'unsupported',
  CUSTOM_ACTION = 'custom_action',
  NEW_CHAT_MEMBERS = 'new_chat_members',
  LEFT_CHAT_MEMBER = 'left_chat_member',
  CHAT_OWNER_LEFT = 'chat_owner_left',
  CHAT_OWNER_CHANGED = 'chat_owner_changed',
  NEW_CHAT_TITLE = 'new_chat_title',
  NEW_CHAT_PHOTO = 'new_chat_photo',
  DELETE_CHAT_PHOTO = 'delete_chat_photo',
  FORUM_TOPIC_CREATED = 'forum_topic_created',
  FORUM_TOPIC_CLOSED = 'forum_topic_closed',
  FORUM_TOPIC_REOPENED = 'forum_topic_reopened',
  FORUM_TOPIC_EDITED = 'forum_topic_edited',
  GENERAL_FORUM_TOPIC_HIDDEN = 'general_forum_topic_hidden',
  GENERAL_FORUM_TOPIC_UNHIDDEN = 'general_forum_topic_unhidden',
  GROUP_CHAT_CREATED = 'group_chat_created',
  CHANNEL_CHAT_CREATED = 'channel_chat_created',
  SUPERGROUP_CHAT_CREATED = 'supergroup_chat_created',
  MIGRATE_TO_CHAT_ID = 'migrate_to_chat_id',
  MIGRATE_FROM_CHAT_ID = 'migrate_from_chat_id',
  PINNED_MESSAGE = 'pinned_message',
  GAME_HIGH_SCORE = 'game_high_score',
  GIVEAWAY_CREATED = 'giveaway_created',
  GIVEAWAY_COMPLETED = 'giveaway_completed',
  MANAGED_BOT_CREATED = 'managed_bot_created',
  POLL_OPTION_ADDED = 'poll_option_added',
  POLL_OPTION_DELETED = 'poll_option_deleted',
  PREMIUM_GIFT_CODE = 'premium_gift_code',
  GIFTED_PREMIUM = 'gifted_premium',
  GIFTED_STARS = 'gifted_stars',
  GIFTED_GRAMS = 'gifted_grams',
  VIDEO_CHAT_STARTED = 'video_chat_started',
  VIDEO_CHAT_ENDED = 'video_chat_ended',
  VIDEO_CHAT_SCHEDULED = 'video_chat_scheduled',
  VIDEO_CHAT_MEMBERS_INVITED = 'video_chat_members_invited',
  PHONE_CALL_STARTED = 'phone_call_started',
  PHONE_CALL_ENDED = 'phone_call_ended',
  WEB_APP_DATA = 'web_app_data',
  USERS_SHARED = 'users_shared',
  CHAT_SHARED = 'chat_shared',
  SUCCESSFUL_PAYMENT = 'successful_payment',
  REFUNDED_PAYMENT = 'refunded_payment',
  SUGGESTED_POST_APPROVAL_FAILED = 'suggested_post_approval_failed',
  SUGGESTED_POST_APPROVED = 'suggested_post_approved',
  SUGGESTED_POST_DECLINED = 'suggested_post_declined',
  SUGGESTED_POST_PAID = 'suggested_post_paid',
  SUGGESTED_POST_REFUNDED = 'suggested_post_refunded',
  SET_MESSAGE_AUTO_DELETE_TIME = 'set_message_auto_delete_time',
  CHAT_BOOST = 'chat_boost',
  GIFT = 'gift',
  CONNECTED_WEBSITE = 'connected_website',
  WRITE_ACCESS_ALLOWED = 'write_access_allowed',
  SCREENSHOT_TAKEN = 'screenshot_taken',
  CONTACT_REGISTERED = 'contact_registered',
  PROXIMITY_ALERT_TRIGGERED = 'proximity_alert_triggered',
  HISTORY_CLEARED = 'history_cleared',
  SUGGEST_PROFILE_PHOTO = 'suggest_profile_photo',
  SUGGEST_BIRTHDAY = 'suggest_birthday',
  CHAT_SET_BACKGROUND = 'chat_set_background',
  CHAT_SET_THEME = 'chat_set_theme',
  GIVEAWAY_PRIZE_STARS = 'giveaway_prize_stars',
  PAID_MESSAGES_REFUNDED = 'paid_messages_refunded',
  PAID_MESSAGES_PRICE_CHANGED = 'paid_messages_price_changed',
  DIRECT_MESSAGE_PRICE_CHANGED = 'direct_message_price_changed',
  CHECKLIST_TASKS_DONE = 'checklist_tasks_done',
  CHECKLIST_TASKS_ADDED = 'checklist_tasks_added',
  COMMUNITY_CHAT_ADDED = 'community_chat_added',
  COMMUNITY_CHAT_REMOVED = 'community_chat_removed',
  COMMUNITY_CHAT_JOINED = 'community_chat_joined',
  UPGRADED_GIFT_PURCHASE_OFFER = 'upgraded_gift_purchase_offer',
  UPGRADED_GIFT_PURCHASE_OFFER_REJECTED = 'upgraded_gift_purchase_offer_rejected',
  CHAT_HAS_PROTECTED_CONTENT_TOGGLED = 'chat_has_protected_content_toggled',
  CHAT_HAS_PROTECTED_CONTENT_DISABLE_REQUESTED = 'chat_has_protected_content_disable_requested',
}

/**
 * Messages filter enumeration used in :meth:`~pyrogram.Client.search_messages` and :meth:`~pyrogram.Client.search_global`
 */
export enum MessagesFilter {
  EMPTY = 'empty',
  PHOTO = 'photo',
  VIDEO = 'video',
  PHOTO_VIDEO = 'photo_video',
  DOCUMENT = 'document',
  URL = 'url',
  ANIMATION = 'animation',
  VOICE_NOTE = 'voice_note',
  VIDEO_NOTE = 'video_note',
  AUDIO_VIDEO_NOTE = 'audio_video_note',
  AUDIO = 'audio',
  CHAT_PHOTO = 'chat_photo',
  PHONE_CALL = 'phone_call',
  MENTION = 'mention',
  LOCATION = 'location',
  CONTACT = 'contact',
  PINNED = 'pinned',
  POLL = 'poll',
}

/**
 * Next code type enumeration used in :obj:`~pyrogram.types.SentCode`.
 */
export enum NextCodeType {
  CALL = 'call',
  FLASH_CALL = 'flash_call',
  MISSED_CALL = 'missed_call',
  SMS = 'sms',
  FRAGMENT_SMS = 'fragment_sms',
}

/**
 * Reaction privacy type enumeration used in :meth:`~pyrogram.Client.send_paid_reaction`.
 */
export enum PaidReactionPrivacy {
  DEFAULT = 'default',
  ANONYMOUS = 'anonymous',
  CHAT = 'chat',
}

/**
 * Parse mode enumeration used in various places to set a specific parse mode
 */
export enum ParseMode {
  DEFAULT = 'default',
  MARKDOWN = 'markdown',
  HTML = 'html',
  RAW = 'raw',
  DISABLED = 'disabled',
}

/**
 * Describes type of payment form.
 */
export enum PaymentFormType {
  REGULAR = 'regular',
  STARS = 'stars',
  STAR_SUBSCRIPTION = 'star_subscription',
}

/**
 * Phone call discard reason enumeration used in :obj:`~pyrogram.types.PhoneCallEnded`.
 */
export enum PhoneCallDiscardReason {
  MISSED = 'missed',
  DECLINED = 'declined',
  DISCONNECTED = 'disconnected',
  HUNG_UP = 'hung_up',
  UPGRADE_TO_CONFERENCE_CALL = 'upgrade_to_conference_call',
}

/**
 * Describes type of the request for which a code is sent to a phone number
 */
export enum PhoneNumberCodeType {
  AUTHENTICATION = 'authentication',
  CHANGE = 'change',
  VERIFY = 'verify',
}

/**
 * Poll type enumeration used in :obj:`~pyrogram.types.Poll`.
 */
export enum PollType {
  QUIZ = 'quiz',
  REGULAR = 'regular',
}

/**
 * Privacy key enumeration used in :meth:`~pyrogram.Client.set_privacy`.
 */
export enum PrivacyKey {
  ABOUT = 'about',
  ADDED_BY_PHONE = 'added_by_phone',
  BIRTHDAY = 'birthday',
  CHAT_INVITE = 'chat_invite',
  FORWARDS = 'forwards',
  PHONE_CALL = 'phone_call',
  PHONE_NUMBER = 'phone_number',
  PHONE_P2P = 'phone_p2p',
  PROFILE_PHOTO = 'profile_photo',
  STATUS = 'status',
  VOICE_MESSAGES = 'voice_messages',
  GIFTS = 'gifts',
  NO_PAID_MESSAGES = 'no_paid_messages',
  SAVED_MUSIC = 'saved_music',
}

/**
 * Privacy rule type enumeration used in :obj:`~pyrogram.types.PrivacyRule`.
 */
export enum PrivacyRuleType {
  ALLOW_ALL = 'allow_all',
  ALLOW_BOTS = 'allow_bots',
  ALLOW_CHAT_PARTICIPANTS = 'allow_chat_participants',
  ALLOW_CLOSE_FRIENDS = 'allow_close_friends',
  ALLOW_CONTACTS = 'allow_contacts',
  ALLOW_PREMIUM = 'allow_premium',
  ALLOW_USERS = 'allow_users',
  DISALLOW_ALL = 'disallow_all',
  DISALLOW_BOTS = 'disallow_bots',
  DISALLOW_CHAT_PARTICIPANTS = 'disallow_chat_participants',
  DISALLOW_CONTACTS = 'disallow_contacts',
  DISALLOW_USERS = 'disallow_users',
}

/**
 * Profile tab enumeration used in :obj:`~pyrogram.types.Chat`.
 */
export enum ProfileTab {
  POSTS = 'posts',
  GIFTS = 'gifts',
  MEDIA = 'media',
  FILES = 'files',
  LINKS = 'links',
  MUSIC = 'music',
  VOICE = 'voice',
  GIFS = 'gifs',
}

/**
 * Proxy scheme enumeration used in :obj:`~pyrogram.Client`'s ``proxy`` parameter.
 */
export enum ProxyScheme {
  SOCKS4 = 'socks4',
  SOCKS5 = 'socks5',
  HTTP = 'http',
  MTPROXY = 'mtproxy',
  WEB = 'web',
}

/**
 * Sent code type enumeration used in :obj:`~pyrogram.types.SentCode`.
 */
export enum SentCodeType {
  APP = 'app',
  CALL = 'call',
  FLASH_CALL = 'flash_call',
  MISSED_CALL = 'missed_call',
  SMS = 'sms',
  FRAGMENT_SMS = 'fragment_sms',
  EMAIL_CODE = 'email_code',
  FIREBASE_SMS = 'firebase_sms',
  SETUP_EMAIL_REQUIRED = 'setup_email_required',
  SMS_PHRASE = 'sms_phrase',
  SMS_WORD = 'sms_word',
}

/**
 * Sticker type enumeration used in :obj:`~pyrogram.types.Sticker`.
 */
export enum StickerType {
  REGULAR = 'regular',
  MASK = 'mask',
  CUSTOM_EMOJI = 'custom_emoji',
}

/**
 * Stories privacy rules type enumeration used in :meth:`~pyrogram.Client.send_story`.
 */
export enum StoriesPrivacyRules {
  PUBLIC = 'public',
  CONTACTS = 'contacts',
  CLOSE_FRIENDS = 'close_friends',
  SELECTED_USERS = 'selected_users',
}

/**
 * Suggested post refund reason enumeration used in :obj:`~pyrogram.types.SuggestedPostRefunded`.
 */
export enum SuggestedPostRefundReason {
  POST_DELETED = 'post_deleted',
  PAYMENT_REFUNDED = 'payment_refunded',
}

/**
 * Suggested post state enumeration used in :obj:`~pyrogram.types.SuggestedPostInfo`.
 */
export enum SuggestedPostState {
  PENDING = 'pending',
  APPROVED = 'approved',
  DECLINED = 'declined',
}

/**
 * Represents the categories of chats for which a list of frequently used chats can be retrieved.
    Used in :meth:`~pyrogram.Client.get_top_chats`.
 */
export enum TopChatCategory {
  USERS = 'users',
  BOTS = 'bots',
  GROUPS = 'groups',
  CHANNELS = 'channels',
  INLINE_BOTS = 'inline_bots',
  GUEST_BOTS = 'guest_bots',
  WEB_APP_BOTS = 'web_app_bots',
  CALLS = 'calls',
  FORWARD_CHATS = 'forward_chats',
}

/**
 * Origin from which the upgraded gift was obtained. Used in :obj:`~pyrogram.types.Gift`.
 */
export enum UpgradedGiftOrigin {
  UPGRADE = 'upgrade',
  TRANSFER = 'transfer',
  RESALE = 'resale',
  BLOCKCHAIN = 'blockchain',
  GIFTED_UPGRADE = 'gifted_upgrade',
  OFFER = 'offer',
  CRAFT = 'craft',
}

/**
 * User status enumeration used in :obj:`~pyrogram.types.User`.
 */
export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  RECENTLY = 'recently',
  LAST_WEEK = 'last_week',
  LAST_MONTH = 'last_month',
  LONG_AGO = 'long_ago',
}

/**
 * High-level Enum for Telegram Inline Button Action Types.
 */
export enum InlineButtonActionType {
  CALLBACK = 'callback',
  URL = 'url',
  WEB_APP = 'web_app',
  SWITCH_INLINE = 'switch_inline',
  COPY = 'copy',
  BUY = 'buy',
  USER_PROFILE = 'user_profile',
}

