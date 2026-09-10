//  Nectogram - Telegram MTProto API Client Library for Node.js
//  Copyright (C) 2024-present Nectogram contributors
//
//  This file is part of Nectogram.
//
//  Nectogram is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Lesser General Public License as published
//  by the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  Nectogram is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Lesser General Public License for more details.
//
//  You should have received a copy of the GNU Lesser General Public License
//  along with Nectogram.  If not, see <http://www.gnu.org/licenses/>.

// TL Compiler — reads auth_key.tl + sys_msgs.tl + main_api.tl,
// generates TypeScript classes in src/raw/{types,functions,base}/ and src/raw/all.ts.
// Usage: npm run generate

import * as fs from 'node:fs'
import * as path from 'node:path'

// ── Configuration ──────────────────────────────────────────────────────────

const HOME_PATH       = path.resolve('compiler')
const TL_SOURCE_PATH  = path.join(HOME_PATH, 'tl-source')
const DEST_PATH       = path.resolve('src/raw')
const TYPES_PATH      = path.join(DEST_PATH, 'types')
const FUNCTIONS_PATH  = path.join(DEST_PATH, 'functions')
const BASE_PATH       = path.join(DEST_PATH, 'base')

// ── Mots réservés JS/TS ──────────────────────────────────────────────────────

const JS_RESERVED = new Set([
  'default', 'delete', 'function', 'class', 'const', 'let', 'var',
  'import', 'export', 'extends', 'implements', 'interface', 'package',
  'private', 'protected', 'public', 'static', 'yield', 'super', 'this',
  'typeof', 'void', 'with', 'case', 'catch', 'break', 'continue',
  'debugger', 'do', 'else', 'finally', 'for', 'if', 'in', 'instanceof',
  'new', 'return', 'switch', 'throw', 'try', 'while', 'enum', 'async', 'await',
  'type', 'symbol', 'any', 'never', 'unknown'
])

// ── Regex ──────────────────────────────────────────────────────────────────

