export type PyValue =
  | { kind: 'int'; value: number }
  | { kind: 'float'; value: number }
  | { kind: 'complex'; re: number; im: number }
  | { kind: 'str'; value: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'none' }
  | { kind: 'list'; items: PyValue[] }
  | { kind: 'tuple'; items: PyValue[] }
  | { kind: 'set'; items: PyValue[] }
  | { kind: 'dict'; entries: Array<{ key: PyValue; value: PyValue }> };

export interface VariableSnapshot {
  name: string;
  typeName: string;
  repr: string;
}

export interface PythonRunResult {
  output: string[];
  error: string | null;
  variables: VariableSnapshot[];
}

class PyRuntimeError extends Error {
  errorType: string;
  line?: number;
  constructor(errorType: string, message: string, line?: number) {
    super(message);
    this.errorType = errorType;
    this.line = line;
  }
}

class LoopControl {
  type: 'break' | 'continue';
  constructor(type: 'break' | 'continue') {
    this.type = type;
  }
}

type TokenType =
  | 'NUMBER'
  | 'IMAG'
  | 'STRING'
  | 'FSTRING'
  | 'IDENT'
  | 'OP'
  | 'PUNCT';

interface Token {
  type: TokenType;
  value: string;
}

const KEYWORDS = new Set([
  'True',
  'False',
  'None',
  'and',
  'or',
  'not',
  'in',
  'is',
  'if',
  'elif',
  'else',
  'for',
  'while',
  'break',
  'continue',
  'pass',
]);

export function pyTypeName(val: PyValue): string {
  switch (val.kind) {
    case 'int':
      return 'int';
    case 'float':
      return 'float';
    case 'complex':
      return 'complex';
    case 'str':
      return 'str';
    case 'bool':
      return 'bool';
    case 'none':
      return 'NoneType';
    case 'list':
      return 'list';
    case 'tuple':
      return 'tuple';
    case 'set':
      return 'set';
    case 'dict':
      return 'dict';
  }
}

export function pyRepr(val: PyValue): string {
  switch (val.kind) {
    case 'int':
      return String(val.value);
    case 'float': {
      const s = String(val.value);
      return s.includes('.') || s.includes('e') ? s : `${s}.0`;
    }
    case 'complex': {
      if (val.re === 0) return `${val.im}j`;
      const sign = val.im >= 0 ? '+' : '-';
      return `(${val.re}${sign}${Math.abs(val.im)}j)`;
    }
    case 'str':
      return `'${val.value.replace(/'/g, "\\'")}'`;
    case 'bool':
      return val.value ? 'True' : 'False';
    case 'none':
      return 'None';
    case 'list':
      return `[${val.items.map(pyRepr).join(', ')}]`;
    case 'tuple':
      return val.items.length === 1
        ? `(${pyRepr(val.items[0])},)`
        : `(${val.items.map(pyRepr).join(', ')})`;
    case 'set':
      return val.items.length === 0
        ? 'set()'
        : `{${val.items.map(pyRepr).join(', ')}}`;
    case 'dict':
      return `{${val.entries
        .map((e) => `${pyRepr(e.key)}: ${pyRepr(e.value)}`)
        .join(', ')}}`;
  }
}

export function pyStr(val: PyValue): string {
  if (val.kind === 'str') return val.value;
  return pyRepr(val);
}

function pyTruthy(val: PyValue): boolean {
  switch (val.kind) {
    case 'bool':
      return val.value;
    case 'none':
      return false;
    case 'int':
    case 'float':
      return val.value !== 0;
    case 'complex':
      return val.re !== 0 || val.im !== 0;
    case 'str':
      return val.value.length > 0;
    case 'list':
    case 'tuple':
    case 'set':
      return val.items.length > 0;
    case 'dict':
      return val.entries.length > 0;
  }
}

function pyEquals(a: PyValue, b: PyValue): boolean {
  if (a.kind === 'bool' && (b.kind === 'int' || b.kind === 'float')) {
    return (a.value ? 1 : 0) === b.value;
  }
  if (b.kind === 'bool' && (a.kind === 'int' || a.kind === 'float')) {
    return a.value === (b.value ? 1 : 0);
  }
  if ((a.kind === 'int' || a.kind === 'float') && (b.kind === 'int' || b.kind === 'float')) {
    return a.value === b.value;
  }
  if (a.kind === 'complex' && b.kind === 'complex') {
    return a.re === b.re && a.im === b.im;
  }
  if (a.kind === 'complex' && (b.kind === 'int' || b.kind === 'float')) {
    return a.re === b.value && a.im === 0;
  }
  if (b.kind === 'complex' && (a.kind === 'int' || a.kind === 'float')) {
    return b.re === a.value && b.im === 0;
  }
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'none':
      return true;
    case 'str':
      return a.value === (b as { kind: 'str'; value: string }).value;
    case 'bool':
      return a.value === (b as { kind: 'bool'; value: boolean }).value;
    case 'list':
    case 'tuple': {
      const bi = (b as { items: PyValue[] }).items;
      if (a.items.length !== bi.length) return false;
      return a.items.every((item, idx) => pyEquals(item, bi[idx]));
    }
    case 'set': {
      const bi = (b as { items: PyValue[] }).items;
      if (a.items.length !== bi.length) return false;
      return a.items.every((item) => bi.some((other) => pyEquals(item, other)));
    }
    case 'dict': {
      const be = (b as { entries: Array<{ key: PyValue; value: PyValue }> }).entries;
      if (a.entries.length !== be.length) return false;
      return a.entries.every((e) => {
        const match = be.find((other) => pyEquals(other.key, e.key));
        return match ? pyEquals(e.value, match.value) : false;
      });
    }
  }
  return false;
}

function tokenizeExpression(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '#') {
      break;
    }

    // f-string
    if ((ch === 'f' || ch === 'F') && (expr[i + 1] === "'" || expr[i + 1] === '"')) {
      const quote = expr[i + 1];
      i += 2;
      let str = '';
      while (i < expr.length && expr[i] !== quote) {
        if (expr[i] === '\\' && i + 1 < expr.length) {
          const next = expr[i + 1];
          str += next === 'n' ? '\n' : next === 't' ? '\t' : next;
          i += 2;
        } else {
          str += expr[i++];
        }
      }
      if (expr[i] !== quote) throw new PyRuntimeError('SyntaxError', 'unterminated f-string literal');
      i++;
      tokens.push({ type: 'FSTRING', value: str });
      continue;
    }

    // String literal
    if (ch === "'" || ch === '"') {
      const quote = ch;
      i++;
      let str = '';
      while (i < expr.length && expr[i] !== quote) {
        if (expr[i] === '\\' && i + 1 < expr.length) {
          const next = expr[i + 1];
          str += next === 'n' ? '\n' : next === 't' ? '\t' : next;
          i += 2;
        } else {
          str += expr[i++];
        }
      }
      if (expr[i] !== quote) throw new PyRuntimeError('SyntaxError', 'unterminated string literal');
      i++;
      tokens.push({ type: 'STRING', value: str });
      continue;
    }

    // Number (int, float, imaginary)
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(expr[i + 1] ?? ''))) {
      let numStr = '';
      let seenDot = false;
      while (i < expr.length && (/[0-9_]/.test(expr[i]) || (!seenDot && expr[i] === '.'))) {
        if (expr[i] === '.') seenDot = true;
        if (expr[i] !== '_') numStr += expr[i];
        i++;
      }
      if (expr[i] === 'j' || expr[i] === 'J') {
        i++;
        tokens.push({ type: 'IMAG', value: numStr });
      } else {
        tokens.push({ type: 'NUMBER', value: numStr });
      }
      continue;
    }

    // Identifier / keyword
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        ident += expr[i++];
      }
      if (ident === 'not' && expr.slice(i).match(/^\s+in\b/)) {
        const m = expr.slice(i).match(/^\s+in\b/)!;
        i += m[0].length;
        tokens.push({ type: 'OP', value: 'not in' });
        continue;
      }
      if (ident === 'is' && expr.slice(i).match(/^\s+not\b/)) {
        const m = expr.slice(i).match(/^\s+not\b/)!;
        i += m[0].length;
        tokens.push({ type: 'OP', value: 'is not' });
        continue;
      }
      if (KEYWORDS.has(ident) && (ident === 'and' || ident === 'or' || ident === 'not' || ident === 'in' || ident === 'is')) {
        tokens.push({ type: 'OP', value: ident });
      } else {
        tokens.push({ type: 'IDENT', value: ident });
      }
      continue;
    }

    // Multi-char operators
    const two = expr.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '//', '**'].includes(two)) {
      tokens.push({ type: 'OP', value: two });
      i += 2;
      continue;
    }

    if ('+-*/%<>'.includes(ch)) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    if ('()[]{},:='.includes(ch)) {
      tokens.push({ type: 'PUNCT', value: ch });
      i++;
      continue;
    }

    if (ch === '.') {
      tokens.push({ type: 'PUNCT', value: '.' });
      i++;
      continue;
    }

    throw new PyRuntimeError('SyntaxError', `invalid character '${ch}'`);
  }

  return tokens;
}

