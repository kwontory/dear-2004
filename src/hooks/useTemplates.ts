import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorState } from '../editor/types'
import { createTemplateRecord, sortTemplates, type TemplateRecord } from '../templates/templateRecord'
import { openTemplateStore, TemplateStoreError, type TemplateStore } from '../templates/templateStore'

export type TemplateStatus =
  | { kind: 'loading' }
  | { kind: 'ready'; persistent: boolean; skipped: number }
  | { kind: 'error'; message: string }

function errorMessage(error: unknown): string {
  if (error instanceof TemplateStoreError && error.quota) {
    return '브라우저 저장 공간이 가득 찼어요. 안 쓰는 템플릿을 지우고 다시 저장해 주세요.'
  }
  return '템플릿을 저장소에 쓰지 못했어요. 다시 시도해 주세요.'
}

export function useTemplates() {
  const storeRef = useRef<TemplateStore | null>(null)
  const [templates, setTemplates] = useState<TemplateRecord[]>([])
  const [status, setStatus] = useState<TemplateStatus>({ kind: 'loading' })

  const refresh = useCallback(async (store: TemplateStore) => {
    const { records, skipped } = await store.list()
    setTemplates(sortTemplates(records))
    setStatus({ kind: 'ready', persistent: store.persistent, skipped })
  }, [])

  useEffect(() => {
    let cancelled = false
    openTemplateStore()
      .then(async (store) => {
        if (cancelled) return
        storeRef.current = store
        await refresh(store)
      })
      .catch(() => {
        if (!cancelled) setStatus({ kind: 'error', message: '저장된 템플릿을 읽지 못했어요.' })
      })
    return () => {
      cancelled = true
    }
  }, [refresh])

  /** 성공하면 null, 실패하면 사용자에게 보여줄 문구 */
  const run = useCallback(
    async (action: (store: TemplateStore) => Promise<void>): Promise<string | null> => {
      const store = storeRef.current
      if (!store) return '템플릿 저장소를 아직 준비하는 중이에요.'
      try {
        await action(store)
        await refresh(store)
        return null
      } catch (error) {
        return errorMessage(error)
      }
    },
    [refresh],
  )

  const create = useCallback(
    (name: string, state: EditorState) => run((store) => store.put(createTemplateRecord(name, state, Date.now()))),
    [run],
  )

  const overwrite = useCallback(
    (record: TemplateRecord, state: EditorState) =>
      run((store) => store.put({ ...record, updatedAt: Date.now(), state: structuredClone(state) })),
    [run],
  )

  const rename = useCallback(
    (record: TemplateRecord, name: string) => run((store) => store.put({ ...record, name, updatedAt: Date.now() })),
    [run],
  )

  const remove = useCallback((record: TemplateRecord) => run((store) => store.remove(record.id)), [run])

  return { templates, status, create, overwrite, rename, remove }
}
