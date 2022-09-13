import {
    capitalize,
    formatPercent,
    formatTokenNumber,
    TOKEN_SYMBOL,
    USDT_DECIMALS,
} from '../app'

import { Alert } from './Alert'

export function ExitAlert({
    value,
    verb,
    feePercent,
}: {
    value: string
    verb: 'withdrawing' | 'unstaking'
    feePercent: number
}) {
    return (
        <Alert
            style="warning-blue"
            title={`${capitalize(verb)} funds incures a ${
                feePercent ? formatPercent(feePercent / 100) : ''
            } fee ${
                value && value !== '-'
                    ? `(${formatTokenNumber(
                          Number(value) * (feePercent / 100),
                          USDT_DECIMALS,
                      )} ${TOKEN_SYMBOL}) `
                    : ''
            } which is paid to the pool`}
        />
    )
}
