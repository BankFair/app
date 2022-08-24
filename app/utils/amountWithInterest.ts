import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { useEffect, useMemo, useState } from 'react'

import {
    oneDay,
    oneHundredPercent,
    zero,
    ONE_HUNDRED_PERCENT,
} from '../constants'

import { noop } from './noop'

const halfHour = 30 * 60 * 1000
export function useAmountWithInterest(
    amount: string,
    interestRate: number,
    borrowedTime: number,
): BigNumber {
    const [integer, setInteger] = useState(0) // Force update
    useEffect(() => {
        // Will update every 30 minutes
        const timeoutId = setTimeout(() => {
            setInteger((i) => i + 1)
        }, halfHour)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [])

    return useMemo(() => {
        process.env.NODE_ENV === 'development' && noop(integer) // because of react-hooks/exhaustive-deps

        return amountWithInterest(amount, borrowedTime, interestRate)
    }, [amount, borrowedTime, integer, interestRate])
}

function countInterestDays(from: number, to: number) {
    const seconds = to - from
    return Math.ceil(seconds / oneDay)
}

const oneYear = BigNumber.from(365)
export function amountWithInterest(
    amount: BigNumberish,
    borrowedTime: number,
    interestRate: number,
) {
    if (!interestRate || !borrowedTime) return zero

    const now = Math.trunc(Date.now() / 1000)

    const amountBigNumber = BigNumber.from(amount)
    const days = countInterestDays(borrowedTime, now)

    const interestRateBigNumber = BigNumber.from(
        (interestRate / 100) * oneHundredPercent,
    )

    return amountBigNumber.add(
        amountBigNumber
            .mul(interestRateBigNumber.mul(days).div(oneYear))
            .div(ONE_HUNDRED_PERCENT),
    )
}
