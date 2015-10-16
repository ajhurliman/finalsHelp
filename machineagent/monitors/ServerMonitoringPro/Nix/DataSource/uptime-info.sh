#!/usr/bin/env bash
#
# Calculates System Uptime and Idle time
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/common.sh"

PROC_UPTIME="/proc/uptime"

# Executes the command to gather inputs to the parser for linux and outputs the result in stdout
#
# Usage: gather_linux_ge_2_6_0
# Parameter: None
# Stdin: None
# Stdout: Result
# Stderr: None
# Return: None
gather_linux_ge_2_6_0() {
    if [ -f "${PROC_UPTIME}" ]; then
        cat "${PROC_UPTIME}"
    else
        log_error "${PROC_UPTIME} is not found."
    fi
}

# Parses the output from gather() and outputs metrics and properties for linux 2.6.0
#
# Usage: parse_linux_ge_2_6_0
# Parameter: None
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
    capture_stdin
    local input="$UTILS_CAPTURED_STDIN"

    preparse_data=($(echo -n "$input" | awk -v date=$(get_date +%s) '
    {
        uptime = $1
        # trim the milliseconds
        uptime_length = length(uptime)
        # trim the last 3 character, including period sign substring exclusive of the length limit
        uptime = substr(uptime, 0, uptime_length - 2)

        boot_time = date - uptime;
        print boot_time;
    }'))
    local boot_time=${preparse_data[0]}
    local boot_time_for_date="@${boot_time}"
    # Convert the seconds to the machine date time
    local boot_date=$( date -d $boot_time_for_date )
    local awk_script='{ print_property("Last|Boot", $0) }'
    echo "$boot_date" | awk -f <(cat "$SCRIPT_DIR/utils.awk") -f <(echo "$awk_script")
}
