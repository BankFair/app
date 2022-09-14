import { BigNumber } from '@ethersproject/bignumber'
import { createSelector } from '@reduxjs/toolkit'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useState } from 'react'

import { AppDispatch, useSelector, AppState, useDispatch } from '../../store'
import {
    getERC20Contract,
    poolsConfig,
    useProvider,
    ERC20Contract,
    useAccount,
    zero,
    ONE_HUNDRED_PERCENT,
    oneMillion,
    amountWithInterest,
    oneDay,
} from '../../app'
import {
    contract,
    CoreContract,
    getBatchProviderAndContract,
    EVMLoan,
    EVMLoanDetails,
} from './contracts'
import {
    updateLoans,
    setLoans,
    Pool,
    setPoolInfo,
    Loan as StateLoan,
    useFetchIntervalStats,
    useFetchIntervalAccountInfo,
    useFetchIntervalManagerInfo,
    useFetchIntervalAllStats,
    useFetchIntervalAccountInfoAllPools,
    useFetchIntervalBorrowInfo,
    transformToStateLoans,
    fetchLoan,
    Loan,
} from './poolsSlice'

export function useManagerInfo(poolAddress: string) {
    const refetch = useFetchIntervalManagerInfo({ poolAddress })

    const info = useSelector((state) => state.pools[poolAddress]?.managerInfo)

    return [info, refetch] as const
}

export function useAccountInfo(
    poolAddress: string,
    account: string | undefined,
) {
    const refetch = useFetchIntervalAccountInfo(
        account ? { poolAddress, account } : null,
    )

    const info = useSelector((state) =>
        account ? state.pools[poolAddress]?.accountInfo[account] : null,
    )

    return [info, refetch] as const
}

export function useAmountDepositable(poolAddress: string) {
    const refetch = useFetchIntervalStats(poolAddress)

    const amountDepositable = useSelector(
        (state) => state.pools[poolAddress]?.stats?.amountDepositable,
    )

    return [amountDepositable, refetch] as const
}

export function useStatsState(poolAddress: string) {
    const refetch = useFetchIntervalStats(poolAddress)

    const stats = useSelector((state) => state.pools[poolAddress]?.stats)

    return [stats, refetch] as const
}

export function usePoolLiquidity(poolAddress: string) {
    const refetch = useFetchIntervalStats(poolAddress)

    const poolLiquidity = useSelector(
        (state) => state.pools[poolAddress]?.stats?.poolLiquidity,
    )

    return [poolLiquidity, refetch] as const
}

export function useStats(poolAddress: string, liquidityTokenDecimals: number) {
    useFetchIntervalStats(poolAddress)

    const stats = useSelector((state) => state.pools[poolAddress]?.stats)
    if (!stats) return null

    // TODO: Memoize

    const poolFunds = BigNumber.from(stats.poolFunds)
    const balanceStaked = BigNumber.from(stats.balanceStaked)

    return {
        loans: stats.loans,
        lossBuffer: poolFunds.eq(zero)
            ? 0
            : balanceStaked.mul(oneMillion).div(poolFunds).toNumber() /
              1_000_000,
        managerFunds: balanceStaked,
        availableForDeposits: stats.amountDepositable,
        totalPoolSize: stats.poolFunds,
        loansOutstanding: poolFunds.sub(stats.poolLiquidity),
        // maxPoolSize: poolFunds.add(stats.amountDepositable),
        poolLiquidity: stats.poolLiquidity,
    }
}

export function useBorrowInfo(poolAddress: string, loanDeskAddress: string) {
    useFetchIntervalBorrowInfo({ poolAddress, loanDeskAddress })

    return useSelector((state) => state.pools[poolAddress]?.borrowInfo)
}

