import { BigNumber } from '@ethersproject/bignumber'
import { useEffect, useMemo, useState } from 'react'

import { oneDay, oneHundredPercent, zero } from '../constants'

import { noop } from './noop'
import { withInterest } from './withInterest'

const halfHour = 30 * 60 * 1000
export function useAmountWithInterest(
    amount: string,
    interestRate: number,
    approvedTime: number,
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

        if (!interestRate || !approvedTime) return zero

        const now = Date.now() / 1000

        const amountBigNumber = BigNumber.from(amount)
        const days = countInterestDays(approvedTime, now)

        const interestRateBigNumber = BigNumber.from(
            (interestRate / 100) * oneHundredPercent,
        )

        return withInterest(amountBigNumber, interestRateBigNumber, days)
    }, [amount, approvedTime, integer, interestRate])
}

function countInterestDays(from: number, to: number) {
    const seconds = to - from
    const days = Math.trunc(seconds / oneDay)

    if (seconds % oneDay > 0) {
        return days + 1
    }

    return days
}
