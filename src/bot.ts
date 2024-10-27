import TelegramBot from 'node-telegram-bot-api'
import { google } from 'googleapis'
import { TELEGRAM_BOT_TOKEN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from './config.js'
import { downloadGooglePhoto, getLastVideos } from './downloader.js'
import { cutVideo } from './videoProcessor.js'
import { authenticate, getNewToken, clearToken, sendAuthUrl } from './googleAuth.js'

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id

  const authClient = await authenticate(bot, chatId)
  if (!authClient) {
    await sendAuthUrl(bot, new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI), chatId)
    return
  }

  bot.sendMessage(chatId, 'You are already authenticated!')
})

bot.onText(/\/auth (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const code = match?.[1]

  if (!code) {
    bot.sendMessage(chatId, 'Please provide an authentication code.')
    return
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    )

    await getNewToken(oAuth2Client, code)
    bot.sendMessage(chatId, 'Authentication successful!')
  } catch (error) {
    console.error('Error during authentication:', error)
    bot.sendMessage(chatId, 'Failed to authenticate. Please try again.')
  }
})

bot.onText(/\/clear/, async (msg) => {
  clearToken()
  bot.sendMessage(msg.chat.id, 'Token cleared.')
})

bot.onText(/\/list (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const count = parseInt(match?.[1] || '5', 10)

  try {
    const videos = await getLastVideos(count, bot, chatId)

    if (videos.length === 0) {
      bot.sendMessage(chatId, 'No videos found.')
      return
    }

    const videoList = videos.map((video: any, index: number) => {
      return `${index + 1}. ${video.filename}\nID: ${video.id}\nURL: ${video.url}\nCreated: ${video.created}`
    })

    let messageChunk = ''
    for (const videoEntry of videoList) {
      if ((messageChunk + videoEntry).length > 4096) {
        await bot.sendMessage(chatId, messageChunk)
        messageChunk = ''
      }
      messageChunk += `${videoEntry}\n\n`
    }

    if (messageChunk) {
      await bot.sendMessage(chatId, messageChunk)
    }

  } catch (error) {
    const err = error as Error
    console.error('Error fetching videos:', err.message)
    bot.sendMessage(chatId, 'Failed to retrieve videos.')
  }
})

bot.onText(/\/cut (\S+) (\d{2}:\d{2}:\d{2}) (\d{2}:\d{2}:\d{2})/, async (msg, match) => {
  const chatId = msg.chat.id
  const mediaItemId = match?.[1]
  const startTime = match?.[2]
  const endTime = match?.[3]

  if (!mediaItemId || !startTime || !endTime) {
    bot.sendMessage(chatId, 'Please provide a valid media item ID and start/end times in HH:MM:SS format.')
    return
  }

  const inputPath = `./downloads/${mediaItemId}.mp4`
  const outputPath = `./downloads/${mediaItemId}_cut.mp4`

  try {
    await downloadGooglePhoto(mediaItemId, inputPath, bot, chatId)
    await cutVideo(inputPath, outputPath, startTime, endTime)
    await bot.sendVideo(chatId, outputPath, { caption: `Here's your cut video from ${startTime} to ${endTime}.` })
  } catch (error) {
    console.error('Error processing video:', error)
    bot.sendMessage(chatId, 'Failed to process the video.')
  }
})
