import { Web3ReactProvider } from '@web3-react/core'
import { Provider } from 'react-redux'
import type { AppProps } from 'next/app'
import {
    COLOR_GREY_500,
    COLOR_GREY_900,
    COLOR_WHITE,
    connectors,
    input,
    inputNonTransparentDark,
    inputNonTransparentLight,
    rgba,
    rgbBlue,
    rgbGrey500,
    rgbGrey600,
    rgbGrey900,
    rgbTextPrimaryDark,
    rgbTextPrimaryLight,
    rgbWhite,
    useClickTabIndexElement,
} from '../app'
import {
    SwitchNetworkModal,
    Navigation,
    TransactionNotifications,
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
                        --bg-color: ${rgbWhite};
                        --bg-overlay: ${rgba(COLOR_WHITE, 0.9)};
                        --color: ${rgbTextPrimaryLight};
                        --color-secondary: ${rgbGrey600};
                        --color-disabled: ${rgbGrey500};
                        --disabled-24: ${rgba(COLOR_GREY_500, 0.24)};
                        --disabled-80: ${rgba(COLOR_GREY_500, 0.8)};
                        --divider: ${rgba(COLOR_GREY_500, 0.24)};
                        --shadow: ${rgba(COLOR_GREY_500, 0.16)};
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

                    input {
                        font-size: 16px;
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
                        background-color: ${input};
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
                            background-color: ${inputNonTransparentLight};
                            color: var(--color);
                        }
                    }

                    @media (prefers-color-scheme: dark) {
                        :root {
                            --bg-color: ${rgbGrey900};
                            --bg-overlay: ${rgba(COLOR_GREY_900, 0.9)};
                            --color: ${rgbTextPrimaryDark};
                            --color-secondary: ${rgbGrey500};
                            --color-disabled: ${rgbGrey600};
                            --shadow: rgba(0, 0, 0, 0.16);
                        }

                        select > option {
                            background-color: ${inputNonTransparentDark};
                        }
                    }
                `}</style>
                <SwitchNetworkModal />
                <Navigation />
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
