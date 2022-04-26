import { createSlice } from '@reduxjs/toolkit'
import {
    AppState,
    connectorsObject,
    getLastConnectorName,
    LOCAL_STORAGE_LAST_CONNECTOR_KEY,
} from '../../app'

export interface Web3State {
    lastConnectorName: string | null
}

const initialState: Web3State = {
    lastConnectorName:
        typeof window === 'object' ? getLastConnectorName() : null,
}

type Action<T> = {
    payload: T
    type: string
}

export const navigationSlice = createSlice({
    name: 'web3',
    initialState,
    reducers: {
        setLastConnectorName(
            state,
            { payload: name }: Action<keyof typeof connectorsObject>,
        ) {
            localStorage.setItem(LOCAL_STORAGE_LAST_CONNECTOR_KEY, name)
            state.lastConnectorName = name
        },

        clearLastConnectorName(state) {
            localStorage.removeItem(LOCAL_STORAGE_LAST_CONNECTOR_KEY)
            state.lastConnectorName = null
        },
    },
})

export const { setLastConnectorName, clearLastConnectorName } =
    navigationSlice.actions

export const selectLastConnectorName = (state: AppState) =>
    state.web3.lastConnectorName

export default navigationSlice.reducer
