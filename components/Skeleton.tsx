export function Skeleton({
    width,
    height,
}: {
    width?: number
    height?: number
}) {
    return (
        <div className="skeleton" style={{ width, height }}>
            <style jsx>{`
                @keyframes pulse {
                    0% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.4;
                    }
                    100% {
                        opacity: 1;
                    }
                }

                .skeleton {
                    animation: pulse 1.5s ease-in-out 0.5s infinite;
                    background-color: var(--disabled-24);
                    border-radius: 4px;
                    user-select: none;
                    display: inline-block;

                    > .text {
                        visibility: hidden;
                    }
                }
            `}</style>
            <div className="text">0</div>
        </div>
    )
}
