#!/usr/bin/env bash
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

# Outputs a log event to the standard error.
#
# Usage: log <severity> <message>
# Parameters:
#     severity - SEVERITY Level (INFO, WARN, ERROR)
#     message - message to log
# Stdin: None
# Stdout: None
# Stderr: log message
# Return: None
log() {
    local severity=$1; shift
    local message=$1; shift

    # redirect stdout to stderr so it'll be printed even if the calling command is piping the result to another command
    1>&2 echo "event-type=MACHINE_AGENT_LOG, severity=$severity, message=$message"
}

# Outputs a error log event to stderr.
#
# Usage: log_error <message>
# Parameters:
#     message - message to log
# Stdin: None
# Stdout: None
# Stderr: log message
# Return: None
log_error() {
    local message=$1; shift

    log "ERROR" "$message"
}

# Outputs a warning log event to stderr.
# Usage: log_warn <message>
# Parameters:
#     message - message to log
# Stdin: None
# Stdout: None
# Stderr: log message
# Return: None
log_warn() {
    local message=$1; shift

    log "WARN" "$message"
}

# Outputs an info log event to stderr.
#
# Usage: log_info <message>
# Parameters:
#     message - message to log
# Stdin: None
# Stdout: None
# Stderr: log message
# Return: None
log_info() {
    local message=$1; shift

    log "INFO" "$message"
}

# Outputs an debug log event to stderr.
#
# Usage: log_debug <message>
# Parameters:
#     message - message to log
# Stdin: None
# Stdout: None
# Stderr: log message
# Return: None
log_debug() {
    local message=$1; shift

    log "DEBUG" "$message"
}

# Takes a parameter and change every character to lower case
#
# Usage: lower_case <var>
# Parameters:
#     var - variable to lower case
# Stdin: None
# Stdout: Lower case of the parameter
# Stderr: None
# Return: None
lower_case() {
    local var="$1"; shift
    local lowerval=$(echo $var | tr '[:upper:]' '[:lower:]')
    echo "$lowerval"
}

# Gets the OS version as an array.
#
# Usage: get_os_version
# Stdin: None
# Stdout: the 3 numbers constituting the OS major, minor, and patch versions (space separated)
# Stderr: None
# Return: None
get_os_version() {
    # Gets the version from uname, then tells awk to use . and - as separators, and then to print the first three tokens
    # separated by a space.
    uname -r | awk 'BEGIN {FS="[.-]"} { print $1, $2, $3}'
}

# Exports environment properties for the OS version.
#
# Usage: load_os_version
# Parameters: None
# Stdin: None
# Stdout: None
# Stderr: None
# Return: None
load_os_version() {
    local parsed_os_version="$(get_os_version)"
    export OS_VERSION=( $parsed_os_version )
    export OS_VER_MAJOR=${OS_VERSION[0]}
    export OS_VER_MINOR=${OS_VERSION[1]}
    export OS_VER_PATCH=${OS_VERSION[2]}
    export OS_TYPE=$(uname)
}

# Checks if the actual OS version number is greater than the given OS version number. The OS version number is assumed
# to be in an environment variable called OS_VERSION as an array.
#
# Usage:
#     os_gt <major> <minor> <patch>
#
# Parameters:
#     <major> - value of the major version number (the 3 in 3.4.5)
#     <minor> - value of the minor version number (the 4 in 3.4.5)
#     <patch> - value of the patch version number (the 5 in 3.4.5)
#
# Stdin: None
#
# Stdout:
#     1 if the OS version is greater than the version given as input
#     0 if false.
#
# Return: None
os_gt() {
    local major="$1"; shift
    local minor="$1"; shift
    local patch="$1"; shift

    echo $(( ${OS_VER_MAJOR} > $major \
            || (${OS_VER_MAJOR} == $major && ${OS_VER_MINOR} > $minor) \
            || (${OS_VER_MAJOR} == $major && ${OS_VER_MINOR} == $minor && ${OS_VER_PATCH} > $patch) ))
}

# Checks if the actual OS version number is equal to the given OS version number. The OS version number is assumed to be
# in an environment variable called OS_VERSION as an array.
#
# Usage:
#     os_gt <major> <minor> <patch>
#
# Parameters:
#     <major> - value of the major version number (the 3 in 3.4.5)
#     <minor> - value of the minor version number (the 4 in 3.4.5)
#     <patch> - value of the patch version number (the 5 in 3.4.5)
#
# Stdin: None
#
# Stdout:
#     1 if the OS version is equal to the version given as input
#     0 if false.
#
# Return: None
os_eq() {
    local major="$1"; shift
    local minor="$1"; shift
    local patch="$1"; shift

    echo $(( ${OS_VER_MAJOR} == $major && ${OS_VER_MINOR} == $minor && ${OS_VER_PATCH} == $patch ))
}

