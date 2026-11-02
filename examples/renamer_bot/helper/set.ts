// Port of helper/set.py

export function escape_invalid_curly_brackets(text: string, valids: string[]): string {
  let new_text = ''
  let idx = 0
  while (idx < text.length) {
    if (text[idx] === '{') {
      if (idx + 1 < text.length && text[idx + 1] === '{') {
        idx += 2
        new_text += '{{'
        continue
      } else {
        let success = false
        for (const v of valids) {
          if (text.slice(idx).startsWith('{' + v + '}')) {
            success = true
            new_text += text.slice(idx, idx + v.length + 2)
            idx += v.length + 2
            break
          }
        }
        if (!success) {
          new_text += '{'
          idx++
        }
        continue
      }
    } else if (text[idx] === '}') {
      if (idx + 1 < text.length && text[idx + 1] === '}') {
        idx += 2
        new_text += '}}'
        continue
      } else {
        new_text += '}'
        idx++
        continue
      }
    } else {
      new_text += text[idx]
      idx++
    }
  }
  return new_text
}
