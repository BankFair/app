import { BigNumberish } from '@ethersproject/bignumber'
import { createAsyncThunk, createSlice, Draft } from '@reduxjs/toolkit'
import {
    contract,
    LoanStatus,
    getBatchProviderAndContract,
    EVMLoan,
    EVMLoanDetails,
    getBatchProviderAndLoanDeskContract,
    loanDeskContract,
} from './contracts'
import {
    Address,
    convertPercent,
    createFetchInterval,
    Hexadecimal,
    poolsConfig,
} from '../../app'
import { AppState, Action, AppDispatch } from '../../store'

export interface Loan {
    id: number
    status: LoanStatus
    borrower: string
    amount: Hexadecimal
    duration: number
    borrowedTime: number
    apr: number
    gracePeriod: number
    applicationId: number
    installments: number
    installmentAmount: Hexadecimal
    details: LoanDetails
}

export interface LoanDetails {
    totalAmountRepaid: Hexadecimal
    baseAmountRepaid: Hexadecimal
    interestPaid: Hexadecimal
    interestPaidUntil: number
}

interface Stats {
    loans: number
    balanceStaked: Hexadecimal
    amountDepositable: Hexadecimal
    poolFunds: Hexadecimal
    poolLiquidity: Hexadecimal
    apy: number
    exitFeePercent: number
    blockNumber: number
}

interface ManagerInfo {
    staked: string
    unstakable: string
    blockNumber: number
}

interface AccountInfo {
    balance: Hexadecimal
    withdrawable: Hexadecimal
    blockNumber: number
}

export interface BorrowInfo {
    minLoanAmount: Hexadecimal
    minLoanDuration: number
    maxLoanDuration: number
    apr: number
    blockNumber: number
}

type Loading = 'stats' | `accountInfo_${Address}`

export interface Pool {
    name: string
    block: number
    address: Address
    managerAddress: Address
    loanDeskAddress: Address
    poolTokenAddress: Address
    poolTokenDecimals: number
    liquidityTokenAddress: Address
    liquidityTokenDecimals: number
    loans: Loan[]
    loansBlockNumber: number
    loanUpdates: { loan: Loan; blockNumber: number }[]
    loadedAccounts: Record<string, true>
    stats: Stats | null
    managerInfo: ManagerInfo | null
    accountInfo: Record<string, AccountInfo>
    borrowInfo: BorrowInfo | null
    loading: Loading[]
}

const oneHour = 60 * 60 * 1000

export const fetchStats = createAsyncThunk(
    'pools/fetchStats',
    async (poolAddress: string) => {
        const { provider, contract: connected } = getBatchProviderAndContract(
            8,
            contract.attach(poolAddress),
        )
        const [
            loanDeskAddress,
            balanceStaked,
            amountDepositable,
            apyBreakdown,
            poolBalances,
            poolFunds,
            poolConfig,
            blockNumber,
        ] = await Promise.all([
            connected.loanDesk(),
            connected.balanceStaked(),
            connected.amountDepositable(),
            connected.currentAPY(),
            connected.balances(),
            connected.poolFunds(),
            connected.config(),
            provider.getCurrentBlockNumber(),
        ])

        const { provider: loanDeskProvider, loanDeskContract: connectedLoanDesk } = getBatchProviderAndLoanDeskContract(
            1,
            loanDeskContract.attach(loanDeskAddress),
        )

        const [
            loansCount,
        ] = await Promise.all([
            connectedLoanDesk.loansCount(),
        ])

        const stats: Stats = {
            loans: loansCount.toNumber(),
            balanceStaked: balanceStaked.toHexString() as Hexadecimal,
            amountDepositable: amountDepositable.toHexString() as Hexadecimal,
            poolFunds: poolFunds.toHexString() as Hexadecimal,
            poolLiquidity: poolBalances.rawLiquidity.toHexString() as Hexadecimal,
            apy: convertPercent(apyBreakdown.lenderComponent),
            exitFeePercent: convertPercent(poolConfig.exitFeePercent),
            blockNumber,
        }

        return stats
    },
)

export const { fetch: fetchIntervalStats, hook: useFetchIntervalStats } =
    createFetchInterval(fetchStats, oneHour)

export const fetchAllStats = createAsyncThunk(
    'pools/fetchAllStats',
    ({
        dispatch,
        pools = poolsConfig,
    }: {
        dispatch: AppDispatch
        pools?: { address: string }[]
    }) => {
        return Promise.all(
            pools.map(({ address }) => fetchIntervalStats(dispatch, address)),
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
            balance: balance.toHexString() as Hexadecimal,
            withdrawable: withdrawable.toHexString() as Hexadecimal,
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
            poolsConfig.map(({ address: poolAddress }) =>
                fetchIntervalAccountInfo(dispatch, { poolAddress, account }),
            ),
        )
    },
)

export const { hook: useFetchIntervalAccountInfoAllPools } =
    createFetchInterval(fetchAccountInfoAllPools, oneHour)

