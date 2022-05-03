import { ReactNode } from 'react'
import { GrClose } from 'react-icons/gr'
import { stopPropagation } from '../app'

export function Modal({
    children,
    onClose,
}: {
    children: ReactNode
    onClose?(): void
}) {
    return (
        <div className="background" onClick={onClose}>
            <style jsx>{`
                .background {
                    background-color: rgba(1, 1, 1, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 10;
                }

                .content {
                    max-width: 400px;
                    background-color: white;
                    padding: 10px;
                    margin: 10px;
                    border-radius: 10px;
                }

                .close {
                    text-align: right;
                }
            `}</style>

            <div className="content" onClick={stopPropagation}>
                {onClose && (
                    <div className="close">
                        <GrClose onClick={onClose} />
                    </div>
                )}
                {children}
            </div>
        </div>
    )
}
