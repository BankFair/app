import { ReactNode } from 'react'
import { rgbGreen, shadow } from '../app'
import Oval from 'react-loading-icons/dist/components/oval'

export function Box({
    children,
    className,
    loading,
    overlay,
    s,
}: {
    children: ReactNode
    className?: string
    loading?: boolean
    overlay?: string | ReactNode | false | ''
    s?: boolean
}) {
    return (
        <div className={`box ${s ? 's' : ''} ${className || ''}`}>
            <style jsx>{`
                .box {
                    border-radius: 16px;
                    background-color: white;
                    box-shadow: ${shadow} 0 16px 32px -4px;
                    margin: 40px auto;
                    padding: 26px 30px;
                    position: relative;

                    &.s {
                        max-width: 400px;
                    }
                }

                .loading-container {
                    background-color: inherit;
                }
                .overlay-container {
                    background-color: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(5px);
                }
                .loading-container,
                .overlay-container {
                    border-radius: inherit;
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: inherit;
                }
            `}</style>

            {children}

            {loading ? (
                <div className="loading-container">
                    <Oval speed={0.7} stroke={rgbGreen} />
                </div>
            ) : overlay ? (
                <div className="overlay-container">{overlay}</div>
            ) : null}
        </div>
    )
}
