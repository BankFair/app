import { className, rgbGreen, rgbGreenLighter } from '../app'

export function Progress({
    percent,
    backgroundColor,
    ...classModifiers
}: {
    percent: number
    backgroundColor?: string
    l?: boolean
    xl?: boolean
}) {
    return (
        <div
            className={`bar ${className(classModifiers)}`}
            style={backgroundColor ? { backgroundColor } : undefined}
        >
            <style jsx>{`
                .bar {
                    background-color: ${rgbGreenLighter};
                    height: 4px;
                    border-radius: 2px;

                    &.l {
                        height: 6px;
                        border-radius: 3px;
                    }

                    &.xl {
                        height: 8px;
                        border-radius: 4px;
                    }

                    > .progress {
                        background-color: ${rgbGreen};
                        height: 100%;
                        border-radius: inherit;
                    }
                }
            `}</style>
            <div className="progress" style={{ width: `${percent}%` }} />
        </div>
    )
}
