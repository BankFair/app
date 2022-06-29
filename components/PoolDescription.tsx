import { useEffect, useState } from 'react'

let nextMountShowMoreState = false
export function PoolDescription({
    text,
    showMoreInNextMount,
}: {
    text: string
    showMoreInNextMount?: boolean
}) {
    const [showMore, setShowMore] = useState(nextMountShowMoreState)

    useEffect(() => {
        nextMountShowMoreState = false
    }, [])

    return (
        <div>
            <style jsx>{`
                .text {
                    font-size: 16px;
                    font-weight: 400;
                    line-height: 23.04px;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    text-overflow: ellipsis;

                    &.more {
                        -webkit-line-clamp: initial;
                    }
                }

                span {
                    margin-top: 8px;
                    color: var(--greenery);
                    font-weight: 600;
                    font-size: 16px;
                    line-height: 19px;
                    display: inline-block;
                    cursor: pointer;
                }
            `}</style>
            <div className={`text ${showMore ? 'more' : ''}`}>{text}</div>
            <span
                onClick={(event) => {
                    if (showMoreInNextMount) {
                        nextMountShowMoreState = true
                    } else {
                        event.stopPropagation()
                        event.preventDefault()
                        setShowMore(!showMore)
                    }
                }}
            >
                {showMoreInNextMount
                    ? 'Go to pool to read more'
                    : showMore
                    ? 'Show less'
                    : 'Show more'}
            </span>
        </div>
    )
}
