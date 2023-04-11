import { BigNumber } from '@ethersproject/bignumber'
import { ContractTransaction } from '@ethersproject/contracts'
import { parseUnits } from '@ethersproject/units'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    formatInputAmount,
    getERC20Contract,
    InputAmount,
    TOKEN_SYMBOL,
    useAccount,
    useProvider,
    zero,
} from '../app'
import {
    AccountInfo,
    contract,
    CoreContract,
    trackTransaction,
    useAllowanceAndBalance,
} from '../features'
import { useDispatch } from '../store'
import { AmountInput } from './AmountInput'
import { Button } from './Button'
import { ConnectModal } from './ConnectModal'

const buttonStyle = { minWidth: 180, alignSelf: 'flex-start' }
type Types = 'Deposit' | 'Withdraw' | 'Stake' | 'Unstake' | 'Repay'
export function useAmountForm<T extends Types>({
    liquidityTokenDecimals,
    liquidityTokenAddress,
    poolAddress,
    onSumbit,
    refetch,
    max: maxProp,
    disabled,
    type,
}: {
    liquidityTokenDecimals: number
    liquidityTokenAddress: string
    poolAddress: string
    onSumbit: (
        contract: CoreContract,
        amount: BigNumber,
    ) => Promise<ContractTransaction>
    refetch: () => Promise<unknown>
    max?: BigNumber
    disabled?: boolean
    type: T
}) {
    const [loading, setLoading] = useState<InputAmount>('')

    const isWithdraw = type === 'Unstake' || type === 'Withdraw'

    const account = useAccount()
    const provider = useProvider()

    const dispatch = useDispatch()

    const {
        allowance,
        balance,
        refetch: refetchAllowanceAndBalance,
    } = useAllowanceAndBalance(liquidityTokenAddress, poolAddress, account)

    const max = useMemo(() => {
        if (isWithdraw) return maxProp

        if (!balance) return null

        const balanceBigNumber = BigNumber.from(balance)
        return maxProp && balanceBigNumber.gt(maxProp)
            ? maxProp
            : balanceBigNumber
    }, [maxProp, balance, isWithdraw])

    const [showConnectModal, setShowConnectModal] = useState(false)
    useEffect(() => {
        if (account) setShowConnectModal(false)
    }, [account])

    const [amount, setAmount] = useState<InputAmount>('')
    const { value, isValueBiggerThanZero, needsApproval, formattedMax } =
        useMemo(() => {
            const amountBigNumber = amount
                ? parseUnits(amount, liquidityTokenDecimals)
                : zero

            const value =
                loading ||
                (max?.lt(amountBigNumber)
                    ? formatInputAmount(max, liquidityTokenDecimals)
                    : amount)

            const valueBigNumber = parseUnits(
                value || '0',
                liquidityTokenDecimals,
            )
            return {
                value,
                isValueBiggerThanZero: valueBigNumber.gt(zero),
                needsApproval:
                    !isWithdraw && allowance
                        ? BigNumber.from(allowance).lt(valueBigNumber)
                        : false,
                formattedMax: max
                    ? formatInputAmount(max, liquidityTokenDecimals)
                    : '',
            }
        }, [
            loading,
            max,
            liquidityTokenDecimals,
            amount,
            allowance,
            isWithdraw,
        ])

    const handleClickMax = useCallback(() => {
        setAmount(formattedMax)
    }, [formattedMax])

    const inputDisabled = Boolean(disabled || loading)

    const form = (
        <form
            onSubmit={(event) => {
                event.preventDefault()

                if (!account) {
                    setShowConnectModal(true)
                    return
                }

                const signer = provider!.getSigner()

                setLoading(value)

                const valueBigNumber = parseUnits(value, liquidityTokenDecimals)

                if (needsApproval) {
                    getERC20Contract(liquidityTokenAddress)
                        .connect(signer)
                        .approve(poolAddress, valueBigNumber)
                        .then((tx) =>
                            trackTransaction(dispatch, {
                                name: `Step 1 of 2 ➜ Approve ${TOKEN_SYMBOL}`,
                                tx,
                            }),
                        )
                        .then(() => refetchAllowanceAndBalance())
                        .then(() => {
                            setLoading('' as InputAmount)
                        })
                        .catch((reason) => {
                            console.error(reason)
                            setLoading('' as InputAmount)
                        })

                    return
                }

                onSumbit(
                    contract.attach(poolAddress).connect(signer),
                    valueBigNumber,
                )
                    .then((tx) =>
                        trackTransaction(dispatch, {
                            name: `${type} ${value} ${TOKEN_SYMBOL}`,
                            tx,
                        }),
                    )
                    .then(() =>
                        // TODO: Optimize provider. Currently it will make 3 separate requests.
                        Promise.all([refetch(), refetchAllowanceAndBalance()]),
                    )
                    .then(() => {
                        setLoading('')
                        setAmount('')
                    })
                    .catch((reason) => {
                        console.error(reason)
                        setLoading('')
                        setAmount('')
                    })
            }}
        >
            <style jsx>{`
                form {
                    display: flex;
                    flex-direction: column;
                    margin: 12px 0;

                    > .max {
                        font-size: 14px;
                        font-weight: 500;
                        margin: 8px 0;
                        height: 16px;
                        line-height: 14px;
                        color: var(--color-secondary);

                        > span {
                            cursor: pointer;
                        }
                    }
                }
            `}</style>

            <AmountInput
                decimals={6}
                disabled={inputDisabled}
                value={value}
                onChange={setAmount}
            />

            <div className="max">
                {max ? (
                    <span tabIndex={0} onClick={handleClickMax}>
                        Maximum: {formattedMax}
                    </span>
                ) : null}
            </div>

            <Button
                key={type}
                disabled={Boolean(
                    account && (inputDisabled || !isValueBiggerThanZero),
                )}
                type="submit"
                style={buttonStyle}
                loading={Boolean(loading)}
            >
                {account
                    ? needsApproval
                        ? `Step 1 of 2 ➜ Approve ${TOKEN_SYMBOL}`
                        : (type === 'Deposit' || type === 'Stake' || type === 'Repay') && !(account && (inputDisabled || !isValueBiggerThanZero)) 
                            ? 'Final Step ➜ ' + type 
                            : type
                    : 'Connect Wallet'}
            </Button>

            {showConnectModal ? (
                <ConnectModal onClose={() => setShowConnectModal(false)} />
            ) : null}
        </form>
    )

    return { form, allowance, balance, value }
}

