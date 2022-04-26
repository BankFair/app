{
    pkgs ? import <nixpkgs> { },
    packages ? import ./packages.nix { pkgs = pkgs; },
}: with pkgs;
let

in
mkShell {
    buildInputs = builtins.attrValues packages;

    shellHook = ''
        ./download-yarn.sh
        yarn install
    '';
}
