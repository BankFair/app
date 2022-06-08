import { useCallback, useState } from 'react'
import {
    rgbWhite,
    shortenAddress,
    SIDEBAR_ALWAYS_VISIBLE_WIDTH,
    useAccount,
} from '../../app'
import { Button } from '../Button'
import { FlexGrow } from '../FlexGrow'
import { NAV_HEIGHT, NAV_PADDING } from './constants'
import { Sidebar } from './Sidebar'
import { RiMenuLine, RiWallet3Line } from 'react-icons/ri'
import { useRouter } from 'next/router'
import { Logo } from '../Logo'

export function Navigation() {
    const { pathname } = useRouter()
    const account = useAccount()

    const [isSidebarVisible, setIsSidebarVisible] = useState(false)
    const toggleSidebar = useCallback(
        () => setIsSidebarVisible((state) => !state),
        [],
    )
    const hideSidebar = useCallback(() => setIsSidebarVisible(false), [])

    return (
        <nav>
            <style jsx>{`
                nav {
                    position: fixed;
                    top: 0;
                    left: 0;
                    padding: ${NAV_PADDING}px;
                    z-index: 2;
                    width: 100vw;
                    display: flex;
                    align-items: center;
                    height: ${NAV_HEIGHT}px;
                    background: var(--gradient);
                    box-shadow: 0px 4px 24px rgba(64, 195, 135, 0.5);

                    @media (prefers-color-scheme: dark) {
                        box-shadow: 0px 4px 24px rgba(64, 195, 135, 0.3);
                    }

                    > :global(.logo) {
                        margin-right: -120px;

                        > :global(g) {
                            display: none;
                        }
                    }

                    > :global(.menu-button) {
                        position: relative;
                        width: 24px;
                        height: 24px;
                        color: ${rgbWhite};
                    }
                }

                @media screen and (min-width: ${SIDEBAR_ALWAYS_VISIBLE_WIDTH}px) {
                    nav {
                        > :global(.logo) {
                            margin-right: 0;

                            > :global(g) {
                                display: inline;
                            }
                        }
                        > :global(.menu-button) {
                            display: none;
                        }
                    }
                }

                :global(#__next) {
                    padding-top: ${NAV_HEIGHT}px;
                }
            `}</style>
            <Logo />
            <RiMenuLine
                className="menu-button"
                size={24}
                onClick={toggleSidebar}
            />
            <FlexGrow />
            {account ? (
                <Button href="/account" key="account" whiteTransaprent>
                    <RiWallet3Line />
                    {shortenAddress(account)}
                </Button>
            ) : (
                pathname !== '/account' && (
                    <Button href="/account" key="connect" whiteTransaprent>
                        Connect Wallet
                    </Button>
                )
            )}
            <Sidebar isVisible={isSidebarVisible} hideSidebar={hideSidebar} />
        </nav>
    )
}
