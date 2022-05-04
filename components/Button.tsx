import Link from 'next/link'
import { ButtonHTMLAttributes } from 'react'
import { CSSProperties, MouseEventHandler, ReactNode } from 'react'
import { COLOR_BLUE, COLOR_GREEN, COLOR_RED } from '../app'

export function Button({
    href,
    onClick,
    children,
    style,
    type,
    ...classModifiers
}: {
    href?: string
    onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>
    children?: ReactNode
    type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
    style?: CSSProperties
    disabled?: boolean
    ghost?: boolean
    blue?: boolean
    red?: boolean
}) {
    const { disabled } = classModifiers

    const Element = type ? 'button' : 'a'

    const anchor = (
        <Element
            onClick={disabled ? undefined : onClick}
            className={className(classModifiers as Record<string, boolean>)}
            style={style}
            type={type}
        >
            <style jsx>{`
                a,
                button {
                    cursor: default;
                    background-color: ${COLOR_GREEN};
                    border-color: ${COLOR_GREEN};
                    padding: 8px 14px;
                    border-radius: 8px;
                    color: white;
                    border: 0 none;
                    font-weight: 300;
                    font-size: 16px;
                    font-family: inherit;
                    display: inline-block;

                    &.red {
                        background-color: ${COLOR_RED};
                        border-color: ${COLOR_RED};
                    }

                    &.blue {
                        background-color: ${COLOR_BLUE};
                        border-color: ${COLOR_BLUE};
                    }

                    &.disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                    }

                    &.ghost {
                        border-width: 1px;
                        border-style: solid;
                        background-color: transparent;
                        color: ${COLOR_GREEN};

                        &.blue {
                            color: ${COLOR_BLUE};
                        }
                    }
                }
            `}</style>
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
