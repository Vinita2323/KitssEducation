// Search boxes accept literal text, never caller-controlled regular expressions.
export const escapeRegex = value => Array.from(value, c => '.+*?^$()[]{}|\\'.includes(c) ? '\\' + c : c).join('');
