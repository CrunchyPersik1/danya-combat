import { useState } from 'react'
import { useGame } from '../game/state'
import { BOXES, skinById } from '../game/data'
import { fmt } from '../game/format'
import { sfx } from '../game/audio'
import DanyaAvatar from './DanyaAvatar'

const CUR_ICO: Record<string, string> = { coins: '💰', rubles: '₽', diamonds: '💎', gold: '🏅' }

export default function BoxesScreen() {
  const { state, openBox, notify } = useGame()
  const [spin, setSpin] = useState('')

  function doOpen(id: string, idx: number) {
    const box = BOXES.filter(function (b) { return b.id === id })[0]
    const price = box.prices[idx]
    if (state[price.currency] < price.amount) { sfx.deny(); notify('Не хватает ресурсов на ' + box.name, 'bad'); return }
    setSpin(id)
    openBox(id, idx)
    setTimeout(function () { setSpin('') }, 900)
  }

  return (
    <div className="screen boxes">
      <h2 className="title">🎁 Ящики</h2>
      <div className="cur-row">
        <div className="cur-chip"><b>💰</b> {fmt(state.coins)}</div>
        <div className="cur-chip"><b>💎</b> {fmt(state.diamonds)}</div>
        <div className="cur-chip"><b>🏅</b> {fmt(state.gold)}</div>
        <div className="cur-chip"><b>📦</b> Открыто: {state.boxesOpened}</div>
      </div>

      <div className="box-list">
        {BOXES.map(function (b, bi) {
          const big = b.id === 'superBox'
          return (
            <div key={b.id} className={'box-card' + (big ? ' super' : '')}>
              <div className={'box-art' + (spin === b.id ? ' spin' : '')}>{big ? '🌟' : '📦'}</div>
              <div className="box-name">{b.name}</div>
              <div className="box-desc">{b.desc}</div>
              <div className="box-luck">Содержимое: {b.luck}</div>
              <div className="box-prices">
                {b.prices.map(function (p, i) {
                  const can = state[p.currency] >= p.amount
                  return (
                    <button key={i} className={'buy' + (can ? '' : ' off')} onClick={function () { doOpen(b.id, i) }}>
                      {CUR_ICO[p.currency]} {fmt(p.amount)}
                    </button>
                  )
                })}
              </div>
              <div className="box-pool">
                {b.rarityTable.map(function (r) {
                  const sk = skinById(r.skinId)
                  const have = state.skins.indexOf(r.skinId) >= 0
                  return (
                    <div key={r.skinId} className={'pool-item' + (have ? ' have' : '')} title={sk.name + ' — шанс ' + r.weight}>
                      <DanyaAvatar skin={sk} size={40} />
                      <span>{sk.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="hint">Алмазы приносит «Шахта алмазов», золото — «Наивысший гриндер золота».</div>
    </div>
  )
}
