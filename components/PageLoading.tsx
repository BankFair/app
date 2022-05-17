import { ReactNode } from 'react'
import { Oval } from 'react-loading-icons'
import { rgbGreen } from '../app'

export function PageLoading({ children }: { children?: ReactNode }) {
    return (
        <div className="container">
            <style jsx>{`
                .container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                :global(#__next) {
                    height: 100vh;
                }
            `}</style>

            <Oval speed={0.7} stroke={rgbGreen} width={64} height={64} />

            {children}
        </div>
    )
}
