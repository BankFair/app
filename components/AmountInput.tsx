import {
    ChangeEvent,
    FocusEventHandler,
    KeyboardEventHandler,
    useMemo,
} from 'react'
import { className, InputAmount, prefix } from '../app'

export function AmountInput({
    decimals,
    value,
    onChange,
    onBlur,
    onKeyDown,
    label,
    paddingRight,
    ...classModifiers
}: {
    decimals: number
    value: InputAmount
    onChange: (newValue: InputAmount) => void
    onBlur?: FocusEventHandler<HTMLInputElement>
    onKeyDown?: KeyboardEventHandler<HTMLInputElement>
    label?: string
    paddingRight?: number
    disabled?: boolean
    noToken?: boolean
    s?: boolean
    center?: boolean
}) {
    const handleChange = useMemo(() => {
        const regexp = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`)
        return (event: ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value.replace(',', '.')
            if (!regexp.test(value)) return

            onChange((value === '.' ? '0.' : value) as InputAmount)
        }
    }, [decimals, onChange])

    return (
        <div className={`input ${className(classModifiers)}`}>
            <style jsx>{`
                .input {
                    position: relative;
                    max-width: 224px;

                    &.disabled {
                        cursor: not-allowed;
                        opacity: 0.7;
                    }

                    &.center {
                        > input {
                            text-align: center;
                        }
                    }

                    &.noToken {
                        > input {
                            padding-right: 12px;
                        }

                        > .token {
                            display: none;
                        }
                    }

                    &.s {
                        > input {
                            padding: 6px 74px 6px 8px;
                            border-radius: 6px;
                            font-size: 16px;
                            line-height: 19px;
                        }

                        > .token {
                            font-size: 14px;
                            right: 8px;

                            > img {
                                width: 20px;
                                height: 20px;
                            }
                        }

                        &.noToken {
                            > input {
                                padding-right: 8px;
                            }
                        }
                    }
                }

                input {
                    padding: 10px 84px 10px 8px;
                }

                .token {
                    display: flex;
                    align-items: center;
                    font-size: 16px;
                    font-weight: 400;
                    pointer-events: none;
                    position: absolute;
                    right: 10px;
                    top: 0;
                    height: 100%;

                    > img {
                        width: 22px;
                        height: 22px;
                        margin-right: 2px;
                    }
                }

                .label {
                    font-size: 14px;
                    position: absolute;
                    right: 10px;
                    top: 0;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    color: var(--color-secondary);
                }
            `}</style>

            <input
                type="text"
                inputMode="decimal"
                disabled={classModifiers.disabled}
                placeholder="0"
                value={value}
                onChange={handleChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                style={paddingRight ? { paddingRight } : undefined}
            />
            {label ? <div className="label">{label}</div> : null}
            <div className="token">
                <img src={`${prefix}/usdt.svg`} alt="USDT logo" />
                USDT
            </div>
        </div>
    )
}
