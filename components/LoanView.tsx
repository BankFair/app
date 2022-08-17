import '@formatjs/intl-locale/polyfill'
import '@formatjs/intl-numberformat/polyfill'
import '@formatjs/intl-numberformat/locale-data/en'
import '@formatjs/intl-pluralrules/polyfill'
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-listformat/polyfill'
import '@formatjs/intl-listformat/locale-data/en'

import { formatUnits } from '@ethersproject/units'
import { BigNumber } from 'ethers'
import { Duration } from 'luxon'
import { useEffect, useMemo, useState } from 'react'
import TimeAgo from 'timeago-react'

import {
    format,
    formatMaxDecimals,
    noop,
    oneHundredPercent,
    rgbaLimeGreen21,
    rgbBlue,
    rgbGreen,
    rgbRed,
    rgbRedLight,
    rgbYellow,
    TOKEN_SYMBOL,
    withInterest,
    zero,
} from '../app'

import {
    LoanStatus,
    Loan,
    formatStatus,
    useCanDefaultLoan,
    Transaction,
} from '../features'

import { ActionButton } from './ActionButton'
import { EtherscanAddress } from './EtherscanLink'
import { Button } from './Button'
import { Progress } from './Progress'

export function LoanView({
    loan: {
        borrower,
        amount,
        duration,
        requestedTime,
        id,
        status,
        details,
        apr,
        lateAPRDelta,
    },
    liquidityTokenDecimals,
    showAll,
    onApprove,
    onReject,
    onCancel,
    onDefault,
    onBorrow,
    onRepay,
    poolAddress,
    account,
}: {
    loan: Loan
    liquidityTokenDecimals: number
    showAll?: boolean
    onBorrow?(id: number): Promise<unknown>
    onRepay?(id: number, debt: BigNumber): void
    onApprove?(id: number): Promise<unknown>
    onReject?(id: number): Promise<unknown>
    onCancel?(id: number): Promise<unknown>
    onDefault?(id: number): Promise<unknown>
    poolAddress: string
    account: string | undefined
}) {
    const formattedAmount = useMemo(
        () => format(formatUnits(amount, liquidityTokenDecimals)),
        [amount, liquidityTokenDecimals],
    )
    const formattedStatus = useMemo(() => formatStatus(status), [status])

    const amountWithInterest = useAmountWithInterest(
        amount,
        apr,
        lateAPRDelta,
        duration,
        details.approvedTime,
    )
    const { debt, repaid, percent } = useMemo(() => {
        const repaid = BigNumber.from(details.totalAmountRepaid)

        return {
            debt: details.approvedTime ? amountWithInterest.sub(repaid) : zero,
            repaid,
            percent:
                details.approvedTime && !zero.eq(amountWithInterest)
                    ? repaid
                          .mul(100_000_000)
                          .div(amountWithInterest)
                          .toNumber() / 1_000_000
                    : 0,
        }
    }, [details, amountWithInterest])

    const canDefaultLoan = useCanDefaultLoan(
        poolAddress,
        id,
        onDefault && account,
    )

    const hasDebt = status === LoanStatus.FUNDS_WITHDRAWN
    const wasRepaid = status === LoanStatus.REPAID

    return (
        <div className="loan">
            <style jsx>{`
                .loan {
                    background-color: var(--bg-section);
                    backdrop-filter: blur(16px);
                    border: 1px solid ${rgbaLimeGreen21};
                    border-radius: 8px;
                    padding: 18px 24px;
                    margin: 8px 0;
                }

                .amount {
                    margin: 0 0 8px;
                    font-weight: 600;
                }

                .progress-legend {
                    margin: 4px 2px 0;
                    display: flex;
                    justify-content: space-between;

                    > .item {
                        font-size: 12px;
                        display: flex;
                        align-items: center;

                        > .dot {
                            display: inline-block;
                            width: 6px;
                            height: 6px;
                            margin-right: 4px;
                            border-radius: 50%;
                        }
                    }
                }

                .stats {
                    display: flex;
                    flex-wrap: wrap;
                    text-align: center;
                    margin-top: 8px;

                    > .item {
                        flex-basis: 50%;
                        margin-top: 8px;

                        > .label {
                            font-size: 11px;
                            text-transform: uppercase;
                            font-weight: 300;
                            color: var(--color-secondary);
                        }

                        > .value {
                            font-size: 14px;
                            padding-top: 2px;
                            font-weight: 400;
                        }
                    }
                }

                .actions {
                    text-align: center;
                    margin-top: 8px;

                    > :global(button) {
                        margin: 0 4px;
                    }
                }
            `}</style>

            <h4 className="amount">
                {hasDebt
                    ? `Debt: ${format(
                          formatUnits(debt, liquidityTokenDecimals),
                      )}`
                    : `Amount: ${
                          wasRepaid
                              ? format(
                                    formatUnits(repaid, liquidityTokenDecimals),
                                )
                              : formattedAmount
                      }`}{' '}
                {TOKEN_SYMBOL}
            </h4>
            <Progress
                l
                percent={percent}
                backgroundColor={
                    hasDebt
                        ? rgbRedLight
                        : wasRepaid
                        ? rgbGreen
                        : status === LoanStatus.APPROVED
                        ? rgbBlue
                        : status === LoanStatus.DENIED ||
                          status === LoanStatus.CANCELLED ||
                          status === LoanStatus.DEFAULTED
                        ? rgbRed
                        : rgbYellow
                }
            />

            <div className="progress-legend">
                {hasDebt ? (
                    <>
                        <div className="item">
                            <span
                                className="dot"
                                style={{ backgroundColor: rgbGreen }}
                            />
                            Repaid ({Math.trunc(percent)}%)
                        </div>
                        <div className="item">
                            <span
                                className="dot"
                                style={{ backgroundColor: rgbRedLight }}
                            />
                            Remaining
                        </div>
                    </>
                ) : (
                    <div className="item">{formattedStatus}</div>
                )}
            </div>
            {showAll ? (
                <div className="stats">
                    <div className="item">
                        <div className="label">Requested</div>
                        <div className="value">
                            <TimeAgo datetime={requestedTime * 1000} />
                        </div>
                    </div>
                    <div className="item">
                        <div className="label">Approved</div>
                        <div className="value">
                            {details.approvedTime ? (
                                <TimeAgo
                                    datetime={details.approvedTime * 1000}
                                />
                            ) : (
                                '-'
                            )}
                        </div>
                    </div>
                    <div className="item">
                        <div className="label">Duration</div>
                        <div className="value">{formatDuration(duration)}</div>
                    </div>
                    <div className="item">
                        <div className="label">Remaining</div>
                        <div className="value">
                            <Remaining
                                timestamp={
                                    status === LoanStatus.CANCELLED
                                        ? 0
                                        : details.approvedTime + duration
                                }
                            />
                        </div>
                    </div>
                    <div className="item">
                        <div className="label">Amount</div>
                        <div className="value">
                            {format(
                                formatMaxDecimals(
                                    formatUnits(amount, liquidityTokenDecimals),
                                    liquidityTokenDecimals,
                                ),
                            )}{' '}
                            {TOKEN_SYMBOL}
                        </div>
                    </div>
                    <div className="item">
                        <div className="label">Interest paid</div>
                        <div className="value">
                            {format(
                                formatMaxDecimals(
                                    formatUnits(
                                        details.interestPaid,
                                        liquidityTokenDecimals,
                                    ),
                                    liquidityTokenDecimals,
                                ),
                            )}{' '}
                            {TOKEN_SYMBOL}
                        </div>
                    </div>
                    <div className="item">
                        <div className="label">Borrower</div>
                        <div className="value">
                            <EtherscanAddress address={borrower} />
                        </div>
                    </div>
                    <div className="item">
                        <div className="label">Status</div>
                        <div className="value">{formatStatus(status)}</div>
                    </div>
                </div>
            ) : (
                <div className="stats">
                    <div className="item">
                        <div className="label">Remaining</div>
                        <div className="value">
                            <Remaining
                                timestamp={
                                    status === LoanStatus.CANCELLED
                                        ? 0
                                        : details.approvedTime + duration
                                }
                            />
                        </div>
                    </div>
                    {details.approvedTime ? (
                        <div className="item">
                            <div className="label">Approved</div>
                            <div className="value">
                                <TimeAgo
                                    datetime={details.approvedTime * 1000}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="item">
                            <div className="label">Requested</div>
                            <div className="value">
                                <TimeAgo datetime={requestedTime * 1000} />
                            </div>
                        </div>
                    )}
                </div>
            )}
            {onRepay && hasDebt ? (
                <div className="actions">
                    <Button onClick={() => onRepay(id, debt)}>Repay</Button>
                </div>
            ) : onBorrow && status === LoanStatus.APPROVED ? (
                <div className="actions">
                    <ActionButton
                        action={() => onBorrow(id).then(actionPromiseHandler)}
                    >
                        Borrow
                    </ActionButton>
                </div>
            ) : onApprove && onReject && status === LoanStatus.APPLIED ? (
                <div className="actions">
                    <ActionButton
                        action={() => onApprove(id).then(actionPromiseHandler)}
                    >
                        Approve
                    </ActionButton>
                    <ActionButton
                        action={() => onReject(id).then(actionPromiseHandler)}
                    >
                        Reject
                    </ActionButton>
                </div>
            ) : onCancel && status === LoanStatus.APPROVED ? (
                <div className="actions">
                    <ActionButton
                        action={() => onCancel(id).then(actionPromiseHandler)}
                    >
                        Cancel
                    </ActionButton>
                </div>
            ) : onDefault &&
              status === LoanStatus.FUNDS_WITHDRAWN &&
              canDefaultLoan ? (
                <div className="actions">
                    <ActionButton
                        action={() => onDefault(id).then(actionPromiseHandler)}
                    >
                        Default
                    </ActionButton>
                </div>
            ) : null}
        </div>
    )
}

