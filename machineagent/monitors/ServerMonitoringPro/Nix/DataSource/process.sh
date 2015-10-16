#!/usr/bin/env bash
#
# Lists processes and calculates its resource usage for system.
#
# For all Unixes, parses output from "ps" command to get the process information.
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/common.sh"

PROC_CPUINFO="/proc/cpuinfo"

PS="ps -eww -o pid -o %mem -o comm -o cputime -o egroup -o etime -o euser -o nice -o maj_flt -o min_flt -o nlwp \
-o pgid -o ppid -o rss -o stat -o ruser -o rgroup -o args"

# Executes the command to gather inputs to the parser for linux 2.6.0 and output the result in stdout
#
# Usage: gather_linux_ge_2_6_0
# Parameter: None
# Stdin: None
# Stdout: Result of executing the command
# Stderr: None
# Return: None
gather_linux_ge_2_6_0() {
    local data=$(${PS})
    if [ $? -ne 0 ]; then
        log_error "Failed to execute '${PS}'."
    elif [ ! -f "${PROC_CPUINFO}" ]; then
        log_error "${PROC_CPUINFO} is not found."
    else
        echo "${data}"
    fi
}

# Parses the output from gather() and outputs metrics for linux 2.6.0
#
# Usage: parse_linux_ge_2_6_0 <prev> [<interval>]
# Parameters:
#     prev - Previous result from gather. This can be empty if the gather results do not need to be averaged with the
#            results of the next gather
#     interval - Number of seconds since previous gather. This is optional, and defaults to $SAMPLE if not specified.
# Stdin: None
# Stdout: Result
# Stderr: None
# Return: None
parse_linux_ge_2_6_0() {
    local prev="$1"
    local interval="${2-$SAMPLE}"

    # fail fast when there is no previous data
    if [ "x${prev}" == "x" ]; then
        return 0;
    fi

    capture_stdin
    local current="$UTILS_CAPTURED_STDIN"
    local previousTotalLines=$(echo "${prev}" | wc -l)
    local currHeader=$((previousTotalLines + 1))
    local combined="${prev}"$'\n'"${current}"
    local cpuCount="$(get_cpu_count)"

    # Process the metric data
    echo "${combined}" | awk -v interval="${interval}" \
        -v currHeader="${currHeader}" \
        -v regex="${APPD_MACHINEAGENT_PROCESS_SELECTOR_REGEX}" \
        -v pClassRegex="${APPD_MACHINEAGENT_PROCESS_CLASS_REGEX}" \
        -v minRunTime="${APPD_MACHINEAGENT_PROCESS_MIN_LIVE_TIME_IN_SECONDS}" \
        -v maxProcess="${APPD_MACHINEAGENT_PROCESS_MAX_NUM_MONITORED}" \
        -v cpuCount="$cpuCount" \
        -f "${SCRIPT_DIR}/utils.awk" \
        -f "${SCRIPT_DIR}/DataSource/process.awk"
}

# Get the number of CPUs. This is used to normalize CPU usage info.
#
# Usage: get_cpu_count
# Stdin: None
# Stdout: cpu count
# Stderr: None
# Return: None
get_cpu_count() {
   grep -c "^processor" ${PROC_CPUINFO}
}