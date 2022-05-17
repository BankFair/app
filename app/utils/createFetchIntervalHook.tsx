import { AsyncThunk } from '@reduxjs/toolkit'
import {
    AsyncThunkFulfilledActionCreator,
    AsyncThunkRejectedActionCreator,
} from '@reduxjs/toolkit/dist/createAsyncThunk'
import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../../store'

export function createFetchIntervalHook<Returned, ThunkArg = void>(
    action: AsyncThunk<Returned, ThunkArg, {}>,
    interval: number,
): (
    arg: ThunkArg | null,
) => () => Promise<
    | ReturnType<AsyncThunkFulfilledActionCreator<Returned, ThunkArg>>
    | ReturnType<AsyncThunkRejectedActionCreator<ThunkArg, {}>>
> {
    const lastCalls: Record<string, number> = {}
    const buffer = 100

    return (arg) => {
        const dispatch = useDispatch<AppDispatch>()
        const memoArg = useMemo(() => ({ arg, id: JSON.stringify(arg) }), [arg])
        useEffect(() => {
            const { id, arg } = memoArg
            if (arg === null) return
            const fetch = () => {
                const lastCall = lastCalls[id]
                const now = Date.now()
                if (!lastCall || lastCall + interval + buffer <= now) {
                    lastCalls[id] = now
                    dispatch(action(arg))
                }
            }

            fetch()
            const intervalId = setInterval(fetch, interval)
            return () => {
                clearInterval(intervalId)
            }
        }, [memoArg, dispatch])

        return () => {
            if (arg === null) return Promise.reject()
            return dispatch(action(arg))
        }
    }
}
