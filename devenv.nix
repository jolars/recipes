{
  pkgs,
  ...
}:

{
  # https://devenv.sh/basics/
  env.GREET = "devenv";

  # https://devenv.sh/packages/
  packages = [
    pkgs.git
    pkgs.bashInteractive
    pkgs.pkg-config
    pkgs.vips
    pkgs.libwebp
    pkgs.rubyPackages.ruby-vips
    pkgs.pngquant
    pkgs.imagemagick
    (pkgs.python3.withPackages (ps: [
      ps.requests
      ps.openai
    ]))
  ];

  # https://devenv.sh/languages/
  languages = {
    ruby = {
      enable = true;
      package = pkgs.ruby;
    };
  };

  # https://devenv.sh/scripts/
  scripts.new-recipe.exec = ''
    ${pkgs.bash}/bin/bash ${./scripts/new-recipe.sh}
  '';

  # https://devenv.sh/git-hooks/
  # git-hooks.hooks.shellcheck.enable = true;

  # See full reference at https://devenv.sh/reference/options/
}
