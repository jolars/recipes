{
  pkgs,
  ...
}:

{
  packages = [
    pkgs.git
    pkgs.bashInteractive
    pkgs.pkg-config
    pkgs.vips
    pkgs.libwebp
    pkgs.rubyPackages.ruby-vips
    pkgs.pngquant
    pkgs.go-task
    pkgs.imagemagick
    (pkgs.python3.withPackages (ps: [
      ps.requests
      ps.openai
    ]))
  ];

  languages = {
    ruby = {
      enable = true;
      package = pkgs.ruby;
    };
  };

  scripts.new-recipe.exec = ''
    ${pkgs.bash}/bin/bash ${./scripts/new-recipe.sh}
  '';

  processes = {
    serve = {
      exec = "bundle exec jekyll serve";
    };
  };

  tasks = {
    "recept:serve" = {
      exec = "bundle exec jekyll serve";
    };
  };
}
