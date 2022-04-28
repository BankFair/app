import { createSlice } from '@reduxjs/toolkit'
import { Connector } from '@web3-react/types'
import {
    AppState,
    connectorsObject,
    jsonParse,
    LOCAL_STORAGE_LAST_CONNECTOR_KEY,
} from '../../app'

export interface Web3State {
    lastConnectorName: string | null
    manager: string | undefined
}

const initialState: Web3State = {
    lastConnectorName:
        typeof window === 'object' ? getLastConnectorName() : null,
    manager: undefined,
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
            localStorage.setItem(
                LOCAL_STORAGE_LAST_CONNECTOR_KEY,
                JSON.stringify(name),
            )
            state.lastConnectorName = name
        },

        clearLastConnectorName(state) {
            localStorage.removeItem(LOCAL_STORAGE_LAST_CONNECTOR_KEY)
            state.lastConnectorName = null
        },

        setManager(state, action: Action<string>) {
            state.manager = action.payload
        },
    },
})

export const { setLastConnectorName, clearLastConnectorName, setManager } =
    navigationSlice.actions

export const selectLastConnector = (state: AppState): Connector | undefined =>
    connectorsObject[
        state.web3.lastConnectorName as keyof typeof connectorsObject
    ]

export const selectManager = (state: AppState) => state.web3.manager

export default navigationSlice.reducer

function getLastConnectorName(): string | null {
    return jsonParse(localStorage.getItem(LOCAL_STORAGE_LAST_CONNECTOR_KEY))
}
