import { useState } from 'react'
import { useGame } from '../game/state'
import { PROMOS } from '../game/data'
import { fmt } from '../game/format'

export default function SettingsScreen({ go }: { go: (s: string) => void }) {
  const { state, set, reset, redeem, notify } = useGame()
  const [code, setCode] = useState('')
  const [confirm, setConfirm] = useState(false)

  function apply() {
    if (!code.trim()) return
    if (redeem(code)) setCode('')
  }

  return (
    <div className="screen settings">
      <h2 className="title">⚙️ Настройки</h2>

      <div className="card col-card">
        <div className="card-name">🎟️ Промокоды</div>
        <div className="card-desc">Введи код и получи награду. Уже активировано: {state.promos.length} / {PROMOS.length}</div>
        <div className="promo-row">
          <input className="inp" placeholder="ВВЕДИ ПРОМОКОД" value={code}
            onChange={function (e) { setCode(e.target.value.toUpperCase()) }}
            onKeyDown={function (e) { if (e.key === 'Enter') apply() }} />
          <button className="buy" onClick={apply}>Применить</button>
        </div>
        <div className="promo-hint">Например: DANYA2026, SIGMA, GOLDEN, VENOM, KOMBAT, NIGHTDANYA</div>
      </div>

      <div className="card col-card">
        <div className="card-name">👤 Аккаунт игрока</div>
        <div className="card-desc">Имя, которое показывается на арене.</div>
        <input className="inp" value={state.name} maxLength={16}
          onChange={function (e) { set(function (p) { return Object.assign({}, p, { name: e.target.value }) }) }} />
      </div>

      <div className="card col-card">
        <div className="card-name">🚀 Оптимизация</div>
        <div className="card-desc">Отключи анимации и частицы, если игра тормозит на слабом ПК.</div>
        <div className="switch-row">
          <button className={'pill' + (state.settings.anim ? ' on' : '')} onClick={function () { set(function (p) { return Object.assign({}, p, { settings: Object.assign({}, p.settings, { anim: true }) }) }) }}>Анимации ВКЛ</button>
          <button className={'pill' + (!state.settings.anim ? ' on' : '')} onClick={function () { set(function (p) { return Object.assign({}, p, { settings: Object.assign({}, p.settings, { anim: false }) }) }) }}>Анимации ВЫКЛ</button>
        </div>
      </div>

      <div className="card col-card">
        <div className="card-name">🔊 Звук</div>
        <div className="card-desc">Звук скинов и боя на Web Audio API.</div>
        <div className="switch-row">
          <button className={'pill' + (state.settings.sound ? ' on' : '')} onClick={function () { set(function (p) { return Object.assign({}, p, { settings: Object.assign({}, p.settings, { sound: !p.settings.sound }) }) }) }}>
            {state.settings.sound ? 'Звук ВКЛ' : 'Звук ВЫКЛ'}
          </button>
          <input type="range" min="0" max="1" step="0.05" value={state.settings.volume}
            onChange={function (e) { const v = Number(e.target.value); set(function (p) { return Object.assign({}, p, { settings: Object.assign({}, p.settings, { volume: v }) }) }) }} />
          <span className="lvl">{Math.round(state.settings.volume * 100)}%</span>
        </div>
      </div>

      <div className="card col-card">
        <div className="card-name">🔗 Быстрые переходы</div>
        <div className="switch-row">
          <button className="pill" onClick={function () { go('boxes') }}>🎁 Ящики</button>
          <button className="pill" onClick={function () { go('event') }}>🎵 Пассивный фарм</button>
          <button className="pill" onClick={function () { go('pvp') }}>⚔️ Арена</button>
          <button className="pill" onClick={function () { go('trade') }}>📈 Трейд</button>
          <button className="pill" onClick={function () { go('creators') }}>🎬 Создатели</button>
        </div>
      </div>

      <div className="card col-card">
        <div className="card-name">📊 Статистика</div>
        <div className="card-desc">
          Всего ДэнКоинов: {fmt(state.totalCoins)} • Кликов: {fmt(state.clicks)} • Ящиков: {state.boxesOpened}<br />
          PvP: {state.pvpWins} побед / {state.pvpLosses} поражений • В игре: {fmt(state.playSeconds)} сек
        </div>
      </div>

      <div className="card col-card danger">
        <div className="card-name">🗑️ Сброс прогресса</div>
        <div className="card-desc">Полностью удалит весь прогресс. Отменить нельзя.</div>
        {!confirm ? (
          <button className="buy danger" onClick={function () { setConfirm(true) }}>Сбросить прогресс</button>
        ) : (
          <div className="switch-row">
            <button className="buy danger" onClick={function () { reset(); setConfirm(false) }}>Да, удалить всё</button>
            <button className="pill" onClick={function () { setConfirm(false); notify('Сброс отменён', 'info') }}>Отмена</button>
          </div>
        )}
      </div>
    </div>
  )
}
