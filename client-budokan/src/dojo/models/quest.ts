/**
 * Quest TypeScript models for parsing quest data from Torii
 * Based on Cartridge arcade quest package structures
 */

import { getChecksumAddress, shortString } from "starknet";

// Model name constants
export const QUEST_DEFINITION = "QuestDefinition";
export const QUEST_COMPLETION = "QuestCompletion";
export const QUEST_ADVANCEMENT = "QuestAdvancement";
export const QUEST_CREATION = "QuestCreation";
export const QUEST_UNLOCKED = "QuestUnlocked";
export const QUEST_COMPLETED = "QuestCompleted";
export const QUEST_CLAIMED = "QuestClaimed";

// Helper to extract value from either wrapped or simplified format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractValue(field: any): string {
  if (field === null || field === undefined) return "0";
  if (typeof field === "string") return field;
  if (typeof field === "number") return field.toString();
  if (typeof field === "bigint") return field.toString();
  if (typeof field === "boolean") return field ? "1" : "0";
  if (typeof field === "object" && "value" in field) {
    return extractValue(field.value);
  }
  return "0";
}

// Helper to parse hex string to bigint safely
function parseHexToBigInt(value: string): bigint {
  if (!value || value === "0") return 0n;
  if (value.startsWith("0x")) {
    return BigInt(value);
  }
  // Try parsing as decimal first, then hex
  try {
    return BigInt(value);
  } catch {
    return BigInt(`0x${value}`);
  }
}

// Helper to parse hex string to number safely
function parseHexToNumber(value: string): number {
  if (!value || value === "0" || value === "0x0") return 0;
  if (value.startsWith("0x")) {
    return parseInt(value, 16);
  }
  // If it looks like a hex number (contains a-f), parse as hex
  if (/^[0-9a-fA-F]+$/.test(value) && /[a-fA-F]/.test(value)) {
    return parseInt(value, 16);
  }
  return parseInt(value, 10);
}

// Raw types from Torii

export interface RawReward {
  name: string;
  description: string;
  icon: string;
}

export interface RawTask {
  total: {
    type: "primitive";
    type_name: "u128";
    value: string;
    key: boolean;
  };
  id: {
    type: "primitive";
    type_name: "felt252";
    value: string;
    key: boolean;
  };
  description: {
    type: "bytearray";
    type_name: "ByteArray";
    value: string;
    key: boolean;
  };
}

export interface RawDefinition {
  id: {
    type: "primitive";
    type_name: "felt252";
    value: string;
    key: boolean;
  };
  interval: {
    type: "primitive";
    type_name: "u64";
    value: string;
    key: boolean;
  };
  conditions: {
    type: "array";
    type_name: "Array<felt252>";
    value: {
      type: "primitive";
      type_name: "felt252";
      value: string;
      key: boolean;
    }[];
    key: boolean;
  };
  end: {
    type: "primitive";
    type_name: "u64";
    value: string;
    key: boolean;
  };
  tasks: {
    type: "array";
    type_name: "Array<Task>";
    value: {
      type: "struct";
      type_name: "Task";
      value: RawTask;
      key: boolean;
    }[];
    key: boolean;
  };
  start: {
    type: "primitive";
    type_name: "u64";
    value: string;
    key: boolean;
  };
  rewarder: {
    type: "primitive";
    type_name: "ContractAddress";
    value: string;
    key: boolean;
  };
  duration: {
    type: "primitive";
    type_name: "u64";
    value: string;
    key: boolean;
  };
}

export interface RawCompletion {
  player_id: {
    type: "primitive";
    type_name: "felt252";
    value: string;
    key: boolean;
  };
  quest_id: {
    type: "primitive";
    type_name: "felt252";
    value: string;
    key: boolean;
  };
  interval_id: {
    type: "primitive";
    type_name: "u64";
    value: string;
    key: boolean;
  };
  timestamp: {
    type: "primitive";
    type_name: "u64";
    value: string;
    key: boolean;
  };
  unclaimed: {
    type: "primitive";
    type_name: "bool";
    value: boolean;
    key: boolean;
  };
  lock_count: {
    type: "primitive";
    type_name: "u32";
    value: string;
    key: boolean;
  };
}

export interface RawAdvancement {
  count: {
    type: "primitive";
    type_name: "u128";
    value: string;
    key: boolean;
  };
  timestamp: {
    type: "primitive";
    type_name: "u64";
    value: string;
    key: boolean;
  };
  quest_id: {
    type: "primitive";
    type_name: "felt252";
    value: string;
    key: boolean;
  };
  player_id: {
    type: "primitive";
    type_name: "felt252";
    value: string;
    key: boolean;
  };
  task_id: {
    type: "primitive";
    type_name: "felt252";
    value: string;
    key: boolean;
  };
  interval_id: {
    type: "primitive";
    type_name: "u64";
    value: string;
    key: boolean;
  };
}

