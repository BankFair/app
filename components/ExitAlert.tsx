import { DateTime } from 'luxon'

import { capitalize, formatMaxDecimals, TOKEN_SYMBOL } from '../app'

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
            style="warning"
            title={`${capitalize(verb)} funds incures a ${
                feePercent ? `${feePercent}%` : ''
            } fee ${
                value && value !== '-'
                    ? `(${formatMaxDecimals(
                          (Number(value) * (feePercent / 100)).toString(),
                          6,
                      )} ${TOKEN_SYMBOL}) `
                    : ''
            } which is paid to the pool`}
        />
    )
}
