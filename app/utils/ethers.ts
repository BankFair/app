import { BaseContract, EventFilter } from '@ethersproject/contracts'
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'

export type ContractFunction<
    ReturnType,
    Arguments extends readonly unknown[] = [],
> = (...args: Arguments) => Promise<ReturnType>

type OptionalOrNullTuple<Tuple extends readonly unknown[]> = {
    [Index in keyof Tuple]?:
        | (Tuple[Index] extends BigNumber ? BigNumberish : Tuple[Index])
        | null
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
    _N extends Record<keyof TupleToObject<T>, PropertyKey>,
> extends EventFilter {}
export type EventFilterFactory<
    T extends readonly unknown[],
    N extends Record<keyof TupleToObject<T>, PropertyKey>,
> = (...args: OptionalOrNullTuple<T>) => EventFilterWithType<T, N>

export interface CustomBaseContract extends BaseContract {
    connect(...args: Parameters<BaseContract['connect']>): this
    attach(...args: Parameters<BaseContract['attach']>): this
}

export const nullAddress = '0x0000000000000000000000000000000000000000'
