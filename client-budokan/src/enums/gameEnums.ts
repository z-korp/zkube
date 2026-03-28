// États possibles de la machine
export enum GameState {
  WAITING,
  DRAGGING,
  GRAVITY,
  GRAVITY2,
  LINE_CLEAR,
  LINE_CLEAR2,
  ADD_LINE,
  UPDATE_AFTER_MOVE,
  CASCADE_COMPLETE,
}
