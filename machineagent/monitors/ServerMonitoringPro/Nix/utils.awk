# Library routines for awk.
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

# Outputs a log event to the standard error.
#
# Parameters:
#     severity - SEVERITY Level (INFO, WARN, ERROR)
#     message - message to log
# Stderr: output the message in Stderr
# Return: None
function log_msg(severity, message) {
    # redirect stdout to stderr so it'll be printed even if the calling command is piping the result to another command
    print "event-type=MACHINE_AGENT_LOG, severity=" severity ", message=" message > "/dev/stderr"
}

# Outputs a error log event to stderr.
#
# Parameters:
#     message - message to log
# Stderr: log message
function log_error(message) {
    log_msg("ERROR", message)
}

# Outputs a warning log event to stderr.
#
# Parameters:
#     message - message to log
# Stderr: log message
function log_warn(message) {
    log_msg("WARN", message)
}

# Outputs an info log event to stderr.
#
# Parameters:
#     message - message to log
# Stderr: log message
function log_info(message) {
    log_msg("INFO", message)
}

# Outputs a debug log event to stderr.
#
# Parameters:
#    message - message to log
# Stderr: log message
function log_debug(message) {
    log_msg("DEBUG", message)
}

# Returns the bit value at the given bitmask. There is no general bitwise and for awk.
#
# Parameters:
#    flags - flags to check
#    bitmaskIn - bitmask value (e.g. 8 to check bit 3)
# Return: 0 or 1, which is the value of that bit
function checkBit(flags, bitmaskIn,    shifted) {
    shifted = int(flags / bitmaskIn)
    return (shifted % 2)
}

# Round number to the nearest integer.
#
# Parameters:
#     value - value to round
# Return:
#     Rounded value
function round(value,    rounded) {
    if (value < 0) {
        rounded = value - 0.5
    } else {
        rounded = value + 0.5
    }
    return int(rounded)
}

# Print a value message to standard out.
#
# Parameters:
#     type - type of value (e.g., name, property)
#     description - description of the value
#     aggregrator - aggregrator for value (omitted if null string)
#     value - value to print
# Stdout: message
# Return: None
function print_value(type, description, aggregator, value,    str) {
    str = type "=" description

    if (aggregator) {
        str = str ",aggregator=" aggregator
    }

    str = str ",value=" value

    print str
}

# Print a metric value message to standard out. This function ensures the value printed is always an integer.
#
# Parameters:
#     description - description of the value
#     value - value to print
# Stdout: message
# Return: None
function print_metric(description, value) {
    print_value("name", description, "OBSERVATION", round(value))
}

# Print a property value message to standard out.
#
# Parameters:
#     description - description of the value
#     value - value to print
# Stdout: message
# Return: None
function print_property(description, value) {
    print_value("property", description, "", value)
}

# Converts the partition name to match the name used in sigar metrics, this function is direct translation from
# AggGroup.cleanupName method in system-agent
# Parameters:
#     partition - the partition raw value
#     result - the converted string that match the sigar metric name
# Stdout: None
# Return: the metric name that matches sigar metrics
function convertToSigarName(partition,      result) {
    result = partition

    # if first character is not alphanumeric, then remove that first character from result
    if (partition !~ /^[a-zA-Z0-9]/) {
        # copy of partition except the first character
        result = substr(partition, 2, length(partition))
    }

    gsub("[^a-zA-Z0-9]+", "-", result)

    return result
}

# Gets the real link of a symbolic link
#
# Parameters:
#     symlink - the symbolic link to resolve
# Stdin: None
# Stdout: None
# Return: result - real link
function getRealLink(symlink,       temp_cmd, result) {
    temp_cmd="readlink -m " symlink
    temp_cmd | getline result;
    close(temp_cmd)
    return result
}

# Gets the base name of a path
#
# Parameters:
#     path - the path to resolve base name from
# Stdin: None
# Stdout: None
# Return: result - the base name of a path
function getBaseName(path,      temp_cmd, result) {
    temp_cmd="basename " path
    temp_cmd | getline result;
    close(temp_cmd)
    return result
}
