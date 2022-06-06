/** @type {import('next').NextConfig} */

const buildingForGitHubPages = Boolean(process.env.BUILDING_FOR_GITHUB_PAGES)

module.exports = {
    env: {
        BUILDING_FOR_GITHUB_PAGES: process.env.BUILDING_FOR_GITHUB_PAGES,
        POOLS: JSON.stringify([
            {
                name: 'Test Pool #1',
                address: '0xB7C871b52d127b5c8354AC5E90Eb108DA673A040',
            },
            {
                name: 'Test Pool #2',
                address: '0x9dAa37385F0DA29c742b4a248740bd86a240E853',
            },
            {
                name: 'Test Pool #3 (v0.4.3)',
                address: '0x56A9833D46F103a147C2ab2a7C5a2511eC9caE4B',
            },
        ]),
    },
    basePath: buildingForGitHubPages ? '/app' : '',
    assetPrefix: buildingForGitHubPages ? '/app/' : '',
    reactStrictMode: true,
}
