#!/usr/bin/env node

// Config Section - TODO make command line args
const INCREMENT_POS = "patch";
const INCREMENT_BY = 1;
const PACKAGE_FILES = [
  "package.json",
  "src/package.json",
  "lib/client/package.json",
  "lib/server/package.json"
];

const fs = require("fs");

const INCREMENT_INDEXES = {
  major: 0,
  minor: 1,
  patch: 2,
};

const DEPENDENCY_SECTIONS = ["dependencies", "peerDependencies"];

const getNewVersion = oldVersion => {
  const versionParts = oldVersion.split(".");
  const incrementIndex = INCREMENT_INDEXES[INCREMENT_POS.toLowerCase()];

  return versionParts.reduce((prev, next, index) => {
    if (index == incrementIndex) {
      return `${prev}.${Number(next) + INCREMENT_BY}`;
    } else if (index > incrementIndex) {
      return `${prev}.0`;
    } else {
      return `${prev}.${next}`;
    }
  });
};

const packageJsons = PACKAGE_FILES.map(f => JSON.parse(fs.readFileSync(f)));
const packageNames = packageJsons.map(p => p.name);
const newVersion = getNewVersion(packageJsons[0].version);

packageJsons.forEach((packageData, index) => {
  packageData.version = newVersion;

  DEPENDENCY_SECTIONS.forEach(d => {
    if (!packageData[d]) {
      return;
    }

    packageNames.forEach(n => {
      if (packageData[d][n]) {
        packageData[d][n] = newVersion;
      }
    });
  });

  const writeJson = `${JSON.stringify(packageData, null, 2)}\n`;
  fs.writeFileSync(PACKAGE_FILES[index], writeJson);
});
