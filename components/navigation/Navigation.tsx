import { useCallback, useState } from 'react'
import {
    COLOR_GREY_900,
    COLOR_WHITE,
    prefix,
    rgba,
    shortenAddress,
    SIDEBAR_ALWAYS_VISIBLE_WIDTH,
    useAccount,
} from '../../app'
import { Button } from '../Button'
import { FlexGrow } from '../FlexGrow'
import {
    LOGO_HEIGHT,
    LOGO_WIDTH,
    LOGO_WITH_TEXT_WIDTH,
    NAV_HEIGHT,
    NAV_PADDING,
} from './constants'
import { Sidebar } from './Sidebar'
import { RiMenuLine } from 'react-icons/ri'
import { useRouter } from 'next/router'

export function Navigation() {
    const { pathname } = useRouter()
    const account = useAccount()

    const [isSidebarVisible, setIsSidebarVisible] = useState(false)
    const showSidebar = useCallback(
        () => setIsSidebarVisible(true),
        [setIsSidebarVisible],
    )
    const hideSidebar = useCallback(
        () => setIsSidebarVisible(false),
        [setIsSidebarVisible],
    )

    return (
        <nav>
            <style jsx>{`
                nav {
                    position: fixed;
                    top: 0;
                    left: 0;
                    padding: ${NAV_PADDING}px;
                    z-index: 1;
                    width: 100vw;
                    display: flex;
                    align-items: center;
                    height: ${NAV_HEIGHT}px;
                    background-color: var(--bg-overlay);
                    backdrop-filter: blur(5px);

                    > .logo,
                    > .logo-text {
                        z-index: 3;
                        position: relative;
                        padding: 2px;
                        height: ${LOGO_HEIGHT}px;
                        object-fit: contain;
                    }

                    > .logo {
                        width: ${LOGO_WIDTH}px;
                        margin-left: 4px;
                    }

                    > .logo-text {
                        filter: invert(1);
                        display: none;
                        width: ${LOGO_WITH_TEXT_WIDTH}px;
                    }

                    > :global(.menu-button) {
                        position: relative;
                        margin-left: 8px;
                        width: 24px;
                        height: 24px;
                        color: var(--color-secondary);
                    }
                }

                @media (prefers-color-scheme: dark) {
                    nav {
                        > .logo-text {
                            filter: none;
                        }
                    }
                }

                @media screen and (min-width: ${SIDEBAR_ALWAYS_VISIBLE_WIDTH}px) {
                    nav {
                        > :global(.menu-button) {
                            display: none;
                        }

                        > .logo-text {
                            display: block;
                        }
                    }
                }

                :global(#__next) {
                    padding-top: ${NAV_HEIGHT}px;
                }
            `}</style>
            <img
                className="logo"
                src={`${prefix}/logo.png`}
                alt="Sapling logo"
            />
            <img
                className="logo-text"
                src={`${prefix}/logo-text.png`}
                alt="Sapling logo"
                loading="lazy"
            />
            <RiMenuLine
                className="menu-button"
                size={24}
                onClick={showSidebar}
            />
            <FlexGrow />
            {account ? (
                <Button href="/account" blue ghost key="account">
                    {shortenAddress(account)}
                </Button>
            ) : (
                pathname !== '/account' && (
                    <Button href="/account" key="connect">
                        Connect Wallet
                    </Button>
                )
            )}
            <Sidebar isVisible={isSidebarVisible} hideSidebar={hideSidebar} />
        </nav>
    )
}
