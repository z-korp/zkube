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

function parseHexToNumber(value: string): number {
  if (!value || value === "0" || value === "0x0") return 0;
  if (value.startsWith("0x")) {
    return parseInt(value, 16);
  }
  if (/^[0-9a-fA-F]+$/.test(value) && /[a-fA-F]/.test(value)) {
    return parseInt(value, 16);
  }
  return parseInt(value, 10);
}

export class StartGame {
  player: string;
  timestamp: number;
  game_id: number;

  constructor(player: string, timestamp: number, game_id: number) {
    this.player = player;
    this.timestamp = timestamp;
    this.game_id = game_id;
  }

  static getModelName(): string {
    return "StartGame";
  }

  static parse(data: any): StartGame {
    return new StartGame(
      extractValue(data.player),
      parseHexToNumber(extractValue(data.timestamp)),
      parseHexToNumber(extractValue(data.game_id)),
    );
  }
}

export class UseBonus {
  player: string;
  timestamp: number;
  game_id: number;
  bonus: number;

  constructor(player: string, timestamp: number, game_id: number, bonus: number) {
    this.player = player;
    this.timestamp = timestamp;
    this.game_id = game_id;
    this.bonus = bonus;
  }

  static getModelName(): string {
    return "UseBonus";
  }

  static parse(data: any): UseBonus {
    return new UseBonus(
      extractValue(data.player),
      parseHexToNumber(extractValue(data.timestamp)),
      parseHexToNumber(extractValue(data.game_id)),
      parseHexToNumber(extractValue(data.bonus)),
    );
  }
}

export class LevelStarted {
  game_id: number;
  player: string;
  level: number;
  points_required: number;
  max_moves: number;
  constraint_type: number;
  constraint_value: number;
  constraint_required: number;

  constructor(
    game_id: number,
    player: string,
    level: number,
    points_required: number,
    max_moves: number,
    constraint_type: number,
    constraint_value: number,
    constraint_required: number,
  ) {
    this.game_id = game_id;
    this.player = player;
    this.level = level;
    this.points_required = points_required;
    this.max_moves = max_moves;
    this.constraint_type = constraint_type;
    this.constraint_value = constraint_value;
    this.constraint_required = constraint_required;
  }

  static getModelName(): string {
    return "LevelStarted";
  }

  static parse(data: any): LevelStarted {
    return new LevelStarted(
      parseHexToNumber(extractValue(data.game_id)),
      extractValue(data.player),
      parseHexToNumber(extractValue(data.level)),
      parseHexToNumber(extractValue(data.points_required)),
      parseHexToNumber(extractValue(data.max_moves)),
      parseHexToNumber(extractValue(data.constraint_type)),
      parseHexToNumber(extractValue(data.constraint_value)),
      parseHexToNumber(extractValue(data.constraint_required)),
    );
  }
}

export class LevelCompleted {
  game_id: number;
  player: string;
  level: number;
  cubes: number;
  moves_used: number;
  score: number;
  total_score: number;
  bonuses_earned: number;

  constructor(
    game_id: number,
    player: string,
    level: number,
    cubes: number,
    moves_used: number,
    score: number,
    total_score: number,
    bonuses_earned: number,
  ) {
    this.game_id = game_id;
    this.player = player;
    this.level = level;
    this.cubes = cubes;
    this.moves_used = moves_used;
    this.score = score;
    this.total_score = total_score;
    this.bonuses_earned = bonuses_earned;
  }

  static getModelName(): string {
    return "LevelCompleted";
  }

  static parse(data: any): LevelCompleted {
    return new LevelCompleted(
      parseHexToNumber(extractValue(data.game_id)),
      extractValue(data.player),
      parseHexToNumber(extractValue(data.level)),
      parseHexToNumber(extractValue(data.cubes)),
      parseHexToNumber(extractValue(data.moves_used)),
      parseHexToNumber(extractValue(data.score)),
      parseHexToNumber(extractValue(data.total_score)),
      parseHexToNumber(extractValue(data.bonuses_earned)),
    );
  }
}