export function useAccountStats() {
    const pools = usePools()
    const dispatch = useDispatch()
    const account = useAccount()
    const poolsLoaded = Object.keys(pools).length === poolsConfig.length
    useFetchIntervalAllStats(poolsLoaded ? { dispatch } : null)
    useFetchIntervalAccountInfoAllPools(
        poolsLoaded && account ? { dispatch, account } : null,
    )

    return useMemo(() => {
        const poolsArray = Object.values(pools)
        if (
            poolsArray.length !== poolsConfig.length ||
            !account ||
            poolsArray.filter(
                (pool) =>
                    pool.loading.includes('stats') ||
                    pool.loading.includes(`accountInfo_${account}`),
            ).length
        ) {
            return null
        }

        const data = poolsConfig.map(({ address }) => {
            const pool = pools[address]
            const accountInfo = pool?.accountInfo[account]
            const stats = pool?.stats

            if (!accountInfo || !stats) {
                return {
                    lentUSDT: '0x0',
                    apy: 0,
                }
            }

            return {
                lentUSDT: accountInfo.balance,
                apy: stats.apy,
            }
        })

        let lent = zero
        let poolsInvestedIn = 0

        for (const item of data) {
            const lentBigNumber = BigNumber.from(item.lentUSDT)
            if (zero.eq(lentBigNumber)) continue

            lent = lent.add(lentBigNumber)
            poolsInvestedIn++
        }

        const apy = zero.eq(lent)
            ? zero
            : data
                  .map((item) =>
                      BigNumber.from(Math.trunc(item.apy) * 10)
                          .mul(item.lentUSDT)
                          .div(lent),
                  )
                  .reduce((accumulator, item) => accumulator.add(item), zero)

        return {
            lent,
            apy: apy.toNumber() / 10,
            earning: lent.mul(apy).div(ONE_HUNDRED_PERCENT),
            pools: poolsInvestedIn,
        }
    }, [pools, account])
}

async function fetchAndSetPoolInfo([
    pool,
    managerAddress,
    loanDeskAddress,
    poolTokenAddress,
    liquidityTokenAddress,
]: [
    {
        name: string
        block: number
        address: string
    },
    string,
    string,
    string,
    string,
]) {
    const poolTokenContract = getERC20Contract(poolTokenAddress)
    const liquidityTokenContract = getERC20Contract(liquidityTokenAddress)
    const [poolTokenDecimals, liquidityTokenDecimals] = await Promise.all([
        poolTokenContract.decimals(),
        liquidityTokenContract.decimals(),
    ])

    return setPoolInfo({
        name: pool.name,
        block: pool.block,
        address: pool.address,
        managerAddress,
        loanDeskAddress,
        poolTokenAddress,
        poolTokenDecimals,
        liquidityTokenAddress,
        liquidityTokenDecimals,
    })
}

const ref = { current: false }
export function useFetchPoolsPropertiesOnce() {
    const dispatch = useDispatch()
    useEffect(() => {
        if (typeof window !== 'object' || ref.current) return
        ref.current = true

        for (const pool of poolsConfig) {
            const attachedContract = contract.attach(pool.address)

            Promise.all([
                pool,
                attachedContract.manager(),
                attachedContract.loanDesk(),
                attachedContract.poolToken(),
                attachedContract.liquidityToken(),
            ])
                .then(fetchAndSetPoolInfo)
                .then(dispatch)
                .catch(console.error)
        }
    }, [dispatch])
}

const map: Record<string, true> = {}
export function useLoadAccountLoans(
    poolAddress: string,
    account: string | undefined,
    dispatch: AppDispatch,
    pool: Pool | undefined,
) {
    useEffect(() => {
        if (!account || !pool) return
        if (pool.managerAddress === account) return
        const key = `${poolAddress}_${account}`
        if (map[key]) return
        map[key] = true

        const attached = contract.attach(poolAddress)
        Promise.all(
            Array.from({ length: 20 }).map((_, i) => attached.loans(i + 1)),
        )
            .then((loans) =>
                fetchLoans(
                    attached,
                    loans
                        .filter((loan) => loan.borrower === account)
                        .map((loan) => loan.id),
                ),
            )
            .then(([loans, details, blockNumber]) => {
                dispatch(
                    updateLoans({
                        loans: transformToStateLoans(loans, details),
                        blockNumber,
                        poolAddress,
                        account,
                    }),
                )
            })

        attached.on(
            attached.filters.LoanBorrowed(null, account),
            handleLoanEvent,
        )
        attached.on(attached.filters.LoanRepaid(null, account), handleLoanEvent)
        attached.on(
            attached.filters.LoanDefaulted(null, account),
            handleLoanEvent,
        )

        function handleLoanEvent<_T>(loanId: BigNumber) {
            dispatch(fetchLoan({ poolAddress, loanId }))
        }
    }, [account, pool, dispatch, poolAddress])
}

