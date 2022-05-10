/** @type {import('next').NextConfig} */

const buildingForGitHubPages = Boolean(process.env.BUILDING_FOR_GITHUB_PAGES)

module.exports = {
    env: {
        BUILDING_FOR_GITHUB_PAGES: process.env.BUILDING_FOR_GITHUB_PAGES,
        POOLS: JSON.stringify([
            {
                name: 'Test Pool #1',
                address: '0xC333C44652cA9eFDb37094a228749782FaFd48a2',
            },
            {
                name: 'Test Pool #2',
                address: '0x0b7D394151ae9b252BaFd0012FC4cBAeF379ad99',
            },
        ]),
    },
    basePath: buildingForGitHubPages ? '/app' : '',
    assetPrefix: buildingForGitHubPages ? '/app/' : '',
    reactStrictMode: true,
}
