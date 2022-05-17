import { ReactNode } from 'react'

export function Page({ children }: { children: ReactNode }) {
    return (
        <div className="page">
            <style jsx>{`
                .page {
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
            `}</style>
            {children}
        </div>
    )
}
