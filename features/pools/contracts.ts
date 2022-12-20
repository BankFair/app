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
    Address,
} from '../../app'
import abi from './abi.json'
import loanDeskAbi from './loanDeskAbi.json'

type TypedEvent<
    T extends readonly unknown[],
    K extends Record<keyof TupleToObject<T>, PropertyKey>,
> = Omit<Event, 'args'> & { args: TupleToObjectWithPropNames<T, K> }

export const loanBorrowedSignature = 'LoanBorrowed(uint256,address)'

export interface CoreContract
    extends Omit<
        CustomBaseContract,
        'filters' | 'connect' | 'attach' | 'queryFilter' | 'on'
    > {
    connect(...args: Parameters<CustomBaseContract['connect']>): this
    attach(...args: Parameters<CustomBaseContract['attach']>): this

    loanDesk: ContractFunction<Address>
    tokenConfig: ContractFunction<TokenConfig>
    config: ContractFunction<PoolConfig>
    balances: ContractFunction<PoolBalance>
    balanceStaked: ContractFunction<BigNumber>
    balanceOf: ContractFunction<BigNumber, [account: string]>
    stake: ContractFunction<ContractTransaction, [amount: BigNumber]>
    unstake: ContractFunction<ContractTransaction, [amount: BigNumber]>
    deposit: ContractFunction<ContractTransaction, [amount: BigNumber]>
    withdraw: ContractFunction<ContractTransaction, [amount: BigNumber]>
    amountDepositable: ContractFunction<BigNumber>
    amountUnstakable: ContractFunction<BigNumber>
    amountWithdrawable: ContractFunction<BigNumber, [account: string]>

    currentAPY: ContractFunction<APYBreakdown>

    collectProtocolRevenue: ContractFunction<ContractTransaction, [amount: BigNumber]>
    collectManagerRevenue: ContractFunction<ContractTransaction, [amount: BigNumber]>

    filters: {
        
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

export interface TokenConfig {
    poolToken: Address
    liquidityToken: Address
    decimals: number
}

export interface PoolConfig {
    weightedAvgStrategyAPR: BigNumber
    exitFeePercent: number
    maxProtocolFeePercent: number
    minWithdrawalRequestAmount: BigNumber
    targetStakePercent: number
    protocolFeePercent: number
    managerEarnFactorMax: number
    managerEarnFactor: number
    targetLiquidityPercent: number
}

export interface PoolBalance {
    tokenBalance: BigNumber
    rawLiquidity: BigNumber
    poolFunds: BigNumber
    allocatedFunds: BigNumber
    strategizedFunds: BigNumber
    withdrawalRequestedShares: BigNumber
    stakedShares: BigNumber
    managerRevenue: BigNumber
    protocolRevenue: BigNumber
}

export interface APYBreakdown {
    totalPoolAPY: number
    protocolRevenueComponent: number
    managerRevenueComponent: number
    lenderComponent: number
}

export interface LoanTemplate {
    minAmount: BigNumber
    minDuration: BigNumber
    maxDuration: BigNumber
    gracePeriod: BigNumber
    apr: number
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
    updateOffer: ContractFunction<
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
    denyLoan: ContractFunction<
        ContractTransaction,
        [applicationId: BigNumberish]
    >
    borrow: ContractFunction<ContractTransaction, [applicationId: BigNumberish]>
    repay: ContractFunction<
        ContractTransaction,
        [loanId: BigNumber, amount: BigNumber]
    >
    repayOnBehalf: ContractFunction<
        ContractTransaction,
        [loanId: BigNumber, amount: BigNumber, borrwer: string]
        >
    defaultLoan: ContractFunction<ContractTransaction, [loanId: BigNumberish]>
    closeLoan: ContractFunction<
        ContractTransaction,
        [loanId: BigNumberish]
        >
    canDefault: ContractFunction<boolean, [loanId: BigNumberish]>
    hasOpenApplication: ContractFunction<boolean, [account: string]>

    loanTemplate: ContractFunction<LoanTemplate>

    applicationsCount: ContractFunction<BigNumber>
    loansCount: ContractFunction<BigNumber>
    outstandingLoansCount: ContractFunction<BigNumber>

    loanApplications: ContractFunction<LoanRequest,[applicationId: BigNumberish]>
    loanOffers: ContractFunction<LoanOffer, [applicationId: BigNumberish]>
    loans: ContractFunction<EVMLoan, [loanId: BigNumberish]>
    loanDetails: ContractFunction<EVMLoanDetails, [loanId: BigNumberish]>

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

        /**
         * ```solidity
         * event LoanRepaid(uint256 loanId, address borrower)
         * ```
         */
        LoanFullyRepaid: EventFilterFactory<
            [loanId: BigNumber, borrower: string],
            ['loanId', 'borrower']
        >

        /**
         * ```solidity
         * event LoanDefaulted(uint256 loanId, address borrower, uint256 amountLost)
         * ```
         */
        LoanDefaulted: EventFilterFactory<
            [loanId: BigNumber, borrower: string, managerLoss: BigNumber, lenderLoss: BigNumber],
            ['loanId', 'borrower', 'managerLoss', 'lenderLoss']
        >

        /**
         * ```solidity
         * event LoanBorrowed(uint256 loanId, address borrower)
         * ```
         */
        LoanBorrowed: EventFilterFactory<
            [loanId: BigNumber, borrower: string, applicationId: BigNumber],
            ['loanId', 'borrower', 'applicationId']
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
    installmentAmount: BigNumber
    borrowedTime: BigNumber
}

export interface EVMLoanDetails {
    loanId: BigNumber
    totalAmountRepaid: BigNumber
    principalAmountRepaid: BigNumber
    interestPaid: BigNumber
    interestPaidTillTime: BigNumber
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
        loanDeskContract: loanDeskContract.connect(provider),
    }
}
