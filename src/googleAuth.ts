import fs from 'fs'
import readline from 'readline'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from './config.js'

const SCOPES = ['https://www.googleapis.com/auth/photoslibrary.readonly']
const TOKEN_PATH = 'token.json'

export const authenticate = async(): Promise<OAuth2Client> => {
  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  )

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
    oAuth2Client.setCredentials(token)
    return oAuth2Client
  } else {
    return getNewToken(oAuth2Client)
  }
}

const getNewToken = (oAuth2Client: OAuth2Client): Promise<OAuth2Client> => {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    })
    console.log('Authorize this app by visiting this URL:', authUrl)

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close()
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return reject(err)
        oAuth2Client.setCredentials(token!)
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token))
        console.log('Token stored to', TOKEN_PATH)
        resolve(oAuth2Client)
      })
    })
  })
}
