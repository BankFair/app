import { ComponentProps, ReactNode, useState } from 'react'
import { Button } from './Button'

export function ActionButton<T>({
    action,
    children,
    ...props
}: Omit<ComponentProps<Button>, 'onClick' | 'disabled'> & {
    action: () => Promise<T>
    children: ReactNode
}) {
    const [loading, setLoading] = useState(false)
    return (
        <Button
            {...props}
            disabled={loading}
            loading={loading}
            onClick={() => {
                setLoading(true)
                action().then(doneLoading).catch(doneLoading)

                function doneLoading() {
                    setLoading(false)
                }
            }}
        >
            {children}
        </Button>
    )
}
