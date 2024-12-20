export const toCamelCase = (str: string): string => {
  if (!str) return str
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
}
