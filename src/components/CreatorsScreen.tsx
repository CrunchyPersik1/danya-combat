import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/state'
import DanyaAvatar from './DanyaAvatar'
import { skinById, SKINS } from '../game/data'
import { sfx } from '../game/audio'

const CREDITS = [
  { role: 'Главный герой', who: 'Даня' },
  { role: 'Геймдизайн и код', who: 'Даня Комбат Team' },
  { role: 'Арт-отдел', who: 'Векторный Даня' },
  { role: 'Звукорежиссёр', who: 'Web Audio API' },
  { role: 'Тестировщик кликов', who: 'Ты' },
  { role: 'Директор по ДэнКойнам', who: 'Сам Даня' }
]

export default function CreatorsScreen() {
  const { state } = useGame()
  const [idx, setIdx] = useState(0)
  const [roll, setRoll] = useState('')
  const rollRef = useRef<number | null>(null)

  useEffect(function () {
    let i = 0
    const id = setInterval(function () {
      i = (i + 1) % SKINS.length
      setRoll(SKINS[i].id)
    }, 110)
    return function () { clearInterval(id) }
  }, [])

  function spin() {
    if (rollRef.current) return
    let n = 0
    rollRef.current = window.setInterval(function () {
      setIdx(Math.floor(Math.random() * SKINS.length))
      n++
      sfx.note(440 + n * 20, 0.05, 0.05)
      if (n > 14) {
        window.clearInterval(rollRef.current!)
        rollRef.current = null
      }
    }, 90)
  }

  const hero = skinById(roll || state.activeSkin)

  return (
    <div className="screen creators">
      <h2 className="title">🎬 Создатели</h2>
      <div className="credits-hero">
        <DanyaAvatar skin={hero} size={140} anim />
      </div>
      <div className="credits-list">
        {CREDITS.map(function (c) {
          return (
            <div key={c.role} className="credit-row">
              <span className="credit-role">{c.role}</span>
              <span className="credit-who">{c.who}</span>
            </div>
          )
        })}
      </div>
      <button className="buy" onClick={spin}>🎲 Показать случайного Даню</button>
      <div className="hint">Спасибо, что играешь в «Даня Комбат»! Версия 1.0</div>
    </div>
  )
}
