import {
    configureStore,
    ThunkAction,
    Action as ReduxAction,
} from '@reduxjs/toolkit'
import {
    EqualityFn,
    useSelector as useReduxSelector,
    useDispatch as useReduxDispatch,
} from 'react-redux'

// Do not use `../features`
import { web3Slice } from './features/web3/web3Slice'
import { poolsSlice } from './features/pools/poolsSlice'
import { erc20Slice } from './features/erc20/erc20Slice'

export function makeStore() {
    return configureStore({
        reducer: {
            web3: web3Slice.reducer,
            pools: poolsSlice.reducer,
            erc20: erc20Slice.reducer,
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

export const useSelector: <Selected = unknown>(
    selector: (state: AppState) => Selected,
    equalityFn?: EqualityFn<Selected> | undefined,
) => Selected = useReduxSelector

export const useDispatch: () => AppDispatch = useReduxDispatch