export interface RawCreation {
  id: {
    type: "primitive";
    type_name: "felt252";
    value: string;
    key: boolean;
  };
  definition: {
    type: "struct";
    type_name: "QuestDefinition";
    value: RawDefinition;
    key: boolean;
  };
  metadata: {
    type: "struct";
    type_name: "QuestMetadata";
    value: string;
    key: boolean;
  };
}

export interface RawUnlocked {
  player_id: { type: "primitive"; type_name: "felt252"; value: string; key: boolean };
  quest_id: { type: "primitive"; type_name: "felt252"; value: string; key: boolean };
  interval_id: { type: "primitive"; type_name: "u64"; value: string; key: boolean };
  time: { type: "primitive"; type_name: "u64"; value: string; key: boolean };
}

export interface RawCompleted {
  player_id: { type: "primitive"; type_name: "felt252"; value: string; key: boolean };
  quest_id: { type: "primitive"; type_name: "felt252"; value: string; key: boolean };
  interval_id: { type: "primitive"; type_name: "u64"; value: string; key: boolean };
  time: { type: "primitive"; type_name: "u64"; value: string; key: boolean };
}

export interface RawClaimed {
  player_id: { type: "primitive"; type_name: "felt252"; value: string; key: boolean };
  quest_id: { type: "primitive"; type_name: "felt252"; value: string; key: boolean };
  interval_id: { type: "primitive"; type_name: "u64"; value: string; key: boolean };
  time: { type: "primitive"; type_name: "u64"; value: string; key: boolean };
}

// Parsed classes

export class QuestTask {
  id: string;
  description: string;
  total: bigint;

  constructor(id: string, description: string, total: bigint) {
    this.id = id;
    this.description = description;
    this.total = total;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static parse(data: RawTask | any): QuestTask {
    const idVal = extractValue(data.id);
    const descVal = extractValue(data.description);
    const totalVal = extractValue(data.total);
    
    return new QuestTask(
      shortString.decodeShortString(`0x${parseHexToBigInt(idVal).toString(16)}`),
      descVal,
      parseHexToBigInt(totalVal)
    );
  }
}

export class QuestReward {
  name: string;
  description: string;
  icon: string;

  constructor(name: string, description: string, icon: string) {
    this.name = name;
    this.description = description;
    this.icon = icon;
  }

  static parse(data: RawReward): QuestReward {
    return new QuestReward(data.name, data.description, data.icon);
  }
}

export class QuestMetadata {
  name: string;
  description: string;
  icon: string;
  registry: string;
  rewards: QuestReward[];

  constructor(
    name: string,
    description: string,
    icon: string,
    registry: string,
    rewards: QuestReward[]
  ) {
    this.name = name;
    this.description = description;
    this.icon = icon;
    this.registry = registry;
    this.rewards = rewards;
  }

  static parse(data: string): QuestMetadata {
    try {
      const object = JSON.parse(data);
      return new QuestMetadata(
        object.name,
        object.description,
        object.icon,
        getChecksumAddress(`0x${BigInt(object.registry).toString(16)}`),
        (object.rewards || []).map((r: RawReward) => QuestReward.parse(r))
      );
    } catch {
      return new QuestMetadata("", "", "", "", []);
    }
  }
}

export class QuestDefinition {
  id: string;
  rewarder: string;
  start: number;
  end: number;
  duration: number;
  interval: number;
  tasks: QuestTask[];
  conditions: string[];

  constructor(
    id: string,
    rewarder: string,
    start: number,
    end: number,
    duration: number,
    interval: number,
    tasks: QuestTask[],
    conditions: string[]
  ) {
    this.id = id;
    this.rewarder = rewarder;
    this.start = start;
    this.end = end;
    this.duration = duration;
    this.interval = interval;
    this.tasks = tasks;
    this.conditions = conditions;
  }

