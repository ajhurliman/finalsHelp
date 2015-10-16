#!/usr/bin/env bash
#
# Calculates Disk Space for system.
#
# For all Unixes, parses output from "df" command to calculate space.
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/common.sh"

DEV_DIR='/dev'

# Executes the command to gather inputs to the parser for linux 2.6.0
# and output the result in stdout
# Usage: gather_linux_ge_2_6_0
# Parameter: None
# Stdin: None
# Stdout: Result of executing the meminfo command
# Stderr: None
# Return: None
gather_linux_ge_2_6_0() {
    df -P -m
}

# Parses the output from gather() and outputs metrics for linux 2.6.0
#
# Usage: parse_linux_ge_2_6_0
# Parameter: None
# Stdin: Data to parse from executing gather command
# Stdout: Formatted data for reporting Metric
# Stderr: None
# Return: None
parse_linux_ge_2_6_0 () {
    capture_stdin
    local input="$UTILS_CAPTURED_STDIN"

    echo -n "${input}" | awk -v devDir="$DEV_DIR" -f "${SCRIPT_DIR}/utils.awk" \
    -f "${SCRIPT_DIR}/DataSource/disk-space.awk"
}

