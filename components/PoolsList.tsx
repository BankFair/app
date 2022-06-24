import Link from 'next/link'
import { ReactNode } from 'react'
import { rgbaLimeGreen21, SIDEBAR_ALWAYS_VISIBLE_WIDTH } from '../app'

export function PoolsList({
    items,
    labels,
}: {
    items: { name: string; link: string; stats: ReactNode[] }[]
    labels: string[]
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
                    color: var(--color);
                    background-color: var(--bg-section);
                    backdrop-filter: blur(16px);
                    border: 1px solid ${rgbaLimeGreen21};
                    display: flex;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 10px 0;
                    justify-content: space-between;
                    flex-direction: column;
                }

                h4 {
                    margin: 0 0 8px;
                    font-size: 18px;
                    font-weight: 500;
                }

                .stats {
                    display: flex;
                    text-align: center;
                    flex-wrap: wrap;
                    align-items: center;

                    > .stat {
                        flex-basis: 50%;
                        margin-top: 8px;

                        &:nth-child(1),
                        &:nth-child(2) {
                            margin-top: 0;
                        }

                        > .label {
                            color: var(--color-secondary);
                            font-size: 10px;
                            text-transform: uppercase;
                            margin-bottom: 4px;
                        }
                        > .value {
                            font-size: 18px;
                        }
                    }
                }

                @media screen and (min-width: 530px) {
                    a {
                        flex-direction: row;
                        align-items: center;
                    }

                    h4 {
                        margin: 0;
                    }
                }

                @media screen and (min-width: ${SIDEBAR_ALWAYS_VISIBLE_WIDTH}px) {
                    .stats {
                        width: 200px;
                        display: flex;
                    }
                }

                @media screen and (min-width: 900px) {
                    .stats {
                        width: auto;
                        flex-wrap: nowrap;

                        > .stat {
                            flex-basis: auto;
                            margin: 0 6px;
                            > .label {
                                height: auto;
                            }
                        }
                    }
                }
            `}</style>
            {items.map(({ link, name, stats }) => (
                <li key={link}>
                    <Link href={link}>
                        <a>
                            <h4>{name}</h4>

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
