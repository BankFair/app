import { useRef } from 'react'
import { FormEventHandler, ReactNode, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { GrClose } from 'react-icons/gr'
import { stopPropagation } from '../app'

export function Modal({
    children,
    onClose,
    element: Element = 'div',
    onSubmit,
    autoWidth,
}: {
    children: ReactNode
    onClose?(): void
    element?: 'div' | 'form'
    onSubmit?: FormEventHandler<HTMLDivElement | HTMLFormElement>
    autoWidth?: boolean
}) {
    const shouldCloseRef = useRef(false)
    const backgroundRef = useRef<HTMLDivElement>(null)
    const handleMouseUp = useCallback(
        (event: { target: EventTarget }) => {
            if (event.target !== backgroundRef.current) return
            if (onClose && shouldCloseRef.current) onClose()
            shouldCloseRef.current = false
        },
        [onClose],
    )
    const handleMouseDown = useCallback(
        () => (shouldCloseRef.current = true),
        [],
    )

    const node = (
        <div
            ref={backgroundRef}
            className="background"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            <style jsx>{`
                .background {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 8;
                    background-color: var(--bg-modal-overlay);
                }

                .content {
                    width: 90vw;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    background-color: var(--bg-color);
                    padding: 10px;
                    margin: 10px;
                    border-radius: 16px;
                    position: relative;

                    &.auto-width {
                        width: auto;
                    }
                }

                .close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    padding: 4px;

                    > :global(svg > path) {
                        stroke: var(--color);
                    }
                }
            `}</style>

            <Element
                className={autoWidth ? 'content auto-width' : 'content'}
                onMouseDown={stopPropagation}
                onSubmit={onSubmit}
            >
                {onClose && (
                    <div className="close">
                        <GrClose onClick={onClose} />
                    </div>
                )}
                {children}
            </Element>
        </div>
    )

    return createPortal(node, document.body)
}