class ExprParser {
  tokens: Token[];
  pos = 0;
  env: Map<string, PyValue>;
  output: string[];

  constructor(tokens: Token[], env: Map<string, PyValue>, output: string[]) {
    this.tokens = tokens;
    this.env = env;
    this.output = output;
  }

  peek(offset = 0): Token | undefined {
    return this.tokens[this.pos + offset];
  }

  consume(): Token {
    return this.tokens[this.pos++];
  }

  match(type: TokenType, value?: string): boolean {
    const t = this.peek();
    if (!t || t.type !== type) return false;
    if (value !== undefined && t.value !== value) return false;
    this.pos++;
    return true;
  }

  expect(type: TokenType, value?: string): Token {
    const t = this.peek();
    if (!t || t.type !== type || (value !== undefined && t.value !== value)) {
      throw new PyRuntimeError('SyntaxError', `expected '${value ?? type}'`);
    }
    this.pos++;
    return t;
  }

  parseExpression(): PyValue {
    return this.parseTernary();
  }

  parseTernary(): PyValue {
    const val = this.parseOr();
    if (this.peek()?.type === 'IDENT' && this.peek()?.value === 'if') {
      this.consume();
      const cond = this.parseOr();
      this.expect('IDENT', 'else');
      const alt = this.parseTernary();
      return pyTruthy(cond) ? val : alt;
    }
    return val;
  }

  parseOr(): PyValue {
    let left = this.parseAnd();
    while (this.match('OP', 'or')) {
      const right = this.parseAnd();
      left = pyTruthy(left) ? left : right;
    }
    return left;
  }

  parseAnd(): PyValue {
    let left = this.parseNot();
    while (this.match('OP', 'and')) {
      const right = this.parseNot();
      left = !pyTruthy(left) ? left : right;
    }
    return left;
  }

  parseNot(): PyValue {
    if (this.match('OP', 'not')) {
      return { kind: 'bool', value: !pyTruthy(this.parseNot()) };
    }
    return this.parseComparison();
  }

  parseComparison(): PyValue {
    let left = this.parseAddSub();
    const compOps = new Set(['==', '!=', '<', '<=', '>', '>=', 'in', 'not in', 'is', 'is not']);
    let result: boolean | null = null;

    while (this.peek()?.type === 'OP' && compOps.has(this.peek()!.value)) {
      const op = this.consume().value;
      const right = this.parseAddSub();
      const ok = this.evalComparison(op, left, right);
      result = result === null ? ok : result && ok;
      left = right;
    }

    if (result !== null) {
      return { kind: 'bool', value: result };
    }
    return left;
  }

  evalComparison(op: string, a: PyValue, b: PyValue): boolean {
    switch (op) {
      case '==':
        return pyEquals(a, b);
      case '!=':
        return !pyEquals(a, b);
      case 'is':
        return a === b || (a.kind === 'none' && b.kind === 'none') || (a.kind === 'bool' && b.kind === 'bool' && a.value === b.value);
      case 'is not':
        return !(a === b || (a.kind === 'none' && b.kind === 'none') || (a.kind === 'bool' && b.kind === 'bool' && a.value === b.value));
      case 'in':
        return this.evalIn(a, b);
      case 'not in':
        return !this.evalIn(a, b);
      case '<':
      case '<=':
      case '>':
      case '>=': {
        const na = this.asNumberForOrder(a);
        const nb = this.asNumberForOrder(b);
        if (na !== null && nb !== null) {
          if (op === '<') return na < nb;
          if (op === '<=') return na <= nb;
          if (op === '>') return na > nb;
          return na >= nb;
        }
        if (a.kind === 'str' && b.kind === 'str') {
          if (op === '<') return a.value < b.value;
          if (op === '<=') return a.value <= b.value;
          if (op === '>') return a.value > b.value;
          return a.value >= b.value;
        }
        throw new PyRuntimeError(
          'TypeError',
          `'${op}' not supported between instances of '${pyTypeName(a)}' and '${pyTypeName(b)}'`
        );
      }
      default:
        return false;
    }
  }

  asNumberForOrder(val: PyValue): number | null {
    if (val.kind === 'int' || val.kind === 'float') return val.value;
    if (val.kind === 'bool') return val.value ? 1 : 0;
    return null;
  }

  evalIn(item: PyValue, container: PyValue): boolean {
    if (container.kind === 'str') {
      if (item.kind !== 'str') {
        throw new PyRuntimeError('TypeError', `'in <string>' requires string as left operand, not ${pyTypeName(item)}`);
      }
      return container.value.includes(item.value);
    }
    if (container.kind === 'list' || container.kind === 'tuple' || container.kind === 'set') {
      return container.items.some((el) => pyEquals(el, item));
    }
    if (container.kind === 'dict') {
      return container.entries.some((e) => pyEquals(e.key, item));
    }
    throw new PyRuntimeError('TypeError', `argument of type '${pyTypeName(container)}' is not iterable`);
  }

  parseAddSub(): PyValue {
    let left = this.parseMulDiv();
    while (this.peek()?.type === 'OP' && (this.peek()!.value === '+' || this.peek()!.value === '-')) {
      const op = this.consume().value;
      const right = this.parseMulDiv();
      left = op === '+' ? this.evalAdd(left, right) : this.evalSub(left, right);
    }
    return left;
  }

  evalAdd(a: PyValue, b: PyValue): PyValue {
    if (a.kind === 'str' && b.kind === 'str') return { kind: 'str', value: a.value + b.value };
    if (a.kind === 'list' && b.kind === 'list') return { kind: 'list', items: [...a.items, ...b.items] };
    if (a.kind === 'tuple' && b.kind === 'tuple') return { kind: 'tuple', items: [...a.items, ...b.items] };

    if (a.kind === 'complex' || b.kind === 'complex') {
      const ca = a.kind === 'complex' ? a : { re: this.toNum(a), im: 0 };
      const cb = b.kind === 'complex' ? b : { re: this.toNum(b), im: 0 };
      return { kind: 'complex', re: ca.re + cb.re, im: ca.im + cb.im };
    }

    if (this.isNumeric(a) && this.isNumeric(b)) {
      const sum = this.toNum(a) + this.toNum(b);
      return a.kind === 'float' || b.kind === 'float'
        ? { kind: 'float', value: sum }
        : { kind: 'int', value: sum };
    }

    throw new PyRuntimeError(
      'TypeError',
      `unsupported operand type(s) for +: '${pyTypeName(a)}' and '${pyTypeName(b)}'`
    );
  }

