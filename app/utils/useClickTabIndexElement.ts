import { useEffect } from 'react'

export function useClickTabIndexElement() {
    useEffect(() => {
        if (typeof window !== 'object') return

        function handleEnterAndSpace(event: KeyboardEvent) {
            if (event.key !== 'Enter' && event.key !== ' ') return
            const activeElement = document.activeElement as
                | HTMLElement
                | undefined
            if (!activeElement) return
            if (typeof activeElement.tabIndex === 'undefined') return

            activeElement.click()
        }

        const eventName = 'keypress' as const
        document.addEventListener(eventName, handleEnterAndSpace)

        return () => {
            document.removeEventListener(eventName, handleEnterAndSpace)
        }
    })
}
