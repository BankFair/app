import { ReactNode } from 'react'

export function Page({ children, xl }: { children: ReactNode; xl?: boolean }) {
    return (
        <div className={`page ${xl ? 'xl' : ''}`}>
            <style jsx>{`
                .page {
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;

                    &.xl {
                        max-width: 1200px;
                    }
                }
            `}</style>
            {children}
        </div>
    )
}