  evalSub(a: PyValue, b: PyValue): PyValue {
    if (a.kind === 'complex' || b.kind === 'complex') {
      const ca = a.kind === 'complex' ? a : { re: this.toNum(a), im: 0 };
      const cb = b.kind === 'complex' ? b : { re: this.toNum(b), im: 0 };
      return { kind: 'complex', re: ca.re - cb.re, im: ca.im - cb.im };
    }
    if (this.isNumeric(a) && this.isNumeric(b)) {
      const diff = this.toNum(a) - this.toNum(b);
      return a.kind === 'float' || b.kind === 'float'
        ? { kind: 'float', value: diff }
        : { kind: 'int', value: diff };
    }
    throw new PyRuntimeError(
      'TypeError',
      `unsupported operand type(s) for -: '${pyTypeName(a)}' and '${pyTypeName(b)}'`
    );
  }

  parseMulDiv(): PyValue {
    let left = this.parseUnary();
    while (
      this.peek()?.type === 'OP' &&
      ['*', '/', '//', '%'].includes(this.peek()!.value)
    ) {
      const op = this.consume().value;
      const right = this.parseUnary();
      left = this.evalMulDiv(op, left, right);
    }
    return left;
  }

  evalMulDiv(op: string, a: PyValue, b: PyValue): PyValue {
    if (op === '*') {
      if (a.kind === 'str' && (b.kind === 'int' || b.kind === 'bool')) {
        const count = Math.max(0, b.kind === 'bool' ? (b.value ? 1 : 0) : b.value);
        return { kind: 'str', value: a.value.repeat(count) };
      }
      if (b.kind === 'str' && (a.kind === 'int' || a.kind === 'bool')) {
        const count = Math.max(0, a.kind === 'bool' ? (a.value ? 1 : 0) : a.value);
        return { kind: 'str', value: b.value.repeat(count) };
      }
      if (a.kind === 'list' && (b.kind === 'int' || b.kind === 'bool')) {
        const count = Math.max(0, b.kind === 'bool' ? (b.value ? 1 : 0) : b.value);
        const items: PyValue[] = [];
        for (let i = 0; i < count; i++) items.push(...a.items);
        return { kind: 'list', items };
      }
      if (b.kind === 'list' && (a.kind === 'int' || a.kind === 'bool')) {
        const count = Math.max(0, a.kind === 'bool' ? (a.value ? 1 : 0) : a.value);
        const items: PyValue[] = [];
        for (let i = 0; i < count; i++) items.push(...b.items);
        return { kind: 'list', items };
      }
      if (a.kind === 'complex' || b.kind === 'complex') {
        const ca = a.kind === 'complex' ? a : { re: this.toNum(a), im: 0 };
        const cb = b.kind === 'complex' ? b : { re: this.toNum(b), im: 0 };
        return {
          kind: 'complex',
          re: ca.re * cb.re - ca.im * cb.im,
          im: ca.re * cb.im + ca.im * cb.re,
        };
      }
      if (this.isNumeric(a) && this.isNumeric(b)) {
        const prod = this.toNum(a) * this.toNum(b);
        return a.kind === 'float' || b.kind === 'float'
          ? { kind: 'float', value: prod }
          : { kind: 'int', value: prod };
      }
    }

    if (this.isNumeric(a) && this.isNumeric(b)) {
      const na = this.toNum(a);
      const nb = this.toNum(b);
      if (nb === 0) throw new PyRuntimeError('ZeroDivisionError', 'division by zero');
      if (op === '/') return { kind: 'float', value: na / nb };
      if (op === '//') {
        const q = Math.floor(na / nb);
        return a.kind === 'float' || b.kind === 'float'
          ? { kind: 'float', value: q }
          : { kind: 'int', value: q };
      }
      if (op === '%') {
        const rem = ((na % nb) + nb) % nb;
        return a.kind === 'float' || b.kind === 'float'
          ? { kind: 'float', value: rem }
          : { kind: 'int', value: rem };
      }
    }

    throw new PyRuntimeError(
      'TypeError',
      `unsupported operand type(s) for ${op}: '${pyTypeName(a)}' and '${pyTypeName(b)}'`
    );
  }

  parseUnary(): PyValue {
    if (this.match('OP', '-')) {
      const val = this.parseUnary();
      if (val.kind === 'int') return { kind: 'int', value: -val.value };
      if (val.kind === 'float') return { kind: 'float', value: -val.value };
      if (val.kind === 'complex') return { kind: 'complex', re: -val.re, im: -val.im };
      if (val.kind === 'bool') return { kind: 'int', value: val.value ? -1 : 0 };
      throw new PyRuntimeError('TypeError', `bad operand type for unary -: '${pyTypeName(val)}'`);
    }
    if (this.match('OP', '+')) {
      const val = this.parseUnary();
      if (val.kind === 'int' || val.kind === 'float' || val.kind === 'complex') return val;
      if (val.kind === 'bool') return { kind: 'int', value: val.value ? 1 : 0 };
      throw new PyRuntimeError('TypeError', `bad operand type for unary +: '${pyTypeName(val)}'`);
    }
    return this.parsePower();
  }

  parsePower(): PyValue {
    const base = this.parsePostfix();
    if (this.match('OP', '**')) {
      const exp = this.parseUnary();
      if (this.isNumeric(base) && this.isNumeric(exp)) {
        const res = Math.pow(this.toNum(base), this.toNum(exp));
        return base.kind === 'float' || exp.kind === 'float' || this.toNum(exp) < 0
          ? { kind: 'float', value: res }
          : { kind: 'int', value: res };
      }
      throw new PyRuntimeError(
        'TypeError',
        `unsupported operand type(s) for **: '${pyTypeName(base)}' and '${pyTypeName(exp)}'`
      );
    }
    return base;
  }

  parsePostfix(): PyValue {
    let val = this.parsePrimary();

    while (true) {
      if (this.match('PUNCT', '[')) {
        val = this.parseSubscript(val);
      } else if (this.match('PUNCT', '.')) {
        const attr = this.expect('IDENT').value;
        if (this.match('PUNCT', '(')) {
          const { args, kwargs } = this.parseCallArgs();
          val = this.callMethod(val, attr, args, kwargs);
        } else {
          throw new PyRuntimeError('AttributeError', `'${pyTypeName(val)}' object has no attribute '${attr}'`);
        }
      } else {
        break;
      }
    }

    return val;
  }

  parseSubscript(target: PyValue): PyValue {
    let start: PyValue | null = null;
    let stop: PyValue | null = null;
    let step: PyValue | null = null;
    let isSlice = false;

    if (this.match('PUNCT', ':')) {
      isSlice = true;
    } else {
      start = this.parseExpression();
      if (this.match('PUNCT', ':')) {
        isSlice = true;
      }
    }

    if (isSlice) {
      if (!this.match('PUNCT', ']') && !(this.peek()?.type === 'PUNCT' && this.peek()?.value === ':')) {
        stop = this.parseExpression();
      }
      if (this.match('PUNCT', ':')) {
        if (!(this.peek()?.type === 'PUNCT' && this.peek()?.value === ']')) {
          step = this.parseExpression();
        }
      }
      this.expect('PUNCT', ']');
      return this.evalSlice(target, start, stop, step);
    }

    this.expect('PUNCT', ']');
    return this.evalIndex(target, start!);
  }

