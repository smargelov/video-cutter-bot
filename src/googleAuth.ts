import fs from 'fs'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from './config.js'

const SCOPES = ['https://www.googleapis.com/auth/photoslibrary.readonly']
const TOKEN_PATH = 'token.json'

export const authenticate = async (bot: any, chatId: number): Promise<OAuth2Client | null> => {
  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  )

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
    oAuth2Client.setCredentials(token)

    try {
      await oAuth2Client.getAccessToken()
      return oAuth2Client
    } catch (error) {
      console.warn('Token expired or invalid. Re-authenticating...')
      await sendAuthUrl(bot, oAuth2Client, chatId)
      return null
    }
  } else {
    await sendAuthUrl(bot, oAuth2Client, chatId)
    return null
  }
}

export const sendAuthUrl = async (bot: any, oAuth2Client: OAuth2Client, chatId: number) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  })
  await bot.sendMessage(chatId, `Please authorize this app by visiting the following URL:\n${authUrl}`)
  console.log(`Authentication URL sent to user with chatId: ${chatId}`)
}

export const getNewToken = async (oAuth2Client: OAuth2Client, code: string) => {
  const { tokens } = await oAuth2Client.getToken(code)
  oAuth2Client.setCredentials(tokens)
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens))
  console.log('Token stored to', TOKEN_PATH)
}

export const clearToken = () => {
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH)
  }
}
