/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useReducer, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, 
  Cpu, 
  Zap, 
  Database, 
  AlertTriangle, 
  Shield, 
  Trash2, 
  RefreshCw, 
  LogOut, 
  Activity,
  HardDrive,
  Maximize2,
  Minimize2,
  ChevronRight,
  Lock,
  Unlock,
  Thermometer,
  Wind
} from "lucide-react";
import { LogType, LogAttribute, Log, FileSystemLocation, Enemy, Architecture, GameState } from "./types";
import { LOG_DATA, ENEMIES, LOCATIONS } from "./constants";

// --- Utils ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const createLog = (type: LogType, attributes: LogAttribute[] = []): Log => {
  const log: Log = {
    id: generateId(),
    type,
    attributes,
    value: LOG_DATA[type].value || 0,
  };
  if (attributes.includes(LogAttribute.VOLATILE)) {
    log.turnsRemaining = 2;
  }
  return log;
};

const getRandomLogType = (): LogType => {
  const types = [LogType.INFO, LogType.INFO, LogType.INFO, LogType.ERROR, LogType.ERROR, LogType.FATAL];
  return types[Math.floor(Math.random() * types.length)];
};

const getRandomAttribute = (): LogAttribute | null => {
  const rand = Math.random();
  if (rand < 0.1) return LogAttribute.VOLATILE;
  if (rand < 0.15) return LogAttribute.POINTER;
  if (rand < 0.2) return LogAttribute.STATIC;
  return null;
};

// --- Initial State ---
const initialState: GameState = {
  hp: 100,
  maxHp: 100,
  stability: 50,
  maxStability: 100,
  bytes: 0,
  queue: [],
  maxQueueSize: 8,
  location: FileSystemLocation.HOME_USER,
  architecture: Architecture.X86,
  turn: 1,
  enemy: null,
  isPlayerTurn: true,
  irqPriority: 0,
  isOverclocked: false,
  overclockTurns: 0,
  encryptedButtons: [],
  isGameOver: false,
  isVictory: false,
  message: "SYSTEM INITIALIZED. WAITING FOR INPUT...",
};