  evalIndex(target: PyValue, indexVal: PyValue): PyValue {
    if (target.kind === 'dict') {
      const entry = target.entries.find((e) => pyEquals(e.key, indexVal));
      if (!entry) throw new PyRuntimeError('KeyError', pyRepr(indexVal));
      return entry.value;
    }

    if (indexVal.kind !== 'int' && indexVal.kind !== 'bool') {
      throw new PyRuntimeError('TypeError', `indices must be integers or slices, not ${pyTypeName(indexVal)}`);
    }
    const rawIdx = indexVal.kind === 'bool' ? (indexVal.value ? 1 : 0) : indexVal.value;

    if (target.kind === 'list' || target.kind === 'tuple') {
      const idx = rawIdx < 0 ? target.items.length + rawIdx : rawIdx;
      if (idx < 0 || idx >= target.items.length) {
        throw new PyRuntimeError('IndexError', `${target.kind} index out of range`);
      }
      return target.items[idx];
    }

    if (target.kind === 'str') {
      const idx = rawIdx < 0 ? target.value.length + rawIdx : rawIdx;
      if (idx < 0 || idx >= target.value.length) {
        throw new PyRuntimeError('IndexError', 'string index out of range');
      }
      return { kind: 'str', value: target.value[idx] };
    }

    throw new PyRuntimeError('TypeError', `'${pyTypeName(target)}' object is not subscriptable`);
  }

  evalSlice(target: PyValue, startV: PyValue | null, stopV: PyValue | null, stepV: PyValue | null): PyValue {
    if (target.kind !== 'list' && target.kind !== 'tuple' && target.kind !== 'str') {
      throw new PyRuntimeError('TypeError', `'${pyTypeName(target)}' object is not subscriptable`);
    }

    const len = target.kind === 'str' ? target.value.length : target.items.length;
    const step = stepV && stepV.kind !== 'none' ? this.asInt(stepV, 'slice step') : 1;
    if (step === 0) throw new PyRuntimeError('ValueError', 'slice step cannot be zero');

    let start: number;
    let stop: number;

    if (step > 0) {
      start = startV && startV.kind !== 'none' ? this.asInt(startV, 'slice index') : 0;
      stop = stopV && stopV.kind !== 'none' ? this.asInt(stopV, 'slice index') : len;
      if (start < 0) start = Math.max(0, len + start);
      if (stop < 0) stop = Math.max(0, len + stop);
      start = Math.min(start, len);
      stop = Math.min(stop, len);
    } else {
      start = startV && startV.kind !== 'none' ? this.asInt(startV, 'slice index') : len - 1;
      stop = stopV && stopV.kind !== 'none' ? this.asInt(stopV, 'slice index') : -len - 1;
      if (start < 0) start = len + start;
      if (stop < 0 && stopV && stopV.kind !== 'none') stop = len + stop;
      start = Math.min(start, len - 1);
    }

    if (target.kind === 'str') {
      let out = '';
      if (step > 0) {
        for (let i = start; i < stop; i += step) out += target.value[i];
      } else {
        for (let i = start; i > stop && i >= 0; i += step) out += target.value[i];
      }
      return { kind: 'str', value: out };
    }

    const out: PyValue[] = [];
    if (step > 0) {
      for (let i = start; i < stop; i += step) out.push(target.items[i]);
    } else {
      for (let i = start; i > stop && i >= 0; i += step) out.push(target.items[i]);
    }
    return target.kind === 'list' ? { kind: 'list', items: out } : { kind: 'tuple', items: out };
  }

  asInt(val: PyValue, context: string): number {
    if (val.kind === 'int') return val.value;
    if (val.kind === 'bool') return val.value ? 1 : 0;
    throw new PyRuntimeError('TypeError', `${context} must be an integer, not ${pyTypeName(val)}`);
  }

  parsePrimary(): PyValue {
    const t = this.peek();
    if (!t) throw new PyRuntimeError('SyntaxError', 'unexpected end of expression');

    if (t.type === 'NUMBER') {
      this.consume();
      return t.value.includes('.')
        ? { kind: 'float', value: parseFloat(t.value) }
        : { kind: 'int', value: parseInt(t.value, 10) };
    }

    if (t.type === 'IMAG') {
      this.consume();
      return { kind: 'complex', re: 0, im: parseFloat(t.value) };
    }

    if (t.type === 'STRING') {
      this.consume();
      return { kind: 'str', value: t.value };
    }

    if (t.type === 'FSTRING') {
      this.consume();
      return { kind: 'str', value: this.evalFString(t.value) };
    }

    if (t.type === 'IDENT') {
      this.consume();
      if (t.value === 'True') return { kind: 'bool', value: true };
      if (t.value === 'False') return { kind: 'bool', value: false };
      if (t.value === 'None') return { kind: 'none' };

      if (this.match('PUNCT', '(')) {
        const { args, kwargs } = this.parseCallArgs();
        return this.callBuiltin(t.value, args, kwargs);
      }

      if (this.env.has(t.value)) {
        return this.env.get(t.value)!;
      }
      throw new PyRuntimeError('NameError', `name '${t.value}' is not defined`);
    }

    // List literal or list comprehension
    if (this.match('PUNCT', '[')) {
      if (this.match('PUNCT', ']')) {
        return { kind: 'list', items: [] };
      }

      // Check for list comprehension: [expr for var in iter (if cond)?]
      const savedPos = this.pos;
      const compResult = this.tryParseListComprehension();
      if (compResult !== null) {
        return compResult;
      }
      this.pos = savedPos;

      const items: PyValue[] = [];
      while (true) {
        if (this.match('PUNCT', ']')) break;
        items.push(this.parseExpression());
        if (this.match('PUNCT', ']')) break;
        this.expect('PUNCT', ',');
      }
      return { kind: 'list', items };
    }

    // Parenthesized expression or tuple
    if (this.match('PUNCT', '(')) {
      if (this.match('PUNCT', ')')) {
        return { kind: 'tuple', items: [] };
      }
      const first = this.parseExpression();
      if (this.match('PUNCT', ',')) {
        const items: PyValue[] = [first];
        while (!this.match('PUNCT', ')')) {
          items.push(this.parseExpression());
          if (this.match('PUNCT', ')')) break;
          this.expect('PUNCT', ',');
        }
        return { kind: 'tuple', items };
      }
      this.expect('PUNCT', ')');
      return first;
    }

    // Dict or Set literal
    if (this.match('PUNCT', '{')) {
      if (this.match('PUNCT', '}')) {
        return { kind: 'dict', entries: [] };
      }
      const first = this.parseExpression();
      if (this.match('PUNCT', ':')) {
        const firstVal = this.parseExpression();
        const entries: Array<{ key: PyValue; value: PyValue }> = [{ key: first, value: firstVal }];
        while (this.match('PUNCT', ',')) {
          if (this.peek()?.type === 'PUNCT' && this.peek()?.value === '}') break;
          const k = this.parseExpression();
          this.expect('PUNCT', ':');
          const v = this.parseExpression();
          const existing = entries.findIndex((e) => pyEquals(e.key, k));
          if (existing >= 0) entries[existing].value = v;
          else entries.push({ key: k, value: v });
        }
        this.expect('PUNCT', '}');
        return { kind: 'dict', entries };
      }

      // Set literal
      const items: PyValue[] = [first];
      while (this.match('PUNCT', ',')) {
        if (this.peek()?.type === 'PUNCT' && this.peek()?.value === '}') break;
        const item = this.parseExpression();
        if (!items.some((el) => pyEquals(el, item))) {
          items.push(item);
        }
      }
      this.expect('PUNCT', '}');
      return { kind: 'set', items };
    }

    throw new PyRuntimeError('SyntaxError', `invalid syntax near '${t.value}'`);
  }

