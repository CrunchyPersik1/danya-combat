import { useRef, useState, useEffect, useCallback } from 'react'
import { useGame, clickPower, passiveCoinsPerSec, globalMult, xpProgress, levelOf } from '../game/state'
import { skinById } from '../game/data'
import { fmt } from '../game/format'
import { sfx } from '../game/audio'
import DanyaAvatar from './DanyaAvatar'

interface Fx { id: number; x: number; y: number; text: string; kind: string; rot: number }
interface Particle { id: number; x: number; y: number; angle: number; dist: number; color: string }

let fxId = 1
let pId = 1

export default function ClickerScreen() {
  const { state, doClick, notify } = useGame()
  const [fx, setFx] = useState<Fx[]>([])
  const [parts, setParts] = useState<Particle[]>([])
  const [down, setDown] = useState(false)
  const [flash, setFlash] = useState(0)
  const [waveKey, setWaveKey] = useState(0)
  const pitchRef = useRef(0)
  const [hue, setHue] = useState(270)
  const skin = skinById(state.activeSkin)
  const anim = state.settings.anim

  // RGB background rotation (throttled: the CSS transition smooths it out)
  useEffect(function () {
    if (!anim) return
    let h = 0
    const id = setInterval(function () {
      h = (h + 9) % 360
      setHue(h)
    }, 600)
    return function () { clearInterval(id) }
  }, [anim])

  const onDown = useCallback(function () { setDown(true) }, [])
  const onUp = useCallback(function () { setDown(false) }, [])

  const handle = useCallback(function (e: React.PointerEvent<HTMLButtonElement>) {
    const gain = doClick()
    const crit = gain < 0
    const p = pitchRef.current
    pitchRef.current = (p + 1) % 6
    sfx.click(p)
    if (crit) sfx.crit()

    const host = e.currentTarget.getBoundingClientRect()
    const x = e.clientX ? e.clientX - host.left : host.width / 2
    const y = e.clientY ? e.clientY - host.top : host.height / 2

    const nx: Fx = { id: fxId++, x, y, text: (crit ? 'КРИТ +' : '+') + fmt(Math.abs(gain)), kind: crit ? 'crit' : 'norm', rot: Math.random() * 30 - 15 }
    setFx(function (a) { return a.concat([nx]).slice(-24) })
    setTimeout(function () { setFx(function (a) { return a.filter(function (z) { return z.id !== nx.id }) }) }, 1000)

    if (anim) {
      const arr: Particle[] = []
      for (let i = 0; i < (crit ? 12 : 6); i++) {
        arr.push({ id: pId++, x, y, angle: Math.random() * Math.PI * 2, dist: 40 + Math.random() * 90, color: crit ? '#fde047' : skin.colors.glow })
      }
      setParts(function (a) { return a.concat(arr).slice(-80) })
      setTimeout(function () {
        setParts(function (a) { return a.filter(function (z) { return arr.indexOf(z) < 0 }) })
      }, 700)
      setWaveKey(function (k) { return k + 1 })
      setFlash(function (f) { return f + 1 })
    }
  }, [doClick, anim, skin])

  const cp = clickPower(state)
  const cps = passiveCoinsPerSec(state)
  const xp = xpProgress(state.xp)

  return (
    <div className="screen clicker" style={{ '--danya': skin.colors.glow, '--hue': hue + 'deg' } as React.CSSProperties}>
      <div className="rgb-bg" />
      {flash > 0 ? <div key={'f' + flash} className={'flash' + (anim ? '' : ' noanim')} /> : null}
      {anim ? <div key={'w' + waveKey} className="wave" style={{ borderColor: skin.colors.glow }} /> : null}

      <div className="clicker-top">
        <div className="big-num">
          <span className="coin-ico">💰</span>
          <span className="num">{fmt(state.coins)}</span>
          <span className="unit">ДэнКоинов</span>
        </div>
        <div className="statline">
          <span>{skin.name}</span>
          <span className="dot">•</span>
          <span>{fmt(cp)} / клик</span>
          <span className="dot">•</span>
          <span>{fmt(cps)} / сек</span>
          <span className="dot">•</span>
          <span>x{fmt(globalMult(state))} глоб.</span>
        </div>
      </div>

      <div className="danya-wrap">
        <button
          className={'danya-btn' + (down ? ' pressed' : '')}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
          onPointerDownCapture={handle}
          aria-label="Даня"
        >
          <DanyaAvatar skin={skin} size={260} anim={anim} />
          <div className="glow" style={{ background: skin.colors.glow }} />
          {parts.map(function (p) {
            return <span key={p.id} className="particle" style={{
              left: p.x, top: p.y, background: p.color,
              '--dx': Math.cos(p.angle) * p.dist + 'px',
              '--dy': Math.sin(p.angle) * p.dist + 'px'
            } as React.CSSProperties} />
          })}
          {fx.map(function (f) {
            return <span key={f.id} className={'fx ' + f.kind} style={{ left: f.x, top: f.y, transform: 'rotate(' + f.rot + 'deg)' }}>{f.text}</span>
          })}
        </button>
      </div>

      <div className="xp-bar">
        <div className="xp-fill" style={{ width: Math.round(xp.pct * 100) + '%' }} />
        <span className="xp-label">Ур. {xp.level} — {fmt(xp.cur)} / {fmt(xp.need)} XP</span>
      </div>

      <div className="cur-row">
        <div className="cur-chip"><b>💰</b> {fmt(state.coins)}</div>
        <div className="cur-chip"><b>₽</b> {fmt(state.rubles)}</div>
        <div className="cur-chip"><b>💎</b> {fmt(state.diamonds)}</div>
        <div className="cur-chip"><b>🏅</b> {fmt(state.gold)}</div>
      </div>

      <div className="hint">
        Жми по Дане! Крит-удар даёт x6. Всего кликов: {fmt(state.clicks)} • В игре: {fmt(state.playSeconds)} сек
      </div>
    </div>
  )
}
