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
# Execute the command (Do not manage the version rigth now)
#

cp ./bin/* $THICKET_SITE/.
