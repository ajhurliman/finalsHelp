#!/usr/bin/env bash
#
# Calculates Network information for system.
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/common.sh"

PROC_NETSTATS="/proc/net/dev"
NET_SYS_DIR="/sys/class/net"

# Executes the command to gather inputs to the parser for linux 2.6.0 and output the result in stdout
#
# Usage: gather_linux_ge_2_6_0
# Parameter: None
# Stdin: None
# Stdout: Result of executing the network metrics command
# Stderr: None
# Return: None
gather_linux_ge_2_6_0() {
    if [ -f "${PROC_NETSTATS}" ]; then
        cat "${PROC_NETSTATS}" | tr ':' ' '
    else
        log_error "${PROC_NETSTATS} is not found."
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

    # if we do not have previous data, then fail fast. Do not process the metrics and properties.
    if [ "x${prev}" == "x" ]; then
        return 0;
    fi

    capture_stdin
    local curr="$UTILS_CAPTURED_STDIN"

    # if awk is the GNU version, it doesn't handle hex out of the box. It needs an extra flag.
    # (mawk doesn't recognize --version, but works fine for us, so ignore stderr.)
    local extraOpt=$([[ $(awk --version 2> /dev/null) = GNU* ]] && echo --non-decimal-data)
    local combined="${prev}"$'\n'"${curr}"
    echo "${combined}" | awk ${extraOpt} -v interval="${interval}" \
        -v netSysDir=${NET_SYS_DIR} \
        -f "${SCRIPT_DIR}/utils.awk" \
        -f "${SCRIPT_DIR}/DataSource/net.awk"
}