const SECTION_RE    = /---(\w+)---/
const LAYER_RE      = /\/\/\s+LAYER\s+(\d+)/
const COMBINATOR_RE = /^([\w.]+)#([0-9a-f]+)\s(?:.*)=\s([\w<>.!]+);$/gm
const ARGS_RE       = /[^{](\w+):([\w?!.<>#]+)/g
const FLAGS_RE_2    = /flags(\d?)\.(\d+)\?([\w<>.!]+)/
const FLAGS_RE_3    = /flags\d?:#/

const WARNING = `// ⚠️ AUTO-GENERATED FILE — DO NOT EDIT
// All changes will be lost on the next \`npm run generate\`
`

// ── Helpers ────────────────────────────────────────────────────────────────

function snake(s: string): string {
  s = s.replace(/([A-Z][a-z]+)/g, '_$1')
  return s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase().replace(/^_/, '')
}

function camel(s: string): string {
  return s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('')
}

function mkdirp(p: string) {
  fs.mkdirSync(p, { recursive: true })
}

function write(filePath: string, content: string) {
  mkdirp(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf8')
}

/** Convertit un type TL core en type TypeScript */
function tlTypeToTS(tlType: string): string | null {
  const t = tlType.toLowerCase()
  if (t.startsWith('!') || t === 'object') return 'TLObject'
  if (t === 'int' || t === 'int32') return 'number'
  if (t === 'long' || t === 'int64') return 'bigint'
  if (t === 'int128' || t === 'int256') return 'Buffer'
  if (t === 'double') return 'number'
  if (t === 'bytes') return 'Buffer'
  if (t === 'string') return 'string'
  if (t === 'bool' || t === 'true') return 'boolean'
  return null
}

/** Lecture primitive en code TS */
function primitiveReadCall(tlType: string, readerVar: string): string | null {
  const t = tlType.toLowerCase()
  if (t.startsWith('!') || t === 'object') return `TLObject.read(${readerVar}) as any`
  if (t === 'int') return `${readerVar}.readInt32(true)`
  if (t === 'long') return `${readerVar}.readInt64()`
  if (t === 'int128') return `${readerVar}.readInt128()`
  if (t === 'int256') return `${readerVar}.readInt256()`
  if (t === 'double') return `${readerVar}.readDouble()`  
  if (t === 'bytes') return `${readerVar}.readTLBytes()`
  if (t === 'string') return `${readerVar}.readTLString()`
  if (t === 'bool') return `${readerVar}.readBool()`
  if (t === 'true') return 'true'
  return null
}

/** Écriture primitive en code TS */
function primitiveWriteCall(tlType: string, varName: string, writerVar: string): string | null {
  const t = tlType.toLowerCase()
  if (t.startsWith('!') || t === 'object') return `${writerVar}.write((${varName} as TLObject).write())`
  if (t === 'int') return `${writerVar}.writeInt32(${varName})`
  if (t === 'long') return `${writerVar}.writeInt64(${varName})`
  if (t === 'int128') return `${writerVar}.writeInt128(${varName})`
  if (t === 'int256') return `${writerVar}.writeInt256(${varName})`
  if (t === 'double') return `${writerVar}.writeDouble(${varName})`
  if (t === 'bytes') return `${writerVar}.writeTLBytes(${varName})`
  if (t === 'string') return `${writerVar}.writeTLString(${varName})`
  if (t === 'bool') return `${writerVar}.writeBool(${varName})`
  if (t === 'true') return ''
  return null
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Arg {
  name: string
  tlType: string
  isFlag: boolean
  flagGroup: string
  flagIndex: number
  flagType: string
}

interface Combinator {
  section: 'types' | 'functions'
  qualname: string
  namespace: string
  name: string
  id: string
  hasFlags: boolean
  args: Arg[]
  qualtype: string
  typespace: string
  type: string
}

// ── Parse ──────────────────────────────────────────────────────────────────

function parseArgs(line: string): Arg[] {
  const result: Arg[] = []
  const raw: Array<[string, string]> = []
  let m: RegExpExecArray | null

  ARGS_RE.lastIndex = 0
  while ((m = ARGS_RE.exec(line)) !== null) {
    raw.push([m[1], m[2]])
  }

  for (let [name, tlType] of raw) {
    if (name === 'self') name = 'isSelf'
    else if (name === 'from') name = 'fromPeer'
    else if (JS_RESERVED.has(name)) name = `${name}_`

    const flagMatch = FLAGS_RE_2.exec(tlType)
    if (flagMatch) {
      result.push({
        name,
        tlType,
        isFlag: true,
        flagGroup: flagMatch[1],
        flagIndex: parseInt(flagMatch[2]),
        flagType: flagMatch[3],
      })
    } else {
      result.push({
        name,
        tlType,
        isFlag: false,
        flagGroup: '',
        flagIndex: -1,
        flagType: tlType,
      })
    }
  }

  return result
}

function parseTLSchema(schema: string): { layer: string; combinators: Combinator[] } {
  const lines = schema.split('\n')
  let section: 'types' | 'functions' = 'types'
  let layer = '0'
  const combinators: Combinator[] = []

  for (const line of lines) {
    const sectionM = SECTION_RE.exec(line)
    if (sectionM) {
      section = sectionM[1] as 'types' | 'functions'
      continue
    }

    const layerM = LAYER_RE.exec(line)
    if (layerM) {
      layer = layerM[1]
      continue
    }

    COMBINATOR_RE.lastIndex = 0
    const m = COMBINATOR_RE.exec(line)
    if (!m) continue

    const [, qualname, id, qualtype] = m

    const dotIdx = qualname.indexOf('.')
    const namespace = dotIdx >= 0 ? qualname.slice(0, dotIdx) : ''
    const rawName   = dotIdx >= 0 ? qualname.slice(dotIdx + 1) : qualname
    const name = camel(rawName)

    const typeDot = qualtype.indexOf('.')
    const typespace = typeDot >= 0 ? qualtype.slice(0, typeDot) : ''
    const typeName  = typeDot >= 0 ? qualtype.slice(typeDot + 1) : qualtype
    const type = camel(typeName)

    const hasFlags = FLAGS_RE_3.test(line)
    const args = parseArgs(line)
      .filter(a => !(a.name.match(/^flags\d?$/) && a.tlType === '#'))

    combinators.push({
      section,
      qualname: namespace ? `${namespace}.${name}` : name,
      namespace,
      name,
      id: `0x${id}`,
      hasFlags,
      args,
      qualtype: typespace ? `${typespace}.${type}` : type,
      typespace,
      type,
    })
  }

  return { layer, combinators }
}

// ── Génération ─────────────────────────────────────────────────────────────

function tsTypeForArg(arg: Arg, typesBase: string): string {
  const ft = arg.isFlag ? arg.flagType : arg.tlType

  if (ft === 'true') return 'boolean'
  if (ft.startsWith('!') || ft.toLowerCase() === 'object') return 'TLObject'

  const prim = tlTypeToTS(ft)
  if (prim) return prim

  if (ft.toLowerCase().startsWith('vector<')) {
    const inner = ft.slice(7, -1)
    if (inner.startsWith('!') || inner.toLowerCase() === 'object') return 'TLObject[]'
    const innerPrim = tlTypeToTS(inner)
    if (innerPrim) return `${innerPrim}[]`
    const innerQn = inner.includes('.') ? `${inner.split('.')[0]}.${camel(inner.split('.')[1])}` : camel(inner)
    return `${typesBase}.${innerQn}[]`
  }

  const qn = ft.includes('.') ? `${ft.split('.')[0]}.${camel(ft.split('.')[1])}` : camel(ft)
  return `${typesBase}.${qn}`
}

function generateCombinatorFile(c: Combinator, destFile: string) {
  const lines: string[] = [WARNING]

  const relPrefix = c.namespace ? '../..' : '..'

  lines.push(`import { BinaryReader } from '${relPrefix}/core/BinaryReader.js'`)
  lines.push(`import { BinaryWriter } from '${relPrefix}/core/BinaryWriter.js'`)
  lines.push(`import { TLObject, objects } from '${relPrefix}/core/TLObject.js'`)
  lines.push(`import * as base from '${relPrefix}/base/index.js'`)
  lines.push('')

  const flagGroups = new Set<string>()
  for (const arg of c.args) {
    if (arg.isFlag) flagGroups.add(arg.flagGroup)
  }

  const sortedArgs = [
    ...c.args.filter(a => !a.isFlag),
    ...c.args.filter(a => a.isFlag),
  ]

  const params = sortedArgs.map(a => {
    const tsType = tsTypeForArg(a, 'base')
    const opt = a.isFlag ? '?' : ''
    return `    readonly ${a.name}${opt}: ${tsType}`
  })

  lines.push(`export class ${c.name} extends TLObject {`)
  lines.push(`  static readonly ID = ${c.id}`)
  lines.push(`  readonly QUALNAME = '${c.section}.${c.qualname}'`)
  lines.push('')

  if (params.length > 0) {
    lines.push(`  constructor(`)
    lines.push(params.join(',\n'))
    lines.push(`  ) { super() }`)
  } else {
    lines.push(`  constructor() { super() }`)
  }
  lines.push('')

  // read()
  lines.push(`  static read(r: BinaryReader): ${c.name} {`)

  for (const fg of flagGroups) {
    lines.push(`    const flags${fg} = r.readInt32(false)`)
  }

  for (const a of c.args) {
    if (a.isFlag && a.flagType === 'true') {
      lines.push(`    const ${a.name} = Boolean(flags${a.flagGroup} & (1 << ${a.flagIndex}))`)
      continue
    }

    const ft = a.isFlag ? a.flagType : a.tlType
    const guard = a.isFlag ? `flags${a.flagGroup} & (1 << ${a.flagIndex}) ? ` : ''
    const guardEnd = a.isFlag ? ` : undefined` : ''

    const pRead = primitiveReadCall(ft, 'r')

    if (ft.toLowerCase().startsWith('vector<')) {
      const inner = ft.slice(7, -1)
      const innerPrimRead = primitiveReadCall(inner, 'r')
      const itemReader = innerPrimRead
        ? `(r: BinaryReader) => ${innerPrimRead}`
        : `(r: BinaryReader) => TLObject.read(r) as any`
      lines.push(`    const ${a.name} = ${guard}(() => { const id = r.readInt32(false); if (id !== 0x1cb5c415) throw new Error('Expected Vector'); const cnt = r.readInt32(false); const readItem = ${itemReader}; return Array.from({length: cnt}, () => readItem(r)); })()${guardEnd}`)
    } else if (pRead) {
      lines.push(`    const ${a.name} = ${guard}${pRead}${guardEnd}`)
    } else {
      lines.push(`    const ${a.name} = ${guard}TLObject.read(r) as any${guardEnd}`)
    }
  }

  const returnArgs = sortedArgs.map(a => a.name).join(', ')
  lines.push(`    return new ${c.name}(${returnArgs})`)
  lines.push(`  }`)
  lines.push('')

  // write()
  lines.push(`  write(): Buffer {`)
  lines.push(`    const w = new BinaryWriter()`)
  lines.push(`    w.writeInt32(${c.name}.ID, false)`)

  for (const fg of flagGroups) {
    const flagBits = c.args
      .filter(a => a.isFlag && a.flagGroup === fg)
      .map(a => {
        if (a.flagType === 'true' || a.flagType.toLowerCase().startsWith('vector<')) {
          return `(this.${a.name} ? (1 << ${a.flagIndex}) : 0)`
        }
        return `(this.${a.name} !== undefined ? (1 << ${a.flagIndex}) : 0)`
      })
      .join(' | ')
    lines.push(`    w.writeInt32(${flagBits || '0'}, false) // flags${fg}`)
  }

  for (const a of c.args) {
    if (a.isFlag && a.flagType === 'true') continue

    const ft = a.isFlag ? a.flagType : a.tlType
    const guard = a.isFlag ? `if (this.${a.name} !== undefined) { ` : ''
    const guardEnd = a.isFlag ? ` }` : ''

    const pWrite = primitiveWriteCall(ft, `this.${a.name}`, 'w')

    if (ft.toLowerCase().startsWith('vector<')) {
      const inner = ft.slice(7, -1)
      const innerPWrite = primitiveWriteCall(inner, 'item', 'w')
      const writeLoop = innerPWrite
        ? `for (const item of this.${a.name}) { ${innerPWrite} }`
        : `for (const item of this.${a.name}) { w.write((item as TLObject).write()) }`
      lines.push(`    ${guard}w.writeInt32(0x1cb5c415, false); w.writeInt32(this.${a.name}.length, false); ${writeLoop}${guardEnd}`)
    } else if (pWrite !== null) {
      if (pWrite === '') continue
      lines.push(`    ${guard}${pWrite}${guardEnd}`)
    } else {
      lines.push(`    ${guard}w.write((this.${a.name} as TLObject).write())${guardEnd}`)
    }
  }

  lines.push(`    return w.toBuffer()`)
  lines.push(`  }`)
  lines.push(`}`)
  lines.push('')
  lines.push(`objects.set(${c.name}.ID, ${c.name})`)
  lines.push('')

  write(destFile, lines.join('\n'))
}

function generateBaseFile(qualtype: string, constructors: string[], destFile: string) {
  const typespace = qualtype.includes('.') ? qualtype.split('.')[0] : ''
  const typeName  = qualtype.includes('.') ? qualtype.split('.')[1] : qualtype

  const relPrefix = typespace ? '../..' : '..'

  const importItems = constructors.map(qn => {
    const ns   = qn.includes('.') ? qn.split('.')[0] : ''
    const name = qn.includes('.') ? qn.split('.')[1] : qn
    const mod  = name === 'Updates' ? 'updates_t' : snake(name)
    const rel  = ns ? `${relPrefix}/types/${ns}/${mod}.js` : `${relPrefix}/types/${mod}.js`
    const alias = name === typeName ? `${name}Type` : name
    return { name, alias, statement: name === typeName ? `import type { ${name} as ${alias} } from '${rel}'` : `import type { ${name} } from '${rel}'` }
  })

  const unionType = importItems.map(i => i.alias).join(' | ')

  const content = [
    WARNING,
    ...importItems.map(i => i.statement),
    '',
    `export type ${typeName} = ${unionType || 'never'}`,
    '',
  ].join('\n')

  write(destFile, content)
}

function generateNamespaceIndex(dir: string, names: string[], isTypeOnly = false) {
  const lines = [WARNING]
  for (const name of names) {
    const mod = name === 'Updates' ? 'updates_t' : snake(name)
    const kw  = isTypeOnly ? 'export type' : 'export'
    lines.push(`${kw} { ${name} } from './${mod}.js'`)
  }
  write(path.join(dir, 'index.ts'), lines.join('\n') + '\n')
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log('🔧 TL Compiler — Reading schemas...')

  const authKey  = fs.readFileSync(path.join(TL_SOURCE_PATH, 'auth_key.tl'), 'utf8')
  const sysMsgs  = fs.readFileSync(path.join(TL_SOURCE_PATH, 'sys_msgs.tl'), 'utf8')
  const mainApi  = fs.readFileSync(path.join(TL_SOURCE_PATH, 'main_api.tl'), 'utf8')

  const schema = [authKey, sysMsgs, mainApi].join('\n')

  console.log('🔍 Parsing combinators...')
  const { layer, combinators } = parseTLSchema(schema)
  console.log(`   Layer: ${layer}, Combinators: ${combinators.length}`)

  fs.rmSync(TYPES_PATH,     { recursive: true, force: true })
  fs.rmSync(FUNCTIONS_PATH, { recursive: true, force: true })
  fs.rmSync(BASE_PATH,      { recursive: true, force: true })

  const namespacesToTypes:        Map<string, string[]> = new Map()
  const namespacesToConstructors: Map<string, string[]> = new Map()
  const namespacesToFunctions:    Map<string, string[]> = new Map()
  const typesToConstructors:      Map<string, string[]> = new Map()

  for (const c of combinators) {
    if (c.section !== 'types') continue
    const existing = typesToConstructors.get(c.qualtype) ?? []
    existing.push(c.qualname)
    typesToConstructors.set(c.qualtype, existing)
  }

  let generated = 0

  for (const c of combinators) {
    const dirBase = c.section === 'types' ? TYPES_PATH : FUNCTIONS_PATH
    const dir     = c.namespace ? path.join(dirBase, c.namespace) : dirBase
    const modName = c.name === 'Updates' ? 'UpdatesT' : c.name
    const destFile = path.join(dir, `${snake(modName)}.ts`)

    generateCombinatorFile(c, destFile)
    generated++

    if (c.section === 'types') {
      const nsMap = namespacesToConstructors.get(c.namespace) ?? []
      if (!nsMap.includes(c.name)) nsMap.push(c.name)
      namespacesToConstructors.set(c.namespace, nsMap)

      const tMap = namespacesToTypes.get(c.namespace) ?? []
      if (!tMap.includes(c.type)) tMap.push(c.type)
      namespacesToTypes.set(c.namespace, tMap)
    } else {
      const nsMap = namespacesToFunctions.get(c.namespace) ?? []
      if (!nsMap.includes(c.name)) nsMap.push(c.name)
      namespacesToFunctions.set(c.namespace, nsMap)
    }
  }

  console.log(`   Generated ${generated} combinator files`)

  console.log('📦 Generating base/ type unions...')
  let baseCount = 0
  for (const [qualtype, constructors] of typesToConstructors) {
    const typespace = qualtype.includes('.') ? qualtype.split('.')[0] : ''
    const typeName  = qualtype.includes('.') ? qualtype.split('.')[1] : qualtype
    const dir = typespace ? path.join(BASE_PATH, typespace) : BASE_PATH
    const modName = typeName === 'Updates' ? 'UpdatesT' : typeName
    const destFile = path.join(dir, `${snake(modName)}.ts`)
    generateBaseFile(qualtype, constructors, destFile)
    baseCount++
  }
  console.log(`   Generated ${baseCount} base type files`)

  // Generate namespace index files — types
  for (const [ns, names] of namespacesToConstructors) {
    const dir = ns ? path.join(TYPES_PATH, ns) : TYPES_PATH
    generateNamespaceIndex(dir, names, false)
  }
  const typeNamespaces = [...namespacesToConstructors.keys()].filter(Boolean)
  const rootTypeExports = (namespacesToConstructors.get('') || []).map(name => {
    const mod = name === 'Updates' ? 'updates_t' : snake(name)
    return `export { ${name} } from './${mod}.js'`
  })
  write(path.join(TYPES_PATH, 'index.ts'), [
    WARNING,
    ...rootTypeExports,
    ...typeNamespaces.flatMap(ns => [
      `export * as ${ns} from './${ns}/index.js'`,
    ]),
  ].join('\n') + '\n')

  // Generate namespace index files — functions
  for (const [ns, names] of namespacesToFunctions) {
    const dir = ns ? path.join(FUNCTIONS_PATH, ns) : FUNCTIONS_PATH
    generateNamespaceIndex(dir, names, false)
  }
  const funcNamespaces = [...namespacesToFunctions.keys()].filter(Boolean)
  const rootFuncExports = (namespacesToFunctions.get('') || []).map(name => {
    const mod = name === 'Updates' ? 'updates_t' : snake(name)
    return `export { ${name} } from './${mod}.js'`
  })
  write(path.join(FUNCTIONS_PATH, 'index.ts'), [
    WARNING,
    ...rootFuncExports,
    ...funcNamespaces.map(ns => `export * as ${ns} from './${ns}/index.js'`),
  ].join('\n') + '\n')

  // Generate base namespace index files
  const baseNamespaces = new Set<string>()
  for (const qualtype of typesToConstructors.keys()) {
    const ns = qualtype.includes('.') ? qualtype.split('.')[0] : ''
    baseNamespaces.add(ns)
  }
  for (const ns of baseNamespaces) {
    if (!ns) continue
    const names: string[] = []
    for (const qt of typesToConstructors.keys()) {
      if (qt.startsWith(ns + '.')) names.push(camel(qt.split('.')[1]))
    }
    generateNamespaceIndex(path.join(BASE_PATH, ns), names, true)
  }
  const rootBaseExports: string[] = []
  for (const qt of typesToConstructors.keys()) {
    if (!qt.includes('.')) {
      const name = camel(qt)
      const mod = name === 'Updates' ? 'updates_t' : snake(qt)
      rootBaseExports.push(`export type { ${name} } from './${mod}.js'`)
    }
  }
  const nsBaseExports = [...baseNamespaces].filter(Boolean).flatMap(ns => [
    `export * as ${ns} from './${ns}/index.js'`,
    `export * from './${ns}/index.js'`,
  ])
  write(path.join(BASE_PATH, 'index.ts'), [
    WARNING,
    ...rootBaseExports,
    ...nsBaseExports,
  ].join('\n') + '\n')

  console.log('📋 Generating all.ts...')
  const allLines = [
    WARNING,
    `export const layer = ${layer}`,
    '',
    '// Map: constructor ID (uint32) → qualified class name',
    'export const objects: Record<number, string> = {',
    ...combinators.map(c => `  ${c.id}: '${c.section}.${c.qualname}',`),
    '  0xbc799737: \'core.BoolFalse\',',
    '  0x997275b5: \'core.BoolTrue\',',
    '  0x1cb5c415: \'core.Vector\',',
    '  0x73f1f8dc: \'core.MsgContainer\',',
    '  0xae500895: \'core.FutureSalts\',',
    '  0x0949d9dc: \'core.FutureSalt\',',
    '  0x3072cfa1: \'core.GzipPacked\',',
    '  0x5bb8e511: \'core.Message\',',
    '}',
    '',
  ]
  write(path.join(DEST_PATH, 'all.ts'), allLines.join('\n'))

  console.log('📋 Generating src/raw/index.ts...')
  write(path.join(DEST_PATH, 'index.ts'), [
    WARNING,
    `import * as base from './base/index.js'`,
    `import * as types from './types/index.js'`,
    `import * as functions from './functions/index.js'`,
    '',
    `export * from './core/index.js'`,
    `export { base, types, functions }`,
    `export { layer } from './all.js'`,
  ].join('\n') + '\n')

  console.log(`✅ Done! Layer ${layer} — ${combinators.length} combinators, ${baseCount} base types`)
}

main()
