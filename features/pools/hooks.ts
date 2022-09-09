import { useEffect, useMemo, useState } from 'react'
import { AppDispatch, useSelector, AppState, useDispatch } from '../../store'
import {
    getERC20Contract,
    POOLS,
    useProvider,
    ERC20Contract,
    useAccount,
    zero,
    ONE_HUNDRED_PERCENT,
    oneMillion,
} from '../../app'
import {
    contract,
    CoreContract,
    getBatchProviderAndContract,
    EVMLoan,
    EVMLoanDetails,
} from './contracts'
import { BigNumber } from '@ethersproject/bignumber'
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
} from './poolsSlice'
import { createSelector } from '@reduxjs/toolkit'

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
            : balanceStaked.mul(oneMillion).div(poolFunds).toNumber() / 10_000,
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
    const poolsLoaded = Object.keys(pools).length === POOLS.length
    useFetchIntervalAllStats(poolsLoaded ? { dispatch } : null)
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
        ) {
            return null
        }

        const data = POOLS.map(({ address }) => {
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
                      BigNumber.from(item.apy * 10)
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
        description: string
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

        for (const pool of POOLS) {
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
        attached
            .queryFilter(
                attached.filters.LoanBorrowed(null, account),
                pool.block,
            )
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