  tryParseListComprehension(): PyValue | null {
    // Scan at bracket depth 0 for top-level 'for' before closing ']'
    let depth = 0;
    let forIndex = -1;
    for (let i = this.pos; i < this.tokens.length; i++) {
      const tk = this.tokens[i];
      if (tk.type === 'PUNCT' && '([{'.includes(tk.value)) depth++;
      else if (tk.type === 'PUNCT' && ')]}'.includes(tk.value)) {
        if (depth === 0 && tk.value === ']') break;
        depth--;
      } else if (depth === 0 && tk.type === 'IDENT' && tk.value === 'for') {
        forIndex = i;
        break;
      }
    }

    if (forIndex === -1) return null;

    const exprTokens = this.tokens.slice(this.pos, forIndex);
    this.pos = forIndex + 1;

    const varToken = this.expect('IDENT');
    this.expect('OP', 'in');

    // Find optional 'if' or closing ']'
    let ifIndex = -1;
    let closeIndex = -1;
    depth = 0;
    for (let i = this.pos; i < this.tokens.length; i++) {
      const tk = this.tokens[i];
      if (tk.type === 'PUNCT' && '([{'.includes(tk.value)) depth++;
      else if (tk.type === 'PUNCT' && ')]}'.includes(tk.value)) {
        if (depth === 0 && tk.value === ']') {
          closeIndex = i;
          break;
        }
        depth--;
      } else if (depth === 0 && tk.type === 'IDENT' && tk.value === 'if' && ifIndex === -1) {
        ifIndex = i;
      }
    }

    if (closeIndex === -1) throw new PyRuntimeError('SyntaxError', 'unclosed list comprehension');

    const iterTokens = this.tokens.slice(this.pos, ifIndex !== -1 ? ifIndex : closeIndex);
    const condTokens = ifIndex !== -1 ? this.tokens.slice(ifIndex + 1, closeIndex) : null;
    this.pos = closeIndex + 1;

    const iterVal = new ExprParser(iterTokens, this.env, this.output).parseExpression();
    const elements = toIterable(iterVal);

    const prevHas = this.env.has(varToken.value);
    const prevVal = this.env.get(varToken.value);
    const results: PyValue[] = [];

    for (const el of elements) {
      this.env.set(varToken.value, el);
      if (condTokens) {
        const condRes = new ExprParser(condTokens, this.env, this.output).parseExpression();
        if (!pyTruthy(condRes)) continue;
      }
      const itemVal = new ExprParser(exprTokens, this.env, this.output).parseExpression();
      results.push(itemVal);
    }

    if (prevHas && prevVal !== undefined) this.env.set(varToken.value, prevVal);
    else this.env.delete(varToken.value);

    return { kind: 'list', items: results };
  }

