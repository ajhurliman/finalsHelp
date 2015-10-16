#!/usr/bin/env bash
#
# Gets memory information for the system.
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/common.sh"

PROC_MEMINFO="/proc/meminfo"

# Executes the command to gather inputs to the parser for linux 2.6.0 and outputs the result in stdout
#
# Usage: gather_linux_ge_2_6_0
# Parameters: None
# Stdin: None
# Stdout: Result of executing the meminfo command
# Stderr: None
# Return: None
gather_linux_ge_2_6_0() {
    if [ -f "${PROC_MEMINFO}" ]; then
        cat "${PROC_MEMINFO}"
    else
        log_error "${PROC_MEMINFO} is not found."
    fi
}

# Parses the output from gather() and outputs metrics for linux 2.6.0
#
# Usage: parse_linux_ge_2_6_0
# Parameters: None
# Stdin: Data to parse from executing gather command
# Stdout: Formatted data for reporting Metric
# Stderr: None
# Return: None
parse_linux_ge_2_6_0() {
    local awk_script='
        # Convert kilobytes to megabytes
        function kb2mb(mb) {
            return (mb / 1024)
        }

        /^MemTotal/ {
            mem_total_mb = kb2mb($2)
        }

        /^MemFree/ {
            mem_free_mb = kb2mb($2)
        }

        /^Cached/ {
            mem_cache_mb = kb2mb($2)
        }

        /^SwapTotal/ {
            swap_total_mb = kb2mb($2)
        }

        /^SwapFree/ {
            swap_free_mb = kb2mb($2)
        }

        END {
            mem_used_mb = mem_total_mb - mem_free_mb;
            swap_used_mb = swap_total_mb - swap_free_mb;

            metric_prefix = "Hardware Resources|Memory|"

            # TODO SIM-321 Move all metrics from Sigar to scripts
            #print_metric(metric_prefix "Total (MB)", mem_total_mb)
            #print_metric(metric_prefix "Used (MB)", mem_used_mb)
            #print_metric(metric_prefix "Free (MB)", mem_free_mb)
            #print_metric(metric_prefix "Used %", (mem_used_mb / mem_total_mb) * 100)
            #print_metric(metric_prefix "Free %", 100 - (mem_used_mb / mem_total_mb) * 100)

            print_metric(metric_prefix "Swap Total (MB)", swap_total_mb)
            print_metric(metric_prefix "Swap Used (MB)", swap_used_mb)
            print_metric(metric_prefix "Swap Free (MB)", swap_free_mb)

            print_property("Memory|Physical|Type", "Physical")
            print_property("Memory|Physical|Size (MB)", round(mem_total_mb))
            print_property("Memory|Swap|Type", "Swap")
            print_property("Memory|Swap|Size (MB)", round(swap_total_mb))
        }
    '
    awk -f <(cat "$SCRIPT_DIR/utils.awk") -f <(echo "$awk_script")
}
