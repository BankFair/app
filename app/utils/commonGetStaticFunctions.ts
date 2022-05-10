import { GetStaticPaths, GetStaticProps } from 'next'
import { POOLS } from '../constants'
import { getAddress } from './getAddress'

export const getStaticPaths: GetStaticPaths = () => {
    return {
        paths: POOLS.map(({ address }) => ({ params: { address } })),
        fallback: false,
    }
}
export const getStaticProps: GetStaticProps = (context) => {
    return Promise.resolve({
        props: {
            address: getAddress(context.params!.address as string),
        },
    })
}
