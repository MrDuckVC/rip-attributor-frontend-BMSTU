import { Button, Form } from 'react-bootstrap'
import { MAX_WORD_COUNT } from '../modules/corpora'
import { Icon } from './Icons'

interface Props {
  value: number
  onChange: (value: number) => void
  onSubmit: () => void
}

export function CorpusFilter({ value, onChange, onSubmit }: Props) {
  return <Form className="search-container" onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
    <div className="slider-wrapper">
      <Form.Label className="slider-label" htmlFor="minimum-words">Объём текста (кол-во слов)</Form.Label>
      <output htmlFor="minimum-words" className="slider-current">≥ {value.toLocaleString('ru-RU')}</output>
      <Form.Range
        id="minimum-words"
        className="range-slider"
        min={0} max={MAX_WORD_COUNT} step={5000}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="slider-limits"><span>0</span><span>200 000</span></div>
    </div>
    <Button type="submit" className="btn-search" aria-label="Применить фильтр" title="Применить фильтр"><Icon name="search" /></Button>
  </Form>
}