  static getModelName(): string {
    return QUEST_DEFINITION;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static parse(data: RawDefinition | any): QuestDefinition {
    const idVal = extractValue(data.id);
    const rewarderVal = extractValue(data.rewarder);
    const startVal = extractValue(data.start);
    const endVal = extractValue(data.end);
    const durationVal = extractValue(data.duration);
    const intervalVal = extractValue(data.interval);
    
    // Parse tasks - handle both wrapped array and direct array formats
    let tasks: QuestTask[] = [];
    if (data.tasks) {
      const tasksArray = data.tasks.value || data.tasks;
      if (Array.isArray(tasksArray)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tasks = tasksArray.map((task: any) => {
          const taskData = task.value || task;
          return QuestTask.parse(taskData);
        });
      }
    }
    
    // Parse conditions - handle both wrapped array and direct array formats
    let conditions: string[] = [];
    if (data.conditions) {
      const conditionsArray = data.conditions.value || data.conditions;
      if (Array.isArray(conditionsArray)) {
        conditions = conditionsArray.map((c: { value?: string } | string) => {
          const condVal = extractValue(c);
          return shortString.decodeShortString(`0x${parseHexToBigInt(condVal).toString(16)}`);
        });
      }
    }
    
    return new QuestDefinition(
      shortString.decodeShortString(`0x${parseHexToBigInt(idVal).toString(16)}`),
      getChecksumAddress(`0x${parseHexToBigInt(rewarderVal).toString(16)}`),
      parseHexToNumber(startVal),
      parseHexToNumber(endVal),
      parseHexToNumber(durationVal),
      parseHexToNumber(intervalVal),
      tasks,
      conditions
    );
  }

  static deduplicate(items: QuestDefinition[]): QuestDefinition[] {
    return items.filter(
      (item, index, self) => index === self.findIndex((t) => t.id === item.id)
    );
  }

  static now(): number {
    return Math.floor(Date.now() / 1000);
  }

  hasStarted(): boolean {
    const now = QuestDefinition.now();
    return this.start === 0 || (now >= this.start && this.start !== 0);
  }

  hasEnded(): boolean {
    const now = QuestDefinition.now();
    return now >= this.end && this.end !== 0;
  }

  isActive(): boolean {
    if (!this.hasStarted() || this.hasEnded()) return false;
    if (this.interval === 0) return true;
    const now = QuestDefinition.now();
    return (now - this.start) % this.interval < this.duration;
  }

  getIntervalId(): number | undefined {
    if (!this.isActive()) return undefined;
    if (this.interval === 0 || this.duration === 0) return 0;
    const now = QuestDefinition.now();
    return Math.floor((now - this.start) / this.interval);
  }

  getNextEnd(): number | undefined {
    if (!this.isActive()) return undefined;
    const intervalId = this.getIntervalId();
    if (intervalId === undefined) return undefined;
    return this.start + intervalId * this.interval + this.duration;
  }
}

export class QuestCompletion {
  player_id: string;
  quest_id: string;
  interval_id: number;
  timestamp: number;
  unclaimed: boolean;
  lock_count: number;

  constructor(
    player_id: string,
    quest_id: string,
    interval_id: number,
    timestamp: number,
    unclaimed: boolean,
    lock_count: number
  ) {
    this.player_id = player_id;
    this.quest_id = quest_id;
    this.interval_id = interval_id;
    this.timestamp = timestamp;
    this.unclaimed = unclaimed;
    this.lock_count = lock_count;
  }

  static getModelName(): string {
    return QUEST_COMPLETION;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static parse(data: RawCompletion | any): QuestCompletion {
    const playerIdVal = extractValue(data.player_id);
    const questIdVal = extractValue(data.quest_id);
    const intervalIdVal = extractValue(data.interval_id);
    const timestampVal = extractValue(data.timestamp);
    const lockCountVal = extractValue(data.lock_count);
    
    // Handle unclaimed which can be boolean directly or wrapped
    let unclaimed = false;
    if (typeof data.unclaimed === "boolean") {
      unclaimed = data.unclaimed;
    } else if (data.unclaimed && typeof data.unclaimed === "object" && "value" in data.unclaimed) {
      unclaimed = data.unclaimed.value;
    }
    
    // Debug log
    console.log("[QuestCompletion.parse] Raw data:", data);
    console.log("[QuestCompletion.parse] Extracted values:", {
      playerIdVal, questIdVal, intervalIdVal, timestampVal, unclaimed, lockCountVal
    });
    
    return new QuestCompletion(
      getChecksumAddress(`0x${parseHexToBigInt(playerIdVal).toString(16)}`),
      shortString.decodeShortString(`0x${parseHexToBigInt(questIdVal).toString(16)}`),
      parseHexToNumber(intervalIdVal),
      parseHexToNumber(timestampVal),
      unclaimed,
      parseHexToNumber(lockCountVal)
    );
  }

  static deduplicate(items: QuestCompletion[]): QuestCompletion[] {
    return items.filter(
      (item, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.player_id === item.player_id &&
            t.quest_id === item.quest_id &&
            t.interval_id === item.interval_id
        )
    );
  }
}

export class QuestAdvancement {
  player_id: string;
  quest_id: string;
  task_id: string;
  interval_id: number;
  timestamp: number;
  count: bigint;

  constructor(
    player_id: string,
    quest_id: string,
    task_id: string,
    interval_id: number,
    timestamp: number,
    count: bigint
  ) {
    this.player_id = player_id;
    this.quest_id = quest_id;
    this.task_id = task_id;
    this.interval_id = interval_id;
    this.timestamp = timestamp;
    this.count = count;
  }

