#!/usr/bin/env bash
#
# This is a wrapper to call the run function of the start-stat script
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

# set script dir to the current
export SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# load the start-stat script
source "$SCRIPT_DIR"/start-stat.sh

# call the main function called "run"
run
