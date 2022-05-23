import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { contract, LoanStatus, getBatchProviderAndContract } from './contract'
import { createFetchIntervalHook } from '../../app'
import { AppState, Action } from '../../store'

export interface Loan {
    id: number
    status: LoanStatus
    borrower: string
    amount: string
    requestedTime: number
    details: LoanDetails
}

export interface LoanDetails {
    id: number
    totalAmountRepaid: string
    baseAmountRepaid: string
    interestPaid: string
    approvedTime: number
}

interface Stats {
    loans: number
    balanceStaked: string
    amountDepositable: string
    poolFunds: string
    poolLiquidity: string
    apy: number
    blockNumber: number
}

interface ManagerInfo {
    staked: string
    unstakable: string
    blockNumber: number
}

interface AccountInfo {
    balance: string
    withdrawable: string
    blockNumber: number
}

export interface Pool {
    name: string
    managerAddress: string
    tokenAddress: string
    tokenDecimals: number
    loans: Loan[]
    loansBlockNumber: number
    loanUpdates: { loan: Loan; blockNumber: number }[]
    stats: Stats | null
    managerInfo: ManagerInfo | null
    accountInfo: Record<string, AccountInfo>
    loading: 'stats'[]
}

const oneHour = 60 * 60 * 1000

export const fetchStats = createAsyncThunk(
    'pools/fetchStats',
    async (poolAddress: string) => {
        const { provider, contract: attached } = getBatchProviderAndContract(
            7,
            contract.attach(poolAddress),
        )

        const [
            loansCount,
            balanceStaked,
            amountDepositable,
            poolFunds,
            poolLiquidity,
            apy,
            blockNumber,
        ] = await Promise.all([
            attached.loansCount(),
            attached.balanceStaked(),
            attached.amountDepositable(),
            attached.poolFunds(),
            attached.poolLiquidity(),
            attached.currentLenderAPY(),
            provider.getCurrentBlockNumber(),
        ])

        const stats: Stats = {
            loans: loansCount.toNumber(),
            balanceStaked: balanceStaked.toHexString(),
            amountDepositable: amountDepositable.toHexString(),
            poolFunds: poolFunds.toHexString(),
            poolLiquidity: poolLiquidity.toHexString(),
            apy: apy / 10,
            blockNumber,
        }

        return stats
    },
)

export const useFetchIntervalStats = createFetchIntervalHook(
    fetchStats,
    oneHour,
)

const fetchAccountInfo = createAsyncThunk(
    'pools/fetchAccountInfo',
    async ({
        poolAddress,
        account,
    }: {
        poolAddress: string
        account: string
    }) => {
        const { provider, contract: attached } = getBatchProviderAndContract(
            3,
            contract.attach(poolAddress),
        )

        const [balance, withdrawable, blockNumber] = await Promise.all([
            attached.balanceOf(account),
            attached.amountWithdrawable(account),
            provider.getCurrentBlockNumber(),
        ])

        const accountInfo: AccountInfo = {
            balance: balance.toHexString(),
            withdrawable: withdrawable.toHexString(),
            blockNumber,
        }

        return accountInfo
    },
)

export const useFetchIntervalAccountInfo = createFetchIntervalHook(
    fetchAccountInfo,
    oneHour,
)

const fetchManagerInfo = createAsyncThunk(
    'pools/fetchManagerInfo',
    async (poolAddress: string) => {
        const { provider, contract: attached } = getBatchProviderAndContract(
            3,
            contract.attach(poolAddress),
        )

        const [staked, unstakable, blockNumber] = await Promise.all([
            attached.balanceStaked(),
            attached.amountUnstakable(),
            provider.getCurrentBlockNumber(),
        ])

        const managerInfo: ManagerInfo = {
            staked: staked.toHexString(),
            unstakable: unstakable.toHexString(),
            blockNumber,
        }

        return managerInfo
    },
)

export const useFetchIntervalManagerInfo = createFetchIntervalHook(
    fetchManagerInfo,
    oneHour,
)

const initialState: Record<string, Pool> = {}

