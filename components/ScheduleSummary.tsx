import { BigNumber } from '@ethersproject/bignumber'
import { Fragment, useMemo, useState } from 'react'

import { formatToken, TOKEN_SYMBOL, zero } from '../app'
import { ScheduleItem } from '../features'

interface Summary {
    amount: BigNumber
    interestOnly: boolean
    times: number
}

export function ScheduleSummary({
    amount,
    monthly,
    schedule,
    liquidityTokenDecimals,
}: {
    amount: BigNumber
    monthly: boolean
    schedule: ScheduleItem[]
    liquidityTokenDecimals: number
}) {
    const [showSchedule, setShowSchedule] = useState(false)
    const { summary, total } = useMemo(() => {
        const summary: Summary[] = []
        let total = zero

        for (const item of schedule) {
            if (item.skip) continue

            const summaryItem = summary.find((i) => i.amount.eq(item.amount))
            if (summaryItem) {
                summaryItem.times++
            } else {
                summary.push({
                    amount: item.amount,
                    times: 1,
                    interestOnly: false,
                })
            }

            total = total.add(item.amount)
        }

        if (summary.length === 2) {
            if (amount.eq(summary[1].amount.sub(summary[0].amount))) {
                summary[0].interestOnly = true
            }
        }

        return { summary, total }
    }, [schedule, amount])

    if (!summary.length) return null

    return (
        <Fragment>
            <div className="schedule-summary">
                {summary.map((item, index) => (
                    <div className="line" key={index}>
                        {item.times === 1 &&
                        index === summary.length - 1 &&
                        summary.length > 1
                            ? 'Final payment'
                            : `${item.times}${
                                  monthly ? ' monthly' : ''
                              } payments`}{' '}
                        of {formatToken(item.amount, liquidityTokenDecimals)}{' '}
                        {TOKEN_SYMBOL}
                        {item.interestOnly ? ' (interest only)' : ''}
                    </div>
                ))}
                {summary.length > 1 ? (
                    <div className="line">
                        Total: {formatToken(total, liquidityTokenDecimals)}{' '}
                        {TOKEN_SYMBOL}
                    </div>
                ) : null}
                {showSchedule ? null : (
                    <div className="line">
                        <span onClick={() => setShowSchedule(true)}>
                            View full schedule
                        </span>
                    </div>
                )}
            </div>
            {showSchedule ? (
                <div className="schedule">
                    <div className="label">Amount</div>
                    <div className="label">Due</div>

                    {schedule.map((item, index) =>
                        item.skip ? null : (
                            <Fragment key={index}>
                                <div>
                                    {formatToken(
                                        item.amount,
                                        liquidityTokenDecimals,
                                    )}{' '}
                                    {TOKEN_SYMBOL}
                                </div>
                                <div>{item.date}</div>
                            </Fragment>
                        ),
                    )}
                </div>
            ) : (
                false
            )}

            <style jsx>{`
                .line {
                    margin-bottom: 4px;

                    > span {
                        text-decoration: underline;
                        cursor: pointer;
                    }
                }

                .schedule {
                    display: grid;
                    grid-template-columns: minmax(auto, max-content) auto;
                    row-gap: 8px;
                    column-gap: 16px;
                    margin-top: 8px;

                    > .label {
                        opacity: 0.7;
                    }
                }
            `}</style>
        </Fragment>
    )
}
