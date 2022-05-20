import { BigNumber } from '@ethersproject/bignumber'
import { ContractTransaction } from '@ethersproject/contracts'
import { parseUnits, formatUnits } from '@ethersproject/units'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    format,
    getERC20Contract,
    infiniteAllowance,
    useAccount,
    useProvider,
    zero,
} from '../app'
import { contract, CoreContract, useAllowanceAndBalance } from '../features'
import { AmountInput } from './AmountInput'
import { Button } from './Button'
import { ConnectModal } from './ConnectModal'

export function useAmountForm({
    tokenDecimals,
    tokenAddress,
    poolAddress,
    onSumbit,
    refetch,
    max: maxProp,
    disabled,
    type = 'Deposit',
}: {
    tokenDecimals: number
    tokenAddress: string
    poolAddress: string
    onSumbit: (
        contract: CoreContract,
        amount: string,
    ) => Promise<ContractTransaction>
    refetch: () => Promise<any>
    max?: BigNumber
    disabled?: boolean
    type?: 'Deposit' | 'Withdraw' | 'Stake' | 'Unstake'
}) {
    const [isLoading, setIsLoading] = useState(false)

    const isWithdraw = type === 'Unstake' || type === 'Withdraw'

    const account = useAccount()
    const provider = useProvider()

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
    const { value, needsApproval } = useMemo(() => {
        const amountBigNumber = amount
            ? parseUnits(amount, tokenDecimals)
            : zero
        return {
            value: max?.lt(amountBigNumber)
                ? format(formatUnits(max, tokenDecimals))
                : amount,
            needsApproval:
                !isWithdraw && allowance
                    ? BigNumber.from(allowance).lt(amountBigNumber)
                    : false,
        }
    }, [max, tokenDecimals, amount, allowance, isWithdraw])

    const handleClickMax = useCallback(() => {
        setAmount(format(formatUnits(max!, tokenDecimals)))
    }, [max, tokenDecimals])

    const form = (
        <form
            onSubmit={(event) => {
                event.preventDefault()

                if (!account) {
                    setShowConnectModal(true)
                    return
                }

                const signer = provider!.getSigner()

                if (needsApproval) {
                    setIsLoading(true)

                    getERC20Contract(tokenAddress)
                        .connect(signer)
                        .approve(poolAddress, infiniteAllowance)
                        .then((tx) => tx.wait())
                        .then(() => refetchAllowanceAndBalance())
                        .then(() => {
                            setIsLoading(false)
                        })
                        .catch((reason) => {
                            console.error(reason)
                            setIsLoading(false)
                        })

                    return
                }

                setIsLoading(true)

                onSumbit(contract.attach(poolAddress).connect(signer), value)
                    .then((tx) => tx.wait())
                    .then(() =>
                        // TODO: Optimize provider. Currently it will make 3 separate requests.
                        Promise.all([refetch(), refetchAllowanceAndBalance()]),
                    )

                    .then(() => {
                        setIsLoading(false)
                    })
                    .catch((reason) => {
                        console.error(reason)
                        setIsLoading(false)
                    })
            }}
        >
            <style jsx>{`
                form {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin: 12px 0;

                    > .input-container {
                        display: flex;
                        flex-direction: column;
                        margin-bottom: 8px;

                        > .max {
                            text-align: right;
                            font-size: 12px;
                            height: 14px;
                            line-height: 14px;
                            margin-bottom: 2px;
                            margin-right: 4px;
                            color: var(--color-secondary);

                            > span {
                                cursor: pointer;
                            }
                        }
                    }
                }
            `}</style>

            <div className="input-container">
                <div className="max">
                    {max ? (
                        <span onClick={handleClickMax}>
                            Max: {format(formatUnits(max, tokenDecimals))}
                        </span>
                    ) : null}
                </div>
                <AmountInput
                    decimals={6}
                    disabled={disabled || isLoading}
                    value={value}
                    onChange={setAmount}
                />
            </div>

            <Button
                key={type}
                disabled={Boolean(disabled || isLoading || (!value && account))}
                type="submit"
                width={170}
                loading={Boolean(isLoading)}
                blue={isWithdraw}
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

    return { form, allowance, balance }
}
