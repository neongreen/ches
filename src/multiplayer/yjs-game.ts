import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { Board } from '@/board'
import { Move } from '@/move'
import { Piece, PieceEmpty } from '@/piece'
import { Coord } from '@/utils/coord'

/**
 * Board state that gets synchronized via Yjs
 */
export interface YjsBoardState {
  board: Uint8Array
  side: number
  kings: { white: { x: number; y: number }; black: { x: number; y: number } }
  castlingRights: number
  enPassantTargetSquare: { x: number; y: number } | null
  fullMoveNumber: number
  halfMoveNumber: number
  lastMove: any | null
}

/**
 * Multiplayer chess game using Yjs for conflict-free collaboration
 */
export class YjsMultiplayerGame {
  private ydoc: Y.Doc
  private provider: WebrtcProvider
  private gameState: Y.Map<any>
  private board: Board
  private roomName: string
  private isHost: boolean

  // Callbacks
  private onBoardStateChange: ((state: YjsBoardState) => void) | null = null
  private onMove: ((move: Move) => void) | null = null
  private onReset: (() => void) | null = null
  private onConnectionChange: ((connected: boolean, peers: number) => void) | null = null

  constructor(roomName: string, isHost: boolean) {
    this.roomName = roomName
    this.isHost = isHost
    this.board = new Board()

    // Create Yjs document and WebRTC provider
    this.ydoc = new Y.Doc()
    this.provider = new WebrtcProvider(roomName, this.ydoc, {
      signaling: ['wss://signaling.yjs.dev'],
    })
    this.gameState = this.ydoc.getMap('gameState')

    this.setupEventHandlers()

    if (isHost) {
      this.initializeBoard()
    }
  }

  /**
   * Sets up Yjs and WebRTC event handlers
   */
  private setupEventHandlers() {
    // Listen for changes to the game state
    this.gameState.observe((event) => {
      this.handleStateUpdate()
    })

    // Listen for provider connection changes
    this.provider.on('status', ({ connected }: { connected: boolean }) => {
      const peerCount = this.provider.awareness.getStates().size
      this.onConnectionChange?.(connected, peerCount)
    })

    this.provider.on(
      'peers',
      (event: { added: string[]; removed: string[]; webrtcPeers: string[] }) => {
        const peerCount = event.webrtcPeers.length
        this.onConnectionChange?.(peerCount > 0, peerCount)
      }
    )

    // Listen for moves
    this.ydoc.getArray('moves').observe((event) => {
      event.changes.added.forEach((item) => {
        const moveData = item.content.getContent()[0]
        if (moveData) {
          const move = this.reconstructMove(moveData)
          this.onMove?.(move)
        }
      })
    })
  }

  /**
   * Initializes the board state (host only)
   */
  private initializeBoard() {
    if (!this.isHost) return

    // Set up starting position
    this.board = new Board() // Reset by creating new board

    const boardState: YjsBoardState = {
      board: this.board.board,
      side: 0, // White to move
      kings: {
        white: { x: 4, y: 0 },
        black: { x: 4, y: 7 },
      },
      castlingRights: 15, // All castling rights
      enPassantTargetSquare: null,
      fullMoveNumber: 1,
      halfMoveNumber: 0,
      lastMove: null,
    }

    this.gameState.set('boardState', boardState)
  }

  /**
   * Handles updates to the shared game state
   */
  private handleStateUpdate() {
    const boardState = this.gameState.get('boardState') as YjsBoardState
    if (boardState) {
      // Update local board
      this.board.board = new Uint8Array(boardState.board)
      this.onBoardStateChange?.(boardState)
    }
  }