const loaded: Record<string, boolean> = {}
export function useLoadManagerState(
    poolAddress: string,
    dispatch: AppDispatch,
    pool: Pool | undefined,
) {
    useEffect(() => {
        if (typeof window !== 'object' || loaded[poolAddress] || !pool) return
        loaded[poolAddress] = true

        const attached = contract.attach(poolAddress)
        attached.loansCount().then(async (count) => {
            const length = count.toNumber()

            const [loans, details, blockNumber] = await fetchLoans(
                attached,
                Array.from({ length }, (_, i) => i + 1),
            )

            dispatch(
                setLoans({
                    poolAddress,
                    loans: transformToStateLoans(loans, details),
                    blockNumber,
                }),
            )
        })

        // attached.on(attached.filters.LoanRequested(), handleLoanEvent)
        // attached.on(attached.filters.LoanApproved(), handleLoanEvent)
        // attached.on(attached.filters.LoanDenied(), handleLoanEvent)
        // attached.on(attached.filters.LoanCancelled(), handleLoanEvent)
        attached.on(attached.filters.LoanRepaid(), handleLoanEvent)
        attached.on(attached.filters.LoanDefaulted(), handleLoanEvent)
        function handleLoanEvent<_T>(loanId: BigNumber) {
            dispatch(fetchLoan({ poolAddress, loanId }))
        }
    }, [poolAddress, dispatch, pool])
}

export function fetchLoans(
    attachedContract: CoreContract,
    ids: (number | BigNumber)[],
): Promise<[EVMLoan[], EVMLoanDetails[], number]> {
    const { provider, contract } = getBatchProviderAndContract(
        ids.length * 2 + 1,
        attachedContract,
    )

    return Promise.all([
        Promise.all(ids.map((id) => contract.loans(id))),
        Promise.all(ids.map((id) => contract.loanDetails(id))),
        provider.getCurrentBlockNumber(),
    ])
}

export function useSigner(
    poolAddress: string,
): (() => CoreContract) | undefined {
    const provider = useProvider()
    return (
        provider &&
        (() => contract.attach(poolAddress).connect(provider.getSigner()))
    )
}

export function useTokenContractSigner(
    tokenAddress: string,
): (() => ERC20Contract) | undefined {
    const provider = useProvider()
    return provider
        ? () => getERC20Contract(tokenAddress).connect(provider.getSigner())
        : undefined
}

export function usePools() {
    return useSelector((s) => s.pools)
}

export function usePool(pool: string): Pool | undefined {
    return useSelector((s) => s.pools[pool])
}

// #region useLoans
const selectors: Record<string, (state: AppState) => StateLoan[]> = {}
const emptyArray: never[] = []
const returnEmptyArray = <T>(): T[] => emptyArray
function createLoansSelector(address: string, account?: string) {
    return createSelector(
        (state: AppState) => state.pools[address]?.loans || emptyArray,
        (state: AppState) => state.pools[address]?.loanUpdates || emptyArray,
        (loans, loanUpdates) => {
            const result = account
                ? loans.filter((loan) => loan.borrower === account)
                : [...loans]

            for (const { loan } of loanUpdates) {
                const { id } = loan
                const updateIndex = result.findIndex((loan) => loan.id === id)
                if (updateIndex === -1) {
                    if (account && loan.borrower !== account) continue
                    result.push(loan)
                } else {
                    result[updateIndex] = loan
                }
            }

            return result
        },
    )
}
export function useLoans(address: string, account?: string): StateLoan[] {
    const forAddress = arguments.length === 2

    const selectorKey = `${address}_${account}`

    const selector =
        forAddress && !account
            ? returnEmptyArray
            : selectors[selectorKey] ||
              (selectors[selectorKey] = createLoansSelector(address, account))

    return useSelector(selector)
}
// #endregion

