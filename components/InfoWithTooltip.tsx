import 'react-popper-tooltip/dist/styles.css'

import { usePopperTooltip } from 'react-popper-tooltip'
import { RiInformationLine } from 'react-icons/ri'
import { createPortal } from 'react-dom'

export function InfoWithTooltip({
    size,
    text,
}: {
    size: number
    text: string
}) {
    const {
        getArrowProps,
        getTooltipProps,
        setTooltipRef,
        setTriggerRef,
        visible,
    } = usePopperTooltip(undefined, {
        placement: 'top',
    })

    // Do not add style jsx elements here
    return (
        <>
            <span ref={setTriggerRef}>
                <RiInformationLine size={size} className="top-align" />
            </span>

            {visible &&
                createPortal(
                    <div
                        ref={setTooltipRef}
                        {...getTooltipProps({ className: 'tooltip-container' })}
                    >
                        {text}

                        <div
                            {...getArrowProps({ className: 'tooltip-arrow' })}
                        />
                    </div>,
                    document.body,
                )}
        </>
    )
}
