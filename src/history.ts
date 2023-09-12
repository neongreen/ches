import { Board } from './board'
import { Identity } from './identity'
import { Move } from './move'

export type HistoryItem = {
  move: Move
  beforeMove: { board: Board; identity: Identity }
  afterMove: { board: Board; identity: Identity }
}
