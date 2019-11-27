cd %1
mklink /d    node_modules      ..\node_modules
mklink    /h package.json      ..\package.json
mklink    /h package-lock.json ..\package-lock.json
mklink    /h rollup.config.js  ..\rollup.config.js
cd ..