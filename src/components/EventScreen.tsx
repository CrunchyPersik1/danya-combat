import { useEffect, useRef, useState } from 'react'
import { useGame, eventIncomePerSec, globalMult } from '../game/state'
import { skinById, DAY_SECONDS } from '../game/data'
import { fmt } from '../game/format'
import { sfx } from '../game/audio'
import DanyaAvatar from './DanyaAvatar'

interface Float { id: number; text: string }
let fid = 1

export default function EventScreen() {
  const { state, set, notify } = useGame()
  const skins = state.skins.map(skinById)
  const rate = eventIncomePerSec(state)
  const [earned, setEarned] = useState(0)
  const [floats, setFloats] = useState<Float[]>([])
  const [tick, setTick] = useState(0)
  const acc = useRef(0)
  const next = useRef<number[]>([])
  const tileRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const rateRef = useRef(rate)
  rateRef.current = rate

  // music scheduler + income accumulator
  useEffect(function () {
    const t0 = performance.now() / 1000
    next.current = skins.map(function (s, i) { return (s.beat * i) / Math.max(1, skins.length) })
    let last = t0
    let raf = 0
    const loop = function () {
      const now = performance.now() / 1000
      const dt = Math.min(0.25, now - last)
      last = now
      acc.current += rateRef.current * dt
      if (acc.current >= 1) {
        const add = Math.floor(acc.current)
        acc.current -= add
        set(function (p) { return Object.assign({}, p, { coins: p.coins + add, totalCoins: p.totalCoins + add, xp: p.xp + add * 0.01 }) })
        setEarned(function (e) { return e + add })
      }
      for (let i = 0; i < skins.length; i++) {
        const s = skins[i]
        const t = now - t0
        if (t >= (next.current[i] || 0)) {
          next.current[i] = t + s.beat
          const transpose = 1 + ((Math.floor(t / 8) % 3) * 0.06)
          sfx.note(s.note * transpose, 0.3, 0.1)
          const el = tileRefs.current[s.id]
          if (el && state.settings.anim) {
            el.classList.add('beat')
            setTimeout(function () { el.classList.remove('beat') }, 140)
          }
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return function () { cancelAnimationFrame(raf) }
  }, [skins.length, state.settings.anim, set])

  // keep tiles in sync when new skins are bought
  useEffect(function () {
    setTick(function (t) { return t + 1 })
  }, [state.skins.length])

  function tapSkin(id: string) {
    const s = skinById(id)
    sfx.note(s.note * 1.5, 0.4, 0.16)
    const bonus = Math.max(1, s.incomePerDay / DAY_SECONDS) * 0.5 * globalMult(state)
    set(function (p) { return Object.assign({}, p, { coins: p.coins + bonus, totalCoins: p.totalCoins + bonus }) })
    setEarned(function (e) { return e + bonus })
    const f: Float = { id: fid++, text: '+' + fmt(bonus) }
    setFloats(function (a) { return a.concat([f]).slice(-14) })
    setTimeout(function () { setFloats(function (a) { return a.filter(function (z) { return z.id !== f.id }) }) }, 800)
  }

  const totalPerDay = skins.reduce(function (a, s) { return a + s.incomePerDay }, 0)
  const comboMult = 1 + 0.15 * Math.max(0, skins.length - 1)

  return (
    <div className="screen event">
      <h2 className="title">🎵 Пассивный фарм ивент</h2>
      <div className="event-head">
        <div className="ev-chip">Скинов: <b>{skins.length}</b></div>
        <div className="ev-chip">V = <b>{fmt(totalPerDay)}</b> в день</div>
        <div className="ev-chip">Комбо скинов: <b>x{comboMult.toFixed(2)}</b></div>
        <div className="ev-chip">Доход: <b>{fmt(rate)}</b> / сек</div>
      </div>
      <div className="formula">V (деньги в день) × T (время) = результат. 1 игровой день = {DAY_SECONDS} сек.</div>

      <div className="stage">
        {skins.map(function (s) {
          return (
            <div key={s.id} className={'monster ' + (state.activeSkin === s.id ? 'act' : '')}
              ref={function (el) { tileRefs.current[s.id] = el }}
              onClick={function () { tapSkin(s.id) }}>
              <DanyaAvatar skin={s} size={92} />
              <div className="mon-name">{s.name}</div>
              <div className="mon-note">{Math.round(s.note)} Гц • {s.beat}с</div>
              {state.activeSkin === s.id ? <div className="mon-badge">активен</div> : null}
            </div>
          )
        })}
      </div>

      {floats.map(function (f) { return <span key={f.id} className="float-up">{f.text}</span> })}

      <div className="event-foot">
        <div className="ev-chip big">Заработано за сессию: <b>{fmt(earned)}</b> 💰</div>
        <button className="buy" onClick={function () { sfx.coin(); notify('Скины играют музыку — просто оставайся на экране', 'info') }}>Как это работает?</button>
      </div>
      <div className="hint">Каждый скин играет свою ноту в своём ритме — вместе получается трек. Тапай по скинам для бонуса.</div>
    </div>
  )
}
