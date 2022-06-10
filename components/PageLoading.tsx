import { ReactNode, useLayoutEffect } from 'react'
import { Oval } from 'react-loading-icons'
import { rgbGreen } from '../app'

export function PageLoading({ children }: { children?: ReactNode }) {
    useLayoutEffect(() => {
        const rootElement = document.getElementById('__next')

        rootElement!.style.height = '100vh'
        rootElement!.style.marginBottom = '0'

        return () => {
            rootElement!.style.removeProperty('height')
            rootElement!.style.removeProperty('margin-bottom')
        }
    }, [])
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
            `}</style>

            <Oval speed={0.7} stroke={rgbGreen} width={64} height={64} />

            {children}
        </div>
    )
}