export function useWithdrawalAmountForm<T extends Types>({
                                                   liquidityTokenDecimals,
                                                   poolAddress,
                                                   accountInfo,
                                                   onSumbit,
                                                   refetch,
                                                   max: maxProp,
                                                   disabled,
                                                   type,
                                               }: {
    liquidityTokenDecimals: number
    poolAddress: string
    accountInfo: AccountInfo | null
    onSumbit: (
        contract: CoreContract,
        amount: BigNumber,
    ) => Promise<ContractTransaction>
    refetch: () => Promise<unknown>
    max?: BigNumber
    disabled?: boolean
    type: T
}) {
    const [loading, setLoading] = useState<InputAmount>('')

    const account = useAccount()
    const provider = useProvider()
    const dispatch = useDispatch()

    const { allowance, timeFrom, timeTo } = useMemo(() => {
        return {
            allowance: accountInfo?.withdrawalAllowance,
            timeFrom: accountInfo?.withdrawalAllowanceTimeFrom,
            timeTo: accountInfo?.withdrawalAllowanceTimeTo,
        }
    }, [accountInfo])

    const max = maxProp;

    const [showConnectModal, setShowConnectModal] = useState(false)
    useEffect(() => {
        if (account) setShowConnectModal(false)
    }, [account])

    const [amount, setAmount] = useState<InputAmount>('')
    const { value, isValueBiggerThanZero, needsAllowance, formattedMax } =
        useMemo(() => {
            const amountBigNumber = amount
                ? parseUnits(amount, liquidityTokenDecimals)
                : zero

            const value =
                loading ||
                (max?.lt(amountBigNumber)
                    ? formatInputAmount(max, liquidityTokenDecimals)
                    : amount)

            const valueBigNumber = parseUnits(
                value || '0',
                liquidityTokenDecimals,
            )

            return {
                value,
                isValueBiggerThanZero: valueBigNumber.gt(zero),
                needsAllowance:
                    allowance && timeTo
                        ? BigNumber.from(allowance).lt(valueBigNumber) || timeTo <= Math.floor(Date.now() / 1000)
                        : true,
                formattedMax: max
                    ? formatInputAmount(max, liquidityTokenDecimals)
                    : '',
            }
        }, [
            loading,
            max,
            liquidityTokenDecimals,
            amount,
            allowance,
            timeTo,
        ])

    const handleClickMax = useCallback(() => {
        setAmount(formattedMax)
    }, [formattedMax])

    const inputDisabled = Boolean(disabled || loading)

    const [unixTime, setTime] = useState(Math.floor(Date.now() / 1000));

    useEffect(() => {
        const interval = setInterval(() => setTime(Math.floor(Date.now() / 1000)), 1000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    const form = (
        <form
            onSubmit={(event) => {
                event.preventDefault()

                if (!account) {
                    setShowConnectModal(true)
                    return
                }

                const signer = provider!.getSigner()

                setLoading(value)

                const valueBigNumber = parseUnits(value, liquidityTokenDecimals)

                if (needsAllowance) {
                    contract.attach(poolAddress)
                        .connect(signer)
                        .requestWithdrawalAllowance(valueBigNumber)
                        .then((tx) =>
                            trackTransaction(dispatch, {
                                name: `Step 1 of 2 ➜ Request Withdrawal Allowance`,
                                tx,
                            }),
                        )
                        .then(() => refetch())
                        .then(() => {
                            setLoading('' as InputAmount)
                        })
                        .catch((reason) => {
                            console.error(reason)
                            setLoading('' as InputAmount)
                        })

                    return
                }

                onSumbit(
                    contract.attach(poolAddress).connect(signer),
                    valueBigNumber,
                )
                    .then((tx) =>
                        trackTransaction(dispatch, {
                            name: `${type} ${value} ${TOKEN_SYMBOL}`,
                            tx,
                        }),
                    )
                    .then(() =>
                        // TODO: Optimize provider. Currently it will make 3 separate requests.
                        Promise.all([refetch()]),
                    )
                    .then(() => {
                        setLoading('')
                        setAmount('')
                    })
                    .catch((reason) => {
                        console.error(reason)
                        setLoading('')
                        setAmount('')
                    })
            }}
        >
            <style jsx>{`
                form {
                    display: flex;
                    flex-direction: column;
                    margin: 12px 0;

                    > .max {
                        font-size: 14px;
                        font-weight: 500;
                        margin: 8px 0;
                        height: 16px;
                        line-height: 14px;
                        color: var(--color-secondary);

                        > span {
                            cursor: pointer;
                        }
                    }
                }
            `}</style>

            <AmountInput
                decimals={6}
                disabled={inputDisabled}
                value={value}
                onChange={setAmount}
            />

            <div className="max">
                {max ? (
                    <span tabIndex={0} onClick={handleClickMax}>
                        Maximum: {formattedMax}
                    </span>
                ) : null}
            </div>

            <Button
                key={type}
                disabled={Boolean(
                    account && (inputDisabled || !isValueBiggerThanZero
                            || timeFrom && timeFrom >= unixTime && !needsAllowance),
                )}
                type="submit"
                style={buttonStyle}
                loading={Boolean(loading)}
            >
                {account
                    ? needsAllowance
                        ? `Step 1 of 3 ➜ Request`
                        :
                            timeFrom && timeFrom >= unixTime
                                ? `Step 2 of 3 ➜ Wait ${Math.max(0, timeFrom - unixTime)}s`
                                : !(account && (inputDisabled || !isValueBiggerThanZero))
                                    ? 'Final Step ➜ ' + type
                                    : type
                    : 'Connect Wallet'}
            </Button>

            {showConnectModal ? (
                <ConnectModal onClose={() => setShowConnectModal(false)} />
            ) : null}
        </form>
    )

    return { form, value }
}
