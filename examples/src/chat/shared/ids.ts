export function createExampleId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}
