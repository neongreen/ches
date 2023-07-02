/**
 * Merge several `Map`s, preserving order of insertion. If a key is present in
 * multiple maps, the value from the last map is used.
 */
export function mergeMapsRight<K, V>(maps: Map<K, V>[]): Map<K, V> {
  const result = new Map<K, V>()
  for (const map of maps) {
    for (const [key, value] of map) {
      result.set(key, value)
    }
  }
  return result
}

/**
 * Merge several `Map`s, preserving order of insertion. If a key is present in
 * multiple maps, we throw an error.
 */
export function mergeMapsEnsureDistinct<K, V>(maps: Map<K, V>[]): Map<K, V> {
  const result = new Map<K, V>()
  for (const map of maps) {
    for (const [key, value] of map) {
      if (result.has(key)) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`mergeMapsEnsureDistinct: duplicate key: ${key}`)
      }
      result.set(key, value)
    }
  }
  return result
}

/**
 * Apply a function to the values of a `Map`.
 */
export function mapValues<K, V1, V2>(map: Map<K, V1>, fn: (value: V1) => V2): Map<K, V2> {
  const result = new Map<K, V2>()
  for (const [key, value] of map) {
    result.set(key, fn(value))
  }
  return result
}
