import { useEffect, useRef } from 'react'
import { DEFAULT_IMAGE } from '../modules/media'

export function CorpusImagePreview({ file }: { file?: File }) {
  const image = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const url = file ? URL.createObjectURL(file) : DEFAULT_IMAGE
    if (image.current) image.current.src = url
    return () => { if (file) URL.revokeObjectURL(url) }
  }, [file])
  return <img ref={image} className="draft-preview" src={DEFAULT_IMAGE} alt="Предпросмотр изображения корпуса" />
}
