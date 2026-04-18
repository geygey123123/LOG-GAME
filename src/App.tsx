import React, { useState, useEffect, useCallback } from 'react';
import {
  SimCharacter,
  GameState,
  Action,
  Needs,
  Skills,
  AVAILABLE_ACTIONS,
  TRAIT_TEMPLATES,
} from './types';
import {
  createSim,
  initializeGameState,
  addSimToGame,
  advanceTime,
  performAction,
  calculateOverallMood,
  checkCriticalNeeds,
  getMoodName,
  getMoodEmoji,
  formatGameTime,
} from './gameLogic';

// Иконки действий
const ACTION_ICONS: Record<string, string> = {
  sleep: '😴',
  eat: '🍽️',
  shower: '🚿',
  socialize: '💬',
  exercise: '💪',
  cook: '👨‍🍳',
  watch_tv: '📺',
  read: '📚',
  work: '💼',
};

const NEED_LABELS: Record<keyof Needs, string> = {
  hunger: 'Голод',
  energy: 'Энергия',
  hygiene: 'Гигиена',
  social: 'Общение',
  fun: 'Веселье',
  comfort: 'Комфорт',
};

const SKILL_LABELS: Record<keyof Skills, string> = {
  cooking: 'Кулинария',
  fitness: 'Фитнес',
  creativity: 'Творчество',
  logic: 'Логика',
  social: 'Общение',
  career: 'Карьера',
};

