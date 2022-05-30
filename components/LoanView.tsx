import { formatUnits } from '@ethersproject/units'
import { BigNumber } from 'ethers'
import { Duration } from 'luxon'
import { useEffect, useMemo, useState } from 'react'
import TimeAgo from 'timeago-react'

import {
    ERC20Contract,
    format,
    noop,
    oneHundredPercent,
    ONE_HUNDRED_PERCENT,
    rgbBlue,
    rgbGreen,
    rgbRed,
    rgbRedLight,
    rgbYellow,
    TOKEN_SYMBOL,
    withInterest,
    zero,
} from '../app'

import { LoanStatus, Loan, CoreContract } from '../features'

import { ActionButton } from './ActionButton'
import { EtherscanLink } from './EtherscanLink'
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
    tokenDecimals,
    onBorrow,
    onRepay,
}: {
    loan: Loan
    tokenDecimals: number
    onBorrow(id: number): Promise<unknown>
    onRepay(id: number, debt: BigNumber): void
}) {
    const formattedAmount = useMemo(
        () => format(formatUnits(amount, tokenDecimals)),
        [amount, tokenDecimals],
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

    const hasDebt = status === LoanStatus.FUNDS_WITHDRAWN
    const wasRepaid = status === LoanStatus.REPAID

    return (
        <div className="loan">
            <style jsx>{`
                .loan {
                    background-color: var(--bg-color);
                    box-shadow: var(--shadow) 0 1px 2px 0;
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
                    text-align: center;
                    margin-top: 16px;

                    > .item {
                        flex-basis: 50%;

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

                .action {
                    text-align: center;
                    margin-top: 8px;
                }
            `}</style>

            <h4 className="amount">
                {hasDebt
                    ? `Debt: ${format(formatUnits(debt, tokenDecimals))}`
                    : `Amount: ${
                          wasRepaid
                              ? format(formatUnits(repaid, tokenDecimals))
                              : formattedAmount
                      }`}{' '}
                USDC
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
                            <TimeAgo datetime={details.approvedTime * 1000} />
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
            {hasDebt ? (
                <div className="action">
                    <Button onClick={() => onRepay(id, debt)} blue>
                        Repay
                    </Button>
                </div>
            ) : status === LoanStatus.APPROVED ? (
                <div className="action">
                    <ActionButton action={() => onBorrow(id)}>
                        Borrow
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

export function LoanViewOld({
    loan: { borrower, amount, duration, requestedTime, id, status, details },
    tokenDecimals,
    getContract,
    manage,
    borrow,
    hideBorrower,
}: {
    loan: Loan
    tokenDecimals: number
    getContract?: () => CoreContract
    manage?: boolean
    borrow?: () => ERC20Contract
    hideBorrower?: boolean
}) {
    if (process.env.NODE_ENV === 'development') {
        if (manage && borrow) {
            throw new Error(
                '`manage` and `borrow` can not be enabled at the same time',
            )
        }
    }

    const humanReadableDuration = useMemo(
        () => formatDuration(duration),
        [duration],
    )

    return (
        <table>
            <tbody>
                {!hideBorrower && (
                    <tr>
                        <td>Borrower</td>
                        <td>
                            <EtherscanLink address={borrower} />
                        </td>
                    </tr>
                )}
                <tr>
                    <td>Amount</td>
                    <td>
                        {formatUnits(amount, tokenDecimals)} {TOKEN_SYMBOL}
                    </td>
                </tr>
                <tr>
                    <td>Requested</td>
                    <td>
                        <TimeAgo datetime={requestedTime * 1000} />
                    </td>
                </tr>
                <tr>
                    <td>Status</td>
                    <td>{formatStatus(status)}</td>
                </tr>
                <tr>
                    <td>Duration</td>
                    <td>{humanReadableDuration}</td>
                </tr>
                {status !== LoanStatus.APPLIED &&
                    status !== LoanStatus.DENIED &&
                    status !== LoanStatus.CANCELLED && (
                        <>
                            <tr>
                                <td>Approved</td>
                                <td>
                                    <TimeAgo
                                        datetime={details.approvedTime * 1000}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>Repaid</td>
                                <td>
                                    {formatUnits(
                                        details.totalAmountRepaid,
                                        tokenDecimals,
                                    )}{' '}
                                    {TOKEN_SYMBOL}
                                </td>
                            </tr>

                            <tr>
                                <td>Interest paid</td>
                                <td>
                                    {formatUnits(
                                        details.interestPaid,
                                        tokenDecimals,
                                    )}{' '}
                                    {TOKEN_SYMBOL}
                                </td>
                            </tr>
                        </>
                    )}
                {manage && status === LoanStatus.APPLIED && getContract && (
                    <tr>
                        <td colSpan={2} style={{ paddingTop: 10 }}>
                            <ActionButton
                                action={() =>
                                    getContract().approveLoan(
                                        BigNumber.from(id),
                                    )
                                }
                            >
                                Approve
                            </ActionButton>
                            <ActionButton
                                red
                                action={() =>
                                    getContract().denyLoan(BigNumber.from(id))
                                }
                            >
                                Reject
                            </ActionButton>
                        </td>
                    </tr>
                )}
                {manage && status === LoanStatus.APPROVED && getContract && (
                    <tr>
                        <td colSpan={2} style={{ paddingTop: 10 }}>
                            <ActionButton
                                red
                                action={() =>
                                    getContract().cancelLoan(BigNumber.from(id))
                                }
                            >
                                Cancel
                            </ActionButton>
                        </td>
                    </tr>
                )}
                {manage &&
                    status === LoanStatus.FUNDS_WITHDRAWN &&
                    getContract && (
                        <tr>
                            <td colSpan={2} style={{ paddingTop: 10 }}>
                                <ActionButton
                                    red
                                    action={() =>
                                        getContract().defaultLoan(
                                            BigNumber.from(id),
                                        )
                                    }
                                >
                                    Default
                                </ActionButton>
                            </td>
                        </tr>
                    )}
            </tbody>
        </table>
    )
}

function formatStatus(status: LoanStatus) {
    switch (status) {
        case LoanStatus.APPLIED:
            return 'Waiting for approval'
        case LoanStatus.APPROVED:
            return 'Approved'
        case LoanStatus.DENIED:
            return 'Rejected'
        case LoanStatus.CANCELLED:
            return 'Cancelled'
        case LoanStatus.DEFAULTED:
            return 'Defaulted'
        case LoanStatus.FUNDS_WITHDRAWN:
            return 'Withdrawn'
        case LoanStatus.REPAID:
            return 'Repaid'
    }
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
