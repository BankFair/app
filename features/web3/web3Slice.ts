import { createSelector, createSlice, Draft } from '@reduxjs/toolkit'
import { Connector } from '@web3-react/types'
import type { AppState } from '../../app/store'
import {
    connectorsObject,
    jsonParse,
    LOCAL_STORAGE_LAST_CONNECTOR_KEY,
} from '../../app'
import { getERC20Contract, LoanStatus } from './utils'

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

export interface Web3State {
    lastConnectorName: string | null
    managerAddress: string | undefined
    tokenAddress: string | undefined
    tokenDecimals: number | undefined
    loans: Loan[]
    loansTimestamp: number
    loanUpdates: { loan: Loan; timestamp: number }[]
}

const initialState: Web3State = {
    lastConnectorName:
        typeof window === 'object' ? getLastConnectorName() : null,
    managerAddress: undefined, // TODO: Cache on build time
    tokenAddress: undefined, // TODO: Cache on build time
    tokenDecimals: undefined, // TODO: Cache on build time
    loans: [],
    loansTimestamp: 0,
    loanUpdates: [],
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

        setLoans(
            state,
            { payload }: Action<{ loans: Loan[]; timestamp: number }>,
        ) {
            const { timestamp } = payload
            if (state.loansTimestamp > timestamp) return

            state.loans = payload.loans
            state.loansTimestamp = timestamp
            state.loanUpdates = state.loanUpdates.filter(
                (loan) => loan.timestamp > timestamp,
            )
        },
        updateLoan(
            state,
            { payload }: Action<{ loan: Loan; timestamp: number }>,
        ) {
            const { timestamp } = payload
            if (timestamp > state.loansTimestamp) {
                const updates = [...state.loanUpdates, payload].sort(
                    sortByTimestampDescending,
                )
                state.loanUpdates = filterUniqueIds(updates, 'loan').reverse()
            }
        },
        updateLoans(
            state,
            {
                payload: { loans, timestamp },
            }: Action<{ loans: Loan[]; timestamp: number }>,
        ) {
            if (timestamp <= state.loansTimestamp) return

            const updates = [...state.loanUpdates]
            for (const loan of loans) {
                updates.push({ loan, timestamp })
            }

            state.loanUpdates = filterUniqueIds(
                updates.sort(sortByTimestampDescending),
                'loan',
            ).reverse()
        },
    },
})

export const {
    setLastConnectorName,
    clearLastConnectorName,
    setManagerAddress,
    setTokenAddress,
    setTokenDecimals,
    setLoans,
    updateLoan,
    updateLoans,
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
const selectLoansArray = (state: AppState) => state.web3.loans
const selectLoanUpdates = (state: AppState) => state.web3.loanUpdates
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
export const selectLoansTimestamp = (state: AppState) =>
    state.web3.loansTimestamp

export default navigationSlice.reducer

function getLastConnectorName(): string | null {
    return jsonParse(localStorage.getItem(LOCAL_STORAGE_LAST_CONNECTOR_KEY))
}

type WithTimestamp = { timestamp: number }
function sortByTimestampAscending(a: WithTimestamp, b: WithTimestamp) {
    return a.timestamp - b.timestamp
}
function sortByTimestampDescending(a: WithTimestamp, b: WithTimestamp) {
    return b.timestamp - a.timestamp
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
