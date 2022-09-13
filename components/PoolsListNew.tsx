import Link from 'next/link'
import { ReactNode } from 'react'
import { commonBoxShadow, commonDarkBoxShadow, rgbaLimeGreen21 } from '../app'
import { PoolDescription } from './PoolDescription'

export function PoolsListNew({
    items,
    labels,
    showMoreAndOpenPage,
}: {
    items: {
        address: string
        name: string
        link: string
        stats: ReactNode[]
    }[]
    labels: string[]
    showMoreAndOpenPage?: boolean
}) {
    return (
        <ul>
            <style jsx>{`
                ul {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                a {
                    display: block;
                    color: var(--color);
                    background-color: var(--bg-section);
                    backdrop-filter: blur(16px);
                    border: 1px solid ${rgbaLimeGreen21};
                    border-radius: 8px;
                    padding: 16px;
                    margin: 24px 0;
                    box-shadow: ${commonBoxShadow};

                    @media (prefers-color-scheme: dark) {
                        box-shadow: ${commonDarkBoxShadow};
                    }
                }

                h2 {
                    margin: 0 0 24px;
                    font-size: 24px;
                    font-weight: 700;
                }

                .stats {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    margin-top: 16px;

                    > .stat {
                        margin-top: 8px;
                        margin-right: 24px;

                        &:last-child {
                            margin-right: 0;
                        }

                        > .label {
                            color: var(--color-secondary);
                            font-size: 16px;
                            margin-bottom: 8px;
                            font-weight: 400;
                        }
                        > .value {
                            font-size: 16px;
                            font-weight: 700;
                        }
                    }
                }
            `}</style>
            {items.map(({ link, name, stats, address }) => (
                <li key={link}>
                    <Link href={link}>
                        <a>
                            <h2>{name}</h2>
                            <PoolDescription
                                address={address}
                                showMoreInNextMount={showMoreAndOpenPage}
                            />
                            <div className="stats">
                                {labels.map((label, index) => (
                                    <div key={label} className="stat">
                                        <div className="label">{label}</div>
                                        <div className="value">
                                            {stats[index]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </a>
                    </Link>
                </li>
            ))}
        </ul>
    )
}
