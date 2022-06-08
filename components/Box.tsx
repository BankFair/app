import { ReactNode } from 'react'
import { rgbaBlack5, rgbaLimeGreen21, rgbaWhite5, rgbGreen } from '../app'
import { Oval } from 'react-loading-icons'

const commonBoxShadow = '0px 28px 32px -16px rgba(66, 117, 48, 0.19)'

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
                    border-radius: 8px;
                    border: 1px solid ${rgbaLimeGreen21};
                    background-color: ${rgbaWhite5};
                    backdrop-filter: blur(16px);
                    box-shadow: ${commonBoxShadow};
                    margin: 24px auto;
                    padding: 24px;
                    position: relative;

                    @media (prefers-color-scheme: dark) {
                        box-shadow: 0px 28px 32px -16px #000000,
                            ${commonBoxShadow};
                        background-color: ${rgbaBlack5};
                    }

                    &.s {
                        max-width: 400px;
                    }
                }

                .loading-container {
                    background-color: inherit;
                }
                .overlay-container {
                    background-color: var(--bg-overlay);
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
                    text-align: center;
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
