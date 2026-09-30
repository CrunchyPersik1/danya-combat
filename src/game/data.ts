export type Currency = 'coins' | 'rubles' | 'diamonds' | 'gold'

export interface Skin {
  id: string
  name: string
  desc: string
  cost: number
  currency: Currency | 'free' | 'box'
  clickMult: number
  incomePerDay: number
  note: number
  beat: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  colors: { face: string; hair: string; eye: string; bg1: string; bg2: string; glow: string; accent: string }
  accessory: 'none' | 'crown' | 'mask' | 'visor' | 'horns' | 'diamond' | 'cap'
}

export interface Upgrade {
  id: string
  name: string
  desc: string
  icon: string
  baseCost: number
  currency: Currency
  growth: number
  maxLevel: number
  requires?: { id: string; level: number }
}

export interface BoxDef {
  id: string
  name: string
  desc: string
  prices: { currency: Currency; amount: number }[]
  rarityTable: { skinId: string; weight: number }[]
  coinRange: [number, number]
  rubleRange: [number, number]
  diamondRange: [number, number]
  goldRange: [number, number]
  boostRange: [number, number]
  luck: string
}

export interface Promo {
  code: string
  label: string
  coins?: number
  rubles?: number
  diamonds?: number
  gold?: number
  skin?: string
  clickMultLevels?: number
}

export const SKINS: Skin[] = [
  {
    id: 'default', name: 'Даня', desc: 'Обычный Даня. С него всё началось.', cost: 0, currency: 'free',
    clickMult: 1, incomePerDay: 12, note: 329.63, beat: 1.0, rarity: 'common', accessory: 'none',
    colors: { face: '#ffd7a8', hair: '#3a2a1a', eye: '#22223b', bg1: '#4a2fbd', bg2: '#12002b', glow: '#8b5cf6', accent: '#ff5c8a' }
  },
  {
    id: 'resource', name: 'Ресоурс', desc: 'Собран из чистых ресурсов. +пассивка.', cost: 3000, currency: 'coins',
    clickMult: 1.3, incomePerDay: 40, note: 392.0, beat: 1.5, rarity: 'common', accessory: 'cap',
    colors: { face: '#c9e7ff', hair: '#1f6feb', eye: '#0b2545', bg1: '#1e3a8a', bg2: '#071023', glow: '#38bdf8', accent: '#22d3ee' }
  },
  {
    id: 'venom', name: 'Веном', desc: 'Симбиот вселился в Даню. Злая мощь.', cost: 8000, currency: 'coins',
    clickMult: 1.6, incomePerDay: 95, note: 261.63, beat: 0.75, rarity: 'rare', accessory: 'mask',
    colors: { face: '#2b1055', hair: '#0b0b0f', eye: '#c8ff2e', bg1: '#3b0764', bg2: '#05010f', glow: '#a3e635', accent: '#84cc16' }
  },
  {
    id: 'golden', name: 'Золотой Денчик', desc: 'Каждая клетка — золото. x2 к клику.', cost: 25000, currency: 'coins',
    clickMult: 2.0, incomePerDay: 210, note: 523.25, beat: 0.5, rarity: 'rare', accessory: 'crown',
    colors: { face: '#ffcf5c', hair: '#b8860b', eye: '#4a2c00', bg1: '#a16207', bg2: '#241a00', glow: '#fbbf24', accent: '#fde047' }
  },
  {
    id: 'night', name: 'Ночной Даня', desc: 'Тень в ночи. Огромный множитель.', cost: 60000, currency: 'coins',
    clickMult: 2.6, incomePerDay: 430, note: 440.0, beat: 2.0, rarity: 'epic', accessory: 'visor',
    colors: { face: '#7c8cf8', hair: '#0f172a', eye: '#22d3ee', bg1: '#0f172a', bg2: '#000000', glow: '#6366f1', accent: '#a78bfa' }
  },
  {
    id: 'cyber', name: 'Кибер Даня', desc: 'Импланты Sigma-класса. Только из ящиков.', cost: 0, currency: 'box',
    clickMult: 3.4, incomePerDay: 820, note: 587.33, beat: 0.6, rarity: 'epic', accessory: 'visor',
    colors: { face: '#d8b4fe', hair: '#111827', eye: '#f0abfc', bg1: '#701a75', bg2: '#0a0118', glow: '#e879f9', accent: '#f472b6' }
  },
  {
    id: 'diamond', name: 'Алмазный Даня', desc: 'Кристаллическая форма. x4.2 к клику.', cost: 0, currency: 'box',
    clickMult: 4.2, incomePerDay: 1500, note: 783.99, beat: 0.8, rarity: 'legendary', accessory: 'diamond',
    colors: { face: '#a5f3fc', hair: '#0e7490', eye: '#083344', bg1: '#0e7490', bg2: '#01161e', glow: '#67e8f9', accent: '#cffafe' }
  },
  {
    id: 'sigma', name: 'Сигма Даня', desc: 'Истинный сигма. x5 к клику.', cost: 0, currency: 'box',
    clickMult: 5.0, incomePerDay: 2600, note: 659.25, beat: 1.2, rarity: 'legendary', accessory: 'crown',
    colors: { face: '#fef3c7', hair: '#78350f', eye: '#dc2626', bg1: '#7f1d1d', bg2: '#140202', glow: '#f59e0b', accent: '#ef4444' }
  },
  {
    id: 'demon', name: 'Демон Комбат', desc: 'Финальная форма Дани. x7 к клику.', cost: 0, currency: 'box',
    clickMult: 7.0, incomePerDay: 6000, note: 220.0, beat: 1.6, rarity: 'legendary', accessory: 'horns',
    colors: { face: '#ef4444', hair: '#1c1917', eye: '#fef08a', bg1: '#450a0a', bg2: '#0a0000', glow: '#dc2626', accent: '#fb923c' }
  }
]

