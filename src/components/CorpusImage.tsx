import { Card } from 'react-bootstrap'
import { DEFAULT_IMAGE } from '../modules/media'

interface Props {
  url: string
  name: string
  className?: string
}

export function CorpusImage({ url, name, className = 'card-img' }: Props) {
  // Card.Img добавляет класс card-img: он нужен карточке, но не фону ленты.
  const Image = className === 'bg-video' ? 'img' : Card.Img
  return <Image
    className={className}
    src={url || DEFAULT_IMAGE}
    alt={name}
    onError={(event) => {
      const image = event.currentTarget
      // Не повторяем запрос бесконечно, если недоступна сама заглушка.
      if (image.getAttribute('src') !== DEFAULT_IMAGE) image.src = DEFAULT_IMAGE
    }}
  />
}
