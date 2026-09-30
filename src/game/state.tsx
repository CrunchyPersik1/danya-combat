import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SKINS, UPGRADES, BOXES, PROMOS, DAY_SECONDS, skinById, upgradeById, boxById, BoxDef } from './data'
import { clamp, pick, rand, randInt } from './format'
import { sfx } from './audio'

export interface TradeRecord { id: number; coin: string; side: 'buy' | 'sell'; amount: number; price: number; total: number; time: number }

export interface GameState {
  v: number
  name: string
  coins: number
  rubles: number
  diamonds: number
  gold: number
  upgrades: Record<string, number>
  skins: string[]
  activeSkin: string
  boostClick: number
  boostIncome: number
  promos: string[]
  boxesOpened: number
  clicks: number
  totalCoins: number
  xp: number
  pvpWins: number
  pvpLosses: number
  settings: { anim: boolean; sound: boolean; volume: number }
  trade: { hist: TradeRecord[]; seed: number; holdings: Record<string, number>; avg: Record<string, number> }
  lastSeen: number
  playSeconds: number
}

export interface Toast { id: number; msg: string; kind: 'ok' | 'bad' | 'info' | 'gold' }

const SAVE_KEY = 'danya-combat-save-v1'

export function defaultState(): GameState {
  return {
    v: 1, name: 'Даня',
    coins: 0, rubles: 0, diamonds: 0, gold: 0,
    upgrades: {}, skins: ['default'], activeSkin: 'default',
    boostClick: 0, boostIncome: 0,
    promos: [], boxesOpened: 0, clicks: 0, totalCoins: 0, xp: 0,
    pvpWins: 0, pvpLosses: 0,
    settings: { anim: true, sound: true, volume: 0.5 },
    trade: { hist: [], seed: Math.random() * 1000, holdings: {}, avg: {} },
    lastSeen: Date.now(), playSeconds: 0
  }
}

export function loadState(): GameState {
  const base = defaultState()
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw)
    const s: GameState = Object.assign(base, parsed)
    s.settings = Object.assign({ anim: true, sound: true, volume: 0.5 }, parsed.settings || {})
    s.trade = Object.assign({ hist: [], seed: Math.random() * 1000, holdings: {}, avg: {} }, parsed.trade || {})
    if (!Array.isArray(s.skins) || s.skins.indexOf('default') < 0) s.skins = ['default']
    return s
  } catch (e) { return base }
}

export function saveState(s: GameState) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)) } catch (e) { /* ignore */ }
}

// ---------- derived math ----------
export function levelOf(xp: number): number { return Math.floor(Math.sqrt(Math.max(0, xp) / 120)) + 1 }
export function xpForLevel(l: number): number { return 120 * (l - 1) * (l - 1) }
export function xpProgress(xp: number) {
  const l = levelOf(xp)
  const a = xpForLevel(l), b = xpForLevel(l + 1)
  return { level: l, cur: xp - a, need: Math.max(1, b - a), pct: clamp((xp - a) / Math.max(1, b - a), 0, 1) }
}

export function clickMultFromLevel(l: number): number {
  if (l <= 0) return 1
  const t = Math.min(l, 25) / 25
  return 1 + 9999 * Math.pow(t, 4)
}

export function upgradeCost(id: string, level: number): number {
  const u = upgradeById(id)
  if (!u) return Infinity
  return Math.ceil(u.baseCost * Math.pow(u.growth, level))
}

export function globalMult(s: GameState): number {
  const lvl = levelOf(s.xp)
  const grinder = s.upgrades['goldGrinder'] || 0
  return (1 + 0.05 * (lvl - 1)) * (1 + 0.25 * grinder) * (1 + 0.002 * s.diamonds) * (1 + 0.01 * s.gold)
}

export function clickPower(s: GameState): number {
  const lvl = s.upgrades['clickMult'] || 0
  const skin = skinById(s.activeSkin)
  return (1 + 0.25 * lvl) * clickMultFromLevel(lvl) * skin.clickMult * (1 + 0.1 * s.boostClick) * globalMult(s)
}

export function passiveCoinsPerSec(s: GameState): number {
  const m1 = s.upgrades['sigmaMiner1'] || 0
  const m2 = s.upgrades['sigmaMiner10k'] || 0
  const c1 = m1 * 0.6 * Math.pow(1.12, m1)
  const c2 = m2 * 25 * Math.pow(1.14, m2)
  const skin = skinById(s.activeSkin)
  return (c1 + c2) * skin.clickMult * (1 + 0.1 * s.boostIncome) * globalMult(s)
}

export function passiveDiamondsPerSec(s: GameState): number {
  const l = s.upgrades['diamondMine'] || 0
  return l * 0.02 * Math.pow(1.1, l) * (1 + 0.1 * s.boostIncome)
}

