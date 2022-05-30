import { BigNumber } from '@ethersproject/bignumber'
import { ONE_HUNDRED_PERCENT } from '../constants'

const oneYear = BigNumber.from(365)

/**
 * Adds interest to value for given period
 * @param value
 * @param interestRate The interest rate in percent
 * @param days The amount of days
 */
export function withInterest(
    value: BigNumber,
    interestRate: BigNumber,
    days: number,
) {
    return value.add(
        value
            .mul(interestRate.mul(Math.trunc(days)).div(oneYear))
            .div(ONE_HUNDRED_PERCENT),
    )
}
