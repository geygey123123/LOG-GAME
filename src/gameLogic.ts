import { SimCharacter, GameState, Action, DEFAULT_NEEDS, DEFAULT_SKILLS, AVAILABLE_ACTIONS } from './types';

// Генерация уникального ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Создание нового сима
export function createSim(name: string, gender: 'male' | 'female', traits: string[] = []): SimCharacter {
  const selectedTraits = traits.map(traitId => ({
    id: traitId,
    name: traitId.charAt(0).toUpperCase() + traitId.slice(1),
    description: '',
    category: 'personality' as const,
    effects: [],
  }));

  return {
    id: generateId(),
    name,
    age: 18,
    gender,
    traits: selectedTraits,
    skills: { ...DEFAULT_SKILLS },
    needs: { ...DEFAULT_NEEDS },
    mood: {
      current: 'happy',
      intensity: 50,
      timer: 0,
    },
    career: null,
    relationships: [],
    inventory: [],
    currentAction: null,
    position: { x: 0, y: 0, room: 'living' },
  };
}

// Обновление потребностей сима
export function updateNeeds(sim: SimCharacter, delta: number): SimCharacter {
  const decayRates = {
    hunger: 0.3,
    energy: 0.2,
    hygiene: 0.15,
    social: 0.25,
    fun: 0.2,
    comfort: 0.1,
  };

  const updatedNeeds = { ...sim.needs };
  
  // Применяем модификаторы от черт характера
  let energyDecay = decayRates.energy;
  sim.traits.forEach(trait => {
    if (trait.effects.some(e => e.type === 'need_decay' && e.target === 'energy')) {
      energyDecay *= 0.7;
    }
  });

  updatedNeeds.hunger = Math.max(0, Math.min(100, updatedNeeds.hunger - decayRates.hunger * delta));
  updatedNeeds.energy = Math.max(0, Math.min(100, updatedNeeds.energy - energyDecay * delta));
  updatedNeeds.hygiene = Math.max(0, Math.min(100, updatedNeeds.hygiene - decayRates.hygiene * delta));
  updatedNeeds.social = Math.max(0, Math.min(100, updatedNeeds.social - decayRates.social * delta));
  updatedNeeds.fun = Math.max(0, Math.min(100, updatedNeeds.fun - decayRates.fun * delta));
  updatedNeeds.comfort = Math.max(0, Math.min(100, updatedNeeds.comfort - decayRates.comfort * delta));

  return {
    ...sim,
    needs: updatedNeeds,
  };
}

// Выполнение действия симом
export function performAction(sim: SimCharacter, action: Action): SimCharacter {
  let updatedSim = { ...sim };
  updatedSim.currentAction = action;

  // Применяем эффекты потребности
  const newNeeds = { ...updatedSim.needs };
  Object.entries(action.needEffects).forEach(([key, value]) => {
    const needKey = key as keyof typeof newNeeds;
    if (value !== undefined) {
      newNeeds[needKey] = Math.max(0, Math.min(100, newNeeds[needKey] + value));
    }
  });
  updatedSim.needs = newNeeds;

  // Применяем эффект настроения
  if (action.moodEffect) {
    updatedSim.mood = {
      ...updatedSim.mood,
      ...action.moodEffect,
      timer: 120, // 2 минуты в игровом времени
    };
  }

  // Повышаем навык если есть
  if (action.skillGained) {
    const skillMultiplier = sim.traits.some(t => t.effects.some(e => e.type === 'skill_gain')) ? 1.5 : 1;
    updatedSim.skills[action.skillGained] = Math.min(100, updatedSim.skills[action.skillGained] + 2 * skillMultiplier);
  }

  return updatedSim;
}

// Завершение текущего действия
export function completeAction(sim: SimCharacter): SimCharacter {
  return {
    ...sim,
    currentAction: null,
  };
}

