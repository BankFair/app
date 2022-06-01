import { DateTime } from 'luxon'

import { formatMaxDecimals } from '../app'

import { Alert } from './Alert'

export function EnterExitAlert({
    enter,
    value,
    exitVerb,
    earlyExitFeePercent,
    earlyExitDeadline,
}: {
    enter: boolean
    value: string
    exitVerb: 'withdrawing' | 'unstaking'
    earlyExitFeePercent: number
    earlyExitDeadline: number
}) {
    return enter ? (
        <Alert style="warning-filled" title="TODO: Explain the risks" />
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
            }when withdrawing before ${DateTime.fromSeconds(earlyExitDeadline)
                .toLocal()
                .toLocaleString(DateTime.DATETIME_SHORT)}`}
        />
    ) : (
        <Alert style="info" title="No exit fee" />
    )
}
