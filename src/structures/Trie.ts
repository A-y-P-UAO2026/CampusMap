import type { Trie as TrieContract } from '../types/structures'

interface TrieNode {
  children: Map<string, TrieNode>
  terminal: boolean
}

const createNode = (): TrieNode => ({ children: new Map(), terminal: false })

/** Canonical form shared by the Trie and the location-to-ID index. */
export function normalizeTrieText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ')
}

/** Prefix index with deterministic suggestions; no external search library. */
export class Trie implements TrieContract {
  private readonly root = createNode()

  insert(word: string): void {
    const normalized = normalizeTrieText(word)
    if (!normalized) return
    let node = this.root
    for (const character of normalized) {
      let child = node.children.get(character)
      if (!child) {
        child = createNode()
        node.children.set(character, child)
      }
      node = child
    }
    node.terminal = true
  }

  private nodeFor(value: string): TrieNode | undefined {
    let node: TrieNode | undefined = this.root
    for (const character of value) {
      node = node.children.get(character)
      if (!node) return undefined
    }
    return node
  }

  search(word: string): boolean {
    const normalized = normalizeTrieText(word)
    return normalized !== '' && (this.nodeFor(normalized)?.terminal ?? false)
  }

  startsWith(prefix: string): boolean {
    const normalized = normalizeTrieText(prefix)
    return normalized === '' ? this.root.children.size > 0 : this.nodeFor(normalized) !== undefined
  }

  suggestions(prefix: string, limit = 10): string[] {
    const normalized = normalizeTrieText(prefix)
    if (!normalized || !Number.isFinite(limit) || limit <= 0) return []
    const start = this.nodeFor(normalized)
    if (!start) return []
    const results: string[] = []
    const maximum = Math.floor(limit)

    const visit = (node: TrieNode, word: string): void => {
      if (results.length >= maximum) return
      if (node.terminal) results.push(word)
      for (const character of [...node.children.keys()].sort()) {
        if (results.length >= maximum) break
        visit(node.children.get(character)!, word + character)
      }
    }
    visit(start, normalized)
    return results
  }

  remove(word: string): boolean {
    const normalized = normalizeTrieText(word)
    if (!normalized) return false
    const trail: { parent: TrieNode; character: string }[] = []
    let node = this.root
    for (const character of normalized) {
      const child = node.children.get(character)
      if (!child) return false
      trail.push({ parent: node, character })
      node = child
    }
    if (!node.terminal) return false
    node.terminal = false

    for (let index = trail.length - 1; index >= 0; index -= 1) {
      const { parent, character } = trail[index]
      const child = parent.children.get(character)!
      if (child.terminal || child.children.size > 0) break
      parent.children.delete(character)
    }
    return true
  }
}
