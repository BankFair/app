import { ReactNode } from 'react'

export function Page({ children }: { children: ReactNode }) {
    return (
        <div className="page">
            <style jsx>{`
                .page {
                    width: 100%;
                    margin: 20px 0;
                }
            `}</style>
            {children}
        </div>
    )
}
