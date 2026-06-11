import { useEffect, useState } from 'react'
import { useTaskStore } from '../stores/taskStore'
import { useLinkStore } from '../stores/linkStore'
import { useResourceStore } from '../stores/resourceStore'
import { useProjectStore } from '../stores/projectStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useBaselineStore } from '../stores/baselineStore'

export const useHydrateStores = () => {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const unsub1 = useTaskStore.persist.onFinishHydration(() => {})
    const unsub2 = useLinkStore.persist.onFinishHydration(() => {})
    const unsub3 = useResourceStore.persist.onFinishHydration(() => {})
    const unsub4 = useProjectStore.persist.onFinishHydration(() => {})
    const unsub5 = useSettingsStore.persist.onFinishHydration(() => {})
    const unsub6 = useBaselineStore.persist.onFinishHydration(() => {})

    setHydrated(true)

    return () => {
      unsub1?.()
      unsub2?.()
      unsub3?.()
      unsub4?.()
      unsub5?.()
      unsub6?.()
    }
  }, [])

  return hydrated
}
