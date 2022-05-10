import { createSelector, createSlice } from '@reduxjs/toolkit'
import { getERC20Contract, AppState, Action } from '../../app'

export enum LoanStatus {
    APPLIED,
    DENIED,
    APPROVED,
    CANCELLED,
    FUNDS_WITHDRAWN,
    REPAID,
    DEFAULTED,
}

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

interface State {
    managerAddress: string | undefined
    tokenAddress: string | undefined
    tokenDecimals: number | undefined
    loans: Loan[]
    loansBlockNumber: number
    loanUpdates: { loan: Loan; blockNumber: number }[]
}

const initialState: State = {
    managerAddress: undefined, // TODO: Cache on build time
    tokenAddress: undefined, // TODO: Cache on build time
    tokenDecimals: undefined, // TODO: Cache on build time
    loans: [],
    loansBlockNumber: 0,
    loanUpdates: [],
}

export const poolsSlice = createSlice({
    name: 'pools',
    initialState,
    reducers: {
        setManagerAddress(state, action: Action<string>) {
            state.managerAddress = action.payload
        },
        setTokenAddress(state, action: Action<string>) {
            state.tokenAddress = action.payload
        },
        setTokenDecimals(state, action: Action<number>) {
            state.tokenDecimals = action.payload
        },

        setLoans(
            state,
            { payload }: Action<{ loans: Loan[]; blockNumber: number }>,
        ) {
            const { blockNumber } = payload
            if (state.loansBlockNumber > blockNumber) return

            state.loans = payload.loans
            state.loansBlockNumber = blockNumber
            state.loanUpdates = state.loanUpdates.filter(
                (loan) => loan.blockNumber > blockNumber,
            )
        },
        updateLoan(
            state,
            { payload }: Action<{ loan: Loan; blockNumber: number }>,
        ) {
            const { blockNumber } = payload
            if (blockNumber > state.loansBlockNumber) {
                const updates = [...state.loanUpdates, payload].sort(
                    sortByBlockNumberDescending,
                )
                state.loanUpdates = filterUniqueIds(updates, 'loan').reverse()
            }
        },
        updateLoans(
            state,
            {
                payload: { loans, blockNumber },
            }: Action<{ loans: Loan[]; blockNumber: number }>,
        ) {
            if (blockNumber <= state.loansBlockNumber) return

            const updates = [...state.loanUpdates]
            for (const loan of loans) {
                updates.push({ loan, blockNumber })
            }

            state.loanUpdates = filterUniqueIds(
                updates.sort(sortByBlockNumberDescending),
                'loan',
            ).reverse()
        },
    },
})

export const {
    setManagerAddress,
    setTokenAddress,
    setTokenDecimals,
    setLoans,
    updateLoan,
    updateLoans,
} = poolsSlice.actions

export const selectManagerAddress = (state: AppState) =>
    state.pools.managerAddress
export const selectTokenAddress = (state: AppState) => state.pools.tokenAddress
export const selectTokenContract = (state: AppState) => {
    const tokenAddress = state.pools.tokenAddress
    if (tokenAddress) return getERC20Contract(tokenAddress)
    return null
}
export const selectTokenDecimals = (state: AppState) =>
    state.pools.tokenDecimals
const selectLoansArray = (state: AppState) => state.pools.loans
const selectLoanUpdates = (state: AppState) => state.pools.loanUpdates
export const selectLoans = createSelector(
    selectLoansArray,
    selectLoanUpdates,
    (loans, updates) => {
        const result = [...loans]

        for (const { loan } of updates) {
            const { id } = loan
            const updateIndex = result.findIndex((loan) => loan.id === id)
            if (updateIndex === -1) {
                result.push(loan)
            } else {
                result[updateIndex] = loan
            }
        }

        return result
    },
)
export const selectRequestedLoans = createSelector(selectLoans, (loans) =>
    loans.filter((loan) => loan.status === LoanStatus.APPLIED),
)
export const selectApprovedLoans = createSelector(selectLoans, (loans) =>
    loans.filter((loan) => loan.status === LoanStatus.APPROVED).reverse(),
)
export const selectRejectedLoans = createSelector(selectLoans, (loans) =>
    loans.filter((loan) => loan.status === LoanStatus.DENIED).reverse(),
)
export const selectLoansBlockNumber = (state: AppState) =>
    state.pools.loansBlockNumber

export const poolsReducer = poolsSlice.reducer

type WithTimestamp = { timestamp: number }
function sortByTimestampAscending(a: WithTimestamp, b: WithTimestamp) {
    return a.timestamp - b.timestamp
}
function sortByTimestampDescending(a: WithTimestamp, b: WithTimestamp) {
    return b.timestamp - a.timestamp
}

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
