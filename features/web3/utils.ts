import { BaseContract, BigNumber, Contract, EventFilter } from 'ethers'
import erc20Abi from './erc20-abi.json'
import provider from './provider'

export const infiniteAllowance = BigNumber.from(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
)

export type ContractFunction<T, R extends readonly unknown[] = []> = (
    ...args: R
) => Promise<T>

type OptionalOrNullTuple<Tuple extends readonly unknown[]> = {
    [Index in keyof Tuple]?: Tuple[Index] | null
}

export type TupleToObject<T extends readonly unknown[]> = {
    [K in keyof T as Exclude<K, keyof any[]>]: T[K]
}
export type TupleToObjectWithPropNames<
    T extends readonly unknown[],
    N extends Record<keyof TupleToObject<T>, PropertyKey>,
> = { [K in keyof TupleToObject<T> as N[K]]: T[K] }

export interface EventFilterWithType<
    T extends readonly unknown[],
    N extends Record<keyof TupleToObject<T>, PropertyKey>,
> extends EventFilter {}
export type EventFilterFactory<
    T extends readonly unknown[],
    N extends Record<keyof TupleToObject<T>, PropertyKey>,
> = (...args: OptionalOrNullTuple<T>) => EventFilterWithType<T, N>

export interface CustomBaseContract extends BaseContract {
    connect(...args: Parameters<BaseContract['connect']>): this
}

interface ERC20Contract extends CustomBaseContract {
    allowance: ContractFunction<BigNumber, [string, string]>
    decimals: ContractFunction<number>
    approve: ContractFunction<boolean, [string, BigNumber]>
    balanceOf: ContractFunction<BigNumber, [string]>
}

export function getERC20Contract(address: string) {
    return new Contract(address, erc20Abi, provider) as ERC20Contract
}
