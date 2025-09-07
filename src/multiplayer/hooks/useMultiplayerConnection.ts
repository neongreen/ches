import { useState, useCallback } from 'react'
import { YjsMultiplayerGame } from '../yjs-game'

/**
 * Connection status types for multiplayer game states
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'waiting'

/**
 * Return type for the useMultiplayerConnection hook containing all state and actions
 */
export interface UseMultiplayerConnectionResult {
  // State
  multiplayerGame: YjsMultiplayerGame | null
  connectionStatus: ConnectionStatus
  gameId: string
  joinGameId: string
  error: string
  isHost: boolean

  // Actions
  setJoinGameId: (id: string) => void
  setError: (error: string) => void
  createGame: () => Promise<void>
  joinGame: () => Promise<void>
  disconnect: () => void
}

/**
 * Custom hook that manages all multiplayer connection state and actions.
 */
export function useMultiplayerConnection(): UseMultiplayerConnectionResult {
  const [multiplayerGame, setMultiplayerGame] = useState<YjsMultiplayerGame | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [gameId, setGameId] = useState<string>('')
  const [joinGameId, setJoinGameId] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isHost, setIsHost] = useState<boolean>(false)

  // Generate a random game ID for hosting
  const generateGameId = useCallback(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }, [])

  const createGame = useCallback(async () => {
    try {
      setError('')
      setConnectionStatus('connecting')
      const newGameId = generateGameId()
      setGameId(newGameId)
      setIsHost(true)

      const game = new YjsMultiplayerGame(newGameId, true)

      // Set up connection change callback
      game.onConnectionChangeCallback((connected: boolean, peers: number) => {
        if (peers > 0) {
          setConnectionStatus('connected')
        } else {
          setConnectionStatus('waiting')
        }
      })

      setMultiplayerGame(game)

      setConnectionStatus('waiting')
    } catch (err) {
      const errorMessage = `Failed to create game: ${String(err)}`
      setError(errorMessage)
      setConnectionStatus('disconnected')
    }
  }, [generateGameId])

  const joinGame = useCallback(async () => {
    if (!joinGameId.trim()) {
      setError('Please enter a game ID')
      return
    }

    try {
      setError('')
      setConnectionStatus('connecting')
      const gameIdToJoin = joinGameId.trim().toUpperCase()
      setGameId(gameIdToJoin)
      setIsHost(false)

      const game = new YjsMultiplayerGame(gameIdToJoin, false)

      // Set up connection change callback
      game.onConnectionChangeCallback((connected: boolean, peers: number) => {
        if (peers > 0) {
          setConnectionStatus('connected')
        } else {
          setConnectionStatus('waiting')
        }
      })

      setMultiplayerGame(game)

      setConnectionStatus('waiting')
    } catch (err) {
      const errorMessage = `Failed to join game: ${String(err)}`
      setError(errorMessage)
      setConnectionStatus('disconnected')
    }
  }, [joinGameId])

  const disconnect = useCallback(() => {
    if (multiplayerGame) {
      multiplayerGame.disconnect()
      setMultiplayerGame(null)
    }
    setConnectionStatus('disconnected')
    setGameId('')
    setJoinGameId('')
    setError('')
    setIsHost(false)
  }, [multiplayerGame])

  return {
    // State
    multiplayerGame,
    connectionStatus,
    gameId,
    joinGameId,
    error,
    isHost,

    // Actions
    setJoinGameId,
    setError,
    createGame,
    joinGame,
    disconnect,
  }
}