// --- Reducer ---
type Action =
  | { type: "START_BATTLE"; enemy: Enemy }
  | { type: "USE_LOG"; index: number }
  | { type: "DELETE_LOG"; index: number }
  | { type: "END_TURN" }
  | { type: "ENEMY_TURN" }
  | { type: "ADD_LOG"; log: Log }
  | { type: "RESTART" }
  | { type: "CHANGE_LOCATION"; location: FileSystemLocation }
  | { type: "SET_MESSAGE"; message: string }
  | { type: "OVERCLOCK" }
  | { type: "MOVE_LOG"; index: number; direction: "left" | "right" }
  | { type: "CHANGE_ARCHITECTURE"; architecture: Architecture }
  | { type: "ENCRYPT_BUTTON"; button: string }
  | { type: "DECRYPT_BUTTON"; button: string };

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "START_BATTLE":
      return {
        ...state,
        enemy: { ...action.enemy },
        turn: 1,
        isPlayerTurn: true,
        isGameOver: false,
        isVictory: false,
        message: `BATTLE STARTED: ${action.enemy.name} DETECTED.`,
        queue: Array.from({ length: 4 }, () => {
          const attr = getRandomAttribute();
          return createLog(getRandomLogType(), attr ? [attr] : []);
        }),
      };

    case "ADD_LOG":
      if (state.queue.length >= state.maxQueueSize) return state;
      return {
        ...state,
        queue: [...state.queue, action.log],
      };

    case "USE_LOG": {
      if (!state.isPlayerTurn || !state.enemy) return state;
      const log = state.queue[action.index];
      let damage = log.value;
      
      // Shift+Click (Overclock) logic
      const isShift = (action as any).isShift;
      if (isShift) {
        damage *= 2;
      }
      
      let heal = 0;
      let newStability = state.stability;
      let newEnemyHp = state.enemy.hp;
      let newMessage = `EXECUTED: [${log.type}]`;

      // Architecture Effects
      if (state.architecture === Architecture.X64) {
        damage = Math.floor(damage * 1.2); // x64 is more powerful but maybe more unstable?
      }
      let bonusTurn = false;

      // Check for IRQ (Chain of 4 identical types)
      const type = log.type;
      let chainCount = 0;
      for (let i = 0; i < state.queue.length; i++) {
        if (state.queue[i].type === type) chainCount++;
        else break;
      }
      if (chainCount >= 4) {
        bonusTurn = true;
        newMessage += " !! IRQ 0 INTERRUPT: BONUS TURN !!";
      }

      // Handle Attributes
      if (log.attributes.includes(LogAttribute.POINTER)) {
        const nextLog = state.queue[action.index + 1];
        if (nextLog) {
          damage += nextLog.value;
          newMessage += ` -> COPIED [${nextLog.type}]`;
        }
      }

      // Handle Types
      if (log.type === LogType.FREE) {
        heal = 15;
        newMessage = "SYSTEM CLEANUP: RECOVERED STABILITY.";
      } else if (log.type === LogType.MALLOC) {
        const fillCount = state.maxQueueSize - state.queue.length + 1;
        const newLogs = Array.from({ length: fillCount - 1 }, () => createLog(getRandomLogType()));
        return {
          ...state,
          queue: [...state.queue.filter((_, i) => i !== action.index), ...newLogs],
          message: "MALLOC: MEMORY ALLOCATED.",
        };
      } else if (log.type === LogType.SYSCALL_EXIT) {
        return {
          ...state,
          enemy: null,
          message: "SYSCALL_EXIT: ESCAPED WITH 50% BYTES.",
          bytes: Math.floor(state.bytes * 0.5),
        };
      }

      // Location Effects
      if (state.location === FileSystemLocation.DEV_NULL) {
        if (Math.random() < 0.5) {
          damage = 0;
          newMessage += " (NULLIFIED BY /dev/null)";
        }
      }

      // DDoS Swarm Trait
      if (state.enemy.id === "ddos" && log.type === LogType.ERROR) {
        damage = Math.floor(damage * 0.5);
        newMessage += " (SWARM RESISTANCE)";
      }

      newEnemyHp -= damage;
      newStability = Math.min(state.maxStability, state.stability + heal);

      const newQueue = state.queue.filter((_, i) => i !== action.index);
      
      // Check for IRQ (Chain of 4)
      // (Simplified logic for now: if 4 of same type in original queue, bonus turn)
      
      if (newEnemyHp <= 0) {
        // Zombie Process Revive Logic
        if (state.enemy.id === "zombie" && (state.enemy.reviveCount || 0) < 1) {
          return {
            ...state,
            enemy: { ...state.enemy, hp: Math.floor(state.enemy.maxHp * 0.2), reviveCount: 1 },
            message: "ZOMBIE PROCESS REVIVED! (20% HP RECOVERED)",
            queue: newQueue,
          };
        }

        return {
          ...state,
          enemy: { ...state.enemy, hp: 0 },
          isVictory: true,
          isGameOver: true,
          message: `VICTORY: ${state.enemy.name} TERMINATED.`,
          queue: newQueue,
          bytes: state.bytes + 50,
          irqPriority: Math.min(100, state.irqPriority + 34), // Trigger memory dump after 3 battles
        };
      }

      return {
        ...state,
        enemy: { ...state.enemy, hp: newEnemyHp },
        stability: newStability,
        queue: newQueue,
        message: newMessage,
      };
    }

    case "DELETE_LOG": {
      const log = state.queue[action.index];
      if (log.attributes.includes(LogAttribute.STATIC)) {
        return { ...state, message: "ERROR: [STATIC] LOG CANNOT BE DELETED." };
      }
      return {
        ...state,
        queue: state.queue.filter((_, i) => i !== action.index),
        message: "LOG DELETED.",
      };
    }

    case "END_TURN":
      return {
        ...state,
        isPlayerTurn: false,
        message: "WAITING FOR SYSTEM RESPONSE...",
      };

    case "ENEMY_TURN": {
      if (!state.enemy) return state;
      let damage = 10 + state.turn * 2;
      let newMessage = `${state.enemy.name} ATTACKED.`;
      let newHp = state.hp - damage;
      let newEncrypted = [...state.encryptedButtons];
      let newMaxQueue = state.maxQueueSize;

      // Location Effects: /swap
      if (state.location === FileSystemLocation.SWAP) {
        // Swap HP and Queue Size (scaled)
        // This is a bit complex for a turn-based swap, let's just adjust maxQueue based on HP
        newMaxQueue = Math.max(4, Math.floor((100 - state.hp) / 10) + 4);
        newMessage += " (/swap: QUEUE SIZE ADJUSTED BY HP)";
      }

      // Enemy Specifics
      if (state.enemy.id === "ransomware") {
        const buttons = ["DEL", "MALLOC", "FREE", "EXIT"];
        const target = buttons[Math.floor(Math.random() * buttons.length)];
        if (!newEncrypted.includes(target)) {
          newEncrypted.push(target);
          newMessage += ` BUTTON [${target}] ENCRYPTED.`;
        }
      }

      if (state.enemy.id === "watchdog" && state.turn >= 10) {
        return {
          ...state,
          hp: 0,
          isGameOver: true,
          message: "WATCHDOG TIMEOUT: GAME OVER.",
        };
      }

      // Update Volatile Logs
      const updatedQueue = state.queue.map(log => {
        if (log.attributes.includes(LogAttribute.VOLATILE) && log.turnsRemaining !== undefined) {
          return { ...log, turnsRemaining: log.turnsRemaining - 1 };
        }
        return log;
      }).filter(log => log.turnsRemaining === undefined || log.turnsRemaining > 0);

      if (newHp <= 0) {
        return {
          ...state,
          hp: 0,
          isGameOver: true,
          message: "SYSTEM CRITICAL FAILURE: GAME OVER.",
        };
      }

      return {
        ...state,
        hp: newHp,
        turn: state.turn + 1,
        isPlayerTurn: true,
        message: newMessage,
        queue: updatedQueue,
        encryptedButtons: newEncrypted,
        maxQueueSize: newMaxQueue,
      };
    }

    case "CHANGE_LOCATION":
      return {
        ...state,
        location: action.location,
        message: `MOVED TO ${action.location}`,
      };

    case "MOVE_LOG": {
      const newQueue = [...state.queue];
      const targetIndex = action.direction === "left" ? action.index - 1 : action.index + 1;
      if (targetIndex < 0 || targetIndex >= newQueue.length) return state;
      [newQueue[action.index], newQueue[targetIndex]] = [newQueue[targetIndex], newQueue[action.index]];
      return { ...state, queue: newQueue };
    }

    case "CHANGE_ARCHITECTURE":
      return {
        ...state,
        architecture: action.architecture,
        message: `ARCHITECTURE SWITCHED TO ${action.architecture.toUpperCase()}`,
      };

    case "RESTART":
      return initialState;

    case "SET_MESSAGE":
      return { ...state, message: action.message };

    case "DECRYPT_BUTTON":
      return {
        ...state,
        encryptedButtons: state.encryptedButtons.filter(b => b !== action.button),
        bytes: state.bytes - 10,
        message: `BUTTON [${action.button}] DECRYPTED.`,
      };

    default:
      return state;
  }
}

