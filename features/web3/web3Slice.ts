import { createSlice } from '@reduxjs/toolkit'
import { Connector } from '@web3-react/types'
import {
    connectorsObject,
    jsonParse,
    LOCAL_STORAGE_LAST_CONNECTOR_KEY,
} from '../../app'
import type { Action, AppState } from '../../store'

interface State {
    lastConnectorName: string | null
}

const initialState: State = {
    lastConnectorName: getLastConnectorName(),
}

export const web3Slice = createSlice({
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
    },
})

export const { setLastConnectorName, clearLastConnectorName } =
    web3Slice.actions

export const selectLastConnector = (state: AppState): Connector | undefined =>
    connectorsObject[
        state.web3.lastConnectorName as keyof typeof connectorsObject
    ]

function getLastConnectorName(): string | null {
    if (typeof window !== 'object') return null

    return jsonParse(localStorage.getItem(LOCAL_STORAGE_LAST_CONNECTOR_KEY))
}
