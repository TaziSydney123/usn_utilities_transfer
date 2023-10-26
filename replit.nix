{ pkgs }: {
  deps = [
        pkgs.busybox
        pkgs.less
        pkgs.nodejs-18_x
        pkgs.nodePackages.typescript-language-server
        pkgs.nodePackages.yarn
        pkgs.replitPackages.jest
  ];
}

# { pkgs }: {
#     deps = [
#         pkgs.bashInteractive
#         pkgs.man
#     ];
# }