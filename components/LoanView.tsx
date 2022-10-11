import '@formatjs/intl-locale/polyfill'
import '@formatjs/intl-numberformat/polyfill'
import '@formatjs/intl-numberformat/locale-data/en'
import '@formatjs/intl-pluralrules/polyfill'
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-listformat/polyfill'
import '@formatjs/intl-listformat/locale-data/en'

import { BigNumber } from 'ethers'
import { Duration } from 'luxon'
import { useEffect, useMemo, useState } from 'react'
import TimeAgo from 'timeago-react'

import {
    Address,
    BORROWER_SERVICE_URL,
    fetchBorrowerInfoAuthenticated,
    formatToken,
    getBorrowerInfo,
    noop,
    oneHundredMillion,
    rgbaLimeGreen21,
    rgbGreen,
    rgbRed,
    rgbRedLight,
    rgbYellow,
    setBorrowerInfo,
    thirtyDays,
    TOKEN_SYMBOL, USD_TO_UGX_FX,
    useAccount,
    useAmountWithInterest,
    useProvider,
    zero,
} from '../app'

import { LoanStatus, Loan, formatStatus, loanDeskContract } from '../features'

import { EtherscanAddress } from './EtherscanLink'
import { Button } from './Button'
import { Progress } from './Progress'

export function LoanView({
    loan: {
        borrower,
        amount,
        duration,
        borrowedTime,
        status,
        details,
        apr,
        applicationId,
    },
    liquidityTokenDecimals,
    poolAddress,
    loanDeskAddress,
}: {
    loan: Loan
    liquidityTokenDecimals: number
    poolAddress: Address
    loanDeskAddress: Address
}) {
    const provider = useProvider()
    const account = useAccount()
    const formattedAmount = useMemo(
        () => formatToken(amount, liquidityTokenDecimals),
        [amount, liquidityTokenDecimals],
    )
    const formattedStatus = useMemo(() => formatStatus(status), [status])

    const amountWithInterest = useAmountWithInterest(
        amount,
        details.baseAmountRepaid,
        details.interestPaidUntil,
        apr,
    )
    const { debt, repaid, percent } = useMemo(() => {
        const repaid = BigNumber.from(details.totalAmountRepaid)
        const repaidPrincipal = BigNumber.from(details.baseAmountRepaid)

        return {
            debt: amountWithInterest,
            repaid,
            percent: !zero.eq(amountWithInterest)
                ? Math.min(
                    repaidPrincipal
                      .mul(oneHundredMillion)
                      .div(amount)
                      .toNumber() / 1_000_000, 
                      100
                    )
                : 0,
        }
    }, [details, amountWithInterest])

    const [borrowerInfoState, setBorrowerInfoState] = useState<{
        name: string
        businessName: string
        phone?: string | undefined
        email?: string | undefined
    } | null>(null)
    const [profileId, setProfileId] = useState('')
    useEffect(() => {
        let canceled = false
        getBorrowerInfo(applicationId)
            .then(async (info) => {
                if (canceled) return
                if (info) {
                    setBorrowerInfoState(info)

                    if (!info.email && !info.phone) {
                        const application = await loanDeskContract
                            .attach(loanDeskAddress)
                            .loanApplications(applicationId)

                        if (canceled) return

                        setProfileId(application.profileId)
                    }
                    return
                }

                const application = await loanDeskContract
                    .attach(loanDeskAddress)
                    .loanApplications(applicationId)

                const response = await fetch(
                    `${BORROWER_SERVICE_URL}/profile/${application.profileId}`,
                )
                const fetchedInfo = await (response.json() as Promise<{
                    name: string
                    businessName: string
                    phone?: string
                    email?: string
                }>)

                if (canceled) return
                setProfileId(application.profileId)
                setBorrowerInfo(applicationId, fetchedInfo)
                setBorrowerInfoState(fetchedInfo)
            })
            .catch((error) => {
                console.error(error)
            })

        return () => {
            canceled = true
        }
    }, [applicationId, loanDeskAddress])

    const hasDebt = status === LoanStatus.OUTSTANDING
    const isRepaid = status === LoanStatus.REPAID

    return (
        <div className="loan">
            <style jsx>{`
                .loan {
                    background-color: var(--bg-section);
                    // backdrop-filter: blur(16px);
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
                {borrowerInfoState ? borrowerInfoState.name : <></>}
                {hasDebt
                    ? ` ${formatToken(debt, liquidityTokenDecimals, 2, true)}`
                    : ` ${
                          isRepaid
                              ? formatToken(repaid, liquidityTokenDecimals, 2)
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
                        : isRepaid
                        ? rgbGreen
                        : status === LoanStatus.DEFAULTED
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
                    <div className="label">Approved</div>
                    <div className="value">
                        <TimeAgo datetime={borrowedTime * 1000} />
                    </div>
                </div>
                <div className="item">
                    <div className="label">Duration</div>
                    <div className="value">{formatDuration(duration)}</div>
                </div>
                <div className="item">
                    <div className="label">Remaining</div>
                    <div className="value">
                        <Remaining timestamp={borrowedTime + duration} noHoursAndLess={true} />
                    </div>
                </div>
                <div className="item">
                    <div className="label">Status</div>
                    <div className="value">{formatStatus(status)}</div>
                </div>
                <div className="item">
                    <div className="label">Principal</div>
                    <div className="value">
                        {formatToken(amount, liquidityTokenDecimals, 2, true)}{' '}
                        {TOKEN_SYMBOL}
                    </div>
                </div>
                <div className="item">
                    <div className="label">Interest paid</div>
                    <div className="value">
                        {formatToken(
                            details.interestPaid,
                            liquidityTokenDecimals,
                            2,
                            false
                        )}{' '}
                        {TOKEN_SYMBOL}
                    </div>
                </div>
                <div className="item">
                    <div className="label">UGX Due</div>
                    <div className="value">
                        {hasDebt
                            ? ` ${formatToken(debt.mul(USD_TO_UGX_FX), liquidityTokenDecimals, 2, true)}`
                            : ` ${
                                isRepaid
                                    ? formatToken(BigNumber.from(0), liquidityTokenDecimals, 2)
                                    : formattedAmount
                            }`}{' '}
                        {'UGX'}
                    </div>
                </div>
                <div className="item">
                    <div className="label">Account</div>
                    <div className="value">
                        <EtherscanAddress address={borrower} />
                    </div>
                </div>
                {borrowerInfoState ? (
                    <>
                        <div className="item">
                            <div className="label">Business name</div>
                            <div className="value">
                                {borrowerInfoState.businessName}
                            </div>
                        </div>
                        {borrowerInfoState.phone ? (
                            <div className="item">
                                <div className="label">Phone</div>
                                <div className="value">
                                    <a href={`tel:${borrowerInfoState.phone}`}>
                                        {borrowerInfoState.phone}
                                    </a>
                                </div>
                            </div>
                        ) : null}
                        {borrowerInfoState.email ? (
                            <div className="item">
                                <div className="label">Email</div>
                                <div className="value">
                                    <a
                                        href={`mailto:${borrowerInfoState.email}`}
                                    >
                                        {borrowerInfoState.email}
                                    </a>
                                </div>
                            </div>
                        ) : null}
                    </>
                ) : null}

            </div>
            {borrowerInfoState &&
            !borrowerInfoState.phone &&
            !borrowerInfoState.email &&
            profileId ? (
                <div className="actions">
                    <Button
                        onClick={() =>
                            fetchBorrowerInfoAuthenticated(
                                poolAddress,
                                applicationId,
                                profileId,
                                account!,
                                provider!.getSigner(),
                            ).then(setBorrowerInfoState)
                        }
                        stone
                    >
                        Get contact information
                    </Button>
                </div>
            ) : null}
        </div>
    )
}

const zeroMinutes = Duration.fromObject({ minutes: 0 }).toHuman()
function Remaining({ timestamp, noHoursAndLess }: { timestamp: number, noHoursAndLess?: boolean }) {
    const [integer, setInteger] = useState(0) // Force update
    const value = useMemo(
        () => (noop(integer), formatRemaining(timestamp, noHoursAndLess)),
        [timestamp, integer, noHoursAndLess],
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

function formatRemaining(timestamp: number, noHoursAndLess?: boolean) {
    const now = Date.now() / 1000
    if (now > timestamp) return zeroMinutes

    return formatDuration(timestamp - now, true, noHoursAndLess, noHoursAndLess)
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

function formatDuration(duration: number, noSeconds?: boolean, noMinutes?: boolean, noHours?: boolean): string {
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
    if (noMinutes) delete result.minutes
    if (noHours) delete result.hours

    return Duration.fromObject(result).toHuman()
}

export function formatDurationInMonths(duration: number): number {
    return duration / thirtyDays
}
