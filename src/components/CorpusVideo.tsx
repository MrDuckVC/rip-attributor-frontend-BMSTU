import { useState } from 'react'
import { DEFAULT_IMAGE, DEFAULT_VIDEO } from '../modules/media'
import { CorpusImage } from './CorpusImage'

interface Props {
  videoUrl: string
  imageUrl: string
  name: string
}

export function CorpusVideo({ videoUrl, imageUrl, name }: Props) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const source = videoUrl || DEFAULT_VIDEO
  const currentSource = failedSource === source ? DEFAULT_VIDEO : source

  if (failedSource === DEFAULT_VIDEO) {
    return <CorpusImage url={imageUrl} name={name} className="bg-video" />
  }

  return <video
    key={currentSource}
    className="bg-video"
    aria-label="Видео корпуса"
    src={currentSource}
    poster={imageUrl || DEFAULT_IMAGE}
    autoPlay loop muted playsInline
    onError={() => setFailedSource(currentSource)}
  />
}
