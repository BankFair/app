import type { NextPage } from 'next'
import Head from 'next/head'
import { APP_NAME, prefix } from '../app'

const About: NextPage = () => {
    return (
        <div className="page">
            <Head>
                <title>About - {APP_NAME}</title>
                <meta name="description" content={`About ${APP_NAME}`} />
                <link rel="icon" href={`${prefix}/favicon.svg`} />
            </Head>
        </div>
    )
}

export default About
