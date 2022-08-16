import { DateTime } from 'luxon'

import { capitalize, formatMaxDecimals } from '../app'

import { Alert } from './Alert'

export function ExitAlert({
    value,
    verb,
    feePercent,
    deadline,
}: {
    value: string
    verb: 'withdrawing' | 'unstaking'
    feePercent: number
    deadline: number
}) {
    return value === '-' ||
        (feePercent && deadline && deadline > Date.now() / 1000) ? (
        <Alert
            style="warning"
            title={`${capitalize(verb)} funds ${
                value !== '-'
                    ? `before ${DateTime.fromSeconds(deadline)
                          .toLocal()
                          .toLocaleString(DateTime.DATETIME_SHORT)}`
                    : ''
            } incures a ${feePercent}% fee ${
                value && value !== '-'
                    ? `(${formatMaxDecimals(
                          (Number(value) * (feePercent / 100)).toString(),
                          6,
                      )} USDC) `
                    : ''
            } which is paid to the pool`}
        />
    ) : (
        <Alert style="info" title={`No exit fee when ${verb}`} />
    )
}