  /**
   * Reconstructs a Move object from plain data, ensuring Coord objects have proper methods
   */
  private reconstructMove(rawMove: any): Move {
    switch (rawMove.kind) {
      case 'normal':
        return {
          kind: 'normal',
          from: new Coord(rawMove.from.x, rawMove.from.y),
          to: new Coord(rawMove.to.x, rawMove.to.y),
          promotion: rawMove.promotion,
          capture: rawMove.capture,
        }
      case 'castling':
        return {
          kind: 'castling',
          kingFrom: new Coord(rawMove.kingFrom.x, rawMove.kingFrom.y),
          kingTo: new Coord(rawMove.kingTo.x, rawMove.kingTo.y),
          rookFrom: new Coord(rawMove.rookFrom.x, rawMove.rookFrom.y),
          rookTo: new Coord(rawMove.rookTo.x, rawMove.rookTo.y),
        }
      case 'enPassant':
        return {
          kind: 'enPassant',
          from: new Coord(rawMove.from.x, rawMove.from.y),
          to: new Coord(rawMove.to.x, rawMove.to.y),
          capture: rawMove.capture,
          captureCoord: new Coord(rawMove.captureCoord.x, rawMove.captureCoord.y),
        }
      default:
        throw new Error(`Unknown move kind: ${rawMove.kind}`)
    }
  }

  /**
   * Makes a move and synchronizes it across all clients
   */
  makeMove(move: Move) {
    // Add move to shared moves array
    const movesArray = this.ydoc.getArray('moves')
    movesArray.push([move])

    // Update board state if host
    if (this.isHost) {
      this.updateBoardState(move)
    }
  }

  /**
   * Updates the shared board state (host only)
   */
  private updateBoardState(move: Move) {
    if (!this.isHost) return

    const currentState = this.gameState.get('boardState') as YjsBoardState
    if (!currentState) return

    // Apply the move to the board
    const newBoard = new Uint8Array(currentState.board)

    switch (move.kind) {
      case 'normal': {
        const piece = newBoard[move.from.y * 8 + move.from.x]
        newBoard[move.to.y * 8 + move.to.x] = move.promotion || piece
        newBoard[move.from.y * 8 + move.from.x] = PieceEmpty
        break
      }
      case 'castling': {
        // Move king
        const king = newBoard[move.kingFrom.y * 8 + move.kingFrom.x]
        newBoard[move.kingTo.y * 8 + move.kingTo.x] = king
        newBoard[move.kingFrom.y * 8 + move.kingFrom.x] = PieceEmpty

        // Move rook
        const rook = newBoard[move.rookFrom.y * 8 + move.rookFrom.x]
        newBoard[move.rookTo.y * 8 + move.rookTo.x] = rook
        newBoard[move.rookFrom.y * 8 + move.rookFrom.x] = PieceEmpty
        break
      }
      case 'enPassant': {
        // Move pawn
        const piece = newBoard[move.from.y * 8 + move.from.x]
        newBoard[move.to.y * 8 + move.to.x] = piece
        newBoard[move.from.y * 8 + move.from.x] = PieceEmpty

        // Remove captured pawn
        newBoard[move.captureCoord.y * 8 + move.captureCoord.x] = PieceEmpty
        break
      }
    }

    // Update the shared state
    const newState: YjsBoardState = {
      ...currentState,
      board: newBoard,
      side: currentState.side === 0 ? 1 : 0, // Toggle side
      fullMoveNumber:
        currentState.side === 1 ? currentState.fullMoveNumber + 1 : currentState.fullMoveNumber,
      halfMoveNumber: currentState.halfMoveNumber + 1,
      lastMove: move,
    }

    this.gameState.set('boardState', newState)
  }

  /**
   * Resets the board to starting position
   */
  resetBoard() {
    if (this.isHost) {
      this.ydoc.getArray('moves').delete(0, this.ydoc.getArray('moves').length)
      this.initializeBoard()
      this.onReset?.()
    }
  }

  /**
   * Gets the current board state
   */
  getBoardState(): YjsBoardState | null {
    return (this.gameState.get('boardState') as YjsBoardState) || null
  }

  /**
   * Sets callback for board state changes
   */
  onBoardStateChangeCallback(callback: (state: YjsBoardState) => void) {
    this.onBoardStateChange = callback
  }

  /**
   * Sets callback for move events
   */
  onMoveCallback(callback: (move: Move) => void) {
    this.onMove = callback
  }

  /**
   * Sets callback for reset events
   */
  onResetCallback(callback: () => void) {
    this.onReset = callback
  }

  /**
   * Sets callback for connection status changes
   */
  onConnectionChangeCallback(callback: (connected: boolean, peers: number) => void) {
    this.onConnectionChange = callback
  }

  /**
   * Disconnects from the multiplayer session
   */
  disconnect() {
    this.provider.disconnect()
    this.provider.destroy()
    this.ydoc.destroy()
  }
}
