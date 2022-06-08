import Link from 'next/link'
import {
    networks,
    RPC_NETWORK_ID,
    SIDEBAR_ALWAYS_VISIBLE_WIDTH,
    useAccount,
} from '../../app'
import { NAV_HEIGHT, SIDEBAR_MAX_WIDTH } from './constants'
import {
    RiPercentLine,
    RiHandCoinLine,
    RiUserLine,
    RiCoinLine,
    RiVipDiamondLine,
} from 'react-icons/ri'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { useMemo } from 'react'
import { selectPools } from '../../features'

export function Sidebar({
    isVisible,
    hideSidebar,
}: {
    isVisible: boolean
    hideSidebar: () => void
}) {
    const { pathname } = useRouter()
    const account = useAccount()
    const pools = useSelector(selectPools)
    const isManager = useMemo(
        () =>
            Object.values(pools).filter(
                (pool) => pool.managerAddress === account,
            ).length > 0,
        [pools, account],
    )

    return (
        <div className="sidebar">
            <style jsx>{`
                .sidebar {
                    background-color: var(--bg-color);
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    z-index: 2;
                    margin-top: ${NAV_HEIGHT}px;
                    display: ${isVisible ? 'block' : 'none'};

                    > .overlay {
                        display: none;
                        z-index: 1;
                        position: fixed;
                        top: 0;
                        bottom: 0;
                        margin-top: ${NAV_HEIGHT}px;
                        margin-left: ${SIDEBAR_MAX_WIDTH}px;
                        width: 100%;
                        height: 100vh;
                        background-color: rgba(0, 0, 0, 0.5);
                    }
                }

                ul {
                    list-style: none;
                    margin: 32px;
                    padding: 0;
                }

                .sidebar-button {
                    display: flex;
                    margin: 16px 0;
                    padding: 8px 8px;
                    cursor: default;
                    border-radius: 8px;
                    color: var(--color-secondary);
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 24px;

                    > :global(svg) {
                        margin-right: 8px;
                    }

                    &.current,
                    &:hover {
                        color: var(--greenery);
                        background: var(--gradient-hover);
                    }
                }

                @media screen and (min-width: ${SIDEBAR_MAX_WIDTH}px) {
                    .sidebar {
                        width: ${SIDEBAR_MAX_WIDTH}px;

                        > .overlay {
                            display: block;
                        }
                    }
                }

                @media screen and (min-width: ${SIDEBAR_ALWAYS_VISIBLE_WIDTH}px) {
                    .sidebar {
                        display: block;
                        background-color: transparent;

                        > .overlay {
                            display: none;
                        }
                    }

                    :global(#__next) {
                        padding-left: ${SIDEBAR_MAX_WIDTH}px;
                    }
                }
            `}</style>

            <ul>
                <li>
                    <Link href="/">
                        <a
                            className={getSidebarItemClass(
                                '/earn',
                                pathname,
                                true,
                            )}
                            onClick={hideSidebar}
                        >
                            <RiPercentLine size={24} />
                            Earn
                        </a>
                    </Link>
                </li>
                <li>
                    <Link href="/borrow">
                        <a
                            className={getSidebarItemClass('/borrow', pathname)}
                            onClick={hideSidebar}
                        >
                            <RiHandCoinLine size={24} />
                            Borrow
                        </a>
                    </Link>
                </li>
                {isManager && (
                    <li>
                        <Link href="/manage">
                            <a
                                className={getSidebarItemClass(
                                    '/manage',
                                    pathname,
                                )}
                                onClick={hideSidebar}
                            >
                                <RiVipDiamondLine size={24} />
                                Manage
                            </a>
                        </Link>
                    </li>
                )}
                {RPC_NETWORK_ID === networks.optimismKovan ? (
                    <li>
                        <a
                            className={getSidebarItemClass('/faucet', pathname)}
                            onClick={hideSidebar}
                            href="https://kovan.optifaucet.com"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <RiCoinLine size={24} />
                            Faucet
                        </a>
                    </li>
                ) : null}
                <li>
                    <Link href="/account">
                        <a
                            className={getSidebarItemClass(
                                '/account',
                                pathname,
                            )}
                            onClick={hideSidebar}
                        >
                            <RiUserLine size={24} />
                            Account
                        </a>
                    </Link>
                </li>
            </ul>

            <div className="overlay" onClick={hideSidebar} />
        </div>
    )
}

function getSidebarItemClass(
    href: string,
    currentPath: string,
    home?: boolean,
) {
    return `sidebar-button${
        currentPath.startsWith(href) || (home && currentPath === '/')
            ? ' current'
            : ''
    }`
}
