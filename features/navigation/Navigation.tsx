import { useCallback, useState } from 'react'
import {
    shortenAddress,
    SIDEBAR_ALWAYS_VISIBLE_WIDTH,
    useAccount,
} from '../../app'
import { Button, FlexGrow } from '../../components'
import { LOGO_SIZE, NAV_HEIGHT, NAV_PADDING } from './constants'
import Sidebar from './Sidebar'
import { RiBankFill, RiMenuLine } from 'react-icons/ri'
import { useRouter } from 'next/router'

export default function Navigation() {
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
                    background-color: white;

                    > :global(.logo) {
                        z-index: 2;
                        position: relative;
                    }

                    > :global(.menu-button) {
                        position: relative;
                        margin-left: 8px;
                        width: 24px;
                        height: 24px;
                    }
                }

                @media screen and (min-width: ${SIDEBAR_ALWAYS_VISIBLE_WIDTH}px) {
                    .menu-button {
                        display: none;
                    }
                }

                :global(#__next) {
                    padding-top: ${NAV_HEIGHT}px;
                }
            `}</style>
            <RiBankFill className="logo" size={LOGO_SIZE} />
            <RiMenuLine
                className="menu-button"
                size={24}
                onClick={showSidebar}
            />
            <FlexGrow />
            {account ? (
                <Button href="/account" blue ghost>
                    {shortenAddress(account)}
                </Button>
            ) : (
                pathname !== '/account' && (
                    <Button href="/account">Connect Wallet</Button>
                )
            )}
            <Sidebar isVisible={isSidebarVisible} hideSidebar={hideSidebar} />
        </nav>
    )
}
