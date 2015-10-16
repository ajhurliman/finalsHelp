#!/usr/bin/env bash
#
# The starting point of Metric Gathering script
#
# Copyright (c) AppDynamics Inc.
#
# Repeat Infinitely:
# 1. Get Starting Timestamp
# 2. Opens a DataSource directory in the same location to this script
# 3. For each .sh file within that directory, calls the gather and the parse functions
# 4. Repeat again 60 seconds from the Starting Timestamp
#
# To add new command for metrics gather:
# 1. Implement the command in a .sh file and save it in the DataSource folder
# 2. Implements gather and parse function.
#
# DO NOT USE "set -o nounset" or "set -o errexit" because the script needs to skip a script error and attempt to do
# the next one
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

# These globals are modified by tests to alter the behavior of this script
SAMPLE=60 # run all the metric gathering scripts every SAMPLE seconds (see get_next_run_time)
RUN_TERMINATE="0"

export DATA_SOURCE_DIRECTORY=$SCRIPT_DIR"/DataSource/"
export PATH=$PATH:/bin:/usr/bin:/sbin:/usr/sbin:/usr/local/bin:/usr/local/sbin
source "$SCRIPT_DIR"/utils.sh

# Load the configuration script
source "$SCRIPT_DIR"/config.sh

# Checks the common tools and if any of them is not found, the script exits.
#
# Usage: check_tools
# Parameters: None
# Stdin: None
# Stdout: Logs ERROR if the tool is not available
# Stderr: None
# Return: None
check_tools() {
    local tools=(
        awk
        basename
        cat
        date
        dmesg
        md5sum
        readlink
        sed
        uname
    )

    for tool in "${tools[@]}"; do
        command -v $tool >/dev/null 2>&1 || { log_error "$tool command is not found"; exit; }
    done
}

# Gets the current date in Epoch time.
#
# Usage: get_current date
# Parameters: None
# Stdin: None
# Stdout: Current date in Epoch time
# Stderr: None
# Return: None
get_current_date() {
    get_date +%s
}

# Gets the time when the metric gathering should execute next: (current time + $SAMPLE seconds)
#
# Usage: get_next_run_time
# Parameters: None
# Stdin: None
# Stdout: time when metric gathering should execute next
# Stderr: None
# Return: None
get_next_run_time() {
    local now=$(get_current_date)
    echo $((now + $SAMPLE))
}

# Gets the number of seconds to sleep till the next run time for the metric gathering. If it is less than or equal to 0,
# then log a warning that the metric gathering has overrun the SAMPLE period.
#
# Usage: get_sleep_time <next_run_time>
# Parameters:
#     next_run_time - the time when the metric gathering scripts should execute next
# Stdin: None
# Stdout: number of seconds to sleep till the next metric gathering
# Stderr: None
# Return: None
get_sleep_time() {
    local next_run_time=$1
    local sleeptime=`date +"$1 %s" | awk '{if ($1 > $2) {print $1 - $2} else {print 0}}'`
    if [ $sleeptime -eq 0 ]; then
        log_warn "Scripts are running longer than $SAMPLE seconds"
    fi
    echo $sleeptime
}

# Exports the environment variable and checks the common tools
#
# Usage: setup
# Parameters: None
# Stdin: None
# Stdout: None
# Stderr: None
# Return: None
setup() {
    check_tools
    load_os_version
}

# Override this method if there is a need to set the termination flag
#
# Usage: determine_terminate_flag
# Stdin: None
# Stdout: None
# Stderr: None
# Return: None - don't evaluate this in subshell because mocks won't work.
determine_terminate_flag() {
    # execute the null command since bash won't let us declare empty functions
    :
}

# Load the file passed in at $1. This is provided so that we can mock this and do something different in our tests.
#
# Usage: load_datasource_file <file> <file_index>
# Parameters:
#     file - full file path
#     file_index - index of the current data source being sourced
#             Ex: if cpu.sh is the 4th file to be executed in the main run loop the index would be 3.
# Stdin: None
# Stdout: None
# Stderr: None
# Return: None
load_datasource_file() {
    local file=$1
    local file_index=$2
    source $file
}

# Runs the scripts in an infinite loop.

# Usage: run
# Parameters: None
# Stdin: None
# Stdout: Warn if gather failed
# Stderr: None
# Return: None
run() {

    # How man seconds to wait before rerunning scripts. Adjustable via SAMPLE global variable.
    local sleep_time=0

    # When the scripts should be run again. Used to detect if the scripts are taking too long to run.
    local next_run_time=0

    # Some metrics need the previous result for aggregation. Each script occupies a different element of the array.
    local gather_prev
    local gather_prev_timestamp

    setup
    while [ 1 ]; do

        determine_terminate_flag

        if [ "${RUN_TERMINATE}" == "1" ]; then
            log_info "Terminate flag was set! Exiting..."
            exit 0
        fi

        next_run_time=$(get_next_run_time)

        if [ ! -d "$DATA_SOURCE_DIRECTORY" ]; then
            log "ERROR" "Missing Directory: ${DATA_SOURCE_DIRECTORY}"
            exit 1
        fi

        local files="${DATA_SOURCE_DIRECTORY}*.sh"
        local i=0

        for file in $files; do
            log_debug "Running script ${file}."

            # Load the next datasource file. Also pass file index, which is used in test scripts.
            load_datasource_file $file $i

            # Call gather function. stdout for gather is stored into a variable for error checking purposes. If it is
            # done directly (i.e., gather | parse), parse will continue to run and output misleading data.
            gather_result="$(gather)"

            if [ -z "$gather_result" ]; then
                log_warn "${file} gather returned empty string, skip parsing"
            else
                local now=$(get_current_date)
                local prev=${gather_prev_timestamp[$i]:=0}
                local interval=$(($now - $prev))

                # Disallow intervals less than 1 second
                interval=$(($interval < 1 ? 1 : $interval))

                echo "${gather_result}" | parse "${gather_prev[$i]}" "$interval"

                # Save the previous gather result. Some metrics need the previous result for aggregation.
                gather_prev[$i]="${gather_result}"
                gather_prev_timestamp[$i]="$now"
            fi

            i=$((i + 1))
        done

        sleep_time=$(get_sleep_time $next_run_time)
        sleep $sleep_time
    done
}

# Executes any arguments (e.g., calling functions)
$@;
