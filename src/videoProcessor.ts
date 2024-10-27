import ffmpeg from 'fluent-ffmpeg'

const calculateDuration = (start: string, end: string): number => {
  const [startHours, startMinutes, startSeconds] = start.split(':').map(Number)
  const [endHours, endMinutes, endSeconds] = end.split(':').map(Number)

  const startTotalSeconds = startHours * 3600 + startMinutes * 60 + startSeconds
  const endTotalSeconds = endHours * 3600 + endMinutes * 60 + endSeconds
  const durationSeconds = endTotalSeconds - startTotalSeconds

  if (durationSeconds <= 0) {
    throw new Error('End time must be greater than start time.')
  }

  return durationSeconds
}

export const cutVideo = async (inputPath: string, outputPath: string, startTime: string, endTime: string): Promise<void> => {
  const duration = calculateDuration(startTime, endTime)

  console.log(`Starting cut from ${startTime} to ${endTime} (duration: ${duration} seconds)`)

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => {
        console.error('FFmpeg Error:', err.message)
        reject(err)
      })
      .run()
  })
}
