import { createSlice } from '@reduxjs/toolkit'
import { Connector } from '@web3-react/types'
import {
    AppState,
    connectorsObject,
    jsonParse,
    LOCAL_STORAGE_LAST_CONNECTOR_KEY,
} from '../../app'
import { getERC20Contract } from './utils'

export interface Web3State {
    lastConnectorName: string | null
    managerAddress: string | undefined
    tokenAddress: string | undefined
    tokenDecimals: number | undefined
}

const initialState: Web3State = {
    lastConnectorName:
        typeof window === 'object' ? getLastConnectorName() : null,
    managerAddress: undefined, // TODO: Cache on build time
    tokenAddress: undefined, // TODO: Cache on build time
    tokenDecimals: undefined, // TODO: Cache on build time
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

        setManagerAddress(state, action: Action<string>) {
            state.managerAddress = action.payload
        },
        setTokenAddress(state, action: Action<string>) {
            state.tokenAddress = action.payload
        },
        setTokenDecimals(state, action: Action<number>) {
            state.tokenDecimals = action.payload
        },
    },
})

export const {
    setLastConnectorName,
    clearLastConnectorName,
    setManagerAddress,
    setTokenAddress,
    setTokenDecimals,
} = navigationSlice.actions

export const selectLastConnector = (state: AppState): Connector | undefined =>
    connectorsObject[
        state.web3.lastConnectorName as keyof typeof connectorsObject
    ]

export const selectManagerAddress = (state: AppState) =>
    state.web3.managerAddress
export const selectTokenAddress = (state: AppState) => state.web3.tokenAddress
export const selectTokenContract = (state: AppState) => {
    const tokenAddress = state.web3.tokenAddress
    if (tokenAddress) return getERC20Contract(tokenAddress)
    return null
}
export const selectTokenDecimals = (state: AppState) => state.web3.tokenDecimals

export default navigationSlice.reducer

function getLastConnectorName(): string | null {
    return jsonParse(localStorage.getItem(LOCAL_STORAGE_LAST_CONNECTOR_KEY))
}
