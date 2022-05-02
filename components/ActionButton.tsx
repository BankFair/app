import { ComponentProps, useState } from 'react'
import { useDispatch } from 'react-redux'
import { AnyAction } from 'redux'
import { Button } from './Button'

export function ActionButton<T>({
    action,
    onSuccess,
    children,
    ...props
}: Omit<ComponentProps<Button>, 'onClick' | 'disabled'> & {
    action: () => Promise<T>
    onSuccess?: (response: T) => AnyAction | Promise<AnyAction>
}) {
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)
    return (
        <Button
            {...props}
            disabled={loading}
            children={loading ? 'Loading…' : children}
            onClick={() => {
                setLoading(true)
                if (onSuccess) {
                    action().then(async (response) => {
                        dispatch(await onSuccess(response))
                        setLoading(false)
                    })
                } else {
                    action()
                }
            }}
        />
    )
}
