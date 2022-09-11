import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { ContractTransaction } from '@ethersproject/contracts'
import { CustomBaseContract, ContractFunction } from './ethers'

export interface ERC20Contract extends CustomBaseContract {
    allowance: ContractFunction<BigNumber, [owner: string, spender: string]>
    decimals: ContractFunction<number>
    approve: ContractFunction<
        ContractTransaction,
        [spender: string, allowance: BigNumberish]
    >
    balanceOf: ContractFunction<BigNumber, [owner: string]>
}

export const infiniteAllowance = BigNumber.from(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
)
