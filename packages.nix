{ pkgs }: 
let
    node = pkgs.nodejs-16_x;
in
{
    node = node;
    yarn = (pkgs.yarn.override { nodejs = node; });
}
