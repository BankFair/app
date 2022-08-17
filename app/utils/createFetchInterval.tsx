/* eslint-disable react-hooks/rules-of-hooks */

import { AsyncThunk } from '@reduxjs/toolkit'
import {
    AsyncThunkFulfilledActionCreator,
    AsyncThunkRejectedActionCreator,
} from '@reduxjs/toolkit/dist/createAsyncThunk'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../../store'

type Return<ThunkReturnType, ThunkArg> = Promise<
    | ReturnType<AsyncThunkFulfilledActionCreator<ThunkReturnType, ThunkArg>>
    | ReturnType<AsyncThunkRejectedActionCreator<ThunkArg, {}>>
    | void
>

function throwWhenRejected<T extends { type: string }>(payload: T) {
    if (payload.type.endsWith('rejected')) {
        throw payload
    }

    return payload
}

export function createFetchInterval<ThunkReturnType, ThunkArg = void>(
    action: AsyncThunk<ThunkReturnType, ThunkArg, {}>,
    interval: number,
): {
    fetch(
        dispatch: AppDispatch,
        arg: ThunkArg,
    ): Return<ThunkReturnType, ThunkArg>
    hook(arg: ThunkArg | null): () => Return<ThunkReturnType, ThunkArg>
} {
    const lastCalls: Record<string, number> = {}
    const buffer = 100

    function fetch(dispatch: AppDispatch, arg: ThunkArg) {
        const id = JSON.stringify(arg)
        const lastCall = lastCalls[id]
        const now = Date.now()
        if (!lastCall || lastCall + interval + buffer <= now) {
            lastCalls[id] = now
            return dispatch(action(arg)).then(throwWhenRejected)
        }

        return Promise.resolve()
    }

    return {
        fetch,

        hook(arg) {
            const dispatch = useDispatch<AppDispatch>()
            useEffect(() => {
                if (arg === null) return

                fetch(dispatch, arg).catch(console.error)
                const intervalId = setInterval(() => {
                    fetch(dispatch, arg).catch(console.error)
                }, interval)
                return () => {
                    clearInterval(intervalId)
                }
            }, [arg, dispatch])

            return () => {
                if (arg === null) {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('`arg` was `null`')
                    }

                    return Promise.resolve()
                }
                return dispatch(action(arg)).then(throwWhenRejected)
            }
        },
    }
}
