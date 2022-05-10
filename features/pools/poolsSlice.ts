import { createSelector, createSlice } from '@reduxjs/toolkit'
import { useMemo } from 'react'
import { CreateSelectorFunction, OutputSelectorFields } from 'reselect'
import { AppState, Action, useSelector } from '../../app'

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

export interface Pool {
    name: string
    managerAddress: string
    tokenAddress: string
    tokenDecimals: number
    loans: Loan[]
    loansBlockNumber: number
    loanUpdates: { loan: Loan; blockNumber: number }[]
}

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
})

export const { setPoolInfo, setLoans, updateLoan, updateLoans } =
    poolsSlice.actions

export const selectPools = (state: AppState) => state.pools

export function usePool(pool: string): Pool | undefined {
    return useSelector((s) => s.pools[pool])
}

const selectors: Record<string, (state: AppState) => Loan[]> = {}
export function useLoans(address: string) {
    const selector =
        selectors[address] ||
        (selectors[address] = createSelector(
            (state: AppState) => state.pools[address]?.loans || [],
            (state: AppState) => state.pools[address]?.loanUpdates || [],
            (loans, loanUpdates) => {
                const result = [...loans]

                for (const { loan } of loanUpdates) {
                    const { id } = loan
                    const updateIndex = result.findIndex(
                        (loan) => loan.id === id,
                    )
                    if (updateIndex === -1) {
                        result.push(loan)
                    } else {
                        result[updateIndex] = loan
                    }
                }

                return result
            },
        ))

    return useSelector(selector)
}
export function useRequestedLoans(address: string) {
    const loans = useLoans(address)
    return useMemo(
        () => loans.filter((loan) => loan.status === LoanStatus.APPLIED),
        [loans],
    )
}
export function useApprovedLoans(address: string) {
    const loans = useLoans(address)
    return useMemo(
        () => loans.filter((loan) => loan.status === LoanStatus.APPROVED),
        [loans],
    )
}
export function useRejectedLoans(address: string) {
    const loans = useLoans(address)
    return useMemo(
        () => loans.filter((loan) => loan.status === LoanStatus.DENIED),
        [loans],
    )
}

export const poolsReducer = poolsSlice.reducer

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
