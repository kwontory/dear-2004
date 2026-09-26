/** 최대 길이로 자르되 이모지 등 surrogate pair가 반으로 잘리지 않게 한다. */
export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  let cut = value.slice(0, maxLength)
  const last = cut.charCodeAt(cut.length - 1)
  if (last >= 0xd800 && last <= 0xdbff) cut = cut.slice(0, -1)
  return cut
}

export interface TextInsertResult {
  value: string
  /** 삽입 후 커서 위치 */
  cursor: number
}

/**
 * 선택 영역을 insert로 바꾼다 (특수문자 넣기).
 * 최대 길이를 넘으면 들어갈 수 있는 만큼만 넣는다.
 */
export function insertText(
  value: string,
  insert: string,
  selectionStart: number,
  selectionEnd: number,
  maxLength: number,
): TextInsertResult {
  const start = Math.min(Math.max(0, selectionStart), value.length)
  const end = Math.min(Math.max(start, selectionEnd), value.length)
  const before = value.slice(0, start)
  const after = value.slice(end)
  const room = Math.max(0, maxLength - before.length - after.length)
  const fitted = truncateText(insert, room)
  return { value: before + fitted + after, cursor: start + fitted.length }
}
