import { formatUnits } from '@ethersproject/units'
import { useEffect, useMemo } from 'react'
import { AppDispatch, useSelector, AppState, useDispatch } from '../../store'
import {
    getERC20Contract,
    POOLS,
    useProvider,
    ERC20Contract,
    useAccount,
    zero,
    USDC_DECIMALS,
    ONE_HUNDRED_PERCENT,
} from '../../app'
import {
    contract,
    CoreContract,
    getBatchProviderAndContract,
    EVMLoan,
    EVMLoanDetails,
    LoanStatus,
} from './contract'
import { BigNumber } from '@ethersproject/bignumber'
import {
    updateLoan,
    updateLoans,
    setLoans,
    Pool,
    setPoolInfo,
    Loan as StateLoan,
    LoanDetails as StateLoanDetails,
    useFetchIntervalStats,
    useFetchIntervalAccountInfo,
    useFetchIntervalManagerInfo,
    useFetchIntervalAllStats,
    useFetchIntervalAccountInfoAllPools,
    useFetchIntervalBorrowConstraints,
} from './poolsSlice'
import { createSelector } from '@reduxjs/toolkit'

export function useManagerInfo(poolAddress: string) {
    const refetch = useFetchIntervalManagerInfo(poolAddress)

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

export function usePoolLiquidity(poolAddress: string) {
    const refetch = useFetchIntervalStats(poolAddress)

    const poolLiquidity = useSelector(
        (state) => state.pools[poolAddress]?.stats?.poolLiquidity,
    )

    return [poolLiquidity, refetch] as const
}

export function useStats(poolAddress: string, tokenDecimals: number) {
    useFetchIntervalStats(poolAddress)

    const stats = useSelector((state) => state.pools[poolAddress]?.stats)
    if (!stats) return null

    const poolFunds = BigNumber.from(stats.poolFunds)

    return {
        loans: stats.loans,
        managerFunds: formatUnits(stats.balanceStaked, tokenDecimals),
        availableForDeposits: formatUnits(
            stats.amountDepositable,
            tokenDecimals,
        ),
        totalPoolSize: formatUnits(stats.poolFunds, tokenDecimals),
        loansOutstanding: formatUnits(
            poolFunds.sub(stats.poolLiquidity),
            tokenDecimals,
        ),
        maxPoolSize: formatUnits(
            poolFunds.add(stats.amountDepositable),
            tokenDecimals,
        ),
        apy: stats.apy,
    }
}

export function useBorrowConstraints(poolAddress: string) {
    useFetchIntervalBorrowConstraints(poolAddress)

    const borrowConstraints = useSelector(
        (state) => state.pools[poolAddress]?.borrowConstraints,
    )

    return borrowConstraints
}

export function useAccountStats() {
    // TODO: Wait for pools to load
    const pools = usePools()
    const dispatch = useDispatch()
    const account = useAccount()
    const poolsLoaded = Object.keys(pools).length === POOLS.length
    useFetchIntervalAllStats(poolsLoaded ? dispatch : null)
    useFetchIntervalAccountInfoAllPools(
        poolsLoaded && account ? { dispatch, account } : null,
    )

    return useMemo(() => {
        const poolsArray = Object.values(pools)
        if (
            poolsArray.length !== POOLS.length ||
            !account ||
            poolsArray.filter(
                (pool) =>
                    pool.loading.includes('stats') ||
                    pool.loading.includes(`accountInfo_${account}`),
            ).length
        )
            return null

        const data = POOLS.map(({ address }) => {
            const pool = pools[address]
            const accountInfo = pool?.accountInfo[account]

            if (!accountInfo)
                return {
                    lentUSDC: '0x0',
                    apy: 0,
                }

            return {
                lentUSDC: accountInfo.balance,
                apy: pool.stats!.apy,
            }
        })

        let lent = zero
        let poolsInvestedIn = 0

        for (const item of data) {
            const lentBigNumber = BigNumber.from(item.lentUSDC)
            if (zero.eq(lentBigNumber)) continue

            lent = lent.add(lentBigNumber)
            poolsInvestedIn++
        }

        const apy = zero.eq(lent)
            ? zero
            : data
                  .map((item) =>
                      BigNumber.from(item.apy * 10)
                          .mul(item.lentUSDC)
                          .div(lent),
                  )
                  .reduce((accumulator, item) => accumulator.add(item), zero)

        return {
            lent: formatUnits(lent, USDC_DECIMALS),
            apy: apy.toNumber() / 10,
            earning: formatUnits(
                lent.mul(apy).div(ONE_HUNDRED_PERCENT),
                USDC_DECIMALS,
            ),
            pools: poolsInvestedIn,
        }
    }, [pools, account])
}

const ref = { current: false }
export function useFetchPoolsPropertiesOnce() {
    const dispatch = useDispatch()
    useEffect(() => {
        if (typeof window !== 'object' || ref.current) return
        ref.current = true

        for (const pool of POOLS) {
            const attachedContract = contract.attach(pool.address)

            Promise.all([
                attachedContract.manager(),
                attachedContract.token(),
            ]).then(async ([managerAddress, tokenAddress]) => {
                const tokenContract = getERC20Contract(tokenAddress)
                const tokenDecimals = await tokenContract.decimals()

                dispatch(
                    setPoolInfo({
                        name: pool.name,
                        address: pool.address,
                        managerAddress,
                        tokenAddress,
                        tokenDecimals,
                    }),
                )
            })
        }
    }, [dispatch])
}

const map: Record<string, string[]> = {}
export function useLoadAccountLoans(
    poolAddress: string,
    account: string | undefined,
    dispatch: AppDispatch,
    pool?: Pool,
) {
    useEffect(() => {
        if (!account || !pool) return
        if (pool.managerAddress === account) return
        const subscribed: string[] | undefined = map[poolAddress]
        const accounts = subscribed || (map[poolAddress] = [])
        if (accounts.includes(account)) return
        accounts.push(account)

        const attached = contract.attach(poolAddress)
        attached
            .queryFilter(attached.filters.LoanRequested(null, account))
            .then((loans) =>
                fetchLoans(
                    attached,
                    loans.map((loan) => loan.args.loanId),
                ),
            )
            .then(([loans, details, blockNumber]) => {
                dispatch(
                    updateLoans({
                        loans: transformToStateLoans(loans, details),
                        blockNumber,
                        poolAddress,
                    }),
                )
            })

        attached.on(
            attached.filters.LoanRequested(null, account),
            handleLoanEvent,
        )

        if (subscribed) return

        attached.on(attached.filters.LoanApproved(), handleLoanEvent)
        attached.on(attached.filters.LoanDenied(), handleLoanEvent)
        attached.on(attached.filters.LoanCancelled(), handleLoanEvent)
        attached.on(attached.filters.LoanRepaid(), handleLoanEvent)
        attached.on(attached.filters.LoanDefaulted(), handleLoanEvent)

        function handleLoanEvent<_T>(loanId: BigNumber) {
            fetchAndUpdateLoan(poolAddress, attached, loanId).then((action) => {
                if (!accounts.includes(action.payload.loan.borrower)) return
                dispatch(action)
            })
        }
    }, [account, pool, dispatch, poolAddress])
}

const loaded: Record<string, boolean> = {}
export function useLoadManagerState(address: string, pool: Pool | undefined) {
    const dispatch = useDispatch()
    useEffect(() => {
        if (typeof window !== 'object' || loaded[address] || !pool) return
        loaded[address] = true

        const attached = contract.attach(address)
        attached.loansCount().then(async (count) => {
            const length = count.toNumber()

            const [loans, details, blockNumber] = await fetchLoans(
                attached,
                Array.from({ length }, (_, i) => i + 1),
            )

            dispatch(
                setLoans({
                    poolAddress: address,
                    loans: transformToStateLoans(loans, details),
                    blockNumber,
                }),
            )
        })

        attached.on(attached.filters.LoanRequested(), handleLoanEvent)
        attached.on(attached.filters.LoanApproved(), handleLoanEvent)
        attached.on(attached.filters.LoanDenied(), handleLoanEvent)
        attached.on(attached.filters.LoanCancelled(), handleLoanEvent)
        attached.on(attached.filters.LoanRepaid(), handleLoanEvent)
        attached.on(attached.filters.LoanDefaulted(), handleLoanEvent)
        function handleLoanEvent<_T>(loanId: BigNumber) {
            fetchAndUpdateLoan(address, attached, loanId).then(dispatch)
        }
    }, [address, dispatch, pool])
}

export function fetchAndUpdateLoan(
    poolAddress: string,
    attachedContract: CoreContract,
    loanId: number | BigNumber,
): Promise<ReturnType<typeof updateLoan>> {
    const { provider, contract } = getBatchProviderAndContract(
        3,
        attachedContract,
    )

    return Promise.all([
        contract.loans(
            typeof loanId === 'number' ? BigNumber.from(loanId) : loanId,
        ),
        contract.loanDetails(
            typeof loanId === 'number' ? BigNumber.from(loanId) : loanId,
        ),
        provider.getCurrentBlockNumber(),
    ]).then(([loan, details, blockNumber]) =>
        updateLoan({
            poolAddress,
            loan: transformToStateLoan(loan, details),
            blockNumber,
        }),
    )
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

export function transformToStateLoansDetails(
    loans: EVMLoanDetails[],
): StateLoanDetails[] {
    return loans.map(transformToStateLoanDetails)
}
export function transformToStateLoanDetails(
    details: EVMLoanDetails,
): StateLoanDetails {
    return {
        id: details.loanId.toNumber(),
        approvedTime: Number(details.approvedTime.toString()) * 1000,
        baseAmountRepaid: details.baseAmountRepaid.toString(),
        interestPaid: details.interestPaid.toString(),
        totalAmountRepaid: details.totalAmountRepaid.toString(),
    }
}

export function transformToStateLoans(
    loans: EVMLoan[],
    details: EVMLoanDetails[],
): StateLoan[] {
    return loans.map((loan, index) =>
        transformToStateLoan(loan, details[index]),
    )
}
export function transformToStateLoan(
    loan: EVMLoan,
    details: EVMLoanDetails,
): StateLoan {
    return {
        id: loan.id.toNumber(),
        status: loan.status,
        borrower: loan.borrower,
        amount: loan.amount.toHexString(),
        requestedTime: loan.requestedTime.toNumber() * 1000,
        details: transformToStateLoanDetails(details),
    }
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

const selectors: Record<string, (state: AppState) => StateLoan[]> = {}
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
