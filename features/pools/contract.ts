import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { Contract, ContractTransaction, Event } from '@ethersproject/contracts'
import { id } from '@ethersproject/hash'
import {
    provider,
    CustomBatchProvider,
    ContractFunction,
    CustomBaseContract,
    EventFilterFactory,
    EventFilterWithType,
    TupleToObject,
    TupleToObjectWithPropNames,
    nullAddress,
} from '../../app'
import abi from './abi.json'

type TypedEvent<
    T extends readonly unknown[],
    K extends Record<keyof TupleToObject<T>, PropertyKey>,
> = Omit<Event, 'args'> & { args: TupleToObjectWithPropNames<T, K> }

export const loanRequestedSignature = id('LoanRequested(uint256,address)')

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
    requestLoan: ContractFunction<
        ContractTransaction,
        [amount: BigNumber, loanDuration: BigNumber]
    >
    cancelLoan: ContractFunction<ContractTransaction, [loanId: BigNumber]>
    borrow: ContractFunction<ContractTransaction, [loanId: BigNumberish]>
    repay: ContractFunction<
        ContractTransaction,
        [loanId: BigNumber, amount: BigNumber]
    >
    approveLoan: ContractFunction<ContractTransaction, [loanId: BigNumber]>
    denyLoan: ContractFunction<ContractTransaction, [loandId: BigNumber]>
    defaultLoan: ContractFunction<ContractTransaction, [loanId: BigNumber]>

    loans: ContractFunction<EVMLoan, [loanId: BigNumberish]>
    loanDetails: ContractFunction<EVMLoanDetails, [loanId: BigNumberish]>

    poolFunds: ContractFunction<BigNumber>
    poolLiquidity: ContractFunction<BigNumber>
    currentLenderAPY: ContractFunction<number>

    defaultAPR: ContractFunction<number>
    maxDuration: ContractFunction<BigNumber>
    minAmount: ContractFunction<BigNumber>
    minDuration: ContractFunction<BigNumber>

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
         * event LoanApproved(uint256 loanId, address borrower)
         * ```
         */
        LoanApproved: EventFilterFactory<
            [loanId: BigNumber, borrower: string],
            ['loanId', 'borrower']
        >

        /**
         * ```solidity
         * event LoanDenied(uint256 loanId, address borrower)
         * ```
         */
        LoanDenied: EventFilterFactory<
            [loanId: BigNumber, borrower: string],
            ['loanId', 'borrower']
        >

        /**
         * ```solidity
         * event LoanCancelled(uint256 loanId, address borrower)
         * ```
         */
        LoanCancelled: EventFilterFactory<
            [loanId: BigNumber, borrower: string],
            ['loanId', 'borrower']
        >

        /**
         * ```solidity
         * event LoanRepaid(uint256 loanId, address borrower)
         * ```
         */
        LoanRepaid: EventFilterFactory<
            [loanId: BigNumber, borrower: string],
            ['loanId', 'borrower']
        >

        /**
         * ```solidity
         * event LoanDefaulted(uint256 loanId, address borrower, uint256 amountLost)
         * ```
         */
        LoanDefaulted: EventFilterFactory<
            [loanId: BigNumber, borrower: string, amountLost: BigNumber],
            ['loanId', 'borrower', 'amountLost']
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

export interface EVMLoan {
    id: BigNumber
    status: LoanStatus
    borrower: string
    amount: BigNumber
    duration: BigNumber
    requestedTime: BigNumber
    lateAPRDelta: number
    apr: number
}

export interface EVMLoanDetails {
    loanId: BigNumber
    totalAmountRepaid: BigNumber
    baseAmountRepaid: BigNumber
    interestPaid: BigNumber
    approvedTime: BigNumber
    lastPaymentTime: BigNumber
}

export enum LoanStatus {
    APPLIED,
    DENIED,
    APPROVED,
    CANCELLED,
    FUNDS_WITHDRAWN,
    REPAID,
    DEFAULTED,
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
