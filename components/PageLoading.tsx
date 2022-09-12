import { ReactNode } from 'react'
import { Oval } from 'react-loading-icons'
import { rgbGreen, SIDEBAR_ALWAYS_VISIBLE_WIDTH } from '../app'
import { NAV_HEIGHT, SIDEBAR_MAX_WIDTH } from './navigation/constants'

export function PageLoading({ children }: { children?: ReactNode }) {
    return (
        <div className="container">
            <style jsx>{`
                .container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding-top: ${NAV_HEIGHT}px;

                    @media screen and (min-width: ${SIDEBAR_ALWAYS_VISIBLE_WIDTH}px) {
                        padding-left: ${SIDEBAR_MAX_WIDTH}px;
                    }
                }
            `}</style>

            <Oval speed={0.7} stroke={rgbGreen} width={64} height={64} />

            {children}
        </div>
    )
}
