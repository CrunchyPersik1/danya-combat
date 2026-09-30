import { useState } from 'react'
import { useGame, upgradeCost, unlockedUpgrades, clickMultFromLevel, levelOf } from '../game/state'
import { SKINS, UPGRADES, skinById } from '../game/data'
import { fmt } from '../game/format'
import DanyaAvatar from './DanyaAvatar'

type Tab = 'up' | 'skins' | 'ex'

const CUR_ICO: Record<string, string> = { coins: '💰', rubles: '₽', diamonds: '💎', gold: '🏅' }

export default function ShopScreen() {
  const { state, buyUpgrade, buySkin, selectSkin, exchange, notify } = useGame()
  const [tab, setTab] = useState<Tab>('up')
  const [qty, setQty] = useState(1)
  const lvl = levelOf(state.xp)
  const list = unlockedUpgrades(state)

  return (
    <div className="screen shop">
      <h2 className="title">🛒 Магазин</h2>

      <div className="cur-row">
        <div className="cur-chip"><b>💰</b> {fmt(state.coins)}</div>
        <div className="cur-chip"><b>₽</b> {fmt(state.rubles)}</div>
        <div className="cur-chip"><b>💎</b> {fmt(state.diamonds)}</div>
        <div className="cur-chip"><b>🏅</b> {fmt(state.gold)}</div>
      </div>

      <div className="tabs">
        <button className={tab === 'up' ? 'tab on' : 'tab'} onClick={function () { setTab('up') }}>Улучшения</button>
        <button className={tab === 'skins' ? 'tab on' : 'tab'} onClick={function () { setTab('skins') }}>Скины</button>
        <button className={tab === 'ex' ? 'tab on' : 'tab'} onClick={function () { setTab('ex') }}>Обмен</button>
      </div>

      {tab === 'up' ? (
        <div className="list">
          <div className="qty-row">
            <span>Покупать сразу:</span>
            {[1, 5, 10, 25].map(function (n) {
              return <button key={n} className={qty === n ? 'pill on' : 'pill'} onClick={function () { setQty(n) }}>x{n}</button>
            })}
          </div>
          {UPGRADES.map(function (u) {
            const lv = state.upgrades[u.id] || 0
            const open = list.indexOf(u) >= 0
            const maxed = lv >= u.maxLevel
            const cost = upgradeCost(u.id, lv)
            const bank = state[u.currency] as number
            const can = !maxed && bank >= cost
            let extra = ''
            if (u.id === 'clickMult') extra = 'сейчас x' + fmt(clickMultFromLevel(lv))
            if (u.id === 'sigmaMiner1') extra = '+' + fmt(lv * 0.6 * Math.pow(1.12, lv)) + '/сек'
            if (u.id === 'sigmaMiner10k') extra = '+' + fmt(lv * 25 * Math.pow(1.14, lv)) + '/сек'
            if (u.id === 'diamondMine') extra = '+' + (lv * 0.02 * Math.pow(1.1, lv)).toFixed(2) + ' алм/сек'
            if (u.id === 'goldGrinder') extra = 'x' + (1 + 0.25 * lv).toFixed(2) + ' ко всему доходу'
            return (
              <div key={u.id} className={'card up' + (open ? '' : ' locked') + (maxed ? ' maxed' : '')}>
                <div className="card-ico">{u.icon}</div>
                <div className="card-body">
                  <div className="card-name">{u.name} <span className="lvl">ур. {lv}/{u.maxLevel}</span></div>
                  <div className="card-desc">{u.desc}</div>
                  {open && extra ? <div className="card-extra">{extra}</div> : null}
                  {!open ? <div className="card-lock">🔒 Нужно: {UPGRADES.filter(function (x) { return x.id === u.requires!.id })[0].name} ур. {u.requires!.level}</div> : null}
                </div>
                <button className="buy" disabled={!open || maxed} onClick={function () { buyUpgrade(u.id, qty) }}>
                  {maxed ? 'MAX' : <span>{CUR_ICO[u.currency]} {fmt(cost)}</span>}
                </button>
              </div>
            )
          })}
        </div>
      ) : null}

      {tab === 'skins' ? (
        <div className="list grid2">
          {SKINS.map(function (sk) {
            const have = state.skins.indexOf(sk.id) >= 0
            const active = state.activeSkin === sk.id
            const boxOnly = sk.currency === 'box'
            return (
              <div key={sk.id} className={'card skin' + (have ? ' owned' : '') + (active ? ' active' : '')}>
                <div className="skin-art" style={{ background: 'radial-gradient(circle at 50% 35%, ' + sk.colors.bg1 + ', ' + sk.colors.bg2 + ')' }}>
                  <DanyaAvatar skin={sk} size={86} />
                  <span className={'rarity r-' + sk.rarity}>{sk.rarity}</span>
                </div>
                <div className="card-body">
                  <div className="card-name">{sk.name}</div>
                  <div className="card-desc">{sk.desc}</div>
                  <div className="card-extra">x{sk.clickMult} клик • {fmt(sk.incomePerDay)}/день</div>
                </div>
                {have ? (
                  <button className={'buy' + (active ? ' on' : '')} disabled={active} onClick={function () { selectSkin(sk.id); notify('Активный скин: ' + sk.name, 'ok') }}>
                    {active ? 'Выбран' : 'Выбрать'}
                  </button>
                ) : (
                  <button className="buy" disabled={boxOnly} onClick={function () { buySkin(sk.id) }}>
                    {boxOnly ? 'Только из ящика' : <span>💰 {fmt(sk.cost)}</span>}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : null}

      {tab === 'ex' ? (
        <div className="list">
          <div className="card up">
            <div className="card-ico">🔁</div>
            <div className="card-body">
              <div className="card-name">Обменять ДэнКоины на рубли</div>
              <div className="card-desc">Курс: 100 ДэнКоинов = 1 рубль. Рубли нужны для улучшений.</div>
            </div>
            <button className="buy" onClick={function () { exchange(1000) }}>1 000 💰</button>
          </div>
          <div className="card up">
            <div className="card-ico">🔁</div>
            <div className="card-body">
              <div className="card-name">Крупный обмен</div>
              <div className="card-desc">Обменять 50 000 ДэнКоинов на 500 рублей.</div>
            </div>
            <button className="buy" onClick={function () { exchange(50000) }}>50 000 💰</button>
          </div>
          <div className="card up">
            <div className="card-ico">🏦</div>
            <div className="card-body">
              <div className="card-name">Заработать рубли</div>
              <div className="card-desc">Рубли падают с кликов (20%), из ящиков, за победы на арене и на трейде.</div>
            </div>
          </div>
          <div className="card up">
            <div className="card-ico">📊</div>
            <div className="card-body">
              <div className="card-name">Статистика</div>
              <div className="card-desc">Всего добыто: {fmt(state.totalCoins)} • Кликов: {fmt(state.clicks)} • Уровень {lvl}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
