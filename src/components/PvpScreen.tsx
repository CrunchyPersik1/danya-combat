import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useGame, clickPower, globalMult, levelOf } from '../game/state'
import { Skin, skinById } from '../game/data'
import { fmt, clamp } from '../game/format'
import { sfx } from '../game/audio'
import DanyaAvatar from './DanyaAvatar'

const EVIL: Skin = {
  id: 'evil', name: 'Злая Даня', desc: '', cost: 0, currency: 'box', clickMult: 1, incomePerDay: 0,
  note: 0, beat: 1, rarity: 'legendary', accessory: 'horns',
  colors: { face: '#7f1d1d', hair: '#111', eye: '#f97316', bg1: '#450a0a', bg2: '#0b0000', glow: '#dc2626', accent: '#f97316' }
}

interface Fl { id: number; side: 'p' | 'e'; text: string; kind: string }
let flId = 1

interface Battle {
  over: null | 'win' | 'lose'
  p: { hp: number; maxHp: number; energy: number; shield: number; rage: number }
  e: { hp: number; maxHp: number; blocking: number; rage: number; healLeft: number; act: number }
  cds: Record<string, number>
  combo: number
  comboT: number
  chain: string[]
  time: number
  lvl: number
}

const ENEMY_NAMES = ['Злая Даня', 'Тёмный Денчик', 'Анти-Даня', 'Даня-Разрушитель', 'Мега Злая Даня', 'Сигма-Тень', 'Даня Бездны', 'Крипто-Даня', 'Даня Хаоса', 'ФИНАЛЬНЫЙ БОСС']

function makeEnemy(lvl: number) {
  return {
    lvl: lvl,
    name: ENEMY_NAMES[Math.min(lvl - 1, 9)],
    maxHp: Math.round(240 * Math.pow(1.32, lvl - 1)),
    dmg: 7 * Math.pow(1.24, lvl - 1),
    reward: Math.round(400 * Math.pow(2.4, lvl - 1)),
    xp: 45 * lvl,
    rub: 15 * lvl
  }
}

