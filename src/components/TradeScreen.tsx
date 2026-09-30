import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/state'
import { fmt } from '../game/format'
import { sfx } from '../game/audio'

interface CoinDef { id: string; name: string; ico: string; base: number; color: string }

const COINS: CoinDef[] = [
  { id: 'danya', name: 'ДэнКоин', ico: '💰', base: 120, color: '#fbbf24' },
  { id: 'raff', name: 'РафКоин', ico: '🍬', base: 45, color: '#f472b6' },
  { id: 'ti', name: 'ТиКоин', ico: '💠', base: 300, color: '#34d399' }
]

function priceOf(c: CoinDef, t: number, seed: number, walk: number) {
  const a = Math.sin(t / 9 + seed + c.base) * 0.26
  const b = Math.sin(t / 3.7 + seed * 2 + c.base / 10) * 0.13
  const d = Math.sin(t / 1.3 + seed * 3) * 0.03
  const v = c.base * (1 + a + b + d + walk)
  return Math.max(1, v)
}

export default function TradeScreen() {
  const { state, set, addTrade, notify } = useGame()
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [hist, setHist] = useState<Record<string, number[]>>({})
  const [sel, setSel] = useState('danya')
  const [amount, setAmount] = useState(10)
  const [flash, setFlash] = useState('')
  const walks = useRef<Record<string, number>>({ danya: 0, raff: 0, ti: 0 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(function () {
    const t0 = performance.now() / 1000
    const histBuf: Record<string, number[]> = { danya: [], raff: [], ti: [] }
    const id = setInterval(function () {
      const t = performance.now() / 1000 - t0
      const p: Record<string, number> = {}
      for (let i = 0; i < COINS.length; i++) {
        const c = COINS[i]
        const w = walks.current[c.id] + (Math.random() - 0.5) * 0.012
        walks.current[c.id] = Math.max(-0.28, Math.min(0.28, w * 0.985))
        p[c.id] = priceOf(c, t, stateRef.current.trade.seed, walks.current[c.id])
        const arr = histBuf[c.id]
        arr.push(p[c.id])
        if (arr.length > 160) arr.shift()
      }
      setPrices(p)
      setHist({
        danya: histBuf.danya.slice(),
        raff: histBuf.raff.slice(),
        ti: histBuf.ti.slice()
      })
    }, 500)
    return function () { clearInterval(id) }
  }, [])

  // canvas chart
  useEffect(function () {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const data = hist[sel] || []
    const w = cv.width, h = cv.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(6,2,20,0.85)'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    for (let i = 1; i < 5; i++) {
      const y = (h / 5) * i
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }
    if (data.length < 2) return
    let min = Infinity, max = -Infinity
    for (let i = 0; i < data.length; i++) { if (data[i] < min) min = data[i]; if (data[i] > max) max = data[i] }
    if (max - min < 1) { max = min + 1 }
    const def = COINS.filter(function (c) { return c.id === sel })[0]
    const pad = 8
    const px = function (i: number) { return pad + (i / (data.length - 1)) * (w - pad * 2) }
    const py = function (v: number) { return h - pad - ((v - min) / (max - min)) * (h - pad * 2) }
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, def.color + '88')
    grad.addColorStop(1, def.color + '00')
    ctx.beginPath()
    ctx.moveTo(px(0), py(data[0]))
    for (let i = 1; i < data.length; i++) ctx.lineTo(px(i), py(data[i]))
    ctx.lineTo(px(data.length - 1), h)
    ctx.lineTo(px(0), h)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(px(0), py(data[0]))
    for (let i = 1; i < data.length; i++) ctx.lineTo(px(i), py(data[i]))
    ctx.strokeStyle = def.color
    ctx.lineWidth = 2.5
    ctx.stroke()
    const lastV = data[data.length - 1]
    ctx.beginPath()
    ctx.arc(px(data.length - 1), py(lastV), 4, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = '12px system-ui'
    ctx.fillText('max ' + fmt(max), 10, 16)
    ctx.fillText('min ' + fmt(min), 10, h - 6)
  }, [hist, sel])

  const cur = COINS.filter(function (c) { return c.id === sel })[0]
  const price = prices[sel] || cur.base
  const held = state.trade.holdings[sel] || 0
  const avg = state.trade.avg[sel] || 0

  function buy() {
    const cost = price * amount
    if (state.rubles < cost) { sfx.deny(); notify('Не хватает рублей: нужно ' + fmt(cost), 'bad'); return }
    sfx.coin()
    set(function (p) {
      const h = Object.assign({}, p.trade.holdings)
      const a = Object.assign({}, p.trade.avg)
      const oldQty = h[sel] || 0
      const newQty = oldQty + amount
      a[sel] = ((a[sel] || 0) * oldQty + cost) / newQty
      h[sel] = newQty
      return Object.assign({}, p, { rubles: p.rubles - cost, trade: Object.assign({}, p.trade, { holdings: h, avg: a }) })
    })
    addTrade({ coin: sel, side: 'buy', amount: amount, price: price, total: cost })
    setFlash('buy'); setTimeout(function () { setFlash('') }, 300)
  }

  function sell() {
    if (held < amount) { sfx.deny(); notify('У тебя только ' + held + ' ' + cur.name, 'bad'); return }
    const gain = price * amount
    sfx.coin()
    set(function (p) {
      const h = Object.assign({}, p.trade.holdings)
      h[sel] = (h[sel] || 0) - amount
      const profit = gain - (p.trade.avg[sel] || 0) * amount
      return Object.assign({}, p, { rubles: p.rubles + gain, trade: Object.assign({}, p.trade, { holdings: h }), xp: p.xp + Math.max(0, profit) * 0.1 })
    })
    addTrade({ coin: sel, side: 'sell', amount: amount, price: price, total: gain })
    setFlash('sell'); setTimeout(function () { setFlash('') }, 300)
  }

  const total = state.rubles + COINS.reduce(function (a, c) { return a + (state.trade.holdings[c.id] || 0) * (prices[c.id] || c.base) }, 0)

  return (
    <div className="screen trade">
      <h2 className="title">📈 Трейд-система</h2>
      <div className="cur-row">
        <div className="cur-chip"><b>₽</b> {fmt(state.rubles)}</div>
        <div className="cur-chip"><b>📊</b> Портфель: {fmt(total)}</div>
      </div>

      <div className="tabs">
        {COINS.map(function (c) {
          const pr = prices[c.id] || c.base
          const delta = ((pr - c.base) / c.base) * 100
          return (
            <button key={c.id} className={'tab' + (sel === c.id ? ' on' : '')} onClick={function () { setSel(c.id) }}>
              {c.ico} {c.name}<br />
              <small style={{ color: delta >= 0 ? '#4ade80' : '#f87171' }}>{fmt(pr)} ({delta >= 0 ? '+' : ''}{delta.toFixed(1)}%)</small>
            </button>
          )
        })}
      </div>

      <canvas ref={canvasRef} width={620} height={220} className="chart" />

      <div className="trade-panel">
        <div className="trade-price" style={{ color: cur.color }}>
          {cur.ico} {cur.name}: <b>{fmt(price)}</b> руб.
        </div>
        <div className="trade-hold">
          В портфеле: <b>{fmt(held)}</b> шт. • средняя цена: <b>{fmt(avg)}</b>
          {held > 0 ? <span className={price > avg ? 'up' : 'down'}> ({price > avg ? '+' : ''}{fmt((price - avg) * held)} руб.)</span> : null}
        </div>
        <div className="trade-qty">
          <span>Количество:</span>
          {[1, 10, 50, 100, 500].map(function (n) {
            return <button key={n} className={amount === n ? 'pill on' : 'pill'} onClick={function () { setAmount(n) }}>{n}</button>
          })}
          <input className="inp small" type="number" min="1" value={amount}
            onChange={function (e) { setAmount(Math.max(1, Math.floor(Number(e.target.value) || 1))) }} />
        </div>
        <div className="trade-btns">
          <button className={'buy' + (flash === 'buy' ? ' flash' : '')} onClick={buy}>Купить за {fmt(price * amount)}</button>
          <button className={'buy sell' + (flash === 'sell' ? ' flash' : '')} onClick={sell}>Продать за {fmt(price * amount)}</button>
        </div>
      </div>

      <div className="card col-card">
        <div className="card-name">🧾 История сделок</div>
        {state.trade.hist.length === 0 ? <div className="card-desc">Пока нет сделок. Купи дёшево — продай дорого!</div> : null}
        <div className="hist">
          {state.trade.hist.slice(0, 12).map(function (h) {
            const c = COINS.filter(function (x) { return x.id === h.coin })[0]
            return (
              <div key={h.id} className="hist-row">
                <span className={h.side === 'buy' ? 'down' : 'up'}>{h.side === 'buy' ? 'ПОКУПКА' : 'ПРОДАЖА'}</span>
                <span>{c ? c.ico + ' ' + c.name : h.coin}</span>
                <span>x{fmt(h.amount)}</span>
                <span>по {fmt(h.price)}</span>
                <span>= {fmt(h.total)} руб.</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="hint">Курс меняется в реальном времени: синусоида + случайное блуждание. Заработанные рубли идут на улучшения.</div>
    </div>
  )
}
