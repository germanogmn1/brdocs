#!/bin/bash

shopt -s extglob

cd $(dirname $0)

rm brdocs.zip

zip -r brdocs.zip !(pack.sh|extra|README.md|*.zip)
