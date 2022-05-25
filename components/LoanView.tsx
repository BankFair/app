import { formatUnits, parseUnits } from '@ethersproject/units'
import { BigNumber } from 'ethers'
import { Duration } from 'luxon'
import { useCallback, useMemo, useState } from 'react'
import TimeAgo from 'timeago-react'

import { ERC20Contract, infiniteAllowance, TOKEN_SYMBOL } from '../app'

import type { AppDispatch } from '../store'

import { LoanStatus, Loan, CoreContract, fetchAndUpdateLoan } from '../features'

import { ActionButton } from './ActionButton'
import { EtherscanLink } from './EtherscanLink'
import { Modal } from './Modal'
import { Button } from './Button'

export function LoanView({
    loan: { borrower, amount, duration, requestedTime, id, status, details },
    tokenDecimals,
    poolAddress,
    account,
    dispatch,
    getContract,
    manage,
    borrow,
    hideBorrower,
}: {
    loan: Loan
    tokenDecimals: number
    poolAddress: string
    account: string
    dispatch: AppDispatch
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
        () =>
            Duration.fromObject(
                onlyPositive(
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
                ),
            ).toHuman({
                listStyle: 'short',
            }),
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
                        <TimeAgo datetime={requestedTime} />
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
                                    <TimeAgo datetime={details.approvedTime} />
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
                {borrow &&
                    getContract &&
                    (status === LoanStatus.APPROVED ? (
                        <tr>
                            <td colSpan={2} style={{ paddingTop: 10 }}>
                                <ActionButton
                                    action={() => {
                                        const contract = getContract()
                                        return contract
                                            .borrow(BigNumber.from(id))
                                            .then((tx) => tx.wait())
                                            .then(() =>
                                                fetchAndUpdateLoan(
                                                    poolAddress,
                                                    contract,
                                                    id,
                                                ),
                                            )
                                            .then(dispatch)
                                    }}
                                >
                                    Borrow
                                </ActionButton>
                            </td>
                        </tr>
                    ) : status === LoanStatus.FUNDS_WITHDRAWN ? (
                        <tr>
                            <td colSpan={2} style={{ paddingTop: 10 }}>
                                <RepayModal
                                    getContract={getContract}
                                    getTokenContract={borrow}
                                    poolAddress={poolAddress}
                                    account={account}
                                    id={id}
                                    dispatch={dispatch}
                                    tokenDecimals={tokenDecimals}
                                />
                            </td>
                        </tr>
                    ) : null)}
            </tbody>
        </table>
    )
}

const initialValue = '100'
function RepayModal({
    getContract,
    getTokenContract,
    poolAddress,
    account,
    id,
    dispatch,
    tokenDecimals,
}: {
    getContract(): CoreContract
    getTokenContract(): ERC20Contract
    poolAddress: string
    account: string
    id: number
    dispatch: AppDispatch
    tokenDecimals: number
}) {
    const [isVisible, setIsVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const toggle = useCallback(
        () => setIsVisible((isVisible) => !isVisible),
        [setIsVisible],
    )
    const [value, setValue] = useState(initialValue)
    const handleChange = useCallback(
        (event: { target: { value: string } }) => setValue(event.target.value),
        [setValue],
    )

    const button = (
        <Button onClick={toggle} blue>
            Repay
        </Button>
    )

    if (!isVisible) {
        return button
    }

    const modal = (
        <Modal
            onClose={toggle}
            element="form"
            onSubmit={(event) => {
                event.preventDefault()

                setIsLoading(true)

                const tokenContract = getTokenContract()
                tokenContract.balanceOf(account).then(async (balance) => {
                    const amount = parseUnits(value, tokenDecimals)
                    if (balance.lt(amount)) {
                        alert('USDC balance too low') // TODO: Display in component
                        setIsLoading(false)
                        return
                    }

                    const allowance = await tokenContract.allowance(
                        account,
                        poolAddress,
                    )

                    if (amount.gt(allowance)) {
                        const tx = await tokenContract.approve(
                            poolAddress,
                            infiniteAllowance,
                        )

                        await tx.wait()
                    }

                    const contract = getContract()
                    const tx = await contract.repay(BigNumber.from(id), amount)

                    await tx.wait()

                    await fetchAndUpdateLoan(poolAddress, contract, id).then(
                        dispatch,
                    )

                    setIsVisible(false)
                    setIsLoading(false)
                    setValue(initialValue)
                })
            }}
        >
            <input type="number" value={value} onChange={handleChange} />
            <Button blue type="submit" disabled={isLoading}>
                {isLoading ? 'Loading…' : 'Repay'}
            </Button>
        </Modal>
    )

    return (
        <>
            {modal}
            {button}
        </>
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
