import { ChangeEvent, useMemo } from 'react'
import { input, prefix } from '../app'

export function AmountInput({
    decimals,
    value,
    onChange,
    disabled,
}: {
    decimals: number
    value: string
    onChange: (newValue: string) => void
    disabled?: boolean
}) {
    const handleChange = useMemo(() => {
        const regexp = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`)
        return (event: ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value.replace(',', '.')
            if (!regexp.test(value)) return

            onChange(value)
        }
    }, [decimals, onChange])

    return (
        <div className={`input ${disabled ? 'disabled' : ''}`}>
            <style jsx>{`
                .input {
                    position: relative;
                    max-width: 224px;

                    &.disabled {
                        cursor: not-allowed;
                        opacity: 0.7;
                    }
                }

                input {
                    font-size: 18px;
                    width: 100%;
                    padding: 10px 84px 10px 12px;
                    border: 0 none;
                    border-radius: 8px;
                    background-color: ${input};
                    color: var(--color);

                    &:disabled {
                        cursor: not-allowed;
                    }
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
            `}</style>

            <input
                type="text"
                inputMode="decimal"
                disabled={disabled}
                placeholder="0"
                value={value}
                onChange={handleChange}
            />
            <div className="token">
                <img src={`${prefix}/usdc.svg`} alt="USDC logo" />
                USDC
            </div>
        </div>
    )
}