export const UPGRADES: Upgrade[] = [
  { id: 'clickMult', name: 'Множитель нажатий', desc: 'Увеличивает силу клика. Прокачка от x1 до x10000.', icon: '👆', baseCost: 40, currency: 'rubles', growth: 1.62, maxLevel: 25 },
  { id: 'sigmaMiner1', name: 'Сигма Майнер 1.0', desc: 'Первый автофарм. Пассивно добывает ДэнКоины.', icon: '⛏️', baseCost: 100, currency: 'rubles', growth: 1.5, maxLevel: 50 },
  { id: 'diamondMine', name: 'Шахта алмазов', desc: 'Пассивная добыча алмазов. Алмазы нужны для боксов.', icon: '💎', baseCost: 2500, currency: 'rubles', growth: 1.56, maxLevel: 40, requires: { id: 'sigmaMiner1', level: 3 } },
  { id: 'sigmaMiner10k', name: 'Сигма Майнер 10к', desc: 'Усиленный автофарм. В 40 раз мощнее первого.', icon: '🏭', baseCost: 5000, currency: 'rubles', growth: 1.52, maxLevel: 50, requires: { id: 'sigmaMiner1', level: 5 } },
  { id: 'goldGrinder', name: 'Наивысший гриндер золота', desc: 'ТОПОВОЕ улучшение. Пассивно даёт золото и +25% ко всему доходу за уровень.', icon: '🏆', baseCost: 50000, currency: 'rubles', growth: 1.6, maxLevel: 30, requires: { id: 'diamondMine', level: 5 } }
]

export const BOXES: BoxDef[] = [
  {
    id: 'danyaBox', name: 'Дэн Бокс', desc: 'Обычный ящик. Внутри скины, бусты и ресурсы.',
    prices: [{ currency: 'coins', amount: 5000 }, { currency: 'diamonds', amount: 15 }],
    rarityTable: [
      { skinId: 'resource', weight: 30 }, { skinId: 'venom', weight: 18 }, { skinId: 'golden', weight: 7 },
      { skinId: 'night', weight: 2 }, { skinId: 'cyber', weight: 1 }
    ],
    coinRange: [800, 6000], rubleRange: [10, 70], diamondRange: [1, 6], goldRange: [0, 2], boostRange: [10, 25], luck: '+ обычные скины'
  },
  {
    id: 'superBox', name: 'Супер Бокс', desc: 'Премиум ящик. Лучшие награды и легендарные скины.',
    prices: [{ currency: 'coins', amount: 75000 }, { currency: 'diamonds', amount: 120 }, { currency: 'gold', amount: 250 }],
    rarityTable: [
      { skinId: 'golden', weight: 22 }, { skinId: 'night', weight: 20 }, { skinId: 'cyber', weight: 18 },
      { skinId: 'diamond', weight: 14 }, { skinId: 'sigma', weight: 9 }, { skinId: 'demon', weight: 4 }
    ],
    coinRange: [25000, 250000], rubleRange: [120, 900], diamondRange: [20, 110], goldRange: [8, 60], boostRange: [30, 90], luck: '+ легендарки'
  }
]

export const PROMOS: Promo[] = [
  { code: 'DANYA2026', label: 'Стартовый набор 2026', coins: 12000, rubles: 260, diamonds: 12, clickMultLevels: 1 },
  { code: 'SIGMA', label: 'Сигма-буст', coins: 60000, rubles: 600, diamonds: 20, gold: 5 },
  { code: 'GOLDEN', label: 'Золотой запас', coins: 350000, rubles: 1500, gold: 40 },
  { code: 'VENOM', label: 'Симбиот разблокирован', coins: 25000, rubles: 100, skin: 'venom' },
  { code: 'KOMBAT', label: 'Боевой припас', coins: 5000, rubles: 120, clickMultLevels: 1 },
  { code: 'NIGHTDANYA', label: 'Ночной дроп', coins: 900000, rubles: 2200, diamonds: 60, skin: 'night' }
]

export const BOOSTS: { id: string; name: string; icon: string; desc: string }[] = [
  { id: 'clickBoost', name: 'Буст клика', icon: '⚡', desc: '+10% к силе клика за каждый стак' },
  { id: 'incomeBoost', name: 'Буст дохода', icon: '📈', desc: '+10% к пассивному доходу за каждый стак' }
]

export const DAY_SECONDS = 10

export function skinById(id: string): Skin {
  return SKINS.find(function (s) { return s.id === id }) || SKINS[0]
}
export function upgradeById(id: string): Upgrade | undefined {
  return UPGRADES.find(function (u) { return u.id === id })
}
export function boxById(id: string): BoxDef | undefined {
  return BOXES.find(function (b) { return b.id === id })
}