# Checks if the actual OS version number is less than the given OS version number. The OS version number is assumed to
# be in an environment variable called OS_VERSION as an array.
#
# Usage:
#     os_gt <major> <minor> <patch>
#
# Parameters:
#     <major> - value of the major version number (the 3 in 3.4.5)
#     <minor> - value of the minor version number (the 4 in 3.4.5)
#     <patch> - value of the patch version number (the 5 in 3.4.5)
#
# Stdin: None
#
# Stdout:
#     1 if the OS version is less than the version given as input
#     0 if false.
#
# Return: None
os_lt() {
    local gt=$(os_gt $@)
    local eq=$(os_eq $@)

    echo $(( gt == 0 && eq == 0 ))
}

# Checks if the actual OS version number is greater than or equals to the given OS version number. The OS version number
# is assumed to be in an environment variable called OS_VERSION as an array.
#
# Usage:
#     os_gt <major> <minor> <patch>
#
# Parameters:
#     <major> - value of the major version number (the 3 in 3.4.5)
#     <minor> - value of the minor version number (the 4 in 3.4.5)
#     <patch> - value of the patch version number (the 5 in 3.4.5)
#
# Stdin: None
#
# Stdout:
# Stdout:
#     1 if the OS version is greater than or equals to the version given as input
#     0 if false.
#
# Return: None
os_ge() {
    local gt=$(os_gt $@)
    local eq=$(os_eq $@)

    echo $(( gt || eq ))
}

# Checks if the actual OS version number is less than or equal to the given OS version number. The OS version number is
# assumed to be in an environment variable called OS_VERSION as an array.
#
# Usage:
#     os_gt <major> <minor> <patch>
#
# Parameters:
#     <major> - value of the major version number (the 3 in 3.4.5)
#     <minor> - value of the minor version number (the 4 in 3.4.5)
#     <patch> - value of the patch version number (the 5 in 3.4.5)
#
# Stdin: None
#
# Stdout:
# Stdout:
#     1 if the OS version is greater than the version given as input
#     0 if false.
#
# Return: None
os_le() {
    local gt=$(os_gt $@)

    echo $(( gt == 0 ))
}

# Checks that the given name is a set environment variable.
#
# Usage: check_var <variable_name>
# Parameters:
#     variable_name - name of environment variable to check
# Stdin: None
# Stdout: None
# Stderr: Error message for missing environment variable data
# Return:
#     0 if the name is an environment variable name
#     1 otherwise
check_var() {
    local env_var_name="$1"; shift

    # creates the variable with the name passed in the parameter
    local env_var=${env_var_name}
    local returnval=0

    # With indirect reference, check what is the value of the variable stored in the $env_var.
    if [ -z "${!env_var}" ]; then
        log_error "Missing ${env_var_name} environment variable"
        returnval=1
    fi
    return "$returnval"
}

# Checks if the current OS is Mac OS.
#
# Usage: is_mac
# Parameters: none
# Stdin: none
# Stdout: 1 if mac, 0 if not
# Stderr: none
# Return: none
is_mac() {
    if [ "x$OS_TYPE" = "xDarwin" ]; then
        echo "1";
    else
        echo "0";
    fi
}

# Checks if the current OS is linux.
#
# Usage: is_linux
# Parameters: none
# Stdin: none
# Stdout: 1 if linux, 0 if not
# Stderr: none
# Return: none
is_linux() {
    if [ "x$OS_TYPE" = "xLinux" ]; then
        echo "1";
    else
        echo "0";
    fi
}

# Converts a filepath to a key removing the extension and replacing any '-' with underscore '_'. This function can be
# used for debugging one datasource at a time in start-stat run. Just get the result of this function and then do an if
# on the datasource that is of interest. (ex: rootdir/dir1/dir2/disk-io.sh returns "disk_io")
#
# Usage: get_file_key "<filepath>"
# Parameters:
#     filepath - full file path of the data source file
# Stdin: None
# Stdout: filename without the extension or directory and all "-" replaced by "_"
# Stderr: None
# Return: None
get_file_key() {
    local filepath="$1"
    local file_key="$(basename $filepath)"
    file_key="${file_key%.*}"
    file_key="$(tr '-' '_' <<<$file_key)"
    echo "${file_key}"
}

# Echo the date of given parameter with its parameter. Go through one layer of indirection so that we can override this
# in testing/mocks.
#
# Usage: get_date <options>
# Parameters:
#     options - date options that will be passed in when calling date
# Stdin: None
# Stdout: date output
# Stderr: None
# Return: None
get_date() {
    echo $(date $1)
}

# Capture stdin into the global variable UTILS_CAPTURED_STDIN.
#
# Usage: capture_stdin
# Parameters: None
# Stdin: Input to save
# Stdout: None
# Stderr: None
# Return: None
capture_stdin() {
    # Handle bash's "$( )" stripping of trailing newlines by appending and removing an 'x'.
    UTILS_CAPTURED_STDIN="$(cat; echo -n x)"
    UTILS_CAPTURED_STDIN="${UTILS_CAPTURED_STDIN%x}"
}