import { BigNumber, Contract, ContractTransaction, Event } from 'ethers'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
    AppDispatch,
    useProvider,
    provider,
    CustomBatchProvider,
    ContractFunction,
    CustomBaseContract,
    getERC20Contract,
    EventFilterFactory,
    EventFilterWithType,
    TupleToObject,
    TupleToObjectWithPropNames,
    ERC20Contract,
    POOLS,
    nullAddress,
} from '../../app'
import abi from './abi.json'
import {
    setLoans,
    updateLoan,
    Loan as StateLoan,
    LoanDetails as StateLoanDetails,
    updateLoans,
    LoanStatus,
    Pool,
    setPoolInfo,
} from './poolsSlice'

type TypedEvent<
    T extends readonly unknown[],
    K extends Record<keyof TupleToObject<T>, PropertyKey>,
> = Omit<Event, 'args'> & { args: TupleToObjectWithPropNames<T, K> }

export interface CoreContract
    extends Omit<
        CustomBaseContract,
        'filters' | 'connect' | 'attach' | 'queryFilter' | 'on'
    > {
    connect(...args: Parameters<CustomBaseContract['connect']>): this
    attach(...args: Parameters<CustomBaseContract['attach']>): this

    manager: ContractFunction<string>
    token: ContractFunction<string>
    loansCount: ContractFunction<BigNumber>
    balanceStaked: ContractFunction<BigNumber>
    balanceOf: ContractFunction<BigNumber, [account: string]>
    stake: ContractFunction<ContractTransaction, [amount: BigNumber]>
    unstake: ContractFunction<ContractTransaction, [amount: BigNumber]>
    deposit: ContractFunction<ContractTransaction, [amount: BigNumber]>
    withdraw: ContractFunction<ContractTransaction, [amount: BigNumber]>
    amountDepositable: ContractFunction<BigNumber>
    amountUnstakable: ContractFunction<BigNumber>
    amountWithdrawable: ContractFunction<BigNumber, [account: string]>
    maxDuration: ContractFunction<BigNumber>
    minAmount: ContractFunction<BigNumber>
    minDuration: ContractFunction<BigNumber>
    requestLoan: ContractFunction<
        ContractTransaction,
        [amount: BigNumber, loanDuration: BigNumber]
    >
    cancelLoan: ContractFunction<ContractTransaction, [loanId: BigNumber]>
    borrow: ContractFunction<ContractTransaction, [loanId: BigNumber]>
    repay: ContractFunction<
        ContractTransaction,
        [loanId: BigNumber, amount: BigNumber]
    >
    approveLoan: ContractFunction<ContractTransaction, [loanId: BigNumber]>
    denyLoan: ContractFunction<ContractTransaction, [loandId: BigNumber]>
    defaultLoan: ContractFunction<ContractTransaction, [loanId: BigNumber]>

    loans: ContractFunction<EVMLoan, [loanId: BigNumber | number]>
    loanDetails: ContractFunction<EVMLoanDetails, [loanId: BigNumber | number]>

    poolFunds: ContractFunction<BigNumber>
    poolLiquidity: ContractFunction<BigNumber>

    protocolEarningsOf: ContractFunction<BigNumber, [account: string]>
    withdrawProtocolEarnings: ContractFunction<ContractTransaction>

    filters: {
        /**
         * ```solidity
         * event LoanRequested(uint256 loanId, address borrower)
         * ```
         */
        LoanRequested: EventFilterFactory<
            [loanId: BigNumber, borrower: string],
            ['loanId', 'borrower']
        >

        /**
         * ```solidity
         * event LoanApproved(uint256 loanId)
         * ```
         */
        LoanApproved: EventFilterFactory<[loanId: BigNumber], ['loanId']>

        /**
         * ```solidity
         * event LoanDenied(uint256 loanId)
         * ```
         */
        LoanDenied: EventFilterFactory<[loanId: BigNumber], ['loanId']>

        /**
         * ```solidity
         * event LoanCancelled(uint256 loanId)
         * ```
         */
        LoanCancelled: EventFilterFactory<[loanId: BigNumber], ['loanId']>

        /**
         * ```solidity
         * event LoanRepaid(uint256 loanId)
         * ```
         */
        LoanRepaid: EventFilterFactory<[loanId: BigNumber], ['loanId']>

        /**
         * ```solidity
         * event LoanDefaulted(uint256 loanId, uint256 amountLost)
         * ```
         */
        LoanDefaulted: EventFilterFactory<
            [loanId: BigNumber, amountLost: BigNumber],
            ['loanId', 'amountLost']
        >
    }

    on<
        T extends readonly unknown[],
        K extends Record<keyof TupleToObject<T>, PropertyKey>,
    >(
        filter: EventFilterWithType<T, K>,
        callback: (...args: [...T, TypedEvent<T, K>]) => void,
    ): true

    queryFilter<
        T extends readonly unknown[],
        K extends Record<keyof TupleToObject<T>, PropertyKey>,
    >(
        filter: EventFilterWithType<T, K>,
    ): Promise<TypedEvent<T, K>[]>
}

export const contract = new Contract(
    nullAddress,
    abi,
    provider,
) as unknown as CoreContract

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

interface EVMLoan {
    id: BigNumber
    status: LoanStatus
    borrower: string
    amount: BigNumber
    duration: BigNumber
    requestedTime: BigNumber
    lateAPRDelta: number
    apr: number
}

interface EVMLoanDetails {
    loanId: BigNumber
    totalAmountRepaid: BigNumber
    baseAmountRepaid: BigNumber
    interestPaid: BigNumber
    approvedTime: BigNumber
    lastPaymentTime: BigNumber
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

export function getBatchProviderAndContract(
    count: number,
    contract: CoreContract,
) {
    const provider = new CustomBatchProvider(count)
    return {
        provider,
        contract: contract.connect(provider),
    }
}
