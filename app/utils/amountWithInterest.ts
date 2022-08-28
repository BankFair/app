import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { useEffect, useMemo, useState } from 'react'

import { oneDay, zero } from '../constants'

import { noop } from './noop'
import { oneHundredThousand, oneMillion } from './precision'

const halfHour = 30 * 60 * 1000
export function useAmountWithInterest(
    amount: string,
    baseAmountRepaid: string,
    interestPaidUntil: number,
    interestRate: number,
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

        const { principalOutstanding, interestOutstanding } =
            amountWithInterest(
                amount,
                baseAmountRepaid,
                interestPaidUntil,
                interestRate,
            )

        return principalOutstanding.add(interestOutstanding)
    }, [amount, baseAmountRepaid, integer, interestPaidUntil, interestRate])
}

function countInterestDays(from: number, to: number) {
    if (to <= from) return 0
    const seconds = to - from
    return Math.ceil(seconds / oneDay)
}

export function amountWithInterest(
    amount: BigNumberish,
    baseAmountRepaid: BigNumberish,
    interestPaidUntil: number,
    interestRate: number,
    at = Math.trunc(Date.now() / 1000),
) {
    if (!interestRate) {
        return { principalOutstanding: zero, interestOutstanding: zero }
    }

    const amountBigNumber = BigNumber.from(amount)
    const baseAmountRepaidBigNumber = BigNumber.from(baseAmountRepaid)
    const daysPassed = countInterestDays(interestPaidUntil, at)
    const interestPercent = (interestRate / 100) * (daysPassed / 365)
    const principalOutstanding = amountBigNumber.sub(baseAmountRepaidBigNumber)
    const interestOutstanding = principalOutstanding
        .mul(Math.trunc(interestPercent * 1_000_000))
        .div(oneMillion)

    return { principalOutstanding, interestOutstanding }
}

export function getInstallmentAmount(
    amount: BigNumberish,
    apr: number,
    installments: number,
    duration: number,
) {
    const dailyInterest = apr / 100 / 365
    const days = countInterestDays(0, duration)
    const years = days / 365
    const installmentInterest = ((years * 365) / installments) * dailyInterest
    const amountBigNumber = BigNumber.from(amount)

    return amountBigNumber
        .mul(
            Math.trunc(
                ((installmentInterest *
                    Math.pow(1 + installmentInterest, installments)) /
                    (Math.pow(1 + installmentInterest, installments) - 1)) *
                    1_000_000,
            ),
        )
        .div(oneMillion)
}