export class RunEnded {
  game_id: number;
  player: string;
  final_level: number;
  final_score: number;
  total_cubes: number;
  started_at: number;
  ended_at: number;

  constructor(
    game_id: number,
    player: string,
    final_level: number,
    final_score: number,
    total_cubes: number,
    started_at: number,
    ended_at: number,
  ) {
    this.game_id = game_id;
    this.player = player;
    this.final_level = final_level;
    this.final_score = final_score;
    this.total_cubes = total_cubes;
    this.started_at = started_at;
    this.ended_at = ended_at;
  }

  static getModelName(): string {
    return "RunEnded";
  }

  static parse(data: any): RunEnded {
    return new RunEnded(
      parseHexToNumber(extractValue(data.game_id)),
      extractValue(data.player),
      parseHexToNumber(extractValue(data.final_level)),
      parseHexToNumber(extractValue(data.final_score)),
      parseHexToNumber(extractValue(data.total_cubes)),
      parseHexToNumber(extractValue(data.started_at)),
      parseHexToNumber(extractValue(data.ended_at)),
    );
  }
}

export class RunCompleted {
  game_id: number;
  player: string;
  final_score: number;
  total_cubes: number;
  started_at: number;
  completed_at: number;

  constructor(
    game_id: number,
    player: string,
    final_score: number,
    total_cubes: number,
    started_at: number,
    completed_at: number,
  ) {
    this.game_id = game_id;
    this.player = player;
    this.final_score = final_score;
    this.total_cubes = total_cubes;
    this.started_at = started_at;
    this.completed_at = completed_at;
  }

  static getModelName(): string {
    return "RunCompleted";
  }

  static parse(data: any): RunCompleted {
    return new RunCompleted(
      parseHexToNumber(extractValue(data.game_id)),
      extractValue(data.player),
      parseHexToNumber(extractValue(data.final_score)),
      parseHexToNumber(extractValue(data.total_cubes)),
      parseHexToNumber(extractValue(data.started_at)),
      parseHexToNumber(extractValue(data.completed_at)),
    );
  }
}

export class ConsumablePurchased {
  game_id: number;
  player: string;
  consumable: number;
  cost: number;
  cubes_remaining: number;

  constructor(
    game_id: number,
    player: string,
    consumable: number,
    cost: number,
    cubes_remaining: number,
  ) {
    this.game_id = game_id;
    this.player = player;
    this.consumable = consumable;
    this.cost = cost;
    this.cubes_remaining = cubes_remaining;
  }

  static getModelName(): string {
    return "ConsumablePurchased";
  }

  static parse(data: any): ConsumablePurchased {
    return new ConsumablePurchased(
      parseHexToNumber(extractValue(data.game_id)),
      extractValue(data.player),
      parseHexToNumber(extractValue(data.consumable)),
      parseHexToNumber(extractValue(data.cost)),
      parseHexToNumber(extractValue(data.cubes_remaining)),
    );
  }
}

export class BonusLevelUp {
  game_id: number;
  player: string;
  bonus_slot: number;
  bonus_type: number;
  new_level: number;

  constructor(
    game_id: number,
    player: string,
    bonus_slot: number,
    bonus_type: number,
    new_level: number,
  ) {
    this.game_id = game_id;
    this.player = player;
    this.bonus_slot = bonus_slot;
    this.bonus_type = bonus_type;
    this.new_level = new_level;
  }

  static getModelName(): string {
    return "BonusLevelUp";
  }

  static parse(data: any): BonusLevelUp {
    return new BonusLevelUp(
      parseHexToNumber(extractValue(data.game_id)),
      extractValue(data.player),
      parseHexToNumber(extractValue(data.bonus_slot)),
      parseHexToNumber(extractValue(data.bonus_type)),
      parseHexToNumber(extractValue(data.new_level)),
    );
  }
}
