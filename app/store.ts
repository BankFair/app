import {
    configureStore,
    ThunkAction,
    Action as ReduxAction,
} from '@reduxjs/toolkit'

// Do not use `../features`
import { web3Reducer } from '../features/web3/web3Slice'
import { poolsReducer } from '../features/pools/poolsSlice'

export function makeStore() {
    return configureStore({
        reducer: {
            web3: web3Reducer,
            pools: poolsReducer,
        },
    })
}

export const store = makeStore()

export type AppState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    AppState,
    unknown,
    ReduxAction<string>
>

export type Action<T> = {
    payload: T
    type: string
}
