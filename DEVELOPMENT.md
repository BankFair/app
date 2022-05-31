# Development

## Setting up development environment

### Without Nix

```bash
yarn
```

### With Nix

If you have direnv installed and flakes enabled run the following:

```bash
direnv allow
```

If you don't have direnv installed run the following:

```bash
nix-shell
```

## Getting started

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

The contract addresses are hard-coded in the `next.config.js` file. Changing addresses requires the development server to be restarted.

## Libraries used by this project

-   Next.js
    -   [Next.js Documentation](https://nextjs.org/docs)
    -   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
-   React
-   Redux
-   Redux Toolkit
-   Web3 React
-   Ethers.js
-   React Icons

## Tools used by this project

-   TypeScript
-   Prettier
