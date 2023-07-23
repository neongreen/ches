/**
 * Find all connected nodes in a graph.
 */
export function allConnected<T>(options: {
  start: T
  neighbors: (x: T) => T[]
  equals: (a: T, b: T) => boolean
}): T[] {
  const { start, neighbors, equals } = options
  const visited: T[] = []
  const queue: T[] = [start]
  while (queue.length > 0) {
    const current = queue.shift()!
    if (!visited.some((x) => equals(x, current))) {
      visited.push(current)
      queue.push(...neighbors(current))
    }
  }
  return visited
}
