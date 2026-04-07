/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogType, LogAttribute, Log, FileSystemLocation, Enemy, Architecture } from "./types";

export const LOG_DATA: Record<LogType, Partial<Log>> = {
  [LogType.INFO]: { value: 5 },
  [LogType.ERROR]: { value: 15 },
  [LogType.FATAL]: { value: 40 },
  [LogType.MALLOC]: { value: 0 },
  [LogType.FREE]: { value: 10 },
  [LogType.SYSCALL_EXIT]: { value: 0 },
  [LogType.JUNK_DATA]: { value: 0 },
  [LogType.CORRUPTED_SECTOR]: { value: 0 },
};

export const ENEMIES: Enemy[] = [
  {
    id: "ddos",
    name: "DDoS Swarm",
    type: "Cluster",
    hp: 100,
    maxHp: 100,
    description: "10 small entities. Single ERRORs are weak.",
    trait: "Resistant to single-target attacks.",
  },
  {
    id: "ransomware",
    name: "Ransomware.Enc",
    type: "Encryptor",
    hp: 150,
    maxHp: 150,
    description: "Encrypts your buttons every turn.",
    trait: "Button Encryption.",
  },
  {
    id: "watchdog",
    name: "The Watchdog",
    type: "Timer",
    hp: 200,
    maxHp: 200,
    description: "Ends session after 10 turns.",
    trait: "10-Turn Limit.",
  },
  {
    id: "zombie",
    name: "Zombie Process",
    type: "Undead",
    hp: 120,
    maxHp: 120,
    description: "Revives after 2 turns if not finished correctly.",
    trait: "Revives once.",
  },
];

export const LOCATIONS: FileSystemLocation[] = [
  FileSystemLocation.HOME_USER,
  FileSystemLocation.DEV_NULL,
  FileSystemLocation.PROC,
  FileSystemLocation.SWAP,
];
