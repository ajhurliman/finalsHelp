#!/usr/bin/env bash
#
# Common routines for all the DataSource scripts. This script should be sourced by all the DataSource scripts.
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

source "$SCRIPT_DIR"/utils.sh

# Gathers the metrics from the data sources, selecting which version to execute.
#
# Usage: gather
# Parameters: None
# Stdin: None
# Stdout: Result
# Stderr: None
# Return: None
gather() {
    if (( $(is_linux) )); then
        gather_linux
    else
        log_error "Unsupported OS type: ${OS_TYPE}"
    fi
}

# Executes the command to gather inputs to the parser for linux and outputs the result in stdout
#
# Usage: gather_linux
# Parameters: None
# Stdin: None
# Stdout: Result
# Stderr: None
# Return: None
gather_linux() {
    if (( $(os_ge 2 6 0) )); then
        gather_linux_ge_2_6_0
    else
        log_error "Unsupported Linux Version: ${OS_VER_MAJOR}.${OS_VER_MINOR}.${OS_VER_PATCH}"
    fi
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
    if (( $(is_linux) )); then
        parse_linux "$@"
    else
        log_error "Unsupported OS type: ${OS_TYPE}"
    fi
}

# Parses the output from gather() and outputs metrics for linux
#
# Usage: parse_linux <prev> <interval>
# Parameters:
#     prev - Previous result from gather. This can be empty if the gather results do not need to be averaged with the
#            results of the next gather
#     interval - Number of seconds since previous gather
# Stdin: Data to parse from executing gather command
# Stdout: Result
# Stderr: None
# Return: None
parse_linux() {
    if (( $(os_ge 2 6 0) )); then
        parse_linux_ge_2_6_0 "$@"
    else
        log_error "Unsupported Linux Version: ${OS_VER_MAJOR}.${OS_VER_MINOR}.${OS_VER_PATCH}"
    fi
}
