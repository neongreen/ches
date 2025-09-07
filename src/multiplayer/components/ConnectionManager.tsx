import React from 'react'
import {
  Button,
  Center,
  Group,
  Stack,
  Text,
  TextInput,
  Alert,
  Loader,
  ActionIcon,
  CopyButton,
  Tooltip,
} from '@mantine/core'
import { IconCopy, IconCheck } from '@tabler/icons-react'
import { ConnectionStatus } from '../hooks/useMultiplayerConnection'

/**
 * Props for the ConnectionManager component
 */
interface ConnectionManagerProps {
  // State
  connectionStatus: ConnectionStatus
  gameId: string
  joinGameId: string
  error: string
  isHost: boolean

  // Actions
  onCreateGame: () => Promise<void>
  onJoinGame: () => Promise<void>
  onDisconnect: () => void
  onJoinGameIdChange: (id: string) => void

  // Utils
  getShareableLink: () => string
}

/**
 * Manages the UI for creating, joining, and monitoring multiplayer game connections.
 */
export function ConnectionManager({
  connectionStatus,
  gameId,
  joinGameId,
  error,
  isHost,
  onCreateGame,
  onJoinGame,
  onDisconnect,
  onJoinGameIdChange,
  getShareableLink,
}: ConnectionManagerProps) {
  if (connectionStatus === 'disconnected') {
    return (
      <Stack>
        <Group grow>
          <Button onClick={onCreateGame} color="green">
            Create Game
          </Button>
          <Button onClick={onJoinGame} color="blue" disabled={!joinGameId.trim()}>
            Join Game
          </Button>
        </Group>

        <TextInput
          label="Game ID to Join"
          placeholder="Enter 6-character game ID"
          value={joinGameId}
          onChange={(e) => onJoinGameIdChange(e.target.value.toUpperCase())}
          maxLength={6}
          sx={{ maxWidth: 200 }}
        />

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}
      </Stack>
    )
  }

  if (connectionStatus === 'connecting') {
    return (
      <Center>
        <Group>
          <Loader size="sm" />
          <Text>Connecting...</Text>
        </Group>
      </Center>
    )
  }

  if (connectionStatus === 'waiting') {
    return (
      <Stack>
        <Center>
          <Group>
            <Loader size="sm" />
            <Text>{isHost ? 'Waiting for second player...' : 'Waiting for connection...'}</Text>
          </Group>
        </Center>

        {gameId && (
          <Group position="apart">
            <Text weight="bold">Game ID: {gameId}</Text>
            <Button size="xs" variant="light" onClick={onDisconnect}>
              Cancel
            </Button>
          </Group>
        )}

        {isHost && gameId && (
          <Alert color="blue" title="Share this link with your friend">
            <Group position="apart">
              <Text size="sm" sx={{ flex: 1, wordBreak: 'break-all' }}>
                {getShareableLink()}
              </Text>
              <CopyButton value={getShareableLink()}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy link'}>
                    <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Alert>
        )}
      </Stack>
    )
  }

  if (connectionStatus === 'connected') {
    return (
      <Stack>
        <Group position="apart">
          <Text weight="bold">
            Game ID: {gameId}
            {isHost && (
              <Text component="span" size="sm" color="dimmed" ml="xs">
                (Host)
              </Text>
            )}
          </Text>
          <Group>
            <CopyButton value={getShareableLink()}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy link'}>
                  <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
            <Button size="xs" variant="light" onClick={onDisconnect}>
              Disconnect
            </Button>
          </Group>
        </Group>

        <Alert color="green" title="Both players connected">
          Game is ready to play!
        </Alert>
      </Stack>
    )
  }

  return null
}
