import Link from 'next/link'
import { useMemo } from 'react'
import { ButtonHTMLAttributes } from 'react'
import { CSSProperties, MouseEventHandler, ReactNode } from 'react'
import { Oval } from 'react-loading-icons'
import {
    className,
    COLOR_BLUE,
    COLOR_GREEN,
    COLOR_RED,
    rgba,
    rgbBlue,
    rgbBlueDark,
    rgbGreen,
    rgbGreenDark,
    rgbRed,
    rgbRedDark,
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
    ghost?: boolean
    blue?: boolean
    red?: boolean
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
                    background-color: ${rgbGreen};
                    border-color: ${rgba(COLOR_GREEN, 0.48)};
                    padding: 8px 14px;
                    border-radius: 8px;
                    color: white;
                    border: 0 none;
                    font-weight: 400;
                    font-size: 16px;
                    font-family: inherit;
                    display: inline-block;
                    transition-property: background-color;
                    transition-duration: 100ms;
                    transition-timing-function: linear;

                    &:not(.disabled):not(.ghost):hover {
                        background-color: ${rgbGreenDark};
                    }

                    &.red {
                        background-color: ${rgbRed};
                        border-color: ${rgba(COLOR_RED, 0.48)};

                        &:not(.disabled):not(.ghost):hover {
                            background-color: ${rgbRedDark};
                        }
                    }

                    &.blue {
                        background-color: ${rgbBlue};
                        border-color: ${rgba(COLOR_BLUE, 0.48)};

                        &:not(.disabled):not(.ghost):hover {
                            background-color: ${rgbBlueDark};
                        }
                    }

                    &.disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                    }

                    &.ghost {
                        border-width: 1px;
                        border-style: solid;
                        background-color: transparent;
                        color: ${rgbGreen};

                        &.red {
                            color: ${rgbRed};
                        }
                        &.blue {
                            color: ${rgbBlue};
                        }
                    }

                    > :global(svg) {
                        width: 16px;
                        height: 16px;
                        margin-right: 4px;
                        margin-bottom: -3px;
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
