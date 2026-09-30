import { useGame } from '../game/state'

export default function Toasts() {
  const { toasts } = useGame()
  return (
    <div className="toasts">
      {toasts.map(function (t) {
        return <div key={t.id} className={'toast toast-' + t.kind}>{t.msg}</div>
      })}
    </div>
  )
}
