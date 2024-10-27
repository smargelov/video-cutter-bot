import fs from 'fs'
import fetch from 'node-fetch'
import { authenticate } from './googleAuth.js'
import path from 'path'

export const getLastVideos = async (count: number) => {
  const auth = await authenticate()
  const token = await auth.getAccessToken()

  const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token?.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pageSize: count,
      filters: {
        mediaTypeFilter: {
          mediaTypes: ['VIDEO']
        }
      }
    })
  })

  if (!response.ok) {
    const errorDetails = await response.text()
    throw new Error(`Failed to fetch videos: ${errorDetails}`)
  }

  const data = await response.json()

  return data.mediaItems.map((item: any) => ({
    id: item.id,
    filename: item.filename,
    created: item.mediaMetadata.creationTime,
    url: item.productUrl
  }))
}

export const downloadGooglePhoto = async (mediaItemId: string, outputPath: string): Promise<void> => {
  const auth = await authenticate()
  const token = await auth.getAccessToken()

  if (!token) {
    throw new Error('Failed to obtain access token.')
  }

  const downloadsDir = path.dirname(outputPath)
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true })
  }

  const response = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems/${mediaItemId}`, {
    headers: { Authorization: `Bearer ${token.token}` }
  })

  if (!response.ok) {
    const errorDetails = await response.text()
    throw new Error(`Failed to fetch media item: ${errorDetails}`)
  }

  const mediaItem = await response.json()
  const mediaUrl = `${mediaItem.baseUrl}=dv`

  const mediaResponse = await fetch(mediaUrl)
  if (!mediaResponse.ok) {
    throw new Error('Failed to download media content')
  }

  const buffer = Buffer.from(await mediaResponse.arrayBuffer())
  fs.writeFileSync(outputPath, buffer)
}

const extractMediaItemId = (url: string): string | null => {
  const match = url.match(/\/([a-zA-Z0-9_-]+)$/)
  return match ? match[1] : null
}
