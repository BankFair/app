import { useEffect } from 'react'

export function useInterval(
    effect: (() => void) | undefined,
    interval: number,
) {
    useEffect(() => {
        if (!effect) return

        effect()

        const intervalId = setInterval(effect, interval)

        return () => {
            clearInterval(intervalId)
        }
    }, [effect, interval])
}
