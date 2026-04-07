/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum LogType {
  INFO = "INFO",
  ERROR = "ERROR",
  FATAL = "FATAL",
  MALLOC = "MALLOC",
  FREE = "FREE",
  SYSCALL_EXIT = "SYSCALL_EXIT",
  JUNK_DATA = "JUNK_DATA",
  CORRUPTED_SECTOR = "CORRUPTED_SECTOR",
}

export enum LogAttribute {
  VOLATILE = "VOLATILE",
  POINTER = "POINTER",
  STATIC = "STATIC",
}

export interface Log {
  id: string;
  type: LogType;
  attributes: LogAttribute[];
  turnsRemaining?: number; // For VOLATILE
  value: number;
}

export enum FileSystemLocation {
  DEV_NULL = "/dev/null",
  HOME_USER = "/home/user",
  PROC = "/proc",
  SWAP = "/swap",
}

export enum Architecture {
  X86 = "x86",
  X64 = "x64",
}

export interface Enemy {
  id: string;
  name: string;
  type: string;
  hp: number;
  maxHp: number;
  description: string;
  trait: string;
  reviveCount?: number;
}

export interface GameState {
  hp: number;
  maxHp: number;
  stability: number; // Mana/Energy equivalent
  maxStability: number;
  bytes: number; // Currency
  queue: Log[];
  maxQueueSize: number;
  location: FileSystemLocation;
  architecture: Architecture;
  turn: number;
  enemy: Enemy | null;
  isPlayerTurn: boolean;
  irqPriority: number; // 0-100
  isOverclocked: boolean;
  overclockTurns: number;
  encryptedButtons: string[]; // For Ransomware
  isGameOver: boolean;
  isVictory: boolean;
  message: string;
}
