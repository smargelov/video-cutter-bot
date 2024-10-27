import TelegramBot from 'node-telegram-bot-api'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { TELEGRAM_BOT_TOKEN } from './config.js'
import { downloadGooglePhoto, getLastVideos } from './downloader.js'
import { cutVideo } from './videoProcessor.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })

bot.onText(/\/list (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const count = parseInt(match?.[1] || '5', 10)

  try {
    const videos = await getLastVideos(count)

    if (videos.length === 0) {
      bot.sendMessage(chatId, 'No videos found.')
      return
    }

    const videoList = videos.map((video: any, index: number) => {
      return `${index + 1}. ${video.filename}
      \nID: ${video.id}
      \nURL: ${video.url}
      \nCreated: ${video.created}`
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
    console.error('Error fetching videos:', error)
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
    await downloadGooglePhoto(mediaItemId, inputPath)

    await cutVideo(inputPath, outputPath, startTime, endTime)

    await bot.sendVideo(chatId, outputPath, { caption: `Here's your cut video from ${startTime} to ${endTime}.` })
  } catch (error) {
    console.error('Error processing video:', error)
    bot.sendMessage(chatId, 'Failed to process the video.')
  }
})