export function useCanDefaultLoan(
    poolAddress: string,
    loanId: number,
    account: string | undefined,
) {
    const [canDefaultId, setCanDefaultId] = useState('')
    useEffect(() => {
        if (!account) return
        let canceled = false

        contract
            .attach(poolAddress)
            .canDefault(loanId, account)
            .then((canDefault) => {
                if (!canDefault || canceled) return

                setCanDefaultId(`${loanId}_${account}`)
            })

        return () => {
            canceled = true
        }
    }, [account, loanId, poolAddress])

    return `${loanId}_${account}` === canDefaultId
}

export interface ScheduleItem {
    date: string
    dateTime: DateTime
    overdue: boolean
    amount: BigNumber
    skip: boolean
    expectedBaseAmountRepaid: BigNumber
    expectedTimestamp: number
}
export function useSchedule(
    loan: Omit<
        | Loan
        | (Omit<Loan, 'amount' | 'installmentAmount'> & {
              amount: BigNumber
              installmentAmount: BigNumber
          }),
        'id' | 'applicationId' | 'gracePeriod' | 'borrower' | 'status'
    > | null,
): ScheduleItem[] {
    return useMemo(() => {
        if (!loan) return []
        const installmentAmount = BigNumber.from(loan.installmentAmount)
        const now = DateTime.now()
        const installmentDuration = loan.duration / loan.installments
        const amountBigNumber = BigNumber.from(loan.amount)

        let baseAmountRepaid = BigNumber.from(loan.details.baseAmountRepaid)
        let interestPaidUntil = loan.details.interestPaidUntil
        let paid = false

        return Array.from({
            length: loan.installments,
        }).reduce<ScheduleItem[]>((array, _, index) => {
            const installmentNumber = index + 1
            const timestamp =
                loan.borrowedTime + installmentDuration * installmentNumber
            const date = DateTime.fromSeconds(timestamp)

            if (paid) {
                array[index] = {
                    date: date.toLocaleString(),
                    dateTime: date,
                    overdue: false,
                    amount: zero,
                    skip: true,
                    expectedBaseAmountRepaid: zero,
                    expectedTimestamp: 0,
                }
                return array
            }

            const overdue = now > date
            const nextDate = DateTime.fromSeconds(
                timestamp + installmentDuration,
            )
            const previous = array[index - 1] as ScheduleItem | undefined
            let actualDate = date
            let skip = false
            let amount = installmentAmount

            const {
                principalOutstanding: expectedPrincipalOutstanding,
                interestOutstanding: expectedInterestOutstanding,
            } = amountWithInterest(
                amountBigNumber,
                previous ? previous.expectedBaseAmountRepaid : zero,
                previous ? previous.expectedTimestamp : loan.borrowedTime,
                loan.apr,
                timestamp,
            )

            let { principalOutstanding, interestOutstanding, daysPassed } =
                baseAmountRepaid.gte(amountBigNumber)
                    ? {
                          principalOutstanding: zero,
                          interestOutstanding: zero,
                          daysPassed: 0,
                      }
                    : amountWithInterest(
                          amountBigNumber,
                          baseAmountRepaid,
                          interestPaidUntil,
                          loan.apr,
                          timestamp,
                      )

            const outstanding = principalOutstanding.add(interestOutstanding)

            if (installmentAmount.gt(outstanding)) {
                amount = outstanding
            }

            const expectedBaseAmountRepaid = installmentAmount
                .sub(expectedInterestOutstanding)
                .add(previous ? previous.expectedBaseAmountRepaid : zero)

            if (overdue) {
                if (nextDate) {
                    if (nextDate > now) {
                        if (
                            principalOutstanding.lte(
                                expectedPrincipalOutstanding,
                            )
                        ) {
                            skip = true
                        } else {
                            const {
                                principalOutstanding:
                                    nextExpectedPrincipalOutstanding,
                            } = amountWithInterest(
                                amountBigNumber,
                                expectedBaseAmountRepaid,
                                timestamp,
                                loan.apr,
                                timestamp + installmentDuration,
                            )

                            actualDate = now

                            const {
                                interestOutstanding: currentInterestOutstanding,
                                daysPassed: currentDaysPassed,
                            } = amountWithInterest(
                                amountBigNumber,
                                loan.details.baseAmountRepaid,
                                loan.details.interestPaidUntil,
                                loan.apr,
                                Math.trunc(now.toSeconds()),
                            )
                            amount = principalOutstanding
                                .sub(nextExpectedPrincipalOutstanding)
                                .add(currentInterestOutstanding)

                            daysPassed = currentDaysPassed
                            interestOutstanding = currentInterestOutstanding
                        }
                    } else {
                        skip = true
                    }
                }
            } else {
                const previous = array[index - 1]
                if (
                    ((previous && previous.amount.eq(zero)) ||
                        installmentNumber === 1) &&
                    principalOutstanding.lt(expectedPrincipalOutstanding) &&
                    interestOutstanding.lt(expectedInterestOutstanding)
                ) {
                    const {
                        principalOutstanding: nextExpectedPrincipalOutstanding,
                    } = amountWithInterest(
                        amountBigNumber,
                        expectedBaseAmountRepaid,
                        timestamp,
                        loan.apr,
                        timestamp + installmentDuration,
                    )

                    const {
                        interestOutstanding: currentInterestOutstanding,
                        daysPassed: currentDaysPassed,
                    } = amountWithInterest(
                        amountBigNumber,
                        loan.details.baseAmountRepaid,
                        loan.details.interestPaidUntil,
                        loan.apr,
                        timestamp,
                    )

                    amount = principalOutstanding
                        .sub(nextExpectedPrincipalOutstanding)
                        .add(currentInterestOutstanding)

                    if (amount.lt(zero)) {
                        skip = true
                    } else {
                        daysPassed = currentDaysPassed
                        interestOutstanding = currentInterestOutstanding
                    }
                } else if (
                    previous &&
                    previous.amount.gt(installmentAmount) &&
                    now.equals(previous.dateTime)
                ) {
                    const {
                        interestOutstanding: currentInterestOutstanding,
                        daysPassed: currentDaysPassed,
                    } = amountWithInterest(
                        amountBigNumber,
                        baseAmountRepaid,
                        interestPaidUntil,
                        loan.apr,
                        timestamp,
                    )
                    interestOutstanding = currentInterestOutstanding
                    daysPassed = currentDaysPassed
                    amount = expectedBaseAmountRepaid
                        .sub(baseAmountRepaid)
                        .add(currentInterestOutstanding)
                }
            }

            if (skip) {
                amount = zero
            } else if (amount.lt(interestOutstanding)) {
                const payableInterestDays = amount
                    .mul(daysPassed)
                    .div(interestOutstanding)

                amount = interestOutstanding
                    .mul(payableInterestDays)
                    .div(daysPassed)
                interestPaidUntil += payableInterestDays.toNumber() * oneDay
            } else {
                baseAmountRepaid = baseAmountRepaid.add(
                    amount.sub(interestOutstanding),
                )
                interestPaidUntil += daysPassed * oneDay
            }

            if (
                installmentNumber === loan.installments &&
                outstanding.gt(amount)
            ) {
                amount = outstanding
            }

            if (baseAmountRepaid.gte(amountBigNumber)) {
                paid = true
            }

            const isAmountZero = amount.eq(zero)
            array[index] = {
                date: actualDate.toLocaleString(),
                dateTime: actualDate,
                overdue:
                    overdue && !isAmountZero
                        ? !now.startOf('day').equals(date.startOf('day'))
                        : false,
                amount,
                skip: isAmountZero && (overdue ? nextDate < now : paid),
                expectedBaseAmountRepaid,
                expectedTimestamp: timestamp,
            }
            return array
        }, [])
    }, [loan])
}