// Определение приоритетного действия на основе потребностей
export function getPriorityAction(sim: SimCharacter): Action | null {
  const needs = sim.needs;
  
  if (needs.hunger < 30) return AVAILABLE_ACTIONS.find(a => a.id === 'eat') || null;
  if (needs.energy < 20) return AVAILABLE_ACTIONS.find(a => a.id === 'sleep') || null;
  if (needs.hygiene < 30) return AVAILABLE_ACTIONS.find(a => a.id === 'shower') || null;
  if (needs.social < 25) return AVAILABLE_ACTIONS.find(a => a.id === 'socialize') || null;
  if (needs.fun < 30) return AVAILABLE_ACTIONS.find(a => a.id === 'watch_tv') || null;
  
  // Если все потребности в норме, можно работать или тренироваться
  if (needs.energy > 50) {
    return AVAILABLE_ACTIONS.find(a => a.id === 'work') || null;
  }
  
  return AVAILABLE_ACTIONS.find(a => a.id === 'watch_tv') || null;
}

// Автоматическое управление симом (AI)
export function autoPlaySim(sim: SimCharacter): SimCharacter {
  if (sim.currentAction) {
    return sim;
  }

  const action = getPriorityAction(sim);
  if (action) {
    return performAction(sim, action);
  }

  return sim;
}

// Расчет общего настроения сима
export function calculateOverallMood(sim: SimCharacter): number {
  const needs = sim.needs;
  const avgNeeds = (
    needs.hunger +
    needs.energy +
    needs.hygiene +
    needs.social +
    needs.fun +
    needs.comfort
  ) / 6;

  const moodBonus = sim.mood.intensity / 100 * 20;
  
  return Math.min(100, avgNeeds + moodBonus);
}

// Проверка критических потребностей
export function checkCriticalNeeds(sim: SimCharacter): string[] {
  const critical: string[] = [];
  
  if (sim.needs.hunger < 20) critical.push('hunger');
  if (sim.needs.energy < 15) critical.push('energy');
  if (sim.needs.hygiene < 20) critical.push('hygiene');
  if (sim.needs.social < 15) critical.push('social');
  if (sim.needs.fun < 15) critical.push('fun');
  
  return critical;
}

// Инициализация состояния игры
export function initializeGameState(): GameState {
  return {
    sims: [],
    activeSim: null,
    house: null,
    money: 20000,
    gameTime: 0,
    isPaused: true,
    speed: 1,
  };
}

// Добавление сима в игру
export function addSimToGame(state: GameState, sim: SimCharacter): GameState {
  return {
    ...state,
    sims: [...state.sims, sim],
    activeSim: state.activeSim || sim.id,
  };
}

// Обновление игрового времени
export function advanceTime(state: GameState, ticks: number): GameState {
  if (state.isPaused) return state;

  const timeMultiplier = state.speed;
  const updatedSims = state.sims.map(sim => {
    let updatedSim = updateNeeds(sim, ticks * timeMultiplier);
    
    // Если сим выполняет действие, уменьшаем таймер
    if (updatedSim.currentAction) {
      // В реальной игре здесь была бы логика выполнения действия
    }
    
    // Авто-управление если нет активного действия
    if (!updatedSim.currentAction) {
      updatedSim = autoPlaySim(updatedSim);
    }
    
    return updatedSim;
  });

  return {
    ...state,
    sims: updatedSims,
    gameTime: state.gameTime + ticks * timeMultiplier,
  };
}

// Получение названия настроения
export function getMoodName(mood: string): string {
  const moodNames: Record<string, string> = {
    happy: 'Счастлив',
    sad: 'Грустный',
    angry: 'Злой',
    energetic: 'Энергичный',
    tired: 'Уставший',
    bored: 'Скучающий',
    focused: 'Сосредоточенный',
  };
  return moodNames[mood] || mood;
}

// Получение иконки настроения
export function getMoodEmoji(mood: string): string {
  const moodEmojis: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    energetic: '⚡',
    tired: '😴',
    bored: '😐',
    focused: '🤔',
  };
  return moodEmojis[mood] || '😐';
}

// Форматирование игрового времени
export function formatGameTime(ticks: number): string {
  const totalMinutes = ticks;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const days = Math.floor(totalMinutes / (60 * 24));
  
  const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const dayName = dayNames[days % 7];
  
  return `${dayName}, ${hours.toString().padStart(2, '0')}:00`;
}
