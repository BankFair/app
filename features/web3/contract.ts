import { BigNumber, Contract, Event, EventFilter } from 'ethers'
import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { CONTRACT_ADDRESS } from '../../app'
import abi from './abi.json'
import provider from './provider'
import {
    setManagerAddress,
    setTokenAddress,
    setTokenDecimals,
} from './web3Slice'
import {
    ContractFunction,
    CustomBaseContract,
    getERC20Contract,
    EventFilterFactory,
    EventFilterWithType,
    TupleToObject,
    TupleToObjectWithPropNames,
} from './utils'

interface CoreContract
    extends Omit<CustomBaseContract, 'filters' | 'connect' | 'queryFilter'> {
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
        LoanRequested: EventFilterFactory<
            [loanId: BigNumber, borrower: string],
            ['loanId', 'borrower']
        >
    }

    queryFilter<
        T extends readonly unknown[],
        K extends Record<keyof TupleToObject<T>, PropertyKey>,
    >(
        filter: EventFilterWithType<T, K>,
    ): Promise<
        (Omit<Event, 'args'> & { args: TupleToObjectWithPropNames<T, K> })[]
    >
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

export enum LoanStatus {
    APPLIED,
    DENIED,
    APPROVED,
    CANCELLED,
    FUNDS_WITHDRAWN,
    REPAID,
    DEFAULTED,
}
