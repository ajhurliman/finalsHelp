#!/usr/bin/env bash
#
# This is the configuration for machine agents to gather metrics and properties.
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

# This regular expression can be used to select all processes whose names do
# not start with an opening square bracket (i.e., "["), which has the effect of
# not matching kernel processes. This is used as the default value of
# APPD_MACHINEAGENT_PROCESS_SELECTOR_REGEX so that all user processes are
# monitored.
PROCESS_SELECTOR_ALL_NON_KERNEL_REGEX='^[^[].+'

# This regular expression can be used to select all Java processes.
PROCESS_SELECTOR_JAVA_REGEX='^([^ ]+/)*java( +|$)'

# This regular expression can be used to class processes by name (i.e., the
# first word of the command line that was used to start the process). For
# example, suppose two processes are started via the command lines: "java
# application1 -Denabled=true" and "java application2 -Denabled=true". These two
# processes will be put in the same class, called "java". This is used as the
# default value of APPD_MACHINEAGENT_PROCESS_CLASS_REGEX.
PROCESS_CLASS_BY_NAME_REGEX='^[^ ]+'

# This regular expression can be used to class processes by the full command
# line that was used to start the process.
PROCESS_CLASS_BY_FULL_COMMAND_LINE_REGEX='.+'

# To test the effect of any of the above or custom regular expressions, use a
# command such as: ps -eww -o args | awk -v regex="$REGEX" '$0 ~ regex'

# This environment variable contains a regular expression that selects which
# processes should be monitored by the machine agent. The regular expression is
# compared against the full command line that was was used to start the process.
# The default behavior is to monitor all processes with names that do not start
# with an opening square bracket (i.e., "[").
export APPD_MACHINEAGENT_PROCESS_SELECTOR_REGEX="${PROCESS_SELECTOR_ALL_NON_KERNEL_REGEX}"

# This environment variable contains a regular expression that is used by the
# machine agent to group processes into a class. The regular expression is
# compared against the full command line that was used to start the process, and
# the portion that matches is used to do the grouping. The default behavior is
# to class by process name.
export APPD_MACHINEAGENT_PROCESS_CLASS_REGEX="${PROCESS_CLASS_BY_NAME_REGEX}"

# This environment variable specifies the minimum amount of time a process must
# be alive before it is monitored by the machine agent. It is useful for
# preventing the machine agent from being overloaded with monitoring short-lived
# processes.
export APPD_MACHINEAGENT_PROCESS_MIN_LIVE_TIME_IN_SECONDS=60

# This environment variable specifies the maximum number of processes that the
# machine agent will monitor.
export APPD_MACHINEAGENT_PROCESS_MAX_NUM_MONITORED=100
