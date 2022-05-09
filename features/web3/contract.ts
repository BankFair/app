import { BigNumber, Contract, ContractTransaction, Event } from 'ethers'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CONTRACT_ADDRESS, RPC_URL, useProvider } from '../../app'
import abi from './abi.json'
import provider, { CustomBatchProvider } from './provider'
import {
    setLoans,
    setManagerAddress,
    setTokenAddress,
    setTokenDecimals,
    updateLoan,
    Loan as StateLoan,
    LoanDetails as StateLoanDetails,
    selectManagerAddress,
    updateLoans,
    selectTokenContract,
} from './web3Slice'
import {
    ContractFunction,
    CustomBaseContract,
    getERC20Contract,
    EventFilterFactory,
    EventFilterWithType,
    TupleToObject,
    TupleToObjectWithPropNames,
    LoanStatus,
    ERC20Contract,
} from './utils'
import { Dispatch } from 'redux'

type TypedEvent<
    T extends readonly unknown[],
    K extends Record<keyof TupleToObject<T>, PropertyKey>,
> = Omit<Event, 'args'> & { args: TupleToObjectWithPropNames<T, K> }

export interface CoreContract
    extends Omit<
        CustomBaseContract,
        'filters' | 'connect' | 'queryFilter' | 'on'
    > {
    connect(...args: Parameters<CustomBaseContract['connect']>): this

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
    amountWithdrawable: ContractFunction<BigNumber>
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
    CONTRACT_ADDRESS,
    abi,
    provider,
) as unknown as CoreContract

export function useFetchContractPropertiesOnce() {
    const dispatch = useDispatch()
    const ref = useRef(false)
    useEffect(() => {
        if (typeof window !== 'object' || ref.current) return
        // https://github.com/reactwg/react-18/discussions/18
        // Read "Effects that should only run once can use a ref"
        ref.current = true

        contract.manager().then((manager) => {
            dispatch(setManagerAddress(manager))
        })
        contract.token().then((token) => {
            dispatch(setTokenAddress(token))

            const tokenContract = getERC20Contract(token)
            tokenContract.decimals().then((decimals) => {
                dispatch(setTokenDecimals(decimals))
            })
        })
    }, [dispatch])
}

const accounts: string[] = []
const onceRef = { current: false }
export function useLoadAccountLoans(
    account: string | undefined,
    dispatch: Dispatch,
) {
    const managerAddress = useSelector(selectManagerAddress)

    useEffect(() => {
        if (!managerAddress || !account) return
        if (managerAddress === account) return
        if (accounts.includes(account)) return
        accounts.push(account)

        contract
            .queryFilter(contract.filters.LoanRequested(null, account))
            .then((loans) => fetchLoans(loans.map((loan) => loan.args.loanId)))
            .then(([loans, details, blockNumber]) => {
                dispatch(
                    updateLoans({
                        loans: transformToStateLoans(loans, details),
                        blockNumber,
                    }),
                )
            })

        contract.on(
            contract.filters.LoanRequested(null, account),
            handleLoanEvent,
        )

        if (onceRef.current) return
        onceRef.current = true

        contract.on(contract.filters.LoanApproved(), handleLoanEvent)
        contract.on(contract.filters.LoanDenied(), handleLoanEvent)
        contract.on(contract.filters.LoanCancelled(), handleLoanEvent)
        contract.on(contract.filters.LoanRepaid(), handleLoanEvent)
        contract.on(contract.filters.LoanDefaulted(), handleLoanEvent)

        function handleLoanEvent<_T>(loanId: BigNumber) {
            fetchAndUpdateLoan(loanId).then((action) => {
                if (action.payload.loan.borrower !== account) return
                dispatch(action)
            })
        }
    }, [account, managerAddress, dispatch])
}

const ref = { current: false }
export function useLoadManagerState() {
    const dispatch = useDispatch()
    useEffect(() => {
        if (typeof window !== 'object' || ref.current) return
        // https://github.com/reactwg/react-18/discussions/18
        // Read "Effects that should only run once can use a ref"
        ref.current = true

        // TODO: Replace with `loansCount`
        contract.loansCount().then(async (count) => {
            const length = count.toNumber()

            const [loans, details, blockNumber] = await fetchLoans(
                Array.from({ length }, (_, i) => i + 1),
            )

            dispatch(
                setLoans({
                    loans: transformToStateLoans(loans, details),
                    blockNumber,
                }),
            )
        })

        contract.on(contract.filters.LoanRequested(), handleLoanEvent)
        contract.on(contract.filters.LoanApproved(), handleLoanEvent)
        contract.on(contract.filters.LoanDenied(), handleLoanEvent)
        contract.on(contract.filters.LoanCancelled(), handleLoanEvent)
        contract.on(contract.filters.LoanRepaid(), handleLoanEvent)
        contract.on(contract.filters.LoanDefaulted(), handleLoanEvent)
        function handleLoanEvent<_T>(loanId: BigNumber) {
            fetchAndUpdateLoan(loanId).then(dispatch)
        }
    }, [dispatch])
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
    ids: (number | BigNumber)[],
): Promise<[EVMLoan[], EVMLoanDetails[], number]> {
    const { provider, contract } = getBatchProviderAndContract(
        ids.length * 2 + 1,
    )

    return Promise.all([
        Promise.all(ids.map((id) => contract.loans(id))),
        Promise.all(ids.map((id) => contract.loanDetails(id))),
        provider.getCurrentBlockNumber(),
    ])
}

export function fetchAndUpdateLoan(
    loanId: number | BigNumber,
): Promise<ReturnType<typeof updateLoan>> {
    const { provider, contract } = getBatchProviderAndContract(3)

    return Promise.all([
        contract.loans(
            typeof loanId === 'number' ? BigNumber.from(loanId) : loanId,
        ),
        contract.loanDetails(
            typeof loanId === 'number' ? BigNumber.from(loanId) : loanId,
        ),
        provider.getCurrentBlockNumber(),
    ]).then(([loan, details, blockNumber]) =>
        updateLoan({ loan: transformToStateLoan(loan, details), blockNumber }),
    )
}

export function useSigner(): (() => CoreContract) | undefined {
    const provider = useProvider()
    return provider && (() => contract.connect(provider.getSigner()))
}

export function useTokenContractSigner(): (() => ERC20Contract) | undefined {
    const provider = useProvider()
    const tokenContract = useSelector(selectTokenContract)
    return provider && tokenContract
        ? () => tokenContract.connect(provider.getSigner())
        : undefined
}

export function getBatchProviderAndContract(count: number) {
    const provider = new CustomBatchProvider(count)
    return {
        provider,
        contract: contract.connect(provider),
    }
}
