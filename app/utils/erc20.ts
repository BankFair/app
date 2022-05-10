import { BigNumber } from '@ethersproject/bignumber'
import { ContractTransaction } from '@ethersproject/contracts'
import { CustomBaseContract, ContractFunction } from './ethers'

export interface ERC20Contract extends CustomBaseContract {
    allowance: ContractFunction<BigNumber, [string, string]>
    decimals: ContractFunction<number>
    approve: ContractFunction<ContractTransaction, [string, BigNumber]>
    balanceOf: ContractFunction<BigNumber, [string]>
}

export const infiniteAllowance = BigNumber.from(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
)
