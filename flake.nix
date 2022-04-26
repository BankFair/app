{
    inputs = {
        nixpkgs.url = github:NixOS/nixpkgs/nixos-21.11;
        flake-utils.url = github:numtide/flake-utils;
    };

    outputs = { self, nixpkgs, flake-utils }:
        flake-utils.lib.eachDefaultSystem (system:
            let
                pkgs = nixpkgs.legacyPackages.${system};
                packages = import ./packages.nix { pkgs = pkgs; };
            in
            {
                devShell = import ./shell.nix { inherit pkgs packages; };

                packages = packages;
            }
        );
}
