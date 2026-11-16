/*
 * The wordmark's two runs: the short name, when the full name starts with
 * it, in the lead colour, then the rest. Any other name is set in one colour,
 * so renaming the group in site.json can never produce a broken wordmark.
 *
 *   splitName('TSR Research Group', 'TSR') -> { lead: 'TSR', rest: 'Research Group' }
 */
export function splitName(name, shortName) {
  if (shortName && name.startsWith(`${shortName} `)) {
    return { lead: shortName, rest: name.slice(shortName.length + 1) }
  }
  return { lead: null, rest: name }
}
