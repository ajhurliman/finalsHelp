#!/usr/bin/env bash
#
# Generates heartbeat for determining machine availability
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/common.sh"

# Gathers the metrics from the data sources, selecting which version to execute.
#
# Usage: gather
# Parameters: None
# Stdin: None
# Stdout: Result
# Stderr: None
# Return: None
gather() {
    local one_million="1000000"
    echo "$one_million"
}

# Parses the output from gather() and outputs metrics.
#
# Usage: parse  <prev> <interval>
# Parameters:
#     prev - Previous result from gather. This can be empty if the gather results do not need to be averaged with the
#            results of the next gather
#     interval - Number of seconds since previous gather
# Stdin: Data to parse from executing gather command
# Stdout: Result
# Stderr: None
# Return: None
parse() {
    local awk_script='{ value = $1; print_metric("Hardware Resources|Machine|Availability", value) }'
    head -1 | awk -f <(cat "$SCRIPT_DIR/utils.awk") -f <(echo "$awk_script")
}
