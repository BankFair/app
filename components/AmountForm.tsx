import { BigNumber } from '@ethersproject/bignumber'
import { ContractTransaction } from '@ethersproject/contracts'
import { parseUnits, formatUnits } from '@ethersproject/units'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    format,
    getERC20Contract,
    infiniteAllowance,
    TOKEN_SYMBOL,
    useAccount,
    useProvider,
    zero,
} from '../app'
import {
    contract,
    CoreContract,
    trackTransaction,
    useAllowanceAndBalance,
} from '../features'
import { useDispatch } from '../store'
import { AmountInput } from './AmountInput'
import { Button } from './Button'
import { ConnectModal } from './ConnectModal'

type Types = 'Deposit' | 'Withdraw' | 'Stake' | 'Unstake' | 'Repay'
export function useAmountForm<T extends Types>({
    tokenDecimals,
    tokenAddress,
    poolAddress,
    onSumbit,
    refetch,
    max: maxProp,
    disabled,
    type,
}: {
    tokenDecimals: number
    tokenAddress: string
    poolAddress: string
    onSumbit: (
        contract: CoreContract,
        amount: string,
    ) => Promise<ContractTransaction>
    refetch: () => Promise<unknown>
    max?: BigNumber
    disabled?: boolean
    type: T
}) {
    const [loading, setLoading] = useState('')

    const isWithdraw = type === 'Unstake' || type === 'Withdraw'
    const isRepay = type === 'Repay'

    const account = useAccount()
    const provider = useProvider()

    const dispatch = useDispatch()

    const {
        allowance,
        balance,
        refetch: refetchAllowanceAndBalance,
    } = useAllowanceAndBalance(tokenAddress, poolAddress, account)

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

    const [amount, setAmount] = useState('')
    const { value, isValueBiggerThanZero, needsApproval, formattedMax } =
        useMemo(() => {
            const amountBigNumber = amount
                ? parseUnits(amount, tokenDecimals)
                : zero

            const value =
                loading ||
                (max?.lt(amountBigNumber)
                    ? format(formatUnits(max, tokenDecimals))
                    : amount)

            const valueBigNumber = parseUnits(value || '0', tokenDecimals)
            return {
                value,
                isValueBiggerThanZero: valueBigNumber.gt(zero),
                needsApproval:
                    !isWithdraw && allowance
                        ? BigNumber.from(allowance).lt(valueBigNumber)
                        : false,
                formattedMax: max
                    ? format(formatUnits(max, tokenDecimals))
                    : '',
            }
        }, [loading, max, tokenDecimals, amount, allowance, isWithdraw])

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

                if (needsApproval) {
                    getERC20Contract(tokenAddress)
                        .connect(signer)
                        .approve(poolAddress, infiniteAllowance)
                        .then((tx) =>
                            trackTransaction(dispatch, {
                                name: `Approve ${TOKEN_SYMBOL}`,
                                tx,
                            }),
                        )
                        .then(() => refetchAllowanceAndBalance())
                        .then(() => {
                            setLoading('')
                        })
                        .catch((reason) => {
                            console.error(reason)
                            setLoading('')
                        })

                    return
                }

                onSumbit(contract.attach(poolAddress).connect(signer), value)
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
                width={170}
                loading={Boolean(loading)}
            >
                {account
                    ? needsApproval
                        ? 'Approve USDC'
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