export default function PvpScreen() {
  const { state, set, notify, addTrade } = useGame()
  const [, force] = useReducer(function (x) { return x + 1 }, 0)
  const [phase, setPhase] = useState<'select' | 'fight' | 'end'>('select')
  const [log, setLog] = useState<string[]>([])
  const [floats, setFloats] = useState<Fl[]>([])
  const [shake, setShake] = useState(0)
  const [flash, setFlash] = useState('')
  const [combo, setCombo] = useState(0)
  const [endInfo, setEndInfo] = useState<{ win: boolean; coins: number; xp: number; rub: number } | null>(null)
  const b = useRef<Battle | null>(null)
  const enemyRef = useRef(makeEnemy(1))

  const playerLevel = levelOf(state.xp)
  const skin = skinById(state.activeSkin)

  const pushLog = useCallback(function (t: string) {
    setLog(function (l) { return [t].concat(l).slice(0, 6) })
  }, [])

  const addFloat = useCallback(function (side: 'p' | 'e', text: string, kind: string) {
    const f: Fl = { id: flId++, side: side, text: text, kind: kind }
    setFloats(function (a) { return a.concat([f]).slice(-16) })
    setTimeout(function () { setFloats(function (a) { return a.filter(function (z) { return z.id !== f.id }) }) }, 850)
  }, [])

  const start = useCallback(function (lvl: number) {
    const en = makeEnemy(lvl)
    enemyRef.current = en
    const maxHp = 130 + 26 * (playerLevel - 1)
    b.current = {
      over: null, lvl: lvl,
      p: { hp: maxHp, maxHp: maxHp, energy: 60, shield: 0, rage: 0 },
      e: { hp: en.maxHp, maxHp: en.maxHp, blocking: 0, rage: 0, healLeft: 2, act: 1.2 },
      cds: { light: 0, heavy: 0, special: 0, shield: 0, rage: 0, heal: 0 },
      combo: 0, comboT: 0, chain: [], time: 0
    }
    setLog(['Бой начался: ' + en.name + ' (ур. ' + lvl + ')'])
    setEndInfo(null)
    setCombo(0)
    setPhase('fight')
    sfx.win()
  }, [playerLevel])

  const finish = useCallback(function (win: boolean) {
    const bt = b.current!
    if (bt.over) return
    bt.over = win ? 'win' : 'lose'
    const en = enemyRef.current
    const coins = win ? Math.round(en.reward * globalMult(state)) : Math.round(en.reward * 0.15)
    const xp = win ? en.xp : Math.round(en.xp * 0.2)
    const rub = win ? en.rub : 1
    set(function (p) {
      return Object.assign({}, p, {
        coins: p.coins + coins, totalCoins: p.totalCoins + coins,
        rubles: p.rubles + rub, xp: p.xp + xp,
        pvpWins: p.pvpWins + (win ? 1 : 0), pvpLosses: p.pvpLosses + (win ? 0 : 1)
      })
    })
    if (win) sfx.win(); else sfx.lose()
    setEndInfo({ win: win, coins: coins, xp: xp, rub: rub })
    setPhase('end')
  }, [set, state])

  // battle loop
  useEffect(function () {
    if (phase !== 'fight') return
    let raf = 0
    let last = performance.now() / 1000
    const loop = function () {
      const now = performance.now() / 1000
      const dt = Math.min(0.1, now - last)
      last = now
      const bt = b.current
      if (!bt) return
      if (bt.over) { raf = requestAnimationFrame(loop); return }
      bt.time += dt
      const ks = Object.keys(bt.cds)
      for (let i = 0; i < ks.length; i++) bt.cds[ks[i]] = Math.max(0, bt.cds[ks[i]] - dt)
      bt.p.energy = Math.min(100, bt.p.energy + 11 * dt)
      bt.p.shield = Math.max(0, bt.p.shield - dt)
      bt.p.rage = Math.max(0, bt.p.rage - dt)
      bt.e.blocking = Math.max(0, bt.e.blocking - dt)
      bt.e.rage = Math.max(0, bt.e.rage - dt)
      if (bt.combo > 0) {
        bt.comboT -= dt
        if (bt.comboT <= 0) { bt.combo = 0; setCombo(0) }
      }

      // enemy AI
      bt.e.act -= dt
      if (bt.e.act <= 0) {
        const en = enemyRef.current
        const speed = Math.max(0.55, 1.5 - bt.lvl * 0.07)
        bt.e.act = speed + Math.random() * 0.5
        if (bt.e.hp < bt.e.maxHp * 0.34 && bt.e.healLeft > 0) {
          bt.e.healLeft--
          bt.e.hp = Math.min(bt.e.maxHp, bt.e.hp + bt.e.maxHp * 0.22)
          pushLog(en.name + ' лечится!')
          addFloat('e', 'ЛЕЧЕНИЕ', 'heal')
        } else if (bt.p.combo >= 4 && Math.random() < 0.45) {
          bt.e.blocking = 1.4
          pushLog(en.name + ' ставит блок!')
        } else {
          const heavy = Math.random() < 0.32
          let dmg = en.dmg * (heavy ? 1.9 : 1)
          if (bt.p.shield > 0) dmg *= 0.28
          bt.p.hp = Math.max(0, bt.p.hp - dmg)
          addFloat('p', '-' + Math.round(dmg), bt.p.shield > 0 ? 'block' : 'dmg')
          pushLog(en.name + (heavy ? ' бьёт ТЯЖЕЛО!' : ' атакует') + ' (-' + Math.round(dmg) + ')')
          sfx.hit()
          if (state.settings.anim) { setShake(function (s) { return s + 1 }); setFlash('red') }
          bt.combo = 0
          setCombo(0)
          if (bt.p.hp <= 0) { finish(false); force() }
        }
      }
      if (bt.p.hp <= 0) finish(false)
      else if (bt.e.hp <= 0) finish(true)
      force()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return function () { cancelAnimationFrame(raf) }
  }, [phase, finish, pushLog, addFloat, force, state.settings.anim])

  const CHAINS: { seq: string[]; name: string; mult: number }[] = [
    { seq: ['light', 'light', 'heavy'], name: 'ТРОЙНОЙ УДАР', mult: 1.5 },
    { seq: ['light', 'light', 'light', 'special'], name: 'СИГМА-ФИНАЛ', mult: 2.2 },
    { seq: ['heavy', 'heavy'], name: 'ДВОЙНОЙ МОЛОТ', mult: 1.4 },
    { seq: ['light', 'heavy', 'special'], name: 'КОМБО КОМБАТ', mult: 1.8 }
  ]

  const attack = useCallback(function (kind: 'light' | 'heavy' | 'special') {
    const bt = b.current
    if (!bt || bt.over) return
    const en = enemyRef.current
    const cdKey = kind
    if (bt.cds[cdKey] > 0) { return }
    const cost = kind === 'special' ? 40 : 0
    if (bt.p.energy < cost) { sfx.deny(); notify('Мало энергии', 'bad'); return }
    bt.p.energy -= cost
    const base = kind === 'light' ? 7 + 1.3 * playerLevel : kind === 'heavy' ? 17 + 3.2 * playerLevel : 40 + 8 * playerLevel
    const skinBonus = 1 + 0.14 * (skin.clickMult - 1)
    const lvlBonus = 1 + 0.055 * (playerLevel - 1)
    const comboMult = 1 + bt.combo * 0.07
    const rageMult = bt.p.rage > 0 ? 1.6 : 1
    const miss = kind === 'heavy' && Math.random() < 0.15
    bt.cds[kind] = kind === 'light' ? 0.34 : kind === 'heavy' ? 1.05 : 3.2
    if (kind === 'special') bt.cds.special = 3.4

    bt.chain.push(kind)
    if (bt.chain.length > 4) bt.chain.shift()
    let chainName = ''
    let chainMult = 1
    for (let i = 0; i < CHAINS.length; i++) {
      const c = CHAINS[i]
      const tail = bt.chain.slice(-c.seq.length)
      if (tail.length === c.seq.length && tail.join(',') === c.seq.join(',')) {
        chainName = c.name
        chainMult = c.mult
        bt.chain = []
        break
      }
    }

    if (miss) {
      addFloat('e', 'ПРОМАХ', 'miss')
      pushLog('Ты промазал тяжёлым ударом')
      return
    }
    let dmg = base * skinBonus * lvlBonus * comboMult * rageMult * chainMult
    if (bt.e.blocking > 0) { dmg *= 0.3; addFloat('e', 'БЛОК -' + Math.round(dmg), 'block') }
    else addFloat('e', '-' + Math.round(dmg), chainName ? 'combo' : kind === 'special' ? 'special' : 'dmg')
    bt.e.hp = Math.max(0, bt.e.hp - dmg)
    bt.combo = Math.min(12, bt.combo + 1)
    bt.comboT = 3
    setCombo(bt.combo)
    if (kind === 'heavy') sfx.heavy(); else if (kind === 'special') sfx.crit(); else sfx.hit()
    pushLog((chainName ? chainName + '! ' : '') + (kind === 'light' ? 'Лёгкий' : kind === 'heavy' ? 'Тяжёлый' : 'СПЕЦ') + ' удар: ' + Math.round(dmg))
    if (chainName) notify('КОМБО: ' + chainName + ' x' + chainMult, 'gold')
    if (state.settings.anim) { setShake(function (s) { return s + 1 }); setFlash(kind === 'special' ? 'gold' : 'hit') }
    if (bt.e.hp <= 0) finish(true)
    force()
  }, [playerLevel, skin, notify, addFloat, pushLog, finish, force, state.settings.anim])

  const ability = useCallback(function (kind: 'shield' | 'rage' | 'heal') {
    const bt = b.current
    if (!bt || bt.over) return
    if (bt.cds[kind] > 0) return
    if (kind === 'shield') { if (bt.p.energy < 20) { sfx.deny(); return } bt.p.energy -= 20; bt.p.shield = 2.4; bt.cds.shield = 6.5; pushLog('ЩИТ активен!'); addFloat('p', 'ЩИТ', 'buff') }
    if (kind === 'rage') { if (bt.p.energy < 30) { sfx.deny(); return } bt.p.energy -= 30; bt.p.rage = 6; bt.cds.rage = 11; pushLog('ЯРОСТЬ! +60% урона'); addFloat('p', 'ЯРОСТЬ', 'buff') }
    if (kind === 'heal') { if (bt.p.energy < 45) { sfx.deny(); return } bt.p.energy -= 45; bt.cds.heal = 12; const h = Math.round(bt.p.maxHp * 0.3); bt.p.hp = Math.min(bt.p.maxHp, bt.p.hp + h); pushLog('ЛЕЧЕНИЕ +' + h); addFloat('p', '+' + h, 'heal') }
    sfx.buy()
    force()
  }, [addFloat, pushLog, force])

  // keyboard
  useEffect(function () {
    if (phase !== 'fight') return
    const onKey = function (e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if (k === 'a' || k === 'ф') attack('light')
      else if (k === 's' || k === 'ы') attack('heavy')
      else if (k === 'd' || k === 'в') attack('special')
      else if (k === 'q' || k === 'й') ability('shield')
      else if (k === 'w' || k === 'ц') ability('rage')
      else if (k === 'e' || k === 'у') ability('heal')
    }
    window.addEventListener('keydown', onKey)
    return function () { window.removeEventListener('keydown', onKey) }
  }, [phase, attack, ability])

  const bt = b.current
  const en = enemyRef.current

  if (phase === 'select') {
    return (
      <div className="screen pvp">
        <h2 className="title">⚔️ PvP Арена</h2>
        <div className="cur-row">
          <div className="cur-chip"><b>🏆</b> {state.pvpWins} побед</div>
          <div className="cur-chip"><b>💀</b> {state.pvpLosses} поражений</div>
          <div className="cur-chip"><b>⭐</b> Ур. {playerLevel}</div>
        </div>
        <div className="card col-card">
          <div className="card-name">Как играть</div>
          <div className="card-desc">
            A — лёгкий, S — тяжёлый, D — СПЕЦ-удар (40 энергии). Q — щит, W — ярость, E — лечение.<br />
            Комбо-приёмы: лёгкий-лёгкий-тяжёлый = ТРОЙНОЙ УДАР, лёгкий-лёгкий-лёгкий-СПЕЦ = СИГМА-ФИНАЛ.
          </div>
        </div>
        <h3 className="sub">Выбери противника</h3>
        <div className="foes">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (l) {
            const e = makeEnemy(l)
            const hard = l > playerLevel + 1
            return (
              <div key={l} className={'foe' + (hard ? ' hard' : '')}>
                <DanyaAvatar skin={EVIL} size={68} />
                <div className="foe-name">{e.name}</div>
                <div className="foe-lvl">Уровень {l}</div>
                <div className="foe-stats">HP {fmt(e.maxHp)}<br />Урон ~{Math.round(e.dmg)}<br />Награда {fmt(e.reward)} 💰</div>
                <button className="buy" onClick={function () { start(l) }}>В БОЙ</button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (phase === 'end' && endInfo) {
    return (
      <div className="screen pvp">
        <div className={'end-panel ' + (endInfo.win ? 'win' : 'lose')}>
          <div className="end-title">{endInfo.win ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ'}</div>
          <DanyaAvatar skin={endInfo.win ? skin : EVIL} size={150} anim />
          <div className="end-rewards">
            <div>+{fmt(endInfo.coins)} 💰 ДэнКоинов</div>
            <div>+{fmt(endInfo.xp)} XP</div>
            <div>+{fmt(endInfo.rub)} ₽ рублей</div>
          </div>
          <div className="switch-row">
            <button className="buy" onClick={function () { start(bt ? bt.lvl : 1) }}>Реванш</button>
            <button className="pill" onClick={function () { setPhase('select') }}>К списку противников</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen pvp fight">
      <div className={'arena' + (shake % 2 === 0 ? '' : ' shake')} key={'sh' + shake}>
        {flash ? <div key={flash + shake} className={'hitflash ' + flash} /> : null}
        <div className="fighter left">
          <div className="hpbar">
            <div className="hpf" style={{ width: (bt ? (bt.p.hp / bt.p.maxHp) * 100 : 100) + '%', background: 'linear-gradient(90deg,#22c55e,#86efac)' }} />
            <span className="hptxt">{bt ? Math.max(0, Math.ceil(bt.p.hp)) : 0} / {bt ? bt.p.maxHp : 0}</span>
          </div>
          <div className={'avatar-slot' + (bt && bt.p.shield > 0 ? ' shielded' : '') + (bt && bt.p.rage > 0 ? ' raging' : '')}>
            <DanyaAvatar skin={skin} size={160} anim={state.settings.anim} />
          </div>
          <div className="fname">{state.name} • Ур. {playerLevel}</div>
          <div className="energybar"><div className="enf" style={{ width: (bt ? bt.p.energy : 0) + '%' }} /></div>
          <div className="buffrow">
            {bt && bt.p.shield > 0 ? <span className="buff">🛡 {bt.p.shield.toFixed(1)}с</span> : null}
            {bt && bt.p.rage > 0 ? <span className="buff rage">🔥 {bt.p.rage.toFixed(1)}с</span> : null}
          </div>
        </div>

        <div className="vs">
          <div className="vs-text">VS</div>
          {combo > 1 ? <div className="combo-badge">COMBO x{combo}</div> : null}
        </div>

        <div className="fighter right">
          <div className="hpbar">
            <div className="hpf" style={{ width: (bt ? (bt.e.hp / bt.e.maxHp) * 100 : 100) + '%', background: 'linear-gradient(90deg,#ef4444,#fca5a5)' }} />
            <span className="hptxt">{bt ? Math.max(0, Math.ceil(bt.e.hp)) : 0} / {bt ? bt.e.maxHp : 0}</span>
          </div>
          <div className={'avatar-slot' + (bt && bt.e.blocking > 0 ? ' blocking' : '')}>
            <DanyaAvatar skin={EVIL} size={160} anim={state.settings.anim} />
          </div>
          <div className="fname">{en.name} • Ур. {bt ? bt.lvl : 1}</div>
          <div className="buffrow">
            {bt && bt.e.blocking > 0 ? <span className="buff">🛡️ БЛОК</span> : null}
          </div>
        </div>

        {floats.map(function (f) {
          return <span key={f.id} className={'dmg ' + f.kind + ' ' + f.side}>{f.text}</span>
        })}
      </div>

      <div className="battle-log">
        {log.map(function (l, i) { return <div key={i} className="log-line" style={{ opacity: 1 - i * 0.14 }}>{l}</div> })}
      </div>

      <div className="abilities">
        <button className="atk light" disabled={!!(bt && bt.cds.light > 0)} onClick={function () { attack('light') }}>
          👊 Лёгкий<br /><small>A</small>
          {bt && bt.cds.light > 0 ? <span className="cdov" style={{ height: (bt.cds.light / 0.34) * 100 + '%' }} /> : null}
        </button>
        <button className="atk heavy" disabled={!!(bt && bt.cds.heavy > 0)} onClick={function () { attack('heavy') }}>
          💥 Тяжёлый<br /><small>S</small>
          {bt && bt.cds.heavy > 0 ? <span className="cdov" style={{ height: (bt.cds.heavy / 1.05) * 100 + '%' }} /> : null}
        </button>
        <button className="atk special" disabled={!!(bt && bt.cds.special > 0)} onClick={function () { attack('special') }}>
          ✨ СПЕЦ (40)<br /><small>D</small>
          {bt && bt.cds.special > 0 ? <span className="cdov" style={{ height: (bt.cds.special / 3.4) * 100 + '%' }} /> : null}
        </button>
        <button className="atk ab" disabled={!!(bt && bt.cds.shield > 0)} onClick={function () { ability('shield') }}>
          🛡 Щит (20)<br /><small>Q</small>
          {bt && bt.cds.shield > 0 ? <span className="cdov" style={{ height: (bt.cds.shield / 6.5) * 100 + '%' }} /> : null}
        </button>
        <button className="atk ab" disabled={!!(bt && bt.cds.rage > 0)} onClick={function () { ability('rage') }}>
          🔥 Ярость (30)<br /><small>W</small>
          {bt && bt.cds.rage > 0 ? <span className="cdov" style={{ height: (bt.cds.rage / 11) * 100 + '%' }} /> : null}
        </button>
        <button className="atk ab" disabled={!!(bt && bt.cds.heal > 0)} onClick={function () { ability('heal') }}>
          💚 Лечение (45)<br /><small>E</small>
          {bt && bt.cds.heal > 0 ? <span className="cdov" style={{ height: (bt.cds.heal / 12) * 100 + '%' }} /> : null}
        </button>
      </div>
      <button className="pill" onClick={function () { setPhase('select'); b.current = null }}>Сдаться</button>
    </div>
  )
}
