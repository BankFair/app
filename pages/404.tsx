import router from 'next/router'
import { Component } from 'react'

let isMounted = false

export default class NotFound extends Component {
    state = {
        showPageNotFound: false,
    }

    componentDidMount() {
        if (isMounted) return
        isMounted = true

        const { asPath } = router

        const paths = ['/borrow/', '/earn/', '/manage/', '/stake/']
        for (const path of paths) {
            if (asPath.startsWith(path)) {
                router.replace(asPath)
                return
            }
        }

        setTimeout(() => {
            this.setState({ showPageNotFound: true })
        })
    }

    render() {
        if (this.state.showPageNotFound) {
            return <h3 style={{ textAlign: 'center' }}>Page not found</h3>
        }
        return null
    }
}