export const poolsSlice = createSlice({
    name: 'pools',
    initialState,
    reducers: {
        // TODO: Cache on build time
        setPoolInfo(
            state,
            {
                payload: {
                    name,
                    address,
                    managerAddress,
                    tokenAddress,
                    tokenDecimals,
                },
            }: Action<{
                name: string
                address: string
                managerAddress: string
                tokenAddress: string
                tokenDecimals: number
            }>,
        ) {
            state[address] = {
                name,
                managerAddress,
                tokenAddress,
                tokenDecimals,
                loans: [],
                loansBlockNumber: 0,
                loanUpdates: [],
                stats: null,
                managerInfo: null,
                accountInfo: {},
                loading: [],
            }
        },

        setLoans(
            state,
            {
                payload,
            }: Action<{
                poolAddress: string
                loans: Loan[]
                blockNumber: number
            }>,
        ) {
            const { blockNumber, poolAddress } = payload
            if (state[poolAddress].loansBlockNumber > blockNumber) return

            state[poolAddress].loans = payload.loans
            state[poolAddress].loansBlockNumber = blockNumber
            state[poolAddress].loanUpdates = state[
                poolAddress
            ].loanUpdates.filter((loan) => loan.blockNumber > blockNumber)
        },
        updateLoan(
            state,
            {
                payload,
            }: Action<{
                poolAddress: string
                loan: Loan
                blockNumber: number
            }>,
        ) {
            const { blockNumber, poolAddress } = payload
            if (blockNumber > state[poolAddress].loansBlockNumber) {
                const updates = [
                    ...state[poolAddress].loanUpdates,
                    payload,
                ].sort(sortByBlockNumberDescending)
                state[poolAddress].loanUpdates = filterUniqueIds(
                    updates,
                    'loan',
                ).reverse()
            }
        },
        updateLoans(
            state,
            {
                payload: { poolAddress, loans, blockNumber },
            }: Action<{
                poolAddress: string
                loans: Loan[]
                blockNumber: number
            }>,
        ) {
            if (blockNumber <= state[poolAddress].loansBlockNumber) return

            const updates = [...state[poolAddress].loanUpdates]
            for (const loan of loans) {
                updates.push({ loan, blockNumber })
            }

            state[poolAddress].loanUpdates = filterUniqueIds(
                updates.sort(sortByBlockNumberDescending),
                'loan',
            ).reverse()
        },
    },
    extraReducers(builder) {
        builder
            .addCase(
                fetchStats.pending,
                (state, { meta: { arg: poolAddress } }) => {
                    const pool = state[poolAddress]
                    const set = new Set(pool.loading)
                    set.add('stats')
                    pool.loading = Array.from(set)
                },
            )
            .addCase(
                fetchStats.fulfilled,
                (state, { payload, meta: { arg: poolAddress } }) => {
                    const pool = state[poolAddress]
                    const set = new Set(pool.loading)
                    set.delete('stats')
                    pool.loading = Array.from(set)

                    replaceIfHigherBlockNumber(pool, 'stats', payload)
                },
            )
            .addCase(
                fetchAccountInfo.fulfilled,
                (
                    state,
                    {
                        payload,
                        meta: {
                            arg: { poolAddress, account },
                        },
                    },
                ) => {
                    replaceIfHigherBlockNumber(
                        state[poolAddress].accountInfo,
                        account,
                        payload,
                    )
                },
            )
            .addCase(
                fetchManagerInfo.fulfilled,
                (state, { payload, meta: { arg: poolAddress } }) => {
                    replaceIfHigherBlockNumber(
                        state[poolAddress],
                        'managerInfo',
                        payload,
                    )
                },
            )
    },
})

export const { setPoolInfo, setLoans, updateLoan, updateLoans } =
    poolsSlice.actions

export const selectPools = (state: AppState) => state.pools

type WithBlockNumber = { blockNumber: number }
function sortByBlockNumberAscending(a: WithBlockNumber, b: WithBlockNumber) {
    return a.blockNumber - b.blockNumber
}
function sortByBlockNumberDescending(a: WithBlockNumber, b: WithBlockNumber) {
    return b.blockNumber - a.blockNumber
}

function filterUniqueIds<
    T extends string,
    R extends { [key in T]: { id: number } },
>(array: R[], key: T): R[] {
    const ids = new Set<number>()
    return array.filter(({ [key]: { id } }) => {
        if (ids.has(id)) return false

        ids.add(id)
        return true
    })
}

function replaceIfHigherBlockNumber<
    X extends { blockNumber: number },
    K extends string,
    T extends { [key in K]?: X | null },
>(object: T, key: K, newValue: X) {
    const oldValue = object[key]
    if (oldValue && oldValue.blockNumber >= newValue.blockNumber) return

    object[key] = newValue as T[K]
}
