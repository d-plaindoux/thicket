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
THICKET_COMPILE=0
THICKET_TEST=0
THICKET_PACKAGE=0
THICKET_INSTALL=0
THICKET_DEBUG=
THICKET_VERBOSE=

CURRENT=$1

# sub orders: compile test package install

# deploy is missing for the moment

while [[ $# > 0 ]]
do
    case $CURRENT in
        -d|--debug)
        THICKET_DEBUG=-d
        shift
        CURRENT=$1
        ;;
        -v|--verbose)
        THICKET_VERBOSE=-v
        shift
        CURRENT=$1
        ;;
        install)
        THICKET_INSTALL=1
        CURRENT=package
        ;;
        package)
        THICKET_PACKAGE=1
        CURRENT=test
        ;;
        test)
        if [ -f "package-test.pkt" ]; then
            THICKET_TEST=1
        else
            echo "[WARN] no test package available"
        fi
        CURRENT=compile
        ;;
        compile)
        THICKET_COMPILE=1
        shift
        CURRENT=$1
        ;;
        clean)
        THICKET_CLEAN=1
        shift
        CURRENT=$1
        ;;
        *)
        echo "[ERROR] unrecognized key $1"
        exit 1
        ;;
    esac
done

THICKET_OPT="$THICKET_DEBUG $THICKET_VERBOSE"

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

if [ $THICKET_COMPILE -ne 0 ]; then
    echo "[INFO] compiling sources"
    $THICKET compile `find src/main/thicket -name *.tkt` $THICKET_OPT -o obj -i $THICKET_SITE -p ./package.pkt

    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

#
# Compile and run tests
# 

if [ $THICKET_TEST -ne 0 ]; then
    echo "[INFO] compiling test sources"
    $THICKET compile -i $THICKET_SITE -i obj $THICKET_OPT -o obj -p ./package.pkt -p ./package-test.pkt `find src/test/thicket -name *.tkt`

    if [ $? -ne 0 ]; then
        exit 1
    fi

    #
    # Execute test
    #

    echo "[INFO] execute tests"
    $THICKET execute -i $THICKET_SITE -i src/main/js -i obj -i bin -p ./package.pkt -p ./package-test.pkt Test

    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

#
# Make package (generic)
# 

if [ $THICKET_PACKAGE -ne 0 ]; then
    echo "[INFO] building package"
    $THICKET package -i obj -i src/main/js -o bin -n -s $THICKET_OPT package.pkt

    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

#
# Install binaries
#

if [ $THICKET_INSTALL -ne 0 ]; then
    $THICKET install 
fi
