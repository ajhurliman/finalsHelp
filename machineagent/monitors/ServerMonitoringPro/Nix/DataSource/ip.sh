#!/usr/bin/env bash
#
# Reads interface IP addresses.
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/common.sh"

IP_CMD="ip"
IP_ADDR_CMD="${IP_CMD} -o addr show"

# Executes the command to gather inputs to the parser for linux and outputs the result in stdout
#
# Usage: gather_linux
# Parameters: None
# Stdin: None
# Stdout: Result
# Stderr: None
# Return: None
gather_linux() {
    local data="$(${IP_ADDR_CMD})"
    if [ $? -ne 0 ]; then
        log_error "Failed to execute '${IP_ADDR_CMD}'."
    else
        echo "${data}"
    fi
}

# Parses the output from gather() and outputs metrics for linux
#
# Usage: parse_linux
# Parameters: None
# Stdin: Data to parse from executing gather command
# Stdout: Formatted data
# Stderr: None
# Return: None
parse_linux() {
    local awk_script='
        BEGIN {
            prefix = "Network Interface|"
        }

        # Match any line that has "inet" or "inet6", and the scope is "global" or "site" i.e. non-loopback and non-link.
        /inet.*scope (site|global)/ {
            dev = $2
            type = $3
            addr = $4

            if (!seen[dev]) {
                print_property(prefix dev "|Name",  dev)
                seen[dev] = 1
            }

            if (type == "inet") {
                print_property(prefix dev "|IPv4 Address",  addr)
            } else if (type == "inet6") {
                print_property(prefix dev "|IPv6 Address",  addr)
            }
        }
    '

    # We want our field separator to be space and any "/" value to remove subnet from addresses (e.g. 1.2.3.4/24).
    awk -F '[ /]*' -f <(cat "$SCRIPT_DIR/utils.awk") -f <(echo "$awk_script")
}
