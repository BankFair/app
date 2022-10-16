import Link from 'next/link'
import { RiArrowLeftLine } from 'react-icons/ri'
import { rgbStone } from '../app'

export function BackToPools({ href }: { href: '/' | '/borrow' | '/manage' | '/stake' }) {
    return (
        <Link href={href}>
            <a>
                <style jsx>{`
                    a {
                        display: flex;
                        align-items: center;
                        color: ${rgbStone};
                        font-size: 14px;
                        height: 40px;
                        line-height: 40px;
                        font-weight: 600;

                        > :global(svg) {
                            margin: 0 6px;
                            font-size: 24px;
                        }
                    }
                `}</style>
                <RiArrowLeftLine />
                <span>Back to pools</span>
            </a>
        </Link>
    )
}