function App() {
  const [gameState, setGameState] = useState<GameState>(initializeGameState());
  const [showCreateSim, setShowCreateSim] = useState(false);
  const [newSimName, setNewSimName] = useState('');
  const [newSimGender, setNewSimGender] = useState<'male' | 'female'>('male');
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);

  // Игровой цикл
  useEffect(() => {
    if (!gameState.isPaused && gameState.sims.length > 0) {
      const interval = setInterval(() => {
        setGameState(prev => advanceTime(prev, 1));
      }, 100 / gameState.speed);

      return () => clearInterval(interval);
    }
  }, [gameState.isPaused, gameState.speed, gameState.sims.length]);

  // Обработчики управления временем
  const togglePause = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const setSpeed = useCallback((speed: 1 | 2 | 3) => {
    setGameState(prev => ({ ...prev, speed }));
  }, []);

  // Создание сима
  const handleCreateSim = useCallback(() => {
    if (!newSimName.trim()) return;

    const sim = createSim(newSimName, newSimGender, selectedTraits);
    setGameState(prev => addSimToGame(prev, sim));
    
    setNewSimName('');
    setNewSimGender('male');
    setSelectedTraits([]);
    setShowCreateSim(false);
  }, [newSimName, newSimGender, selectedTraits]);

  // Выбор активного сима
  const selectSim = useCallback((simId: string) => {
    setGameState(prev => ({ ...prev, activeSim: simId }));
  }, []);

  // Выполнение действия
  const handleAction = useCallback((action: Action) => {
    setGameState(prev => {
      if (!prev.activeSim) return prev;
      
      const updatedSims = prev.sims.map(sim => {
        if (sim.id === prev.activeSim && !sim.currentAction) {
          return performAction(sim, action);
        }
        return sim;
      });

      return { ...prev, sims: updatedSims };
    });
  }, []);

  // Получение активного сима
  const activeSim = gameState.sims.find(s => s.id === gameState.activeSim);

  // Рендер полосы потребности
  const renderNeedBar = (value: number, label: string) => {
    let fillClass = 'high';
    if (value < 40) fillClass = 'medium';
    if (value < 20) fillClass = 'low';

    return (
      <div key={label} className="need-item">
        <div className="need-label">
          <span>{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
        <div className="need-bar">
          <div
            className={`need-fill ${fillClass}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  };

  // Рендер навыка
  const renderSkillBar = (value: number, label: string) => (
    <div key={label} className="skill-item">
      <span className="skill-name">{label}</span>
      <div className="skill-bar">
        <div
          className="skill-fill"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="skill-value">{Math.round(value)}</span>
    </div>
  );

  // Экран создания сима
  if (showCreateSim) {
    return (
      <div className="game-container">
        <div className="panel" style={{ maxWidth: '500px', margin: '50px auto' }}>
          <h2 className="panel-title">✨ Создание персонажа</h2>
          
          <div className="create-sim-form">
            <div className="form-group">
              <label className="form-label">Имя</label>
              <input
                type="text"
                className="form-input"
                value={newSimName}
                onChange={(e) => setNewSimName(e.target.value)}
                placeholder="Введите имя"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Пол</label>
              <select
                className="form-select"
                value={newSimGender}
                onChange={(e) => setNewSimGender(e.target.value as 'male' | 'female')}
              >
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Черты характера</label>
              <div className="checkbox-group">
                {TRAIT_TEMPLATES.map(trait => (
                  <label key={trait.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedTraits.includes(trait.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTraits([...selectedTraits, trait.id]);
                        } else {
                          setSelectedTraits(selectedTraits.filter(t => t !== trait.id));
                        }
                      }}
                    />
                    <span>{trait.name} - {trait.description}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                className="submit-btn"
                onClick={handleCreateSim}
                disabled={!newSimName.trim()}
              >
                Создать
              </button>
              <button
                className="control-btn"
                style={{ background: '#95a5a6' }}
                onClick={() => setShowCreateSim(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Главный экран игры
  return (
    <div className="game-container">
      {/* Заголовок */}
      <header className="game-header">
        <div className="game-info">
          <div className="info-item">
            <span className="info-label">Время</span>
            <span className="info-value">{formatGameTime(gameState.gameTime)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Деньги</span>
            <span className="info-value money-display">§{gameState.money.toLocaleString()}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Симы</span>
            <span className="info-value">{gameState.sims.length}</span>
          </div>
        </div>

        <div className="controls">
          <button
            className={`control-btn ${gameState.isPaused ? 'play-btn' : 'pause-btn'}`}
            onClick={togglePause}
          >
            {gameState.isPaused ? '▶ Play' : '⏸ Pause'}
          </button>
          <button
            className={`control-btn speed-btn ${gameState.speed === 1 ? 'active' : ''}`}
            onClick={() => setSpeed(1)}
          >
            1x
          </button>
          <button
            className={`control-btn speed-btn ${gameState.speed === 2 ? 'active' : ''}`}
            onClick={() => setSpeed(2)}
          >
            2x
          </button>
          <button
            className={`control-btn speed-btn ${gameState.speed === 3 ? 'active' : ''}`}
            onClick={() => setSpeed(3)}
          >
            3x
          </button>
        </div>
      </header>

      {!gameState.sims.length ? (
        /* Приветственный экран */
        <div className="panel welcome-screen">
          <h1 className="welcome-title">🏠 Life Simulator</h1>
          <p className="welcome-subtitle">
            Добро пожаловать в симулятор жизни! Создайте своего первого сима и начните управлять его жизнью.
          </p>
          <button
            className="start-btn"
            onClick={() => setShowCreateSim(true)}
          >
            ✨ Создать сима
          </button>
        </div>
      ) : (
        /* Основной контент */
        <div className="main-content">
          {/* Левая панель - Список симов */}
          <div className="panel">
            <h2 className="panel-title">👥 Семья</h2>
            
            {gameState.sims.map(sim => (
              <div
                key={sim.id}
                className={`sim-card ${sim.id === gameState.activeSim ? 'active' : ''}`}
                onClick={() => selectSim(sim.id)}
              >
                <div className="sim-name">
                  {sim.gender === 'male' ? '👨' : '👩'} {sim.name}
                </div>
                <div className="sim-mood">
                  {getMoodEmoji(sim.mood.current)} {getMoodName(sim.mood.current)}
                </div>
              </div>
            ))}

            <button
              className="submit-btn"
              onClick={() => setShowCreateSim(true)}
              style={{ width: '100%', marginTop: '15px' }}
            >
              + Добавить сима
            </button>
          </div>

          {/* Центральная панель - Активный сим */}
          {activeSim && (
            <>
              <div className="panel">
                <h2 className="panel-title">
                  {activeSim.gender === 'male' ? '👨' : '👩'} {activeSim.name}
                </h2>

                {/* Текущее действие */}
                {activeSim.currentAction && (
                  <div className="current-action">
                    <div className="action-text">Текущее действие:</div>
                    <div className="action-name-display">
                      {ACTION_ICONS[activeSim.currentAction.id]} {activeSim.currentAction.name}
                    </div>
                  </div>
                )}

                {/* Потребности */}
                <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>📊 Потребности</h3>
                <div className="needs-container">
                  {Object.entries(activeSim.needs).map(([key, value]) =>
                    renderNeedBar(value, NEED_LABELS[key as keyof Needs])
                  )}
                </div>

                {/* Критические предупреждения */}
                {checkCriticalNeeds(activeSim).length > 0 && (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '10px', 
                    background: '#ffebee', 
                    borderRadius: '8px',
                    color: '#c62828'
                  }}>
                    ⚠️ Внимание! Критические потребности:
                    {checkCriticalNeeds(activeSim).map(need => (
                      <div key={need}>• {NEED_LABELS[need as keyof Needs]}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Правая панель - Действия и навыки */}
              <div className="panel">
                <h2 className="panel-title">🎮 Действия</h2>
                
                <div className="actions-grid">
                  {AVAILABLE_ACTIONS.map(action => (
                    <button
                      key={action.id}
                      className="action-btn"
                      onClick={() => handleAction(action)}
                      disabled={!!activeSim.currentAction}
                    >
                      <span className="action-icon">{ACTION_ICONS[action.id]}</span>
                      <span className="action-name">{action.name}</span>
                    </button>
                  ))}
                </div>

                <h3 style={{ marginBottom: '15px', fontSize: '16px', marginTop: '25px' }}>
                  📈 Навыки
                </h3>
                <div className="skills-container">
                  {Object.entries(activeSim.skills).map(([key, value]) =>
                    renderSkillBar(value, SKILL_LABELS[key as keyof Skills])
                  )}
                </div>

                {activeSim.traits.length > 0 && (
                  <>
                    <h3 style={{ marginBottom: '15px', fontSize: '16px', marginTop: '25px' }}>
                      ⭐ Черты характера
                    </h3>
                    <div className="traits-list">
                      {activeSim.traits.map(trait => (
                        <span key={trait.id} className="trait-badge">
                          {trait.name}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ 
                  marginTop: '25px', 
                  padding: '15px', 
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                    Общее настроение
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                    {getMoodEmoji(activeSim.mood.current)} {Math.round(calculateOverallMood(activeSim))}%
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
