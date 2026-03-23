import { useState, useEffect, useRef } from 'react'
import { CalendarIcon } from '@heroicons/react/24/outline'

const HOURS   = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const pad = n => String(n).padStart(2, '0')

function parseValue(val) {
  if (!val) return { date: '', hour: 9, minute: 0 }
  const [datePart, timePart = '09:00'] = val.split('T')
  const [h, m] = timePart.split(':').map(Number)
  const minute = MINUTES.includes(m) ? m : MINUTES.reduce((a, b) => Math.abs(b - m) < Math.abs(a - m) ? b : a)
  return { date: datePart, hour: h, minute }
}

export default function DateTimePicker({ value, onChange, required, className, placeholder = 'בחר תאריך ושעה' }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() => parseValue(value))
  const wrapRef = useRef()

  useEffect(() => { setDraft(parseValue(value)) }, [value])

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown) }
  }, [open])

  function confirm() {
    if (!draft.date) return
    onChange(`${draft.date}T${pad(draft.hour)}:${pad(draft.minute)}`)
    setOpen(false)
  }

  const display = value
    ? new Date(value).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

  const selectStyle = "w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => { setDraft(parseValue(value)); setOpen(o => !o) }}
        className={`${className} flex items-center gap-2 w-full text-right`}
      >
        <CalendarIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className={value ? 'text-slate-800 flex-1' : 'text-slate-400 flex-1'}>
          {display || placeholder}
        </span>
      </button>

      {open && (
        <div
          className="absolute z-[60] bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 mt-1"
          style={{ minWidth: '260px', right: 0 }}
        >
          {/* Date */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-500 mb-1">תאריך</label>
            <input
              type="date"
              value={draft.date}
              onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
              required={required}
              className={selectStyle}
            />
          </div>

          {/* Hour + Minute */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">שעה</label>
              <select
                value={draft.hour}
                onChange={e => setDraft(d => ({ ...d, hour: Number(e.target.value) }))}
                className={selectStyle}
              >
                {HOURS.map(h => <option key={h} value={h}>{pad(h)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">דקות</label>
              <select
                value={draft.minute}
                onChange={e => setDraft(d => ({ ...d, minute: Number(e.target.value) }))}
                className={selectStyle}
              >
                {MINUTES.map(m => <option key={m} value={m}>{pad(m)}</option>)}
              </select>
            </div>
          </div>

          {/* Confirm */}
          <button
            type="button"
            onClick={confirm}
            disabled={!draft.date}
            className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition text-sm disabled:opacity-40"
          >
            אשר
          </button>
        </div>
      )}
    </div>
  )
}
