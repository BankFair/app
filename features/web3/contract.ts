import { BigNumber, Contract, Event } from 'ethers'
import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { CONTRACT_ADDRESS, useProvider } from '../../app'
import abi from './abi.json'
import provider from './provider'
import {
    setLoans,
    setManagerAddress,
    setTokenAddress,
    setTokenDecimals,
    updateLoan,
    Loan as StateLoan,
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
    getCurrentBlockTimestamp,
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
    stake: ContractFunction<void, [amount: BigNumber]>
    unstake: ContractFunction<void, [amount: BigNumber]>
    deposit: ContractFunction<void, [amount: BigNumber]>
    withdraw: ContractFunction<void, [amount: BigNumber]>
    amountDepositable: ContractFunction<BigNumber>
    amountUnstakeable: ContractFunction<BigNumber>
    amountWithdrawable: ContractFunction<BigNumber>
    maxDuration: ContractFunction<BigNumber>
    minAmount: ContractFunction<BigNumber>
    minDuration: ContractFunction<BigNumber>
    requestLoan: ContractFunction<
        void,
        [amount: BigNumber, loanDuration: BigNumber]
    >
    cancelLoan: ContractFunction<void, [loanId: BigNumber]>
    borrow: ContractFunction<void, [loanId: BigNumber]>
    repay: ContractFunction<void, [loanId: BigNumber, amount: BigNumber]>
    approveLoan: ContractFunction<void, [loanId: BigNumber]>
    denyLoan: ContractFunction<void, [loandId: BigNumber]>
    defaultLoan: ContractFunction<void, [loanId: BigNumber]>

    loans: ContractFunction<Loan, [loanId: BigNumber]>

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

        // TODO: Replace with `loansCount`
        contract
            .queryFilter(contract.filters.LoanRequested())
            .then(async (events) => {
                const loanIds = events
                    .map((loan) => loan.args.loanId.toNumber())
                    .sort()
                if (!loanIds.length) return

                const lastLoanId = loanIds[loanIds.length - 1]
                const [loans, timestamp] = await Promise.all([
                    Promise.all(
                        Array.from({ length: lastLoanId }, (_, i) => i + 1).map(
                            (id) => contract.loans(BigNumber.from(id)),
                        ),
                    ),
                    getCurrentBlockTimestamp(),
                ])
                dispatch(
                    setLoans({
                        loans: transformToStateLoans(loans),
                        timestamp,
                    }),
                )
            })

        contract.on(contract.filters.LoanRequested(), handleLoanEvent)
        contract.on(contract.filters.LoanApproved(), handleLoanEvent)
        contract.on(contract.filters.LoanDenied(), handleLoanEvent)
        contract.on(contract.filters.LoanRepaid(), handleLoanEvent)
        contract.on(contract.filters.LoanDefaulted(), handleLoanEvent)
        function handleLoanEvent<_T>(loanId: BigNumber) {
            fetchAndUpdateLoan(loanId).then(dispatch)
        }
    }, [dispatch])
}

export interface Loan {
    id: BigNumber
    status: LoanStatus
    borrower: string
    amount: BigNumber
    duration: BigNumber
    requestedTime: BigNumber
    lateAPRDelta: number
    apr: number
}

function transformToStateLoans(loans: Loan[]): StateLoan[] {
    return loans.map(transformToStateLoan)
}
function transformToStateLoan(loan: Loan): StateLoan {
    return {
        id: loan.id.toNumber(),
        status: loan.status,
        borrower: loan.borrower,
        amount: loan.amount.toHexString(),
        requestedTime: loan.requestedTime.toNumber() * 1000,
    }
}

export function fetchAndUpdateLoan(loanId: number | BigNumber) {
    return Promise.all([
        contract.loans(
            typeof loanId === 'number' ? BigNumber.from(loanId) : loanId,
        ),
        getCurrentBlockTimestamp(),
    ]).then(([loan, timestamp]) =>
        updateLoan({ loan: transformToStateLoan(loan), timestamp }),
    )
}

export function useSigner(): (() => CoreContract) | undefined {
    const provider = useProvider()
    return provider && (() => contract.connect(provider.getSigner()))
}