export function passiveGoldPerSec(s: GameState): number {
  const l = s.upgrades['goldGrinder'] || 0
  return l * 0.01 * Math.pow(1.12, l) * (1 + 0.1 * s.boostIncome)
}

export function eventIncomePerSec(s: GameState): number {
  let v = 0
  for (let i = 0; i < s.skins.length; i++) v += skinById(s.skins[i]).incomePerDay
  const combo = 1 + 0.15 * Math.max(0, s.skins.length - 1)
  return (v / DAY_SECONDS) * combo * (1 + 0.1 * s.boostIncome) * globalMult(s)
}

export function unlockedUpgrades(s: GameState) {
  return UPGRADES.filter(function (u) {
    if (!u.requires) return true
    return (s.upgrades[u.requires.id] || 0) >= u.requires.level
  })
}

// ---------- context ----------
interface Ctx {
  state: GameState
  toasts: Toast[]
  notify: (msg: string, kind?: Toast['kind']) => void
  set: (fn: (s: GameState) => GameState) => void
  doClick: () => number
  buyUpgrade: (id: string, qty?: number) => void
  buySkin: (id: string) => void
  selectSkin: (id: string) => void
  openBox: (id: string, priceIndex: number) => void
  redeem: (code: string) => boolean
  exchange: (coins: number) => void
  reset: () => void
  addTrade: (r: Omit<TradeRecord, 'id' | 'time'>) => void
}

const GameContext = createContext<Ctx | null>(null)

export function useGame(): Ctx {
  const c = useContext(GameContext)
  if (!c) throw new Error('useGame outside provider')
  return c
}

