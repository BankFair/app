import { Web3ReactProvider } from '@web3-react/core'
import { Provider } from 'react-redux'
import type { AppProps } from 'next/app'
import {
    COLOR_GREY_500,
    connectors,
    NEW_COLOR_RICH_BLACK,
    NEW_COLOR_WHITE,
    rgba,
    rgbaBlack90,
    rgbaWhite90,
    rgbBlue,
    rgbChineseSilver,
    rgbGreeneryDark,
    rgbGreeneryLight,
    rgbGrey500,
    rgbGrey600,
    rgbGround,
    rgbNewWhite,
    rgbRed,
    rgbRedDarker,
    rgbRichBlack,
    rgbStone,
    rgbWhite,
    useClickTabIndexElement,
} from '../app'
import {
    SwitchNetworkModal,
    Navigation,
    TransactionNotifications,
    Background,
} from '../components'
import { useFetchPoolsPropertiesOnce, useConnectEagerly } from '../features'
import { store } from '../store'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <Provider store={store}>
            <Setup />
            <Web3ReactProvider connectors={connectors}>
                <style jsx global>{`
                    :root {
                        --bg-color: ${rgbNewWhite};
                        --bg-overlay: ${rgba(NEW_COLOR_WHITE, 0.9)};
                        --bg-modal-overlay: rgba(0, 0, 0, 0.7);
                        --bg-section: ${rgbaWhite90};
                        --color: ${rgbGround};
                        --color-secondary: ${rgbStone};
                        --color-disabled: ${rgbGrey500};
                        --disabled-24: ${rgba(COLOR_GREY_500, 0.24)};
                        --disabled-80: ${rgba(COLOR_GREY_500, 0.8)};
                        --divider: ${rgba(COLOR_GREY_500, 0.24)};
                        --shadow: ${rgba(COLOR_GREY_500, 0.16)};
                        --greenery: ${rgbGreeneryLight};
                        --gradient: linear-gradient(
                            90.05deg,
                            #47cc4c 3.95%,
                            #35b5d1 104.32%
                        );
                        --gradient-hover: linear-gradient(
                            90deg,
                            #d1ffda 0%,
                            #baf7e1 111.89%
                        );
                    }

                    html,
                    body {
                        padding: 0;
                        margin: 0;
                        font-family: -apple-system, BlinkMacSystemFont, Segoe UI,
                            Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans,
                            Droid Sans, Helvetica Neue, sans-serif;
                        font-weight: 300;
                        color: var(--color);
                        background-color: var(--bg-color);
                    }

                    a {
                        color: ${rgbBlue};
                        text-decoration: none;

                        &.primary {
                            color: var(--color);

                            &:hover {
                                text-decoration: underline;
                            }
                        }
                    }

                    * {
                        box-sizing: border-box;
                    }

                    h1 {
                        margin: 24px 0;
                    }

                    input {
                        font-size: 16px;
                        font-weight: 600;
                        line-height: 21px;
                        width: 100%;
                        padding: 10px 8px 10px 8px;
                        border: 2px solid ${rgbStone};
                        border-radius: 8px;
                        background-color: ${rgbWhite};
                        color: var(--color);
                        max-width: 224px;

                        &:disabled {
                            cursor: not-allowed;
                            color: var(--color-disabled);
                        }

                        &.invalid {
                            border-color: ${rgbRedDarker};

                            &:focus-visible {
                                outline-color: ${rgbRed};
                            }
                        }

                        @media (prefers-color-scheme: dark) {
                            background-color: ${rgbGround};
                        }
                    }

                    select {
                        display: inline-block;
                        box-sizing: border-box;
                        font-size: 16px;
                        line-height: 19px;
                        appearance: none;
                        background-repeat: no-repeat;
                        color: var(--color);
                        border: 0 none;
                        border-radius: 8px;
                        border: 2px solid ${rgbStone};
                        background-color: ${rgbWhite};
                        background-image: linear-gradient(
                                45deg,
                                transparent 50%,
                                currentColor 50%
                            ),
                            linear-gradient(
                                135deg,
                                currentColor 50%,
                                transparent 50%
                            );
                        background-position: right 15px top 1em,
                            right 10px top 1em;
                        background-size: 5px 5px, 5px 5px;
                        padding: 10px 28px 10px 12px;

                        &.s {
                            padding: 6px 24px 6px 8px;
                            border-radius: 6px;
                            background-position: right 13px top 0.85em,
                                right 8px top 0.85em;
                        }

                        &.xs {
                            padding: 6px 24px 6px 8px;
                            border-radius: 6px;
                            background-position: right 13px top 0.85em,
                                right 8px top 0.85em;
                            font-size: 14px;
                        }

                        &.xxs {
                            padding: 4px 22px 4px 6px;
                            border-radius: 6px;
                            background-position: right 13px top 0.95em,
                                right 8px top 0.95em;
                            font-size: 12px;
                        }

                        > option {
                            background-color: ${rgbGround};
                            color: var(--color);
                        }
                    }

                    :focus-visible {
                        outline: var(--greenery) solid 2px;
                        outline-offset: -2px;
                    }

                    @media (prefers-color-scheme: dark) {
                        :root {
                            --bg-color: ${rgbRichBlack};
                            --bg-overlay: ${rgba(NEW_COLOR_RICH_BLACK, 0.9)};
                            --bg-modal-overlay: rgba(20, 20, 20, 0.7);
                            --bg-section: ${rgbaBlack90};
                            --color: ${rgbChineseSilver};
                            --color-disabled: ${rgbGrey600};
                            --shadow: rgba(0, 0, 0, 0.16);
                            --greenery: ${rgbGreeneryDark};
                            --gradient-hover: linear-gradient(
                                90deg,
                                #183f20 0%,
                                #002f39 111.89%
                            );
                        }

                        select {
                            background-color: ${rgbGround};

                            > option {
                                background-color: ${rgbGround};
                            }
                        }
                    }
                `}</style>
                <SwitchNetworkModal />
                <Navigation />
                <Background />
                <Component {...pageProps} />
                <TransactionNotifications />
            </Web3ReactProvider>
        </Provider>
    )
}

function Setup() {
    useFetchPoolsPropertiesOnce()
    useConnectEagerly()
    useClickTabIndexElement()
    return null
}
