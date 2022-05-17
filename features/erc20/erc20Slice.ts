import { createAsyncThunk, createSlice, Draft } from '@reduxjs/toolkit'
import {
    createFetchIntervalHook,
    CustomBatchProvider,
    getERC20Contract,
} from '../../app'
import type { Action } from '../../store'

interface Allowance {
    token: string
    spender: string
    account: string
    allowance: string
    blockNumber: number
}

interface Balance {
    token: string
    account: string
    balance: string
    blockNumber: number
}

interface State {
    allowances: Allowance[]
    balances: Balance[]
}

const initialState: State = {
    allowances: [],
    balances: [],
}

const fetchAllowanceAndBalance = createAsyncThunk(
    'erc20/fetchAllowanceAndBalance',
    async ({
        token,
        spender,
        account,
    }: {
        token: string
        spender: string
        account: string
    }) => {
        const provider = new CustomBatchProvider(3)
        const contract = getERC20Contract(token).connect(provider)

        const [allowance, balance, blockNumber] = await Promise.all([
            contract.allowance(account, spender),
            contract.balanceOf(account),
            provider.getCurrentBlockNumber(),
        ])

        return {
            allowance: allowance.toHexString(),
            balance: balance.toHexString(),
            blockNumber,
        }
    },
)

export const useFetchIntervalAllowanceAndBalance = createFetchIntervalHook(
    fetchAllowanceAndBalance,
    30_000,
)

export const erc20Slice = createSlice({
    name: 'erc20',
    initialState,
    reducers: {
        setAllowance({ allowances }, { payload }: Action<Allowance>) {
            updateAllowance(allowances, payload)
        },
        setBalance({ balances }, { payload }: Action<Balance>) {
            updateBalance(balances, payload)
        },
    },
    extraReducers(builder) {
        builder.addCase(
            fetchAllowanceAndBalance.fulfilled,
            (
                state,
                {
                    payload: { balance, blockNumber, allowance },
                    meta: {
                        arg: { token, spender, account },
                    },
                },
            ) => {
                updateAllowance(state.allowances, {
                    account,
                    allowance,
                    token,
                    spender,
                    blockNumber,
                })
                updateBalance(state.balances, {
                    account,
                    balance,
                    token,
                    blockNumber,
                })
            },
        )
    },
})

function updateAllowance(allowances: Draft<Allowance[]>, payload: Allowance) {
    const { account, token, spender, blockNumber } = payload
    const index = allowances.findIndex(
        (allowance) =>
            allowance.account === account &&
            allowance.token === token &&
            allowance.spender === spender,
    )
    if (index !== -1) {
        const oldBlockNumber = allowances[index].blockNumber
        if (blockNumber <= oldBlockNumber) return

        allowances.splice(index, 1)
    }
    allowances.push(payload)
}

function updateBalance(balances: Draft<Balance[]>, payload: Balance) {
    const { account, token, blockNumber } = payload
    const index = balances.findIndex(
        (balance) => balance.account === account && balance.token === token,
    )
    if (index !== -1) {
        const oldBlockNumber = balances[index].blockNumber
        if (blockNumber <= oldBlockNumber) return

        balances.splice(index, 1)
    }
    balances.push(payload)
}

export const { setAllowance, setBalance } = erc20Slice.actions
