import Link from 'next/link'
import { CSSProperties, MouseEventHandler, ReactNode } from 'react'
import { COLOR_BLUE, COLOR_GREEN, COLOR_RED } from '../app'

export function Button({
    href,
    onClick,
    children,
    style,
    ...classModifiers
}: {
    href?: string
    onClick?: MouseEventHandler<HTMLAnchorElement>
    children?: ReactNode
    style?: CSSProperties
    disabled?: boolean
    ghost?: boolean
    blue?: boolean
    red?: boolean
}) {
    const { disabled } = classModifiers

    const anchor = (
        <a
            onClick={disabled ? undefined : onClick}
            className={className(classModifiers as Record<string, boolean>)}
            style={style}
        >
            <style jsx>{`
                a {
                    cursor: default;
                    background-color: ${COLOR_GREEN};
                    border-color: ${COLOR_GREEN};
                    padding: 8px 14px;
                    border-radius: 8px;
                    color: white;
                }

                a.red {
                    background-color: ${COLOR_RED};
                    border-color: ${COLOR_RED};
                }

                a.blue {
                    background-color: ${COLOR_BLUE};
                    border-color: ${COLOR_BLUE};
                }

                a.disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                a.ghost {
                    border-width: 1px;
                    border-style: solid;
                    background-color: transparent;
                    color: ${COLOR_GREEN};

                    &.blue {
                        color: ${COLOR_BLUE};
                    }
                }
            `}</style>
            {children}
        </a>
    )

    return href ? <Link href={href}>{anchor}</Link> : anchor
}

function className(props: Record<string, boolean>) {
    return Object.keys(props)
        .filter((key) => props[key])
        .join(' ')
}