// --- Components ---

const MemoryDump = ({ onSuccess, onFail }: { onSuccess: () => void, onFail: () => void }) => {
  const [grid, setGrid] = useState<string[][]>([]);
  const [target, setTarget] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [found, setFound] = useState(0);

  useEffect(() => {
    const hex = "0123456789ABCDEF";
    const newGrid = Array.from({ length: 8 }, () => 
      Array.from({ length: 8 }, () => hex[Math.floor(Math.random() * hex.length)] + hex[Math.floor(Math.random() * hex.length)])
    );
    setGrid(newGrid);
    setTarget(newGrid[Math.floor(Math.random() * 8)][Math.floor(Math.random() * 8)]);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onFail();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClick = (val: string) => {
    if (val === target) {
      setFound(prev => {
        if (prev + 1 >= 3) {
          onSuccess();
          return 3;
        }
        // Generate new target
        setTarget(grid[Math.floor(Math.random() * 8)][Math.floor(Math.random() * 8)]);
        return prev + 1;
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="absolute inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-8"
    >
      <div className="border-2 border-blue-500 p-6 rounded-lg max-w-md w-full bg-blue-900/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-400 crt-glow">MEMORY DUMP ANALYSIS</h2>
          <div className="text-xl font-mono text-yellow-500">{timeLeft}s</div>
        </div>
        <p className="text-xs text-blue-300 mb-4">LOCATE HEX PATTERN: <span className="text-lg font-bold text-white underline">{target}</span> ({found}/3)</p>
        <div className="grid grid-cols-8 gap-1">
          {grid.map((row, i) => row.map((cell, j) => (
            <button
              key={`${i}-${j}`}
              onClick={() => handleClick(cell)}
              className={`text-[10px] p-1 border border-blue-900/50 hover:bg-blue-500/20 transition-colors ${cell === target ? "text-white" : "text-blue-700"}`}
            >
              {cell}
            </button>
          )))}
        </div>
      </div>
    </motion.div>
  );
};

const LogCard: React.FC<{ 
  log: Log, 
  index: number, 
  onUse: (i: number, isShift: boolean) => void, 
  onDelete: (i: number) => void,
  onMove: (i: number, dir: "left" | "right") => void,
  disabled: boolean 
}> = ({ log, index, onUse, onDelete, onMove, disabled }) => {
  const getBorderColor = () => {
    switch (log.type) {
      case LogType.FATAL: return "border-red-500";
      case LogType.ERROR: return "border-orange-500";
      case LogType.INFO: return "border-blue-500";
      default: return "border-zinc-500";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      className={`relative w-24 h-32 ${getBorderColor()} border-2 rounded-md p-2 flex flex-col justify-between bg-black/80 cursor-pointer group`}
      onClick={(e) => !disabled && onUse(index, e.shiftKey)}
    >
      <div className="text-[10px] font-bold truncate">{log.type}</div>
      <div className="flex flex-wrap gap-1">
        {log.attributes.map(attr => (
          <span key={attr} className="text-[8px] bg-zinc-800 px-1 rounded text-zinc-400">
            {attr[0]}
          </span>
        ))}
      </div>
      <div className="text-center text-xl font-bold">{log.value}</div>
      
      {log.turnsRemaining !== undefined && (
        <div className="absolute top-1 right-1 text-[8px] text-yellow-500">
          T:{log.turnsRemaining}
        </div>
      )}

      <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="bg-zinc-800 text-white rounded p-1 hover:bg-zinc-700"
          onClick={(e) => { e.stopPropagation(); onMove(index, "left"); }}
        >
          <ChevronRight size={10} className="rotate-180" />
        </button>
        <button
          className="bg-red-900 text-white rounded p-1 hover:bg-red-800"
          onClick={(e) => { e.stopPropagation(); onDelete(index); }}
        >
          <Trash2 size={10} />
        </button>
        <button
          className="bg-zinc-800 text-white rounded p-1 hover:bg-zinc-700"
          onClick={(e) => { e.stopPropagation(); onMove(index, "right"); }}
        >
          <ChevronRight size={10} />
        </button>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [voltageDrop, setVoltageDrop] = useState(false);
  const [showMemoryDump, setShowMemoryDump] = useState(false);
  const [procTimer, setProcTimer] = useState<number | null>(null);

  // Real-time /proc constraint
  useEffect(() => {
    if (state.location === FileSystemLocation.PROC && state.isPlayerTurn && !state.isGameOver && state.enemy) {
      setProcTimer(5);
      const timer = setInterval(() => {
        setProcTimer(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timer);
            // Auto-execute random log
            const randomIndex = Math.floor(Math.random() * state.queue.length);
            if (state.queue.length > 0) {
              dispatch({ type: "USE_LOG", index: randomIndex });
            } else {
              dispatch({ type: "END_TURN" });
            }
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setProcTimer(null);
    }
  }, [state.location, state.isPlayerTurn, state.isGameOver, state.enemy, state.queue.length]);

  // Trigger voltage drop on heavy attacks
  useEffect(() => {
    if (state.message.includes("FATAL") || state.message.includes("ATTACKED")) {
      setVoltageDrop(true);
      const timer = setTimeout(() => setVoltageDrop(false), 300);
      return () => clearTimeout(timer);
    }
  }, [state.message]);

  // Enemy Turn Logic
  useEffect(() => {
    if (!state.isPlayerTurn && !state.isGameOver && state.enemy) {
      const timer = setTimeout(() => {
        dispatch({ type: "ENEMY_TURN" });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.isPlayerTurn, state.isGameOver, state.enemy]);

  // Auto-fill queue if empty
  useEffect(() => {
    if (state.queue.length === 0 && state.enemy && state.isPlayerTurn && !state.isGameOver) {
      dispatch({ type: "ADD_LOG", log: createLog(getRandomLogType()) });
    }
  }, [state.queue.length, state.enemy, state.isPlayerTurn, state.isGameOver]);

  // Trigger Memory Dump
  useEffect(() => {
    if (state.irqPriority >= 100 && state.isVictory) {
      setShowMemoryDump(true);
    }
  }, [state.irqPriority, state.isVictory]);

  const handleStartGame = () => {
    const randomEnemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
    dispatch({ type: "START_BATTLE", enemy: randomEnemy });
  };

  const handleLocationChange = (loc: FileSystemLocation) => {
    dispatch({ type: "CHANGE_LOCATION", location: loc });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${voltageDrop ? "voltage-drop" : ""}`}>
      <div className="terminal-screen w-full max-w-5xl aspect-video flex flex-col relative">
        <div className="scanline" />
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-green-900/50 pb-2 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-green-400">
              <Cpu size={20} />
              <span className="font-bold tracking-widest uppercase">Log Battle v2.0</span>
            </div>
            <div className="text-xs text-green-700">
              ARCH: {state.architecture.toUpperCase()} | BUS: 400MHz
              {procTimer !== null && (
                <span className="ml-4 text-red-500 font-bold">/PROC INTERRUPT: {procTimer}s</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-500" />
              <div className="w-32 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  className="h-full bg-yellow-500" 
                  animate={{ width: `${(state.stability / state.maxStability) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-red-500" />
              <div className="w-32 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  className="h-full bg-red-500" 
                  animate={{ width: `${(state.hp / state.maxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Left Panel: Stats & World */}
          <div className="w-1/4 flex flex-col gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded">
              <div className="text-[10px] text-zinc-500 mb-2 uppercase font-bold">Architecture</div>
              <div className="flex gap-2">
                <button
                  onClick={() => dispatch({ type: "CHANGE_ARCHITECTURE", architecture: Architecture.X86 })}
                  className={`flex-1 text-[10px] p-1 rounded border ${state.architecture === Architecture.X86 ? "bg-green-900/30 border-green-500 text-green-400" : "border-zinc-800 text-zinc-600"}`}
                >
                  x86
                </button>
                <button
                  onClick={() => dispatch({ type: "CHANGE_ARCHITECTURE", architecture: Architecture.X64 })}
                  className={`flex-1 text-[10px] p-1 rounded border ${state.architecture === Architecture.X64 ? "bg-green-900/30 border-green-500 text-green-400" : "border-zinc-800 text-zinc-600"}`}
                >
                  x64
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded">
              <div className="text-[10px] text-zinc-500 mb-2 uppercase font-bold">File System</div>
              <div className="flex flex-col gap-1">
                {LOCATIONS.map(loc => (
                  <button
                    key={loc}
                    onClick={() => handleLocationChange(loc)}
                    className={`text-left text-xs p-1 rounded transition-colors ${state.location === loc ? "bg-green-900/30 text-green-400" : "hover:bg-zinc-800 text-zinc-500"}`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded flex-1">
              <div className="text-[10px] text-zinc-500 mb-2 uppercase font-bold">System Log</div>
              <div className="text-[11px] leading-relaxed text-green-600/80 h-full overflow-y-auto">
                {state.message}
              </div>
            </div>
          </div>

          {/* Center Panel: Battle Arena */}
          <div className="flex-1 flex flex-col gap-4 relative">
            {!state.enemy ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-zinc-800 rounded-lg">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2 crt-glow">IDLE STATE</h2>
                  <p className="text-zinc-500 text-sm">No threats detected in {state.location}</p>
                </div>
                <button 
                  onClick={handleStartGame}
                  className="calc-btn calc-btn-green px-8 py-3 font-bold text-lg"
                >
                  SCAN FOR ERRORS
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* Enemy Info */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-red-500 crt-glow uppercase">{state.enemy.name}</h3>
                    <div className="text-[10px] text-zinc-500 uppercase">{state.enemy.type} // {state.enemy.trait}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-red-400">
                      {state.enemy.hp} / {state.enemy.maxHp}
                    </div>
                    <div className="w-48 h-1 bg-zinc-900 rounded-full mt-1 overflow-hidden">
                      <motion.div 
                        className="h-full bg-red-600 shadow-[0_0_10px_rgba(255,0,0,0.5)]" 
                        animate={{ width: `${(state.enemy.hp / state.enemy.maxHp) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Visual Representation (Abstract) */}
                <div className="flex-1 flex items-center justify-center relative">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: state.isPlayerTurn ? 0 : [0, 2, -2, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="w-32 h-32 border-4 border-red-900/50 rounded-full flex items-center justify-center relative"
                  >
                    <div className="absolute inset-0 border-2 border-red-500/20 rounded-full animate-ping" />
                    <AlertTriangle size={48} className="text-red-500" />
                  </motion.div>
                </div>

                {/* Queue */}
                <div className="h-40 flex items-center gap-2 overflow-x-auto pb-4">
                  <AnimatePresence mode="popLayout">
                    {state.queue.map((log, idx) => (
                      <LogCard 
                        key={log.id} 
                        log={log} 
                        index={idx} 
                        onUse={(i, isShift) => dispatch({ type: "USE_LOG", index: i, isShift } as any)}
                        onDelete={(i) => dispatch({ type: "DELETE_LOG", index: i })}
                        onMove={(i, dir) => dispatch({ type: "MOVE_LOG", index: i, direction: dir })}
                        disabled={!state.isPlayerTurn || state.isGameOver}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Calculator Interface */}
          <div className="w-1/4 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button 
                disabled={state.encryptedButtons.includes("MALLOC") || !state.isPlayerTurn || state.isGameOver}
                onClick={() => dispatch({ type: "ADD_LOG", log: createLog(LogType.MALLOC) })}
                className={`calc-btn flex flex-col items-center gap-1 ${state.encryptedButtons.includes("MALLOC") ? "border-red-900 text-red-900" : ""}`}
              >
                <Database size={16} />
                <span className="text-[10px]">MALLOC</span>
              </button>
              <button 
                disabled={state.encryptedButtons.includes("FREE") || !state.isPlayerTurn || state.isGameOver}
                onClick={() => dispatch({ type: "ADD_LOG", log: createLog(LogType.FREE) })}
                className={`calc-btn flex flex-col items-center gap-1 ${state.encryptedButtons.includes("FREE") ? "border-red-900 text-red-900" : ""}`}
              >
                <Trash2 size={16} />
                <span className="text-[10px]">FREE</span>
              </button>
              <button 
                disabled={state.encryptedButtons.includes("DEL") || !state.isPlayerTurn || state.isGameOver}
                className={`calc-btn flex flex-col items-center gap-1 ${state.encryptedButtons.includes("DEL") ? "border-red-900 text-red-900" : ""}`}
              >
                <RefreshCw size={16} />
                <span className="text-[10px]">RELOAD</span>
              </button>
              <button 
                disabled={state.encryptedButtons.includes("EXIT") || !state.isPlayerTurn || state.isGameOver}
                onClick={() => dispatch({ type: "ADD_LOG", log: createLog(LogType.SYSCALL_EXIT) })}
                className={`calc-btn flex flex-col items-center gap-1 ${state.encryptedButtons.includes("EXIT") ? "border-red-900 text-red-900" : ""}`}
              >
                <LogOut size={16} />
                <span className="text-[10px]">EXIT</span>
              </button>
            </div>

            <div className="mt-4 bg-zinc-900/80 border-2 border-zinc-800 p-2 rounded-lg flex-1 flex flex-col gap-2">
              <div className="text-right font-mono text-xl text-green-400 bg-black p-2 rounded border border-green-900/30">
                {state.bytes.toString().padStart(8, '0')}
              </div>
              <div className="grid grid-cols-3 gap-1 flex-1">
                {[7,8,9,4,5,6,1,2,3,0].map(n => (
                  <button key={n} className="calc-btn text-sm">{n}</button>
                ))}
                <button className="calc-btn text-sm col-span-2 calc-btn-green" onClick={() => dispatch({ type: "END_TURN" })}>ENTER</button>
              </div>
            </div>

            {state.encryptedButtons.length > 0 && (
              <div className="mt-2 p-2 bg-red-900/20 border border-red-900 rounded text-[10px] text-red-400">
                <div className="font-bold flex items-center gap-1 mb-1">
                  <Lock size={10} /> ENCRYPTION DETECTED
                </div>
                {state.encryptedButtons.map(btn => (
                  <button 
                    key={btn}
                    onClick={() => state.bytes >= 10 && dispatch({ type: "DECRYPT_BUTTON", button: btn })}
                    className="w-full text-left p-1 hover:bg-red-900/40 rounded flex justify-between"
                  >
                    <span>{btn}</span>
                    <span>10B</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer / Status Bar */}
        <div className="mt-4 flex justify-between items-center text-[10px] text-green-900 font-bold uppercase tracking-widest">
          <div className="flex gap-4">
            <span>STATUS: {state.isGameOver ? (state.isVictory ? "VICTORY" : "CRITICAL") : "OPERATIONAL"}</span>
            <span>IRQ: {state.irqPriority}%</span>
          </div>
          <div className="flex gap-4">
            <span>TEMP: 42°C</span>
            <span>FAN: 2400RPM</span>
          </div>
        </div>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {showMemoryDump && (
            <MemoryDump 
              onSuccess={() => {
                setShowMemoryDump(false);
                dispatch({ type: "SET_MESSAGE", message: "PATCH APPLIED: +10% STABILITY RECOVERY." });
                dispatch({ type: "RESTART" }); // Reset for demo purposes or continue
              }}
              onFail={() => {
                setShowMemoryDump(false);
                dispatch({ type: "ADD_LOG", log: createLog(LogType.CORRUPTED_SECTOR) });
                dispatch({ type: "SET_MESSAGE", message: "DUMP FAILED: SECTOR CORRUPTED." });
              }}
            />
          )}
          {state.isGameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={`max-w-md w-full border-2 p-8 rounded-lg ${state.isVictory ? "border-green-500" : "border-red-500"}`}
              >
                <h2 className={`text-4xl font-bold mb-4 crt-glow ${state.isVictory ? "text-green-500" : "text-red-500"}`}>
                  {state.isVictory ? "SESSION SUCCESS" : "SESSION TERMINATED"}
                </h2>
                <p className="text-zinc-400 mb-8">{state.message}</p>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => dispatch({ type: "RESTART" })}
                    className={`calc-btn py-3 font-bold ${state.isVictory ? "calc-btn-green" : "calc-btn-red"}`}
                  >
                    REBOOT SYSTEM
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
