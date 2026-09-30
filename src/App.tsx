import { useState } from 'react'
import { GameProvider, useGame } from './game/state'
import ClickerScreen from './components/ClickerScreen'
import ShopScreen from './components/ShopScreen'
import BoxesScreen from './components/BoxesScreen'
import SettingsScreen from './components/SettingsScreen'
import EventScreen from './components/EventScreen'
import PvpScreen from './components/PvpScreen'
import TradeScreen from './components/TradeScreen'
import CreatorsScreen from './components/CreatorsScreen'
import Toasts from './components/Toasts'
import { fmt } from './game/format'

type Screen = 'clicker' | 'shop' | 'boxes' | 'event' | 'pvp' | 'trade' | 'settings' | 'creators'

const NAV: { id: Screen; label: string; ico: string }[] = [
  { id: 'clicker', label: 'Кликер', ico: '👆' },
  { id: 'shop', label: 'Магазин', ico: '🛒' },
  { id: 'boxes', label: 'Ящики', ico: '🎁' },
  { id: 'event', label: 'Ивент', ico: '🎵' },
  { id: 'pvp', label: 'Арена', ico: '⚔️' },
  { id: 'trade', label: 'Трейд', ico: '📈' },
  { id: 'settings', label: 'Настройки', ico: '⚙️' },
  { id: 'creators', label: 'Создатели', ico: '🎬' }
]

function Shell() {
  const [screen, setScreen] = useState<Screen>('clicker')
  const { state } = useGame()

  return (
    <div className={'app anim-' + (state.settings.anim ? 'on' : 'off')}>
      <header className="topbar">
        <div className="logo" onClick={function () { setScreen('clicker') }}>
          <span className="logo-ico">🥊</span>
          <span className="logo-txt">ДАНЯ КОМБАТ</span>
        </div>
        <div className="top-cur">
          <span className="tc coins">💰 {fmt(state.coins)}</span>
          <span className="tc rub">₽ {fmt(state.rubles)}</span>
          <span className="tc dia">💎 {fmt(state.diamonds)}</span>
          <span className="tc gold">🏅 {fmt(state.gold)}</span>
        </div>
      </header>

      <main className="main">
        {screen === 'clicker' ? <ClickerScreen /> : null}
        {screen === 'shop' ? <ShopScreen /> : null}
        {screen === 'boxes' ? <BoxesScreen /> : null}
        {screen === 'event' ? <EventScreen /> : null}
        {screen === 'pvp' ? <PvpScreen /> : null}
        {screen === 'trade' ? <TradeScreen /> : null}
        {screen === 'settings' ? <SettingsScreen go={function (s) { setScreen(s as Screen) }} /> : null}
        {screen === 'creators' ? <CreatorsScreen /> : null}
      </main>

      <nav className="navbar">
        {NAV.map(function (n) {
          return (
            <button key={n.id} className={'nav-btn' + (screen === n.id ? ' on' : '')} onClick={function () { setScreen(n.id) }}>
              <span className="nav-ico">{n.ico}</span>
              <span className="nav-lbl">{n.label}</span>
            </button>
          )
        })}
      </nav>
      <Toasts />
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  )
}