  evalFString(template: string): string {
    return template.replace(/\{([^}]+)\}/g, (_, inner: string) => {
      const tokens = tokenizeExpression(inner);
      const val = new ExprParser(tokens, this.env, this.output).parseExpression();
      return pyStr(val);
    });
  }

  parseCallArgs(): { args: PyValue[]; kwargs: Record<string, PyValue> } {
    const args: PyValue[] = [];
    const kwargs: Record<string, PyValue> = {};

    while (!this.match('PUNCT', ')')) {
      const next = this.peek();
      const afterNext = this.peek(1);
      if (next?.type === 'IDENT' && afterNext?.type === 'PUNCT' && afterNext.value === '=') {
        const key = this.consume().value;
        this.consume(); // '='
        kwargs[key] = this.parseExpression();
      } else {
        args.push(this.parseExpression());
      }
      if (this.match('PUNCT', ')')) break;
      this.expect('PUNCT', ',');
    }

    return { args, kwargs };
  }

  callBuiltin(name: string, args: PyValue[], kwargs: Record<string, PyValue>): PyValue {
    switch (name) {
      case 'print': {
        const sep = kwargs.sep ? pyStr(kwargs.sep) : ' ';
        const line = args.map(pyStr).join(sep);
        this.output.push(line);
        return { kind: 'none' };
      }
      case 'type': {
        if (args.length !== 1) throw new PyRuntimeError('TypeError', `type() takes 1 argument, got ${args.length}`);
        return { kind: 'str', value: `<class '${pyTypeName(args[0])}'>` };
      }
      case 'len': {
        if (args.length !== 1) throw new PyRuntimeError('TypeError', `len() takes exactly one argument (${args.length} given)`);
        const v = args[0];
        if (v.kind === 'str') return { kind: 'int', value: v.value.length };
        if (v.kind === 'list' || v.kind === 'tuple' || v.kind === 'set') return { kind: 'int', value: v.items.length };
        if (v.kind === 'dict') return { kind: 'int', value: v.entries.length };
        throw new PyRuntimeError('TypeError', `object of type '${pyTypeName(v)}' has no len()`);
      }
      case 'int': {
        if (args.length === 0) return { kind: 'int', value: 0 };
        const v = args[0];
        if (v.kind === 'int') return v;
        if (v.kind === 'float') return { kind: 'int', value: Math.trunc(v.value) };
        if (v.kind === 'bool') return { kind: 'int', value: v.value ? 1 : 0 };
        if (v.kind === 'str') {
          const parsed = Number(v.value.trim());
          if (!Number.isInteger(parsed) || v.value.trim() === '') {
            throw new PyRuntimeError('ValueError', `invalid literal for int() with base 10: '${v.value}'`);
          }
          return { kind: 'int', value: parsed };
        }
        throw new PyRuntimeError('TypeError', `int() argument must be a string or a number, not '${pyTypeName(v)}'`);
      }
      case 'float': {
        if (args.length === 0) return { kind: 'float', value: 0.0 };
        const v = args[0];
        if (v.kind === 'float') return v;
        if (v.kind === 'int') return { kind: 'float', value: v.value };
        if (v.kind === 'bool') return { kind: 'float', value: v.value ? 1.0 : 0.0 };
        if (v.kind === 'str') {
          const parsed = Number(v.value.trim());
          if (Number.isNaN(parsed) || v.value.trim() === '') {
            throw new PyRuntimeError('ValueError', `could not convert string to float: '${v.value}'`);
          }
          return { kind: 'float', value: parsed };
        }
        throw new PyRuntimeError('TypeError', `float() argument must be a string or a number, not '${pyTypeName(v)}'`);
      }
      case 'str': {
        if (args.length === 0) return { kind: 'str', value: '' };
        return { kind: 'str', value: pyStr(args[0]) };
      }
      case 'bool': {
        if (args.length === 0) return { kind: 'bool', value: false };
        return { kind: 'bool', value: pyTruthy(args[0]) };
      }
      case 'list': {
        if (args.length === 0) return { kind: 'list', items: [] };
        return { kind: 'list', items: [...toIterable(args[0])] };
      }
      case 'tuple': {
        if (args.length === 0) return { kind: 'tuple', items: [] };
        return { kind: 'tuple', items: [...toIterable(args[0])] };
      }
      case 'set': {
        if (args.length === 0) return { kind: 'set', items: [] };
        const unique: PyValue[] = [];
        for (const item of toIterable(args[0])) {
          if (!unique.some((u) => pyEquals(u, item))) unique.push(item);
        }
        return { kind: 'set', items: unique };
      }
      case 'dict': {
        return { kind: 'dict', entries: [] };
      }
      case 'range': {
        let start = 0;
        let stop = 0;
        let step = 1;
        if (args.length === 1) {
          stop = this.asInt(args[0], 'range() arg');
        } else if (args.length === 2) {
          start = this.asInt(args[0], 'range() arg');
          stop = this.asInt(args[1], 'range() arg');
        } else if (args.length === 3) {
          start = this.asInt(args[0], 'range() arg');
          stop = this.asInt(args[1], 'range() arg');
          step = this.asInt(args[2], 'range() step');
          if (step === 0) throw new PyRuntimeError('ValueError', 'range() arg 3 must not be zero');
        } else {
          throw new PyRuntimeError('TypeError', `range expected 1 to 3 arguments, got ${args.length}`);
        }
        const items: PyValue[] = [];
        if (step > 0) {
          for (let i = start; i < stop && items.length < 5000; i += step) items.push({ kind: 'int', value: i });
        } else {
          for (let i = start; i > stop && items.length < 5000; i += step) items.push({ kind: 'int', value: i });
        }
        return { kind: 'list', items };
      }
      case 'sum': {
        const items = toIterable(args[0]);
        let total = 0;
        let hasFloat = false;
        for (const item of items) {
          if (!this.isNumeric(item)) throw new PyRuntimeError('TypeError', `unsupported operand type(s) for +: 'int' and '${pyTypeName(item)}'`);
          if (item.kind === 'float') hasFloat = true;
          total += this.toNum(item);
        }
        return hasFloat ? { kind: 'float', value: total } : { kind: 'int', value: total };
      }
      case 'min':
      case 'max': {
        const items = args.length === 1 ? toIterable(args[0]) : args;
        if (items.length === 0) throw new PyRuntimeError('ValueError', `${name}() arg is an empty sequence`);
        let best = items[0];
        for (let i = 1; i < items.length; i++) {
          const cmp = this.evalComparison(name === 'min' ? '<' : '>', items[i], best);
          if (cmp) best = items[i];
        }
        return best;
      }
      case 'sorted': {
        const items = [...toIterable(args[0])];
        const reverse = kwargs.reverse ? pyTruthy(kwargs.reverse) : false;
        items.sort((a, b) => {
          const cmpLt = this.evalComparison('<', a, b);
          const cmpGt = this.evalComparison('>', a, b);
          if (cmpLt) return reverse ? 1 : -1;
          if (cmpGt) return reverse ? -1 : 1;
          return 0;
        });
        return { kind: 'list', items };
      }
      case 'abs': {
        const v = args[0];
        if (v.kind === 'int') return { kind: 'int', value: Math.abs(v.value) };
        if (v.kind === 'float') return { kind: 'float', value: Math.abs(v.value) };
        if (v.kind === 'complex') return { kind: 'float', value: Math.hypot(v.re, v.im) };
        throw new PyRuntimeError('TypeError', `bad operand type for abs(): '${pyTypeName(v)}'`);
      }
      case 'round': {
        const num = this.toNum(args[0]);
        const digits = args[1] ? this.asInt(args[1], 'ndigits') : 0;
        const factor = Math.pow(10, digits);
        const rounded = Math.round(num * factor) / factor;
        return digits === 0 ? { kind: 'int', value: rounded } : { kind: 'float', value: rounded };
      }
      case 'isinstance': {
        if (args.length !== 2) throw new PyRuntimeError('TypeError', 'isinstance expected 2 arguments');
        const targetType = args[1].kind === 'str' ? args[1].value : '';
        const actual = pyTypeName(args[0]);
        return { kind: 'bool', value: targetType.includes(actual) };
      }
      case 'enumerate': {
        const items = toIterable(args[0]);
        const start = args[1] ? this.asInt(args[1], 'start') : 0;
        return {
          kind: 'list',
          items: items.map((el, idx) => ({
            kind: 'tuple',
            items: [{ kind: 'int', value: start + idx }, el],
          })),
        };
      }
      case 'zip': {
        const lists = args.map(toIterable);
        const minLen = Math.min(...lists.map((l) => l.length));
        const zipped: PyValue[] = [];
        for (let i = 0; i < minLen; i++) {
          zipped.push({ kind: 'tuple', items: lists.map((l) => l[i]) });
        }
        return { kind: 'list', items: zipped };
      }
      default:
        throw new PyRuntimeError('NameError', `name '${name}' is not defined`);
    }
  }

  callMethod(target: PyValue, method: string, args: PyValue[], kwargs: Record<string, PyValue>): PyValue {
    if (target.kind === 'list') {
      switch (method) {
        case 'append':
          if (args.length !== 1) throw new PyRuntimeError('TypeError', `list.append() takes exactly one argument`);
          target.items.push(args[0]);
          return { kind: 'none' };
        case 'extend':
          if (args.length !== 1) throw new PyRuntimeError('TypeError', `list.extend() takes exactly one argument`);
          target.items.push(...toIterable(args[0]));
          return { kind: 'none' };
        case 'insert': {
          if (args.length !== 2) throw new PyRuntimeError('TypeError', `list.insert() takes exactly 2 arguments`);
          let idx = this.asInt(args[0], 'insert index');
          if (idx < 0) idx = Math.max(0, target.items.length + idx);
          idx = Math.min(idx, target.items.length);
          target.items.splice(idx, 0, args[1]);
          return { kind: 'none' };
        }
        case 'remove': {
          if (args.length !== 1) throw new PyRuntimeError('TypeError', `list.remove() takes exactly one argument`);
          const foundIdx = target.items.findIndex((el) => pyEquals(el, args[0]));
          if (foundIdx === -1) throw new PyRuntimeError('ValueError', 'list.remove(x): x not in list');
          target.items.splice(foundIdx, 1);
          return { kind: 'none' };
        }
        case 'pop': {
          if (target.items.length === 0) throw new PyRuntimeError('IndexError', 'pop from empty list');
          if (args.length === 0) return target.items.pop()!;
          const rawIdx = this.asInt(args[0], 'pop index');
          const idx = rawIdx < 0 ? target.items.length + rawIdx : rawIdx;
          if (idx < 0 || idx >= target.items.length) throw new PyRuntimeError('IndexError', 'pop index out of range');
          return target.items.splice(idx, 1)[0];
        }
        case 'clear':
          target.items.length = 0;
          return { kind: 'none' };
        case 'reverse':
          target.items.reverse();
          return { kind: 'none' };
        case 'sort': {
          const reverse = kwargs.reverse ? pyTruthy(kwargs.reverse) : false;
          target.items.sort((a, b) => {
            const lt = this.evalComparison('<', a, b);
            const gt = this.evalComparison('>', a, b);
            if (lt) return reverse ? 1 : -1;
            if (gt) return reverse ? -1 : 1;
            return 0;
          });
          return { kind: 'none' };
        }
        case 'copy':
          return { kind: 'list', items: [...target.items] };
        case 'count':
          return { kind: 'int', value: target.items.filter((el) => pyEquals(el, args[0])).length };
        case 'index': {
          const foundIdx = target.items.findIndex((el) => pyEquals(el, args[0]));
          if (foundIdx === -1) throw new PyRuntimeError('ValueError', `${pyRepr(args[0])} is not in list`);
          return { kind: 'int', value: foundIdx };
        }
        default:
          throw new PyRuntimeError('AttributeError', `'list' object has no attribute '${method}'`);
      }
    }

    if (target.kind === 'str') {
      switch (method) {
        case 'upper':
          return { kind: 'str', value: target.value.toUpperCase() };
        case 'lower':
          return { kind: 'str', value: target.value.toLowerCase() };
        case 'title':
          return {
            kind: 'str',
            value: target.value.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()),
          };
        case 'strip':
          return { kind: 'str', value: target.value.trim() };
        case 'split': {
          const sep = args[0] ? pyStr(args[0]) : undefined;
          const parts = sep !== undefined ? target.value.split(sep) : target.value.trim().split(/\s+/).filter(Boolean);
          return { kind: 'list', items: parts.map((s) => ({ kind: 'str', value: s })) };
        }
        case 'replace':
          return { kind: 'str', value: target.value.split(pyStr(args[0])).join(pyStr(args[1])) };
        case 'join': {
          const items = toIterable(args[0]).map(pyStr);
          return { kind: 'str', value: items.join(target.value) };
        }
        default:
          throw new PyRuntimeError('AttributeError', `'str' object has no attribute '${method}'`);
      }
    }

    if (target.kind === 'set') {
      switch (method) {
        case 'add':
          if (!target.items.some((el) => pyEquals(el, args[0]))) target.items.push(args[0]);
          return { kind: 'none' };
        case 'remove': {
          const idx = target.items.findIndex((el) => pyEquals(el, args[0]));
          if (idx === -1) throw new PyRuntimeError('KeyError', pyRepr(args[0]));
          target.items.splice(idx, 1);
          return { kind: 'none' };
        }
        case 'discard': {
          const idx = target.items.findIndex((el) => pyEquals(el, args[0]));
          if (idx !== -1) target.items.splice(idx, 1);
          return { kind: 'none' };
        }
        case 'clear':
          target.items.length = 0;
          return { kind: 'none' };
        default:
          throw new PyRuntimeError('AttributeError', `'set' object has no attribute '${method}'`);
      }
    }

    if (target.kind === 'dict') {
      switch (method) {
        case 'get': {
          const found = target.entries.find((e) => pyEquals(e.key, args[0]));
          return found ? found.value : args[1] ?? { kind: 'none' };
        }
        case 'keys':
          return { kind: 'list', items: target.entries.map((e) => e.key) };
        case 'values':
          return { kind: 'list', items: target.entries.map((e) => e.value) };
        case 'items':
          return {
            kind: 'list',
            items: target.entries.map((e) => ({ kind: 'tuple', items: [e.key, e.value] })),
          };
        case 'pop': {
          const idx = target.entries.findIndex((e) => pyEquals(e.key, args[0]));
          if (idx === -1) {
            if (args[1]) return args[1];
            throw new PyRuntimeError('KeyError', pyRepr(args[0]));
          }
          return target.entries.splice(idx, 1)[0].value;
        }
        case 'clear':
          target.entries.length = 0;
          return { kind: 'none' };
        default:
          throw new PyRuntimeError('AttributeError', `'dict' object has no attribute '${method}'`);
      }
    }

    if (target.kind === 'tuple') {
      if (method === 'count') {
        return { kind: 'int', value: target.items.filter((el) => pyEquals(el, args[0])).length };
      }
      if (method === 'index') {
        const idx = target.items.findIndex((el) => pyEquals(el, args[0]));
        if (idx === -1) throw new PyRuntimeError('ValueError', 'tuple.index(x): x not in tuple');
        return { kind: 'int', value: idx };
      }
    }

    throw new PyRuntimeError('AttributeError', `'${pyTypeName(target)}' object has no attribute '${method}'`);
  }

  isNumeric(val: PyValue): boolean {
    return val.kind === 'int' || val.kind === 'float' || val.kind === 'bool';
  }

  toNum(val: PyValue): number {
    if (val.kind === 'int' || val.kind === 'float') return val.value;
    if (val.kind === 'bool') return val.value ? 1 : 0;
    throw new PyRuntimeError('TypeError', `expected number, got '${pyTypeName(val)}'`);
  }
}

