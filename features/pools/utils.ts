import { store } from '../../store'
import { fetchStats } from './poolsSlice'

export async function refetchStatsIfUsed(poolAddress: string) {
    const pool = store.getState().pools[poolAddress]
    const shouldRefetch = pool.loading.includes('stats') || pool.stats

    if (!shouldRefetch) return

    store.dispatch(fetchStats(poolAddress))
}
