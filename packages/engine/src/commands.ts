export type EngineCommand =
  | Readonly<{ type: 'StartNewGame' }>
  | Readonly<{ type: 'Pause' }>
  | Readonly<{ type: 'Resume' }>
  | Readonly<{ type: 'RestartLevel' }>;
