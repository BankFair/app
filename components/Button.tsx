import Link from 'next/link'
import { useMemo } from 'react'
import { ButtonHTMLAttributes } from 'react'
import { CSSProperties, MouseEventHandler, ReactNode } from 'react'
import { Oval } from 'react-loading-icons'
import {
    COLOR_BLUE,
    COLOR_GREEN,
    COLOR_RED,
    rgba,
    rgbBlue,
    rgbGreen,
    rgbRed,
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

    const Element = type ? 'button' : 'a'

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
            className={className(classModifiers as Record<string, boolean>)}
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

                    &.red {
                        background-color: ${rgbRed};
                        border-color: ${rgba(COLOR_RED, 0.48)};
                    }

                    &.blue {
                        background-color: ${rgbBlue};
                        border-color: ${rgba(COLOR_BLUE, 0.48)};
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

function className(props: Record<string, boolean>) {
    return Object.keys(props)
        .filter((key) => props[key])
        .join(' ')
}

export type Button = typeof Button
