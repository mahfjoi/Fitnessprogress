import { useEffect, useState } from 'react'

/** Zahleneingabe, die Komma und Punkt akzeptiert und Zwischenzustände wie „57,“ zulässt */
export default function NumInput({
  value,
  onChange,
  placeholder,
  decimal = false,
  className,
}: {
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  decimal?: boolean
  className?: string
}) {
  const fmt = (v: number | null) => (v === null ? '' : String(v).replace('.', ','))
  const [text, setText] = useState(fmt(value))

  useEffect(() => {
    // Externe Änderungen übernehmen, ohne laufende Eingabe zu überschreiben
    const parsed = parse(text)
    if (parsed !== value) setText(fmt(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <input
      className={className}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      placeholder={placeholder}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const t = e.target.value.replace(decimal ? /[^0-9.,]/g : /[^0-9]/g, '')
        setText(t)
        onChange(parse(t))
      }}
    />
  )
}

function parse(t: string): number | null {
  if (t.trim() === '') return null
  const n = parseFloat(t.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
