import {
    ContractTransaction,
    ContractReceipt,
    Event,
} from '@ethersproject/contracts'
import { Result } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { AsyncThunkFulfilledActionCreator } from '@reduxjs/toolkit/dist/createAsyncThunk'

import type { Action, AppDispatch } from '../../store'

export interface Transaction {
    hash: string
    name: string
    status: 'pending' | 'completed' | 'failed'
    visible: boolean
    error?: string
}

type ThunkReturnType = {
    receipt: SerializableReceipt
}
type ThunkArg = { name: string; tx: ContractTransaction }
const trackTransactionThunk = createAsyncThunk<ThunkReturnType, ThunkArg>(
    'transactions/newTransaction',
    async ({ tx }) => {
        try {
            const receipt = serializeReceipt(await tx.wait())
            return { receipt }
        } catch (error) {
            console.error('Transaction failed', error)
            throw error
        }
    },
)

type Return<ThunkReturnType, ThunkArg> = Promise<
    ReturnType<AsyncThunkFulfilledActionCreator<ThunkReturnType, ThunkArg>>
>

export function trackTransaction(
    dispatch: AppDispatch,
    arg: ThunkArg,
): Return<ThunkReturnType, ThunkArg> {
    return dispatch(trackTransactionThunk(arg)) as Promise<
        ReturnType<AsyncThunkFulfilledActionCreator<ThunkReturnType, ThunkArg>>
    >
}

type State = Record<string, Transaction>
const initialState: State = {}

export const transactionsSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {
        hideTransaction(state, action: Action<string>) {
            state[action.payload].visible = false
        },
    },
    extraReducers(builder) {
        builder
            .addCase(
                trackTransactionThunk.pending,
                (
                    state,
                    {
                        meta: {
                            arg: {
                                tx: { hash },
                                name,
                            },
                        },
                    },
                ) => {
                    state[hash] = {
                        hash,
                        name,
                        visible: true,
                        status: 'pending',
                    }
                },
            )
            .addCase(
                trackTransactionThunk.fulfilled,
                (
                    state,
                    {
                        meta: {
                            arg: {
                                tx: { hash },
                            },
                        },
                    },
                ) => {
                    const tx = state[hash]
                    if (!tx) {
                        throw new Error(
                            `Tranasction with hash \`${hash}\` not present in state`,
                        )
                    }

                    state[hash] = {
                        ...tx,
                        status: 'completed',
                    }
                },
            )
            .addCase(
                trackTransactionThunk.rejected,
                (
                    state,
                    {
                        meta: {
                            arg: {
                                tx: { hash },
                            },
                        },
                        error,
                    },
                ) => {
                    const tx = state[hash]
                    if (!tx) {
                        throw new Error(
                            `Tranasction with hash \`${hash}\` not present in state`,
                        )
                    }

                    state[hash] = {
                        ...tx,
                        status: 'failed',
                        error: JSON.stringify(error),
                    }
                },
            )
    },
})

export const { hideTransaction } = transactionsSlice.actions

interface SerializableResult {
    array: string[]
    object: Record<string, string>
}

function serializeResult(result: Result): SerializableResult {
    const object: Record<string, string> = {}

    for (const i in result) {
        const value = result[i]
        if (typeof value === 'string') {
            object[i] = value
        } else if (value instanceof BigNumber) {
            object[i] = value.toHexString()
        } else {
            object[i] = JSON.stringify(value)
        }
    }

    return {
        object,
        array: result.map((value) =>
            typeof value === 'string'
                ? value
                : value instanceof BigNumber
                ? value.toHexString()
                : JSON.stringify(value),
        ),
    }
}

interface SerializableEvent {
    args?: SerializableResult
    eventSignature?: string
}

function serializeEvent({ args, eventSignature }: Event): SerializableEvent {
    return {
        args: args ? serializeResult(args) : undefined,
        eventSignature,
    }
}

interface SerializableReceipt {
    events?: SerializableEvent[]
}
function serializeReceipt({ events }: ContractReceipt): SerializableReceipt {
    return {
        events: events?.map(serializeEvent),
    }
}
