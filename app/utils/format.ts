import { BigNumber } from '@ethersproject/bignumber'
import { formatUnits } from '@ethersproject/units'
import { USDT_DECIMALS } from '../constants'

import { Hexadecimal, InputAmount } from '../types'

export function formatCurrency(
    value: BigNumber | Hexadecimal,
    fractionDigits = USDT_DECIMALS,
    maximumFractionDigits = 2,
    currency = 'USD',
) {
    return Number(formatUnits(value, fractionDigits)).toLocaleString(
        undefined,
        {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
            minimumFractionDigits: 0,
            maximumFractionDigits,
        },
    )
}

export function formatToken(
    value: BigNumber | Hexadecimal,
    fractionDigits = USDT_DECIMALS,
    maximumFractionDigits = USDT_DECIMALS,
    roundCeil = false,
) {
    return formatTokenNumber(
        Number(formatUnits(value, fractionDigits)),
        maximumFractionDigits,
        roundCeil,
    )
}

export function formatTokenNumber(
    value: number,
    maximumFractionDigits = USDT_DECIMALS,
    roundCeil = false,
) {
    if (roundCeil) {
        const scale = 10 ** maximumFractionDigits;
        value = Math.ceil(value * scale) / scale;
    }

    return value.toLocaleString(undefined, {
        style: 'decimal',
        maximumFractionDigits,
    })
}

export function formatPercent(value: number, maximumFractionDigits = 1) {
    return value.toLocaleString(undefined, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits,
    })
}

export function formatInputAmount(
    value: BigNumber | Hexadecimal,
    fractionDigits = 6,
): InputAmount {
    const string = formatUnits(value, fractionDigits)
    const [integer, decimal] = string.split('.')
    if (decimal === '0') return integer as InputAmount
    return string as InputAmount
}
