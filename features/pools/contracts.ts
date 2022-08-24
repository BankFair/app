import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { Contract, ContractTransaction, Event } from '@ethersproject/contracts'
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
import loanDeskAbi from './loanDeskAbi.json'

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
    loanDesk: ContractFunction<string>
    poolToken: ContractFunction<string>
    liquidityToken: ContractFunction<string>
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
    borrow: ContractFunction<ContractTransaction, [applicationId: BigNumberish]>
    repay: ContractFunction<
        ContractTransaction,
        [loanId: BigNumber, amount: BigNumber]
    >
    defaultLoan: ContractFunction<ContractTransaction, [loanId: BigNumberish]>
    canDefault: ContractFunction<
        boolean,
        [loanId: BigNumberish, account: string]
    >

    loans: ContractFunction<EVMLoan, [loanId: BigNumberish]>
    loanDetails: ContractFunction<EVMLoanDetails, [loanId: BigNumberish]>

    poolFunds: ContractFunction<BigNumber>
    poolLiquidity: ContractFunction<BigNumber>
    currentLenderAPY: ContractFunction<number>

    protocolEarningsOf: ContractFunction<BigNumber, [account: string]>
    withdrawProtocolEarnings: ContractFunction<ContractTransaction>

    exitFeePercent: ContractFunction<BigNumber>

    filters: {
        /**
         * ```solidity
         * event LoanBorrowed(uint256 loanId, address borrower)
         * ```
         */
        LoanBorrowed: EventFilterFactory<
            [loanId: BigNumber, borrower: string, applicationId: BigNumber],
            ['loanId', 'borrower', 'applicationId']
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
        fromBlock?: number,
    ): Promise<TypedEvent<T, K>[]>
}

export enum LoanApplicationStatus {
    NULL,
    APPLIED,
    DENIED,
    OFFER_MADE,
    OFFER_ACCEPTED,
    OFFER_CANCELLED,
}

export interface LoanRequest {
    id: BigNumber
    borrower: string
    amount: BigNumber
    duration: BigNumber
    requestedTime: BigNumber
    status: LoanApplicationStatus

    profileId: string
    profileDigest: string
}

export interface LoanOffer {
    applicationId: BigNumber
    borrower: string
    amount: BigNumber
    duration: BigNumber
    gracePeriod: BigNumber
    installmentAmount: BigNumber
    installments: number
    apr: number
    offeredTime: BigNumber
}

export interface LoanDeskContract
    extends Omit<
        CustomBaseContract,
        'filters' | 'connect' | 'attach' | 'queryFilter' | 'on'
    > {
    connect(...args: Parameters<CustomBaseContract['connect']>): this
    attach(...args: Parameters<CustomBaseContract['attach']>): this

    requestLoan: ContractFunction<
        ContractTransaction,
        [
            amount: BigNumber,
            loanDuration: BigNumber,
            profileId: string,
            profileDigest: string,
        ]
    >
    offerLoan: ContractFunction<
        ContractTransaction,
        [
            applicationId: BigNumberish,
            amount: BigNumberish,
            duration: BigNumberish,
            gracePeriod: BigNumberish,
            installmentAmount: BigNumberish,
            installments: number,
            apr: number,
        ]
    >
    cancelLoan: ContractFunction<
        ContractTransaction,
        [applicationId: BigNumberish]
    >
    approveLoan: ContractFunction<
        ContractTransaction,
        [applicationId: BigNumberish]
    >
    denyLoan: ContractFunction<
        ContractTransaction,
        [applicationId: BigNumberish]
    >
    canDefault: ContractFunction<
        boolean,
        [loanId: BigNumberish, account: string]
    >

    loanApplications: ContractFunction<
        LoanRequest,
        [applicationId: BigNumberish]
    >
    loanOffers: ContractFunction<LoanOffer, [applicationId: BigNumberish]>
    borrowerStats: ContractFunction<
        { hasOpenApplication: boolean },
        [account: string]
    >
    templateLoanAPR: ContractFunction<number>
    maxLoanDuration: ContractFunction<BigNumber>
    minLoanAmount: ContractFunction<BigNumber>
    minLoanDuration: ContractFunction<BigNumber>

    filters: {
        /**
         * ```solidity
         * event LoanRequested(uint256 applicationId, address borrower)
         * ```
         */
        LoanRequested: EventFilterFactory<
            [applicationId: BigNumber, borrower: string],
            ['applicationId', 'borrower']
        >
        /**
         * ```solidity
         * event LoanOffered(uint256 applicationId, address borrower)
         * ```
         */
        LoanOffered: EventFilterFactory<
            [applicationId: BigNumber, borrower: string],
            ['applicationId', 'borrower']
        >

        // /**
        //  * ```solidity
        //  * event LoanApproved(uint256 loanId, address borrower)
        //  * ```
        //  */
        // LoanApproved: EventFilterFactory<
        //     [loanId: BigNumber, borrower: string],
        //     ['loanId', 'borrower']
        // >

        // /**
        //  * ```solidity
        //  * event LoanDenied(uint256 loanId, address borrower)
        //  * ```
        //  */
        // LoanDenied: EventFilterFactory<
        //     [loanId: BigNumber, borrower: string],
        //     ['loanId', 'borrower']
        // >
        // /**
        //  * ```solidity
        //  * event LoanCancelled(uint256 loanId, address borrower)
        //  * ```
        //  */
        // LoanCancelled: EventFilterFactory<
        //     [loanId: BigNumber, borrower: string],
        //     ['loanId', 'borrower']
        // >
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
        fromBlock?: number,
    ): Promise<TypedEvent<T, K>[]>
}

export const contract = new Contract(
    nullAddress,
    abi,
    provider,
) as unknown as CoreContract

export const loanDeskContract = new Contract(
    nullAddress,
    loanDeskAbi,
    provider,
) as unknown as LoanDeskContract

export interface EVMLoan {
    id: BigNumber
    status: LoanStatus
    borrower: string
    amount: BigNumber
    apr: number
    loanDeskAddress: string
    applicationId: BigNumber
    duration: BigNumber
    gracePeriod: BigNumber
    installments: number
    borrowedTime: BigNumber
}

export interface EVMLoanDetails {
    loanId: BigNumber
    totalAmountRepaid: BigNumber
    baseAmountRepaid: BigNumber
    interestPaid: BigNumber
    lastPaymentTime: BigNumber
}

export enum LoanStatus {
    NULL,
    OUTSTANDING,
    REPAID,
    DEFAULTED,
}

export function formatStatus(status: LoanStatus) {
    switch (status) {
        case LoanStatus.NULL:
            return "You shouldn't see this"
        case LoanStatus.OUTSTANDING:
            return 'Outstanding'
        case LoanStatus.DEFAULTED:
            return 'Defaulted'
        case LoanStatus.REPAID:
            return 'Repaid'
    }
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

export function getBatchProviderAndLoanDeskContract(
    count: number,
    loanDeskContract: LoanDeskContract,
) {
    const provider = new CustomBatchProvider(count)
    return {
        provider,
        contract: loanDeskContract.connect(provider),
    }
}
