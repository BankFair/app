import { BaseContract, BigNumber, Contract } from 'ethers'
import erc20Abi from './erc20-abi.json'
import provider from './provider'

export const infiniteAllowance = BigNumber.from(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
)

export type ContractFunction<T, R extends readonly unknown[] = []> = (
    ...args: R
) => Promise<T>

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