const fetchManagerInfo = createAsyncThunk(
    'pools/fetchManagerInfo',
    async ({ poolAddress }: { poolAddress: string }) => {
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

export const fetchBorrowInfo = createAsyncThunk(
    'pools/fetchBorrowConstraints',
    async ({
        loanDeskAddress,
    }: {
        poolAddress: string
        loanDeskAddress: string
    }) => {
        const { provider, loanDeskContract: connected } =
            getBatchProviderAndLoanDeskContract(
                2,
                loanDeskContract.attach(loanDeskAddress),
            )

        const [
            loanTemplate,
            blockNumber,
        ] = await Promise.all([
            connected.loanTemplate(),
            provider.getCurrentBlockNumber(),
        ])

        const info: BorrowInfo = {
            minLoanAmount: loanTemplate.minAmount.toHexString() as Hexadecimal,
            minLoanDuration: loanTemplate.minDuration.toNumber(),
            maxLoanDuration: loanTemplate.maxDuration.toNumber(),
            apr: convertPercent(loanTemplate.apr),
            blockNumber,
        }

        return info
    },
)

export const {
    fetch: fetchIntervalBorrowInfo,
    hook: useFetchIntervalBorrowInfo,
} = createFetchInterval(fetchBorrowInfo, oneHour)

export const fetchAllBorrowInfo = createAsyncThunk(
    'pools/fetchAllBorrowInfo',
    ({
        dispatch,
        pools,
    }: {
        dispatch: AppDispatch
        pools: Record<string, Pool>
    }) => {
        const promises: Promise<object>[] = []

        // TODO: Batch
        for (const i in pools) {
            fetchIntervalBorrowInfo(dispatch, {
                poolAddress: i,
                loanDeskAddress: pools[i].loanDeskAddress,
            })
        }

        return Promise.all(promises)
    },
)

export const { hook: useFetchIntervalAllBorrowInfo } = createFetchInterval(
    fetchAllBorrowInfo,
    oneHour,
)

export const fetchLoan = createAsyncThunk(
    'pools/fetchLoan',
    ({
        loanId,
        loanDeskAddress,
        poolAddress,
    }: {
        poolAddress: string
        loanDeskAddress: string
        loanId: BigNumberish
    }) => {
        const { provider, loanDeskContract: connected } = getBatchProviderAndLoanDeskContract(
            3,
            loanDeskContract.attach(loanDeskAddress),
        )

        return Promise.all([
            connected.loans(loanId),
            connected.loanDetails(loanId),
            provider.getCurrentBlockNumber(),
        ]).then(([loan, details, blockNumber]) => ({
            loan: transformToStateLoan(loan, details),
            blockNumber,
        }))
    },
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
                    block,
                    address,
                    managerAddress,
                    loanDeskAddress,
                    poolTokenAddress,
                    poolTokenDecimals,
                    liquidityTokenAddress,
                    liquidityTokenDecimals,
                },
            }: Action<{
                name: string
                block: number
                address: Address
                managerAddress: Address
                loanDeskAddress: Address
                poolTokenAddress: Address
                poolTokenDecimals: number
                liquidityTokenAddress: Address
                liquidityTokenDecimals: number
            }>,
        ) {
            state[address] = {
                name,
                block,
                address,
                managerAddress,
                loanDeskAddress,
                poolTokenAddress,
                poolTokenDecimals,
                liquidityTokenAddress,
                liquidityTokenDecimals,
                loans: [],
                loansBlockNumber: 0,
                loanUpdates: [],
                loadedAccounts: {},
                stats: null,
                managerInfo: null,
                accountInfo: {},
                loading: [],
                borrowInfo: null,
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
        updateLoans(
            state,
            {
                payload: { poolAddress, loans, blockNumber, account },
            }: Action<{
                poolAddress: string
                loans: Loan[]
                blockNumber: number
                account: string
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

            state[poolAddress].loadedAccounts[account] = true
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
                (
                    state,
                    {
                        payload,
                        meta: {
                            arg: { poolAddress },
                        },
                    },
                ) => {
                    replaceIfHigherBlockNumber(
                        state[poolAddress],
                        'managerInfo',
                        payload,
                    )
                },
            )
            .addCase(
                fetchBorrowInfo.fulfilled,
                (
                    state,
                    {
                        payload,
                        meta: {
                            arg: { poolAddress },
                        },
                    },
                ) => {
                    replaceIfHigherBlockNumber(
                        state[poolAddress],
                        'borrowInfo',
                        payload,
                    )
                },
            )
            .addCase(
                fetchLoan.fulfilled,
                (
                    state,
                    {
                        payload,
                        meta: {
                            arg: { poolAddress },
                        },
                    },
                ) => {
                    const { blockNumber } = payload
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
            )
    },
})

export const { setPoolInfo, setLoans, updateLoans } = poolsSlice.actions

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

export function transformToStateLoansDetails(
    loans: EVMLoanDetails[],
): LoanDetails[] {
    return loans.map(transformToStateLoanDetails)
}
export function transformToStateLoanDetails(
    details: EVMLoanDetails,
): LoanDetails {
    return {
        baseAmountRepaid: details.principalAmountRepaid.toString() as Hexadecimal,
        interestPaid: details.interestPaid.toString() as Hexadecimal,
        totalAmountRepaid: details.totalAmountRepaid.toString() as Hexadecimal,
        interestPaidUntil: details.interestPaidTillTime.toNumber(),
    }
}

export function transformToStateLoans(
    loans: EVMLoan[],
    details: EVMLoanDetails[],
): Loan[] {
    return loans.map((loan, index) =>
        transformToStateLoan(loan, details[index]),
    )
}
export function transformToStateLoan(
    loan: EVMLoan,
    details: EVMLoanDetails,
): Loan {
    return {
        id: loan.id.toNumber(),
        status: loan.status,
        borrower: loan.borrower,
        amount: loan.amount.toHexString() as Hexadecimal,
        duration: loan.duration.toNumber(),
        apr: convertPercent(loan.apr),
        borrowedTime: loan.borrowedTime.toNumber(),
        gracePeriod: loan.gracePeriod.toNumber(),
        applicationId: loan.applicationId.toNumber(),
        installmentAmount: loan.installmentAmount.toHexString() as Hexadecimal,
        installments: loan.installments,
        details: transformToStateLoanDetails(details),
    }
}