  static getModelName(): string {
    return QUEST_ADVANCEMENT;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static parse(data: RawAdvancement | any): QuestAdvancement {
    const playerIdVal = extractValue(data.player_id);
    const questIdVal = extractValue(data.quest_id);
    const taskIdVal = extractValue(data.task_id);
    const intervalIdVal = extractValue(data.interval_id);
    const timestampVal = extractValue(data.timestamp);
    const countVal = extractValue(data.count);
    
    // Debug log
    console.log("[QuestAdvancement.parse] Raw data:", data);
    console.log("[QuestAdvancement.parse] Extracted values:", {
      playerIdVal, questIdVal, taskIdVal, intervalIdVal, timestampVal, countVal
    });
    
    return new QuestAdvancement(
      getChecksumAddress(`0x${parseHexToBigInt(playerIdVal).toString(16)}`),
      shortString.decodeShortString(`0x${parseHexToBigInt(questIdVal).toString(16)}`),
      shortString.decodeShortString(`0x${parseHexToBigInt(taskIdVal).toString(16)}`),
      parseHexToNumber(intervalIdVal),
      parseHexToNumber(timestampVal),
      parseHexToBigInt(countVal)
    );
  }

  static deduplicate(items: QuestAdvancement[]): QuestAdvancement[] {
    return items.filter(
      (item, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.player_id === item.player_id &&
            t.quest_id === item.quest_id &&
            t.task_id === item.task_id &&
            t.interval_id === item.interval_id
        )
    );
  }
}

export class QuestCreation {
  id: string;
  definition: QuestDefinition;
  metadata: QuestMetadata;

  constructor(id: string, definition: QuestDefinition, metadata: QuestMetadata) {
    this.id = id;
    this.definition = definition;
    this.metadata = metadata;
  }

  static getModelName(): string {
    return QUEST_CREATION;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static parse(data: RawCreation | any): QuestCreation {
    const idVal = extractValue(data.id);
    const definitionData = data.definition?.value || data.definition;
    const metadataVal = data.metadata?.value || data.metadata;
    
    return new QuestCreation(
      shortString.decodeShortString(`0x${parseHexToBigInt(idVal).toString(16)}`),
      QuestDefinition.parse(definitionData),
      QuestMetadata.parse(metadataVal)
    );
  }

  static deduplicate(items: QuestCreation[]): QuestCreation[] {
    return items.filter(
      (item, index, self) => index === self.findIndex((t) => t.id === item.id)
    );
  }
}

export class QuestUnlocked {
  player_id: string;
  quest_id: string;
  interval_id: number;
  time: number;

  constructor(player_id: string, quest_id: string, interval_id: number, time: number) {
    this.player_id = player_id;
    this.quest_id = quest_id;
    this.interval_id = interval_id;
    this.time = time;
  }

  static getModelName(): string {
    return QUEST_UNLOCKED;
  }

  static parse(data: RawUnlocked): QuestUnlocked {
    return new QuestUnlocked(
      getChecksumAddress(`0x${BigInt(data.player_id.value).toString(16)}`),
      shortString.decodeShortString(`0x${BigInt(data.quest_id.value).toString(16)}`),
      parseInt(data.interval_id.value, 16),
      parseInt(data.time.value, 16)
    );
  }
}

export class QuestCompleted {
  player_id: string;
  quest_id: string;
  interval_id: number;
  time: number;

  constructor(player_id: string, quest_id: string, interval_id: number, time: number) {
    this.player_id = player_id;
    this.quest_id = quest_id;
    this.interval_id = interval_id;
    this.time = time;
  }

  static getModelName(): string {
    return QUEST_COMPLETED;
  }

  static parse(data: RawCompleted): QuestCompleted {
    return new QuestCompleted(
      getChecksumAddress(`0x${BigInt(data.player_id.value).toString(16)}`),
      shortString.decodeShortString(`0x${BigInt(data.quest_id.value).toString(16)}`),
      parseInt(data.interval_id.value, 16),
      parseInt(data.time.value, 16)
    );
  }
}

export class QuestClaimed {
  player_id: string;
  quest_id: string;
  interval_id: number;
  time: number;

  constructor(player_id: string, quest_id: string, interval_id: number, time: number) {
    this.player_id = player_id;
    this.quest_id = quest_id;
    this.interval_id = interval_id;
    this.time = time;
  }

  static getModelName(): string {
    return QUEST_CLAIMED;
  }

  static parse(data: RawClaimed): QuestClaimed {
    return new QuestClaimed(
      getChecksumAddress(`0x${BigInt(data.player_id.value).toString(16)}`),
      shortString.decodeShortString(`0x${BigInt(data.quest_id.value).toString(16)}`),
      parseInt(data.interval_id.value, 16),
      parseInt(data.time.value, 16)
    );
  }
}