let toastId = 1
let tradeId = 1

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(function () { return loadState() })
  const [toasts, setToasts] = useState<Toast[]>([])
  const stateRef = useRef(state)
  stateRef.current = state
  const offlineDone = useRef(false)

  const notify = useCallback(function (msg: string, kind: Toast['kind']) {
    const id = toastId++
    setToasts(function (t) { return t.concat([{ id, msg, kind: kind || 'info' }]).slice(-5) })
    setTimeout(function () { setToasts(function (t) { return t.filter(function (x) { return x.id !== id }) }) }, 3200)
  }, [])

  const set = useCallback(function (fn: (s: GameState) => GameState) {
    setState(function (prev) { return fn(prev) })
  }, [])

  // unlock Web Audio on the first user gesture (browser autoplay policy)
  useEffect(function () {
    const unlock = function () { sfx.ensure() }
    window.addEventListener('pointerdown', unlock, { once: false })
    window.addEventListener('keydown', unlock, { once: false })
    return function () {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // audio settings sync
  useEffect(function () {
    sfx.setEnabled(state.settings.sound)
    sfx.setVolume(state.settings.volume)
  }, [state.settings.sound, state.settings.volume])

  // offline earnings once
  useEffect(function () {
    if (offlineDone.current) return
    offlineDone.current = true
    const s = stateRef.current
    const elapsed = Math.min((Date.now() - (s.lastSeen || Date.now())) / 1000, 8 * 3600)
    if (elapsed > 30) {
      const gain = passiveCoinsPerSec(s) * elapsed
      const dia = passiveDiamondsPerSec(s) * elapsed
      const gold = passiveGoldPerSec(s) * elapsed
      if (gain > 0 || dia > 0 || gold > 0) {
        setState(function (p) {
          return Object.assign({}, p, { coins: p.coins + gain, diamonds: p.diamonds + dia, gold: p.gold + gold })
        })
        notify('Оффлайн-доход: +' + Math.floor(gain) + ' ДэнКоинов', 'gold')
      }
    }
  }, [notify])

  // main tick
  useEffect(function () {
    let beat = 0
    const id = setInterval(function () {
      beat++
      setState(function (p) {
        const dt = 0.1
        const cps = passiveCoinsPerSec(p)
        const dps = passiveDiamondsPerSec(p)
        const gps = passiveGoldPerSec(p)
        if (cps === 0 && dps === 0 && gps === 0) {
          if (beat % 10 !== 0) return p
          return Object.assign({}, p, { playSeconds: p.playSeconds + 1, lastSeen: Date.now() })
        }
        const before = levelOf(p.xp)
        const added = cps * dt
        const nxp = p.xp + added * 0.02
        const lvlNow = levelOf(nxp) > before
        if (lvlNow) setTimeout(function () { sfx.levelUp(); notify('Новый уровень: ' + levelOf(nxp) + '!', 'gold') }, 0)
        return Object.assign({}, p, {
          coins: p.coins + added,
          totalCoins: p.totalCoins + added,
          diamonds: p.diamonds + dps * dt,
          gold: p.gold + gps * dt,
          xp: nxp,
          playSeconds: p.playSeconds + dt,
          lastSeen: Date.now(),
          _lvlUp: levelOf(nxp) > before
        } as GameState)
      })
    }, 100)
    return function () { clearInterval(id) }
  }, [])

  // autosave
  useEffect(function () {
    const id = setInterval(function () { saveState(stateRef.current) }, 3000)
    const onHide = function () { saveState(stateRef.current) }
    window.addEventListener('beforeunload', onHide)
    document.addEventListener('visibilitychange', onHide)
    return function () {
      clearInterval(id)
      window.removeEventListener('beforeunload', onHide)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  const doClick = useCallback(function () {
    const s = stateRef.current
    const base = clickPower(s)
    const crit = Math.random() < 0.07
    const gain = base * (crit ? 6 : 1)
    const rub = Math.random() < 0.2 ? (1 + Math.floor(Math.random() * 2)) : 0
    set(function (p) {
      return Object.assign({}, p, {
        coins: p.coins + gain,
        totalCoins: p.totalCoins + gain,
        rubles: p.rubles + rub,
        clicks: p.clicks + 1,
        xp: p.xp + gain * 0.02
      })
    })
    return crit ? -gain : gain
  }, [set])

  const buyUpgrade = useCallback(function (id: string, qty: number) {
    const n = qty || 1
    setState(function (p) {
      const u = upgradeById(id)
      if (!u) return p
      const cur = p.upgrades[id] || 0
      let bought = 0
      let spent = 0
      let lvl = cur
      const bank = Object.assign({}, p)
      for (let i = 0; i < n; i++) {
        if (lvl >= u.maxLevel) break
        const cost = upgradeCost(id, lvl)
        if ((bank[u.currency] as number) < cost) break
        ;(bank[u.currency] as number) -= cost
        spent += cost
        lvl++
        bought++
      }
      if (bought === 0) {
        if (cur >= u.maxLevel) notify(u.name + ': максимальный уровень', 'info')
        else notify('Не хватает ' + (u.currency === 'rubles' ? 'рублей' : u.currency), 'bad')
        return p
      }
      sfx.buy()
      const ups = Object.assign({}, p.upgrades)
      ups[id] = lvl
      notify('Куплено: ' + u.name + ' ур.' + lvl + ' за ' + spent, 'ok')
      return Object.assign({}, p, { upgrades: ups, rubles: bank.rubles, coins: bank.coins, diamonds: bank.diamonds, gold: bank.gold })
    })
  }, [notify, setState])

  const buySkin = useCallback(function (id: string) {
    setState(function (p) {
      const sk = skinById(id)
      if (p.skins.indexOf(id) >= 0) { notify('Скин уже есть', 'info'); return p }
      if (sk.currency === 'box') { notify('Этот скин выпадает только из ящиков', 'bad'); return p }
      if (sk.currency === 'free') {
        return Object.assign({}, p, { skins: p.skins.concat([id]) })
      }
      const cur = sk.currency as 'coins' | 'rubles' | 'diamonds' | 'gold'
      if (p[cur] < sk.cost) { sfx.deny(); notify('Не хватает средств на ' + sk.name, 'bad'); return p }
      sfx.buy()
      notify('Открыт скин: ' + sk.name + '!', 'gold')
      const next = Object.assign({}, p, { skins: p.skins.concat([id]) })
      ;(next as any)[cur] = p[cur] - sk.cost
      return next
    })
  }, [notify])

  const selectSkin = useCallback(function (id: string) {
    set(function (p) { return p.skins.indexOf(id) >= 0 ? Object.assign({}, p, { activeSkin: id }) : p })
  }, [set])

  const rollBox = useCallback(function (box: BoxDef) {
    const roll = Math.random() * box.rarityTable.reduce(function (a, b) { return a + b.weight }, 0)
    let acc = 0
    let skinId = box.rarityTable[0].skinId
    for (let i = 0; i < box.rarityTable.length; i++) {
      acc += box.rarityTable[i].weight
      if (roll <= acc) { skinId = box.rarityTable[i].skinId; break }
    }
    return skinId
  }, [])

  const openBox = useCallback(function (id: string, priceIndex: number) {
    setState(function (p) {
      const box = boxById(id)
      if (!box) return p
      const price = box.prices[priceIndex]
      if (!price || p[price.currency] < price.amount) { sfx.deny(); notify('Не хватает ресурсов на ' + box.name, 'bad'); return p }
      const next: GameState = Object.assign({}, p)
      ;(next as any)[price.currency] = p[price.currency] - price.amount
      const skinId = rollBox(box)
      const have = next.skins.indexOf(skinId) >= 0
      const lines: string[] = []
      const coins = Math.floor(rand(box.coinRange[0], box.coinRange[1]))
      next.coins += coins
      next.totalCoins += coins
      lines.push('+' + coins + ' ДэнКоинов')
      const rub = randInt(box.rubleRange[0], box.rubleRange[1])
      next.rubles += rub
      lines.push('+' + rub + ' руб.')
      const dia = randInt(box.diamondRange[0], box.diamondRange[1])
      next.diamonds += dia
      lines.push('+' + dia + ' алмазов')
      const gold = randInt(box.goldRange[0], box.goldRange[1])
      if (gold > 0) { next.gold += gold; lines.push('+' + gold + ' золота') }
      const boost = randInt(box.boostRange[0], box.boostRange[1])
      const boostKind = Math.random() < 0.5 ? 'clickBoost' : 'incomeBoost'
      if (boost > 0) {
        if (boostKind === 'clickBoost') next.boostClick += boost
        else next.boostIncome += boost
        lines.push('+' + boost + '% ' + (boostKind === 'clickBoost' ? 'к клику' : 'к доходу'))
      }
      if (!have) {
        next.skins = next.skins.concat([skinId])
        lines.push('НОВЫЙ СКИН: ' + skinById(skinId).name)
      } else {
        const comp = Math.floor(rand(5000, 30000))
        next.coins += comp
        lines.push('дубликат -> +' + comp + ' ДэнКоинов')
      }
      next.boxesOpened += 1
      ;(next as any)._boxResult = { skinId, lines, isNew: !have }
      sfx.box()
      return next
    })
    setTimeout(function () {
      const r = (stateRef.current as any)._boxResult
      if (r) {
        notify((r.isNew ? '🎁 ' : '📦 ') + r.lines.join(' • '), r.isNew ? 'gold' : 'ok')
      }
    }, 500)
  }, [notify, rollBox])

  const redeem = useCallback(function (code: string) {
    const c = code.trim().toUpperCase()
    const p = PROMOS.find(function (x) { return x.code === c })
    if (!p) { sfx.deny(); notify('Промокод не найден: ' + c, 'bad'); return false }
    if (stateRef.current.promos.indexOf(c) >= 0) { sfx.deny(); notify('Промокод уже использован: ' + c, 'bad'); return false }
    sfx.win()
    setState(function (s) {
      const next = Object.assign({}, s, { promos: s.promos.concat([c]) })
      next.coins += p.coins || 0
      next.totalCoins += p.coins || 0
      next.rubles += p.rubles || 0
      next.diamonds += p.diamonds || 0
      next.gold += p.gold || 0
      if (p.skin && next.skins.indexOf(p.skin) < 0) next.skins = next.skins.concat([p.skin])
      if (p.clickMultLevels) {
        const ups = Object.assign({}, next.upgrades)
        ups['clickMult'] = Math.min(25, (ups['clickMult'] || 0) + p.clickMultLevels)
        next.upgrades = ups
      }
      return next
    })
    notify('Промокод ' + c + ' активирован: ' + p.label + '!', 'gold')
    return true
  }, [notify])

  const exchange = useCallback(function (coins: number) {
    setState(function (p) {
      if (p.coins < coins) { notify('Мало ДэнКоинов', 'bad'); return p }
      const rub = Math.floor(coins / 100)
      if (rub <= 0) { notify('Минимум 100 ДэнКоинов', 'bad'); return p }
      sfx.coin()
      notify('Обмен: ' + coins + ' ДэнКоинов -> ' + rub + ' руб.', 'ok')
      return Object.assign({}, p, { coins: p.coins - coins, rubles: p.rubles + rub })
    })
  }, [notify])

  const addTrade = useCallback(function (r: Omit<TradeRecord, 'id' | 'time'>) {
    setState(function (p) {
      const rec = Object.assign({ id: tradeId++, time: Date.now() }, r) as TradeRecord
      const hist = [rec].concat(p.trade.hist).slice(0, 40)
      return Object.assign({}, p, { trade: Object.assign({}, p.trade, { hist }) })
    })
  }, [])

  const reset = useCallback(function () {
    const fresh = defaultState()
    fresh.settings = Object.assign({}, stateRef.current.settings)
    fresh.name = stateRef.current.name
    saveState(fresh)
    setState(fresh)
    notify('Прогресс полностью сброшен', 'bad')
  }, [notify])

  const value = useMemo(function (): Ctx {
    return { state, toasts, notify, set, doClick, buyUpgrade, buySkin, selectSkin, openBox, redeem, exchange, reset, addTrade }
  }, [state, toasts, notify, set, doClick, buyUpgrade, buySkin, selectSkin, openBox, redeem, exchange, reset, addTrade])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
