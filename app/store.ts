import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'

import web3Reducer from '../features/web3/web3Slice'

export function makeStore() {
    return configureStore({
        reducer: {
            web3: web3Reducer,
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
    Action<string>
>
