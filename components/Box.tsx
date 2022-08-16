import { ReactNode } from 'react'
import {
    commonBoxShadow,
    commonDarkBoxShadow,
    rgbaLimeGreen21,
    rgbGreen,
} from '../app'
import { Oval } from 'react-loading-icons'

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
                    background-color: var(--bg-section);
                    backdrop-filter: blur(16px);
                    box-shadow: ${commonBoxShadow};
                    margin: 16px auto;
                    padding: 24px;
                    position: relative;

                    @media (prefers-color-scheme: dark) {
                        box-shadow: ${commonDarkBoxShadow};
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
