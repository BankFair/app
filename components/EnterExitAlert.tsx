import { DateTime } from 'luxon'

import { formatMaxDecimals } from '../app'

import { Alert } from './Alert'

export function EnterExitAlert({
    enter,
    value,
    enterVerb,
    exitVerb,
    earlyExitFeePercent,
    earlyExitDeadline,
}: {
    enter: boolean
    value: string
    enterVerb: 'deposit' | 'stake'
    exitVerb: 'withdrawing' | 'unstaking'
    earlyExitFeePercent: number
    earlyExitDeadline: number
}) {
    return enter ? (
        <Alert
            style="warning-filled"
            title={`You should not ${enterVerb} unless you are prepared to sustain a total loss of the money you have invested plus any commission or other transaction charges`}
        />
    ) : earlyExitFeePercent &&
      earlyExitDeadline &&
      earlyExitDeadline > Date.now() / 1000 ? (
        <Alert
            style="warning"
            title={`Exit fee of ${earlyExitFeePercent}% ${
                value
                    ? `(${formatMaxDecimals(
                          (
                              Number(value) *
                              (earlyExitFeePercent / 100)
                          ).toString(),
                          6,
                      )} USDC) `
                    : ''
            }when ${exitVerb} before ${DateTime.fromSeconds(earlyExitDeadline)
                .toLocal()
                .toLocaleString(DateTime.DATETIME_SHORT)}`}
        />
    ) : (
        <Alert style="info" title="No exit fee" />
    )
}
