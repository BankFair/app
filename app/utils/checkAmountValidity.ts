import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'

import { Hexadecimal, InputAmount } from '../types'

export function checkAmountValidity(
    value: InputAmount,
    liquidityTokenDecimals: number,
    minLoanAmount: Hexadecimal | BigNumber,
) {
    return value
        ? parseUnits(value, liquidityTokenDecimals).gte(minLoanAmount)
        : false
}

export function checkAmountMaxValidity(
    value: InputAmount,
    liquidityTokenDecimals: number,
    maxLoanAmount: Hexadecimal | BigNumber,
) {
    return value
        ? parseUnits(value, liquidityTokenDecimals).lte(maxLoanAmount)
        : false
}
