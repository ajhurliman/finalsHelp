#!/usr/bin/env bash
#
# Retrieves the Kernel/OS information
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/common.sh"

# Executes the command to gather inputs to the parser for linux 2.6.0 and outputs the result in stdout
#
# Usage: gather_linux_ge_2_6_0
# Parameters: None
# Stdin: None
# Stdout: Result
# Stderr: None
# Return: None
gather_linux_ge_2_6_0() {
    type -P uname &> /dev/null
    if [ $? == 0 ]; then
        uname
        uname -r
        uname -v
    else
        log_error "uname was not found."
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
# Usage : parse_linux_ge_2_6_0_properties
# Parameter : None
# Stdin : Data to parse from executing gather command
# Stdout : Formatted data for property reporting
# Stderr: None
# Return: None
parse_linux_ge_2_6_0_properties() {
    local awk_script='
        BEGIN {
            prefix = "OS|Kernel|"
        }

        NR == 1 {
            print_property(prefix "Name", $0)
        }

        NR == 2 {
            print_property(prefix "Release", $0)
        }

        NR == 3 {
            print_property(prefix "Version", $0)
        }
    '
    awk -f <(cat "$SCRIPT_DIR/utils.awk") -f <(echo "$awk_script")
}