const zeroMinutes = Duration.fromObject({ minutes: 0 }).toHuman()
function Remaining({ timestamp }: { timestamp: number }) {
    const [integer, setInteger] = useState(0) // Force update
    const value = useMemo(
        () => (noop(integer), formatRemaining(timestamp)),
        [timestamp, integer],
    )

    useEffect(() => {
        if (value === zeroMinutes) return

        // Will update every minute
        const timeoutId = setTimeout(() => {
            setInteger((i) => i + 1)
        }, 60_000)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [value, timestamp])

    return (value === zeroMinutes ? '-' : value) as unknown as JSX.Element
}

function formatRemaining(timestamp: number) {
    const now = Date.now() / 1000
    if (now > timestamp) return zeroMinutes

    return formatDuration(timestamp - now, true)
}

const oneDay = 86400
const halfHour = 30 * 60 * 1000
function useAmountWithInterest(
    amount: string,
    interestRate: number,
    interestRateDelta: number,
    duration: number,
    approvedTime: number | undefined,
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
        const dueTimestamp = approvedTime + duration
        const isLate = now > dueTimestamp

        const amountBigNumber = BigNumber.from(amount)
        const days = countInterestDays(approvedTime, now)

        const interestRateBigNumber = BigNumber.from(
            (interestRate / 100) * oneHundredPercent,
        )

        if (!isLate) {
            return withInterest(amountBigNumber, interestRateBigNumber, days)
        }

        const interestDays = BigNumber.from(days)
        const interestRateDeltaBigNumber = BigNumber.from(
            (interestRateDelta / 100) * oneHundredPercent,
        )

        return withInterest(
            amountBigNumber,
            interestDays
                .mul(interestRateBigNumber)
                .add(
                    interestRateDeltaBigNumber.mul(
                        countInterestDays(dueTimestamp, now),
                    ),
                )
                .div(interestDays),
            days,
        )
    }, [
        amount,
        approvedTime,
        duration,
        integer,
        interestRate,
        interestRateDelta,
    ])
}

function countInterestDays(from: number, to: number) {
    const seconds = to - from
    const days = Math.trunc(seconds / oneDay)

    if (seconds % oneDay > 0) {
        return days + 1
    }

    return days
}

function onlyPositive<T, R extends { [key in keyof T]?: number }>(
    object: R,
): R {
    const newObject = {} as R

    for (const i in object) {
        const value = object[i]
        if (value <= 0) continue
        newObject[i] = value
    }

    return newObject
}

function formatDuration(duration: number, noSeconds?: boolean): string {
    const result = onlyPositive(
        Duration.fromObject({
            years: 0,
            weeks: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: duration,
        })
            .normalize()
            .toObject(),
    )

    if (noSeconds) delete result.seconds

    return Duration.fromObject(result).toHuman({
        listStyle: 'long',
    })
}

function actionPromiseHandler() {
    new Promise(noop) // Event handler will unmount button
}
