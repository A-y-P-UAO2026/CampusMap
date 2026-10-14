import { Stack } from '../../../structures/Stack.ts'

/** Historial de lugares consultados, independiente de rutas y del estado de React. */
export class LocationHistory {
  private readonly previous = new Stack<string>()
  private currentId: string | undefined

  visit(id: string): boolean {
    if (id === this.currentId) return false
    if (this.currentId !== undefined) this.previous.push(this.currentId)
    this.currentId = id
    return true
  }

  back(): string | undefined {
    const previousId = this.previous.pop()
    if (previousId !== undefined) this.currentId = previousId
    return previousId
  }

  canGoBack(): boolean {
    return !this.previous.isEmpty()
  }

  current(): string | undefined {
    return this.currentId
  }

  clear(): void {
    this.previous.clear()
    this.currentId = undefined
  }
}
