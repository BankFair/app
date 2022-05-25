import { createAsyncThunk, createSlice, Draft } from '@reduxjs/toolkit'
import { contract, LoanStatus, getBatchProviderAndContract } from './contract'
import { createFetchInterval, POOLS } from '../../app'
import { AppState, Action, AppDispatch } from '../../store'

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

interface BorrowConstraints {
    minAmount: string
    minDuration: number
    maxDuration: number
    blockNumber: number
}

type Loading = 'stats' | `accountInfo_${string}`

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
    borrowConstraints: BorrowConstraints | null
    loading: Loading[]
}

const oneHour = 60 * 60 * 1000

export const fetchStats = createAsyncThunk(
    'pools/fetchStats',
    async (poolAddress: string) => {
        const { provider, contract: connected } = getBatchProviderAndContract(
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
            connected.loansCount(),
            connected.balanceStaked(),
            connected.amountDepositable(),
            connected.poolFunds(),
            connected.poolLiquidity(),
            connected.currentLenderAPY(),
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

export const { fetch: fetchIntervalStats, hook: useFetchIntervalStats } =
    createFetchInterval(fetchStats, oneHour)

export const fetchAllStats = createAsyncThunk(
    'pools/fetchAllStats',
    (dispatch: AppDispatch) => {
        return Promise.all(
            POOLS.map(({ address }) => fetchIntervalStats(dispatch, address)),
        )
    },
)

export const { hook: useFetchIntervalAllStats } = createFetchInterval(
    fetchAllStats,
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
        const { provider, contract: connected } = getBatchProviderAndContract(
            3,
            contract.attach(poolAddress),
        )

        const [balance, withdrawable, blockNumber] = await Promise.all([
            connected.balanceOf(account),
            connected.amountWithdrawable(account),
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

export const {
    fetch: fetchIntervalAccountInfo,
    hook: useFetchIntervalAccountInfo,
} = createFetchInterval(fetchAccountInfo, oneHour)

export const fetchAccountInfoAllPools = createAsyncThunk(
    'pools/fetchAccountInfoAllPools',
    ({ dispatch, account }: { dispatch: AppDispatch; account: string }) => {
        return Promise.all(
            POOLS.map(({ address: poolAddress }) =>
                fetchIntervalAccountInfo(dispatch, { poolAddress, account }),
            ),
        )
    },
)

export const { hook: useFetchIntervalAccountInfoAllPools } =
    createFetchInterval(fetchAccountInfoAllPools, oneHour)

const fetchManagerInfo = createAsyncThunk(
    'pools/fetchManagerInfo',
    async (poolAddress: string) => {
        const { provider, contract: connected } = getBatchProviderAndContract(
            3,
            contract.attach(poolAddress),
        )

        const [staked, unstakable, blockNumber] = await Promise.all([
            connected.balanceStaked(),
            connected.amountUnstakable(),
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

export const { hook: useFetchIntervalManagerInfo } = createFetchInterval(
    fetchManagerInfo,
    oneHour,
)

const fetchBorrowConstraints = createAsyncThunk(
    'pools/fetchBorrowConstraints',
    async (poolAddress: string) => {
        const { provider, contract: connected } = getBatchProviderAndContract(
            4,
            contract.attach(poolAddress),
        )

        const [minAmount, minDuration, maxDuration, blockNumber] =
            await Promise.all([
                connected.minAmount(),
                connected.minDuration(),
                connected.maxDuration(),
                provider.getCurrentBlockNumber(),
            ])

        const constraints: BorrowConstraints = {
            minAmount: minAmount.toHexString(),
            minDuration: minDuration.toNumber(),
            maxDuration: maxDuration.toNumber(),
            blockNumber,
        }

        return constraints
    },
)

export const { hook: useFetchIntervalBorrowConstraints } = createFetchInterval(
    fetchBorrowConstraints,
    oneHour,
)

type State = Record<string, Pool>
const initialState: State = {}

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
                borrowConstraints: null,
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
                    setLoading(state, poolAddress, 'stats')
                },
            )
            .addCase(
                fetchStats.fulfilled,
                (state, { payload, meta: { arg: poolAddress } }) => {
                    removeLoading(state, poolAddress, 'stats')
                    replaceIfHigherBlockNumber(
                        state[poolAddress],
                        'stats',
                        payload,
                    )
                },
            )
            .addCase(
                fetchAccountInfo.pending,
                (
                    state,
                    {
                        meta: {
                            arg: { account, poolAddress },
                        },
                    },
                ) => {
                    setLoading(state, poolAddress, `accountInfo_${account}`)
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
                    removeLoading(state, poolAddress, `accountInfo_${account}`)
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
            .addCase(
                fetchBorrowConstraints.fulfilled,
                (state, { payload, meta: { arg: poolAddress } }) => {
                    replaceIfHigherBlockNumber(
                        state[poolAddress],
                        'borrowConstraints',
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

function setLoading(state: Draft<State>, poolAddress: string, value: Loading) {
    const pool = state[poolAddress]
    const set = new Set(pool.loading)
    if (process.env.NODE_ENV === 'development' && set.has(value)) {
        console.error(`Already loading \`${value}\``)
    }
    set.add(value)
    pool.loading = Array.from(set)
}

function removeLoading(
    state: Draft<State>,
    poolAddress: string,
    value: Loading,
) {
    const pool = state[poolAddress]
    const set = new Set(pool.loading)
    if (process.env.NODE_ENV === 'development' && !set.has(value)) {
        console.error(`Already not loading \`${value}\``)
    }
    set.delete(value)
    pool.loading = Array.from(set)
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