function toIterable(val: PyValue): PyValue[] {
  if (val.kind === 'list' || val.kind === 'tuple' || val.kind === 'set') {
    return val.items;
  }
  if (val.kind === 'str') {
    return val.value.split('').map((c) => ({ kind: 'str', value: c }));
  }
  if (val.kind === 'dict') {
    return val.entries.map((e) => e.key);
  }
  throw new PyRuntimeError('TypeError', `'${pyTypeName(val)}' object is not iterable`);
}

interface SourceLine {
  lineNum: number;
  indent: number;
  text: string;
}

function splitAssignment(stmt: string): { target: string; op: string; expr: string } | null {
  let depth = 0;
  let inQuote: string | null = null;

  for (let i = 0; i < stmt.length; i++) {
    const ch = stmt[i];
    if (inQuote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      inQuote = ch;
      continue;
    }
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    else if (depth === 0) {
      const two = stmt.slice(i, i + 2);
      if (['+=', '-=', '*=', '/='].includes(two)) {
        return { target: stmt.slice(0, i).trim(), op: two, expr: stmt.slice(i + 2).trim() };
      }
      if (ch === '=' && stmt[i + 1] !== '=' && stmt[i - 1] !== '!' && stmt[i - 1] !== '<' && stmt[i - 1] !== '>') {
        return { target: stmt.slice(0, i).trim(), op: '=', expr: stmt.slice(i + 1).trim() };
      }
    }
  }
  return null;
}

function splitTopLevelCommas(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inQuote: string | null = null;
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      inQuote = ch;
      continue;
    }
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  const tail = text.slice(start).trim();
  if (tail.length > 0) parts.push(tail);
  return parts;
}

function stripInlineComment(line: string): string {
  let inQuote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      inQuote = ch;
      continue;
    }
    if (ch === '#') return line.slice(0, i).trimEnd();
  }
  return line;
}

function evalExpr(exprText: string, env: Map<string, PyValue>, output: string[]): PyValue {
  const tokens = tokenizeExpression(exprText);
  if (tokens.length === 0) throw new PyRuntimeError('SyntaxError', 'empty expression');
  const parser = new ExprParser(tokens, env, output);
  const val = parser.parseExpression();
  if (parser.pos < tokens.length) {
    throw new PyRuntimeError('SyntaxError', `unexpected token '${tokens[parser.pos].value}'`);
  }
  return val;
}

