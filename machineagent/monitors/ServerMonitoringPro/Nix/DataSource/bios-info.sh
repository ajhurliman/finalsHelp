#!/usr/bin/env bash
#
# Collects BIOS information
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/common.sh"
SYS_BIOSVERSION="/sys/devices/virtual/dmi/id/bios_version"

# Executes the command to gather inputs to the parser for linux 2.6.0 and outputs the result in stdout
#
# Usage: gather_linux_ge_2_6_0
# Parameters: None
# Stdin: None
# Stdout: Result
# Stderr: None
# Return: None
gather_linux_ge_2_6_0() {
    if [ -f "${SYS_BIOSVERSION}" ]; then
        cat "${SYS_BIOSVERSION}"
    else
        log_error "${SYS_BIOSVERSION} is not found."
    fi
}

# Parses the output from gather() and outputs metrics and properties for linux 2.6.0
#
# Usage: parse_linux_ge_2_6_0
# Parameters: None
# Stdin: Data to parse from executing gather command
# Stdout: Formatted data for reporting Metric
# Stderr: None
# Return: None
parse_linux_ge_2_6_0() {
    parse_linux_ge_2_6_0_properties
}

# Parses the output from gather() and outputs properties for linux 2.6.0
#
# Usage: parse_linux_ge_2_6_0_properties
# Parameters: None
# Stdin: Data to parse from gather
# Stdout: Formatted data for property reporting
# Stderr: None
# Return: None
parse_linux_ge_2_6_0_properties() {
    local awk_script='{ version = $1; print_property("Bios|Version", version) }'
    awk -f <(cat "$SCRIPT_DIR/utils.awk") -f <(echo "$awk_script")
}
