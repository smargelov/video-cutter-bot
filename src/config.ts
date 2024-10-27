import dotenv from 'dotenv'

dotenv.config()

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN as string
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI as string

if (!TELEGRAM_BOT_TOKEN || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  throw new Error('Some environment variables are missing in .env')
}
