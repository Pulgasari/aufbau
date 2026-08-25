#!/bin/sh
# browser tests. needs a static server where /aufbau, /bunker and /domina resolve,
# see test/readme.md. override with ORIGIN= and CHROMIUM=.
set -e
cd "$(dirname "$0")/.."

node test/flicker.test.mjs
node test/persist.test.mjs
node test/splash.test.mjs
