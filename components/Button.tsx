import Link from 'next/link'
import { useMemo } from 'react'
import { ButtonHTMLAttributes } from 'react'
import { CSSProperties, MouseEventHandler, ReactNode } from 'react'
import { Oval } from 'react-loading-icons'
import {
    className,
    COLOR_WHITE,
    rgba,
    rgbGreen,
    rgbStone,
    rgbStoneDarker,
} from '../app'

export function Button({
    href,
    onClick,
    children,
    style,
    loading,
    width,
    type,
    ...classModifiers
}: {
    href?: string
    onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>
    children: ReactNode
    loading?: boolean
    type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
    style?: CSSProperties
    width?: number
    disabled?: boolean
    whiteTransaprent?: boolean
    stone?: boolean
}) {
    const { disabled } = classModifiers

    const Element = type ? 'button' : href ? 'a' : 'button'

    const styleProp = useMemo(() => {
        if (!style && !width) return undefined
        if (style && !width) return style
        if (width && !style) return { width }
        return { ...style, width }
    }, [style, width])

    const anchor = (
        <Element
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={className(classModifiers)}
            style={styleProp}
            type={type}
        >
            <style jsx>{`
                a,
                button {
                    cursor: default;
                    background-color: transparent;
                    padding: 0 16px;
                    border-radius: 8px;
                    height: 40px;
                    color: white;
                    border: 0 none;
                    font-weight: 400;
                    font-size: 16px;
                    font-family: inherit;
                    display: inline-block;
                    transition-property: background-image;
                    transition-duration: 100ms;
                    transition-timing-function: linear;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background-image: var(--gradient);

                    &:not(.disabled):hover {
                        background-image: var(--gradient-hover);
                    }

                    &.disabled {
                        filter: grayscale(100%);
                        cursor: not-allowed;
                    }

                    &.whiteTransaprent {
                        background-image: none;
                        background-color: ${rgba(COLOR_WHITE, 0.2)};
                        transition-property: background-color;

                        &:not(.disabled):hover {
                            background-image: none;
                            background-color: ${rgba(COLOR_WHITE, 0.4)};
                        }
                    }

                    &.stone {
                        background-image: none;
                        background-color: ${rgbStone};
                        transition-property: background-color;

                        &:not(.disabled):hover {
                            background-image: none;
                            background-color: ${rgbStoneDarker};
                        }
                    }
                    > :global(svg) {
                        width: 24px;
                        height: 24px;
                        margin-right: 16px;
                    }
                }
            `}</style>
            {loading ? <Oval speed={0.7} /> : null}
            {children}
        </Element>
    )

    return href ? <Link href={href}>{anchor}</Link> : anchor
}

export type Button = typeof Button
