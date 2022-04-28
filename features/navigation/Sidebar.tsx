import Link from 'next/link'
import {
    COLOR_GREEN,
    SIDEBAR_ALWAYS_VISIBLE_WIDTH,
    useAccount,
} from '../../app'
import {
    NAV_HEIGHT,
    SIDEBAR_CLOSE_MARGIN,
    SIDEBAR_CLOSE_SIZE,
    SIDEBAR_MAX_WIDTH,
} from './constants'
import { GrClose } from 'react-icons/gr'
import { TiChartAreaOutline } from 'react-icons/ti'
import { AiFillBank } from 'react-icons/ai'
import { RiAccountCircleFill } from 'react-icons/ri'
import { MdOutlineAdminPanelSettings } from 'react-icons/md'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { selectManager } from '../web3/web3Slice'

export default function Sidebar({
    isVisible,
    hideSidebar,
}: {
    isVisible: boolean
    hideSidebar: () => void
}) {
    const { pathname } = useRouter()
    const account = useAccount()
    const managerAddress = useSelector(selectManager)

    return (
        <div className="sidebar">
            <style jsx>{`
                .sidebar {
                    background-color: white;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    z-index: 1;
                    padding-top: ${NAV_HEIGHT}px;
                    display: ${isVisible ? 'block' : 'none'};

                    > :global(.close-button) {
                        position: absolute;
                        top: ${SIDEBAR_CLOSE_MARGIN}px;
                        right: ${SIDEBAR_CLOSE_MARGIN}px;
                    }
                }

                ul {
                    list-style: none;
                    margin: 20px 20px;
                    padding: 0;
                }

                .sidebar-button {
                    display: flex;
                    align-items: center;
                    margin: 4px 0;
                    padding: 8px 10px;
                    cursor: default;
                    border-radius: 8px;

                    > :global(svg) {
                        margin-right: 10px;
                    }

                    &.current,
                    &:hover {
                        color: ${COLOR_GREEN};
                        background-color: #ebf9f2;
                    }
                }

                @media screen and (min-width: ${SIDEBAR_MAX_WIDTH}px) {
                    .sidebar {
                        width: ${SIDEBAR_MAX_WIDTH}px;
                        border-right: 1px solid grey;
                    }
                }

                @media screen and (min-width: ${SIDEBAR_ALWAYS_VISIBLE_WIDTH}px) {
                    .sidebar {
                        display: block;
                    }

                    .sidebar > :global(.close-button) {
                        display: none;
                    }

                    :global(#__next) {
                        padding-left: ${SIDEBAR_MAX_WIDTH}px;
                    }
                }
            `}</style>

            <GrClose
                className="close-button"
                onClick={hideSidebar}
                size={SIDEBAR_CLOSE_SIZE}
            />

            <ul>
                <li>
                    <Link href="/">
                        <a
                            className={getSidebarItemClass('/', pathname)}
                            onClick={hideSidebar}
                        >
                            <TiChartAreaOutline size={24} />
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
                            <AiFillBank size={24} />
                            Borrow
                        </a>
                    </Link>
                </li>
                {managerAddress && account && account === managerAddress && (
                    <li>
                        <Link href="/manage">
                            <a
                                className={getSidebarItemClass(
                                    '/manage',
                                    pathname,
                                )}
                                onClick={hideSidebar}
                            >
                                <MdOutlineAdminPanelSettings size={24} />
                                Manage
                            </a>
                        </Link>
                    </li>
                )}
                <li>
                    <Link href="/account">
                        <a
                            className={getSidebarItemClass(
                                '/account',
                                pathname,
                            )}
                            onClick={hideSidebar}
                        >
                            <RiAccountCircleFill size={24} />
                            Account
                        </a>
                    </Link>
                </li>
            </ul>
        </div>
    )
}

function getSidebarItemClass(href: string, currentPath: string) {
    return `sidebar-button${currentPath === href ? ' current' : ''}`
}
