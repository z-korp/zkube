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

function parseHexToBigInt(value: string): bigint {
  if (!value || value === "0" || value === "0x0") return 0n;
  return BigInt(value);
}

export class StartGame {
  player: string;
  timestamp: number;
  game_id: bigint;

  constructor(player: string, timestamp: number, game_id: bigint) {
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
      parseHexToBigInt(extractValue(data.game_id)),
    );
  }
}

export class LevelStarted {
  game_id: bigint;
  player: string;
  level: number;
  points_required: number;
  max_moves: number;
  constraint_type: number;
  constraint_value: number;
  constraint_required: number;

  constructor(
    game_id: bigint,
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
      parseHexToBigInt(extractValue(data.game_id)),
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
  game_id: bigint;
  player: string;
  level: number;
  moves_used: number;
  score: number;
  total_score: number;

  constructor(
    game_id: bigint,
    player: string,
    level: number,
    moves_used: number,
    score: number,
    total_score: number,
  ) {
    this.game_id = game_id;
    this.player = player;
    this.level = level;
    this.moves_used = moves_used;
    this.score = score;
    this.total_score = total_score;
  }

  static getModelName(): string {
    return "LevelCompleted";
  }

  static parse(data: any): LevelCompleted {
    return new LevelCompleted(
      parseHexToBigInt(extractValue(data.game_id)),
      extractValue(data.player),
      parseHexToNumber(extractValue(data.level)),
      parseHexToNumber(extractValue(data.moves_used)),
      parseHexToNumber(extractValue(data.score)),
      parseHexToNumber(extractValue(data.total_score)),
    );
  }
}

export class RunEnded {
  game_id: bigint;
  player: string;
  final_level: number;
  final_score: number;
  current_difficulty: number;
  started_at: number;
  ended_at: number;

  constructor(
    game_id: bigint,
    player: string,
    final_level: number,
    final_score: number,
    current_difficulty: number,
    started_at: number,
    ended_at: number,
  ) {
    this.game_id = game_id;
    this.player = player;
    this.final_level = final_level;
    this.final_score = final_score;
    this.current_difficulty = current_difficulty;
    this.started_at = started_at;
    this.ended_at = ended_at;
  }

  static getModelName(): string {
    return "RunEnded";
  }

  static parse(data: any): RunEnded {
    return new RunEnded(
      parseHexToBigInt(extractValue(data.game_id)),
      extractValue(data.player),
      parseHexToNumber(extractValue(data.final_level)),
      parseHexToNumber(extractValue(data.final_score)),
      parseHexToNumber(extractValue(data.current_difficulty)),
      parseHexToNumber(extractValue(data.started_at)),
      parseHexToNumber(extractValue(data.ended_at)),
    );
  }
}

export class ZoneClearBonus {
  player: string;
  settings_id: number;
  amount: bigint;

  constructor(player: string, settings_id: number, amount: bigint) {
    this.player = player;
    this.settings_id = settings_id;
    this.amount = amount;
  }

  static getModelName(): string {
    return "ZoneClearBonus";
  }

  static parse(data: any): ZoneClearBonus {
    return new ZoneClearBonus(
      extractValue(data.player),
      parseHexToNumber(extractValue(data.settings_id)),
      parseHexToBigInt(extractValue(data.amount)),
    );
  }
}

export class ConstraintProgress {
  game_id: bigint;
  constraint_type: number;
  current: number;
  required: number;

  constructor(game_id: bigint, constraint_type: number, current: number, required: number) {
    this.game_id = game_id;
    this.constraint_type = constraint_type;
    this.current = current;
    this.required = required;
  }

  static getModelName(): string {
    return "ConstraintProgress";
  }

  static parse(data: any): ConstraintProgress {
    return new ConstraintProgress(
      parseHexToBigInt(extractValue(data.game_id)),
      parseHexToNumber(extractValue(data.constraint_type)),
      parseHexToNumber(extractValue(data.current)),
      parseHexToNumber(extractValue(data.required)),
    );
  }
}
