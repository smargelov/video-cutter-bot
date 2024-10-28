import fs from 'fs'
import fetch from 'node-fetch'
import { authenticate } from './googleAuth.js'
import path from 'path'

export const getLastVideos = async (count: number, bot: any, chatId: number) => {
  const auth = await authenticate(bot, chatId)
  const token = await auth?.getAccessToken()

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
          mediaTypes: ['VIDEO'],
        }
      }
    })
  })

  if (!response.ok) {
    const errorDetails = await response.text()
    throw new Error(`Failed to fetch videos: ${errorDetails}`)
  }

  const data = await response.json()

  console.log('Fetched videos:', JSON.stringify(data.mediaItems))
  return data.mediaItems.map((item: any) => ({
    id: item.id,
    filename: item.filename,
    created: item.mediaMetadata.creationTime,
    url: item.productUrl
  }))
}

export const downloadGooglePhoto = async (mediaItemId: string, outputPath: string, bot: any, chatId: number): Promise<void> => {
  const auth = await authenticate(bot, chatId)
  const token = await auth?.getAccessToken()

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

const test = [{
  'id': 'ADtR1OrwOczX3Q4Qy_RXMDSxgAg_lTIVJ3OL-H7JybN3vCkIZ1pvJHHkR1PGwB8qhUwzEqKQvsFLN8hhEyxZLnzZDNQn24gKkg',
  'productUrl': 'https://photos.google.com/lr/photo/ADtR1OrwOczX3Q4Qy_RXMDSxgAg_lTIVJ3OL-H7JybN3vCkIZ1pvJHHkR1PGwB8qhUwzEqKQvsFLN8hhEyxZLnzZDNQn24gKkg',
  'baseUrl': 'https://lh3.googleusercontent.com/lr/AAJ1LKcQlsJaBl5J6hBLzcSYQc51pr3IMuiOBUV7CFTviEvPZs0jAg2WqW9RF9lDDK6Jvqh1xH_CU-qRpmVuOChW1D34XX2vVupKXzROE0nnr7yVjbBYnG9FywijcNSU0ba18srR_bO_3Bxqp40eZ7LNPTqNeGDw0ppgJpayZHZTXEHdHooRlw-nYIWsfNGye9_q8CLVoYdkDcAaC0zkQxGtqi2E-SfKWWy3MQqprfYlUNVXCKY-oLXwYwZsCeHoK5eB9d1dLeDVts9Y03MBRXWI6N0OwbyDOzv9OvcpQUW7OiW8jQ6unoyXynIpH7eZPGJjcepTDebsNwamGpgofIeuW8ajRnPn1UKAYJgj_yCUiT4gTc5fYUy_w2yx6O8aTDiYHZvBn6-1aReFSrBxQEFyDnuivQ_BhBsI4Sm_OnLQSVxOADvjQpAVOE98HL3SLCNOECZ_kjJRSQjUoiw9ktj_FvnEWH9FRQeDZEinw7ltfXXiYiuv4EJyn7ZKL24k_0CxSDiRmu2oDcuKO4zqrfrQmiYkQJcmMZ_HBmInwhkuZeIugw1rGEPhJZ6JXuGLPzfb1B-RpLLhT4CW7jPqBht8VAL5lYvRLL9s0Ye1BCtupahj1gWH9YYjm9CtkZpdpv1ZOZoC1qRpsUzsiO0RpoEXKHvgB2Esk2JaCCucUUUpjVYJkkMcp7j-PDcQqLLt1kTxh4BIWcCWweBZqFAdmb_mcI3IurDOHc6sHIpGvUHL5_A1f2raiI81tEG8HkP5J8HrJlUZ02PGxFxayz0ytuMH2O4OXvCDnOVzDSC4gyzYle084nxlcCCdNbJJKH-5Jhx8qk9G8a9V2bWk9SRIC8m3EQZE0akqUIMrViuZajxAjsYHmfkSZnRnlZF7iDOeA0FACUsi3xhjcvu8rOgw4cYI25DazM_U50Bh1OWlRb9W9NipMf4SDXGRafNTvSRNoiwn-cW8V5Mog0kugnydt6StcYdN_Vx_T8FRM95FsF6jb4evf0Q3Mt7rg-A9OZcDrLw71T2cbf1h_nsbxlXVlevGc3c8R_SmG8Y33Rk',
  'mimeType': 'video/mp4',
  'mediaMetadata': { 'creationTime': '2024-10-28T18:56:46Z', 'video': { 'status': 'PROCESSING' } },
  'filename': 'PXL_20241028_184229785.mp4'
}, {
  'id': 'ADtR1OoxN_CSgS_N845XCWMko1-wj8jIwn-jI1tFb0R9IC89-jkuJL3UGJzmTOwkoSiTUV3UOcGfU1DOPh7kqU5-SsaG_AwNkA',
  'productUrl': 'https://photos.google.com/lr/photo/ADtR1OoxN_CSgS_N845XCWMko1-wj8jIwn-jI1tFb0R9IC89-jkuJL3UGJzmTOwkoSiTUV3UOcGfU1DOPh7kqU5-SsaG_AwNkA',
  'baseUrl': 'https://lh3.googleusercontent.com/lr/AAJ1LKfIqA2zUyvx1IyPmlccSbTrX0iDVxLA0wDhJT0p9ERwfTKl8hNpgToywYj87kdmyQZuvy7a1K6bN2MtSRsAQtl79Tp9JyrAXXqxoXr60tc8DUBCjR_7hQYdiKvhN7f8azD8m9b72HsGMfPhavyoTY9syqJLYsE_bqjO9Pfl2_p0YNSaV5wNhwpysG5sJVjeWmhBU1E3CXS5SVIU5pME9rqtE36SrqgLv8eFup10CflFLO1XEirQ4sz3Ly0mDXnMStvpEP8BGGAoqlbTJhcO0dPXYHVxx6kCI64yy1KImiayVGAstfjWYjoPIHlcSadf594oW7khaErPvP160edBrdH-YeQTZkZiu3dgyEcxIM5PG54kiZYttPoV37qcpsiGU_0ZZOqeVLduSNExOAzpnZkBPfBFXj6O-D5oAz9VdvxsEIdTzr7GgZEq2tN9Djpdl8HN3JidGFhISfj368hADhROQOCKnYm6wRGDAAa-9uBVVoBPkwc6O9FzLFTQZG39UFpxD2l2CuEOFzvsl86OiQZHtqWVq8WIBcXmOoUNcSV0kmGEVr1ZDB8gV2FIPHL9FmUonXv9HDR_iWx1FsOnrm0AAG_3u_xGP9cVlKTDkkDvQIi7lf2ornidd0rrFKu-VwRAEMQqzW82JD-Jw0PULqXJp37y4nItUZZoSSoT1hL8eHnCcD6EkBYgYJN2cxxVnkxZk8latCIb03-Cft9jZN8_DVsZ8SC9pc3kPdcVJ3i0NTLNqJlluj9Qr7HgoLVbxAYVkdh15bp4Qo_UHwcOnY1vq_v7KZvx7vMTovr1baTeHEzKrM2K_nnBb-vHqdxyuPzB_zpX6Pe7YoZ0cAtbmyBhBimEEiakuIXO7FtHZlEW5gAsrYNidaNTDDtXCfqcHOtU3qEfsJZkb6ngHPvS9zcV-ZQRHdKDpGJqdyJXzGhvRKtxTGj9eeGHNywa1hZZGPUHOPBPsbll-ok4lnT7jknk6E-w4YLbCIm5TCIYq2ds-8uiLxeZ3YgVDIJLh3cGVCbFtMuKVh2yEzXonLH9vqX_arQBtts6yyk',
  'mimeType': 'video/mp4',
  'mediaMetadata': {
    'creationTime': '2024-10-27T15:59:05Z',
    'width': '3840',
    'height': '2160',
    'video': { 'cameraMake': 'Google', 'cameraModel': 'Pixel 6', 'fps': 60, 'status': 'READY' }
  },
  'filename': 'PXL_20241027_154004532.mp4'
}, {
  'id': 'ADtR1OrU9LpDnuaWU9ZdLEGerCY2MjNllZNSuZtUPkO6EcxDiJXEVen8xx_LKIYb3BjNt4L7exONBJM9CEjUvgvwoOQ9qaCheA',
  'productUrl': 'https://photos.google.com/lr/photo/ADtR1OrU9LpDnuaWU9ZdLEGerCY2MjNllZNSuZtUPkO6EcxDiJXEVen8xx_LKIYb3BjNt4L7exONBJM9CEjUvgvwoOQ9qaCheA',
  'baseUrl': 'https://lh3.googleusercontent.com/lr/AAJ1LKdXdK7-A38GRbcKZ_69f5owG1IHmz6RhBTdFjZzf-NOgYLUh1fAdzviHziYZMmhYLEavySV2rLzTyVb3Ec-QaNaOPVCnLAerwD_kCZOx2qxc8GfO736FARrZiRyuTXo1PVobQTNJhnD6Q9XQ53k7v4eJgjOCq-u9mGLcrvKyALO2oGU1QaswZzpeFNjCAKMWUSrdIb7n_FVkL-AKejuLFAeofoXCZVCER_AwGqI-3sBuqxz2BHtSI6K2qXNVcpD8lxehAbGYuPPFB_lib_2c7ZLGJLQcLMBgtIbfVYn25Tej4pOfzj_ULtT-1BOiids3BvKzpqX7n1qyPkwaCJwv6JlFNiN6Ck2KlWiOKWeFvHls1l0mpET9GT7vFDHe0wyUC7-g9Ab6p1Uqvb3Rf_E35KYviFYQLgsBkGgCTdr-KxOYXYfi03uofQKiFloszgSh6XUfJ0KuLM_KDtMC7aEr8YlqvxQnCYQBvXujNOG6BzzxVWNU6pIMmp4Zv6Rq7f-8PYGyXCTLW3g1czCRtG6QUcbURvY9lfIFD1ZZTwaNJgxz26zLhmQ5rEqJVM3QQgW7FJh3daRr49JfhHSYp0xg_B7-6hPBe2eLSEv3pHqKmQveb4o5GJE09DeZSb7BlM58arIkT9ZXcEyy5Ygteug8RyO5bxbMSlSFoDRqt16BDPQ72z9Cq2KlW81rS6zqPpvAot_e8D4eT6uRQnKWyrJOQDzV1F2L7fNNoRECFvkiahKVkjBHNQAFnzYCa3AsmTxY3jMl1Q9Nd1UV361WSuzHWZvnoHyW-V3hH_bTtCYIX18tmLiP6OEWHCLf9ZvPYuifzxs8_GquPUBMoarq2PwrxyrXHYmLYs4hPmSNvVwQ2doZI-uMaLPz83v913XtkOCI5nlLvAj8xFVqqajZw82FqLjobQeLuBT2q8gKl8YYUEJ32i396guy_zLTPvpkErCHppS0VSPw-4Ah9Miz3sBg1-Yhrdbo8jUdL6nrwZ1Gf-gSFV7KZibFbaJu0oO9GkV6szEjo-2k7M-Nwqaf2MRGugR8YGblu7yRZM',
  'mimeType': 'video/mp4',
  'mediaMetadata': {
    'creationTime': '2024-10-27T15:39:14Z',
    'width': '3840',
    'height': '2160',
    'video': { 'cameraMake': 'Google', 'cameraModel': 'Pixel 6', 'fps': 60, 'status': 'READY' }
  },
  'filename': 'PXL_20241027_152039191.mp4'
}]