function executeBlock(
  lines: SourceLine[],
  startIdx: number,
  expectedIndent: number,
  env: Map<string, PyValue>,
  output: string[]
): { nextIdx: number; control: LoopControl | null } {
  let idx = startIdx;

  while (idx < lines.length) {
    const line = lines[idx];
    if (line.indent < expectedIndent) {
      return { nextIdx: idx, control: null };
    }
    if (line.indent > expectedIndent) {
      throw new PyRuntimeError('IndentationError', 'unexpected indent', line.lineNum);
    }

    const stmt = line.text;

    if (stmt === 'pass') {
      idx++;
      continue;
    }
    if (stmt === 'break') {
      return { nextIdx: idx + 1, control: new LoopControl('break') };
    }
    if (stmt === 'continue') {
      return { nextIdx: idx + 1, control: new LoopControl('continue') };
    }

    // if / elif / else
    if (stmt.startsWith('if ') && stmt.endsWith(':')) {
      const condExpr = stmt.slice(3, -1).trim();
      let branchExecuted = false;
      let cursor = idx;

      try {
        const cond = evalExpr(condExpr, env, output);
        cursor++;
        const blockIndent = cursor < lines.length && lines[cursor].indent > expectedIndent ? lines[cursor].indent : expectedIndent + 4;
        if (pyTruthy(cond)) {
          branchExecuted = true;
          const res = executeBlock(lines, cursor, blockIndent, env, output);
          cursor = res.nextIdx;
          if (res.control) return { nextIdx: cursor, control: res.control };
        } else {
          while (cursor < lines.length && lines[cursor].indent > expectedIndent) cursor++;
        }

        while (cursor < lines.length && lines[cursor].indent === expectedIndent) {
          const nextStmt = lines[cursor].text;
          if (nextStmt.startsWith('elif ') && nextStmt.endsWith(':')) {
            const elifExpr = nextStmt.slice(5, -1).trim();
            cursor++;
            const elifIndent = cursor < lines.length && lines[cursor].indent > expectedIndent ? lines[cursor].indent : expectedIndent + 4;
            if (!branchExecuted && pyTruthy(evalExpr(elifExpr, env, output))) {
              branchExecuted = true;
              const res = executeBlock(lines, cursor, elifIndent, env, output);
              cursor = res.nextIdx;
              if (res.control) return { nextIdx: cursor, control: res.control };
            } else {
              while (cursor < lines.length && lines[cursor].indent > expectedIndent) cursor++;
            }
          } else if (nextStmt === 'else:') {
            cursor++;
            const elseIndent = cursor < lines.length && lines[cursor].indent > expectedIndent ? lines[cursor].indent : expectedIndent + 4;
            if (!branchExecuted) {
              const res = executeBlock(lines, cursor, elseIndent, env, output);
              cursor = res.nextIdx;
              if (res.control) return { nextIdx: cursor, control: res.control };
            } else {
              while (cursor < lines.length && lines[cursor].indent > expectedIndent) cursor++;
            }
            break;
          } else {
            break;
          }
        }
        idx = cursor;
        continue;
      } catch (err) {
        if (err instanceof PyRuntimeError && !err.line) err.line = line.lineNum;
        throw err;
      }
    }

    // for loop
    const forMatch = stmt.match(/^for\s+(.+?)\s+in\s+(.+):$/);
    if (forMatch) {
      try {
        const varNames = forMatch[1].split(',').map((s) => s.trim());
        const iterVal = evalExpr(forMatch[2].trim(), env, output);
        const items = toIterable(iterVal);
        const bodyStart = idx + 1;
        if (bodyStart >= lines.length || lines[bodyStart].indent <= expectedIndent) {
          throw new PyRuntimeError('IndentationError', 'expected an indented block', line.lineNum);
        }
        const bodyIndent = lines[bodyStart].indent;
        let bodyEnd = bodyStart;
        while (bodyEnd < lines.length && lines[bodyEnd].indent >= bodyIndent) bodyEnd++;

        for (const item of items) {
          if (varNames.length === 1) {
            env.set(varNames[0], item);
          } else {
            const unpacked = toIterable(item);
            if (unpacked.length !== varNames.length) {
              throw new PyRuntimeError('ValueError', `expected ${varNames.length} values to unpack, got ${unpacked.length}`, line.lineNum);
            }
            varNames.forEach((vn, i) => env.set(vn, unpacked[i]));
          }
          const res = executeBlock(lines, bodyStart, bodyIndent, env, output);
          if (res.control?.type === 'break') break;
        }
        idx = bodyEnd;
        continue;
      } catch (err) {
        if (err instanceof PyRuntimeError && !err.line) err.line = line.lineNum;
        throw err;
      }
    }

    // while loop
    if (stmt.startsWith('while ') && stmt.endsWith(':')) {
      try {
        const condExpr = stmt.slice(6, -1).trim();
        const bodyStart = idx + 1;
        if (bodyStart >= lines.length || lines[bodyStart].indent <= expectedIndent) {
          throw new PyRuntimeError('IndentationError', 'expected an indented block', line.lineNum);
        }
        const bodyIndent = lines[bodyStart].indent;
        let bodyEnd = bodyStart;
        while (bodyEnd < lines.length && lines[bodyEnd].indent >= bodyIndent) bodyEnd++;

        let iterations = 0;
        while (pyTruthy(evalExpr(condExpr, env, output))) {
          iterations++;
          if (iterations > 2000) {
            throw new PyRuntimeError('RuntimeError', 'loop iteration limit exceeded (2000 steps)', line.lineNum);
          }
          const res = executeBlock(lines, bodyStart, bodyIndent, env, output);
          if (res.control?.type === 'break') break;
        }
        idx = bodyEnd;
        continue;
      } catch (err) {
        if (err instanceof PyRuntimeError && !err.line) err.line = line.lineNum;
        throw err;
      }
    }

    // Assignment or Expression
    try {
      const assign = splitAssignment(stmt);
      if (assign) {
        executeAssignment(assign.target, assign.op, assign.expr, env, output);
      } else {
        evalExpr(stmt, env, output);
      }
    } catch (err) {
      if (err instanceof PyRuntimeError && !err.line) err.line = line.lineNum;
      throw err;
    }

    idx++;
  }

  return { nextIdx: idx, control: null };
}

function executeAssignment(
  target: string,
  op: string,
  exprText: string,
  env: Map<string, PyValue>,
  output: string[]
): void {
  const rhs = evalExpr(exprText, env, output);

  // Tuple unpacking on left hand side: a, b = 1, 2
  const lhsParts = splitTopLevelCommas(target);
  if (lhsParts.length > 1 && op === '=') {
    const items = toIterable(rhs);
    if (items.length !== lhsParts.length) {
      throw new PyRuntimeError('ValueError', `expected ${lhsParts.length} values to unpack, got ${items.length}`);
    }
    lhsParts.forEach((lhsName, idx) => {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(lhsName)) {
        throw new PyRuntimeError('SyntaxError', `cannot assign to '${lhsName}'`);
      }
      env.set(lhsName, items[idx]);
    });
    return;
  }

  // Subscript assignment: numbers[0] = 99 or my_dict['a'] = 2
  const subMatch = target.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\[(.+)\]$/);
  if (subMatch) {
    const varName = subMatch[1];
    const indexExpr = subMatch[2];
    if (!env.has(varName)) throw new PyRuntimeError('NameError', `name '${varName}' is not defined`);
    const container = env.get(varName)!;
    const keyVal = evalExpr(indexExpr, env, output);

    if (container.kind === 'list') {
      const rawIdx = keyVal.kind === 'int' ? keyVal.value : keyVal.kind === 'bool' ? (keyVal.value ? 1 : 0) : NaN;
      if (Number.isNaN(rawIdx)) {
        throw new PyRuntimeError('TypeError', `list indices must be integers, not ${pyTypeName(keyVal)}`);
      }
      const idx = rawIdx < 0 ? container.items.length + rawIdx : rawIdx;
      if (idx < 0 || idx >= container.items.length) {
        throw new PyRuntimeError('IndexError', 'list assignment index out of range');
      }
      if (op === '=') {
        container.items[idx] = rhs;
      } else {
        const baseOp = op[0];
        const parser = new ExprParser([], env, output);
        const current = container.items[idx];
        container.items[idx] =
          baseOp === '+'
            ? parser.evalAdd(current, rhs)
            : baseOp === '-'
              ? parser.evalSub(current, rhs)
              : parser.evalMulDiv(baseOp, current, rhs);
      }
      return;
    }

    if (container.kind === 'dict') {
      const existing = container.entries.find((e) => pyEquals(e.key, keyVal));
      if (existing) existing.value = rhs;
      else container.entries.push({ key: keyVal, value: rhs });
      return;
    }

    throw new PyRuntimeError('TypeError', `'${pyTypeName(container)}' object does not support item assignment`);
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(target)) {
    throw new PyRuntimeError('SyntaxError', `cannot assign to '${target}'`);
  }

  if (op === '=') {
    env.set(target, rhs);
    return;
  }

  if (!env.has(target)) {
    throw new PyRuntimeError('NameError', `name '${target}' is not defined`);
  }
  const current = env.get(target)!;
  const baseOp = op[0];
  const parser = new ExprParser([], env, output);
  const nextVal =
    baseOp === '+'
      ? parser.evalAdd(current, rhs)
      : baseOp === '-'
        ? parser.evalSub(current, rhs)
        : parser.evalMulDiv(baseOp, current, rhs);
  env.set(target, nextVal);
}

export function runPythonCode(code: string): PythonRunResult {
  const output: string[] = [];
  const env = new Map<string, PyValue>();

  const rawLines = code.split(/\r?\n/);
  const parsedLines: SourceLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const cleaned = stripInlineComment(rawLines[i]);
    if (cleaned.trim().length === 0) continue;
    const indent = cleaned.length - cleaned.trimStart().length;
    parsedLines.push({
      lineNum: i + 1,
      indent,
      text: cleaned.trim(),
    });
  }

  try {
    if (parsedLines.length > 0) {
      executeBlock(parsedLines, 0, parsedLines[0].indent, env, output);
    }
    const variables: VariableSnapshot[] = Array.from(env.entries()).map(([name, val]) => ({
      name,
      typeName: pyTypeName(val),
      repr: pyRepr(val),
    }));
    return { output, error: null, variables };
  } catch (err) {
    const variables: VariableSnapshot[] = Array.from(env.entries()).map(([name, val]) => ({
      name,
      typeName: pyTypeName(val),
      repr: pyRepr(val),
    }));
    if (err instanceof PyRuntimeError) {
      const linePart = err.line ? `Line ${err.line}: ` : '';
      return {
        output,
        error: `${linePart}${err.errorType}: ${err.message}`,
        variables,
      };
    }
    return {
      output,
      error: `RuntimeError: ${(err as Error).message}`,
      variables,
    };
  }
}
