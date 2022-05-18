import { Web3ReactProvider } from '@web3-react/core'
import { Provider } from 'react-redux'
import type { AppProps } from 'next/app'
import {
    COLOR_GREY_500,
    COLOR_GREY_900,
    COLOR_WHITE,
    connectors,
    rgba,
    rgbBlue,
    rgbGrey500,
    rgbGrey600,
    rgbGrey800,
    rgbGrey900,
    rgbWhite,
} from '../app'
import { SwitchNetworkModal, Navigation } from '../components'
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
                        --color: ${rgbGrey800};
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

                    @media (prefers-color-scheme: dark) {
                        :root {
                            --bg-color: ${rgbGrey900};
                            --bg-overlay: ${rgba(COLOR_GREY_900, 0.9)};
                            --color: ${rgbWhite};
                            --color-secondary: ${rgbGrey500};
                            --color-disabled: ${rgbGrey600};
                            --shadow: rgba(0, 0, 0, 0.16);
                        }
                    }
                `}</style>
                <SwitchNetworkModal />
                <Navigation />
                <Component {...pageProps} />
            </Web3ReactProvider>
        </Provider>
    )
}

function Setup() {
    useFetchPoolsPropertiesOnce()
    useConnectEagerly()
    return null
}
