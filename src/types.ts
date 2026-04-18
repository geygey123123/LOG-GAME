// Типы для симулятора жизни

export interface SimCharacter {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  traits: Trait[];
  skills: Skills;
  needs: Needs;
  mood: MoodState;
  career: Career | null;
  relationships: Relationship[];
  inventory: Item[];
  currentAction: Action | null;
  position: Position;
}

export interface Trait {
  id: string;
  name: string;
  description: string;
  category: 'personality' | 'skill' | 'lifestyle';
  effects: TraitEffect[];
}

export interface TraitEffect {
  type: 'need_decay' | 'skill_gain' | 'mood_boost' | 'career_boost';
  value: number;
  target?: string;
}

export interface Skills {
  cooking: number;
  fitness: number;
  creativity: number;
  logic: number;
  social: number;
  career: number;
}

export interface Needs {
  hunger: number;      // 0-100
  energy: number;      // 0-100
  hygiene: number;     // 0-100
  social: number;      // 0-100
  fun: number;         // 0-100
  comfort: number;     // 0-100
}

export interface MoodState {
  current: 'happy' | 'sad' | 'angry' | 'energetic' | 'tired' | 'bored' | 'focused';
  intensity: number;   // 0-100
  timer: number;       // ticks until mood changes
}

export interface Career {
  id: string;
  name: string;
  level: number;
  salary: number;
  nextPromotion: number;
  performance: number;
}

export interface Relationship {
  simId: string;
  name: string;
  type: 'family' | 'friend' | 'romantic' | 'colleague' | 'enemy';
  score: number;       // -100 to 100
  interactions: Interaction[];
}

export interface Interaction {
  type: string;
  timestamp: number;
  impact: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'furniture' | 'appliance' | 'decor' | 'food' | 'clothing';
  quality: number;
  durability: number;
  value: number;
}

export interface Action {
  id: string;
  name: string;
  duration: number;
  energyCost: number;
  skillGained?: keyof Skills;
  needEffects: Partial<Needs>;
  moodEffect?: Partial<MoodState>;
}

export interface Position {
  x: number;
  y: number;
  room: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'office' | 'outdoor';
  items: Item[];
  size: { width: number; height: number };
}

export interface House {
  id: string;
  name: string;
  rooms: Room[];
  value: number;
  upgradeLevel: number;
}

export interface GameState {
  sims: SimCharacter[];
  activeSim: string | null;
  house: House | null;
  money: number;
  gameTime: number;
  isPaused: boolean;
  speed: 1 | 2 | 3;
}

export const DEFAULT_NEEDS: Needs = {
  hunger: 100,
  energy: 100,
  hygiene: 100,
  social: 100,
  fun: 100,
  comfort: 100,
};

export const DEFAULT_SKILLS: Skills = {
  cooking: 0,
  fitness: 0,
  creativity: 0,
  logic: 0,
  social: 0,
  career: 0,
};

export const AVAILABLE_ACTIONS: Action[] = [
  {
    id: 'sleep',
    name: 'Спать',
    duration: 480,
    energyCost: -80,
    needEffects: { energy: 80, comfort: 10 },
    moodEffect: { current: 'energetic', intensity: 60 },
  },
  {
    id: 'eat',
    name: 'Есть',
    duration: 60,
    energyCost: -5,
    needEffects: { hunger: 60, comfort: 5 },
    skillGained: 'cooking',
  },
  {
    id: 'shower',
    name: 'Принять душ',
    duration: 30,
    energyCost: -10,
    needEffects: { hygiene: 80, comfort: 10 },
    moodEffect: { current: 'happy', intensity: 40 },
  },
  {
    id: 'socialize',
    name: 'Общаться',
    duration: 90,
    energyCost: -15,
    needEffects: { social: 50, fun: 20 },
    skillGained: 'social',
    moodEffect: { current: 'happy', intensity: 50 },
  },
  {
    id: 'exercise',
    name: 'Тренироваться',
    duration: 120,
    energyCost: -40,
    needEffects: { energy: -40, fun: 10 },
    skillGained: 'fitness',
    moodEffect: { current: 'energetic', intensity: 70 },
  },
  {
    id: 'cook',
    name: 'Готовить',
    duration: 90,
    energyCost: -20,
    needEffects: { hunger: -10 },
    skillGained: 'cooking',
    moodEffect: { current: 'focused', intensity: 50 },
  },
  {
    id: 'watch_tv',
    name: 'Смотреть ТВ',
    duration: 120,
    energyCost: -5,
    needEffects: { fun: 40, social: -5 },
    moodEffect: { current: 'happy', intensity: 30 },
  },
  {
    id: 'read',
    name: 'Читать',
    duration: 60,
    energyCost: -5,
    needEffects: { fun: 15, comfort: 5 },
    skillGained: 'logic',
    moodEffect: { current: 'focused', intensity: 40 },
  },
  {
    id: 'work',
    name: 'Работать',
    duration: 240,
    energyCost: -50,
    needEffects: { energy: -50, social: 10 },
    skillGained: 'career',
    moodEffect: { current: 'tired', intensity: 60 },
  },
];

export const TRAIT_TEMPLATES: Trait[] = [
  {
    id: 'creative',
    name: 'Креативный',
    description: 'Быстрее развивает творческие навыки',
    category: 'personality',
    effects: [{ type: 'skill_gain', value: 1.5, target: 'creativity' }],
  },
  {
    id: 'active',
    name: 'Активный',
    description: 'Медленнее устаёт от физических нагрузок',
    category: 'lifestyle',
    effects: [{ type: 'need_decay', value: 0.7, target: 'energy' }],
  },
  {
    id: 'sociable',
    name: 'Общительный',
    description: 'Получает больше удовольствия от общения',
    category: 'personality',
    effects: [{ type: 'mood_boost', value: 1.3 }],
  },
  {
    id: 'neat',
    name: 'Аккуратный',
    description: 'Чаще хочет поддерживать чистоту',
    category: 'lifestyle',
    effects: [{ type: 'need_decay', value: 1.3, target: 'hygiene' }],
  },
  {
    id: 'genius',
    name: 'Гений',
    description: 'Быстрее учится',
    category: 'skill',
    effects: [{ type: 'skill_gain', value: 1.5 }],
  },
];
