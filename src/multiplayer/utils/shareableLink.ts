/**
 * Generates a shareable URL for joining a multiplayer game.
 */
export function getShareableLink(gameId: string): string {
  if (typeof window !== 'undefined' && gameId) {
    return `${window.location.origin}/multiplayer?join=${gameId}`
  }
  return ''
}
