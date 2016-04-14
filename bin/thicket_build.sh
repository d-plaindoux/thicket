#!/bin/sh

#
# Thicket
# https://github.com/d-plaindoux/thicket
#
# Copyright (c) 2015-2016 Didier Plaindoux
# Licensed under the LGPL2 license.
#

 
#
# Set the Thicket home
# 

RELATIVE=`dirname "$0"`/..
THICKET_HOME="`cd \"$RELATIVE\" 2>/dev/null && pwd || echo \"$RELATIVE\"`"

#
# Set the Thicket site
# 

THICKET_SITE=$HOME/.thicket/site

#
# Set the Thicket binary
# 

THICKET=$THICKET_HOME/bin/thicket

#
# Standardized directories
#

SOURCE=src/main/thicket
NATIVE=src/main/js

#
# Parse arguments
#

THICKET_CLEAN=0
THICKET_TEST=0

while [[ $# > 0 ]]
do

case $1 in
    -c|--clean)
    THICKET_CLEAN=1
    ;;
    -t|--test)
    if [ -f "package-test.pkt" ]; then
        THICKET_TEST=1
    else
        "[WARN] no test package available"
    fi
    ;;
    *)
    echo "[ERROR] unrecognized key $1"
    exit 1
    ;;
esac

shift # past argument or value

done

#
# Clean binaries
#

if [ $THICKET_CLEAN -ne 0 ]; then
    echo "[INFO] cleaning binaries"
    rm bin/*
    rm obj/*
fi

# 
# Compile main (generic)
#

echo "[INFO] compiling sources"
$THICKET compile `find src/main/thicket -name *.tkt` -d -v -o obj -i $THICKET_SITE -p ./package.pkt

if [ $? -ne 0 ]; then
    exit 1
fi

#
# Make package (generic)
# 

echo "[INFO] building package"
$THICKET package -i obj -i src/main/js -o bin -n -s -v package.pkt

if [ $? -ne 0 ]; then
    exit 1
fi

if [ $THICKET_TEST -ne 0 ]; then
    #
    # Compile test 
    # 

    echo "[INFO] compiling test sources"
    $THICKET compile -i $THICKET_SITE -i bin -p ./package.pkt -p ./package-test.pkt `find src/test/thicket -name *.tkt` -d -o obj

    if [ $? -ne 0 ]; then
        exit 1
    fi

    #
    # Execute test
    #

    echo "[INFO] execute tests"
    $THICKET execute -i $THICKET_SITE -i obj -i bin -p ./package.pkt -p ./package-test.pkt Test

    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

#
# Install binaries (temporary solution indeed)
#

$THICKET install 
