# Parses and calculates the Process Data of a system
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

# Escapes the given string for inclusion in JSON output.
# Returns the escaped string.
function escapeStringForJson(input) {
    output = input
    # This prepends a \ to either " or \
    gsub(/[\\"]/, "\\\\&", output)
    return output
}

# Escapes the given string for use in a single quoted shell string.
# Returns the escaped string.
function escapeStringForShell(input) {
    output = input
    # This substitution reads will replace a quote with '\'', which closes the quote, appends a single quote, and
    # then reopens the quote.
    gsub(/'/, "'\\\\''", output)
    return output
}

# Extracts substring that matches the regular expression from a string
# Parameters:
# arguments     - original data to match from
# pClass_regex  - the regular expression that describe the sub string of interest
# Returns:  the substring that matches the regular expression, nothing if it does not match
function getProcessClass(arguments, pClass_regex) {
    processClass=""
    match(arguments, pClass_regex)
    processClass = substr (arguments, RSTART, RLENGTH)
    return processClass;
}

# Provides the class Id given the process class string
# Currently, implemented by hashing the class string with MD5
# Parameters:
# processClass     - process Class string
# Returns:  the process class identification (hash value)
function getClassId(processClass) {
    escapedProcClass = escapeStringForShell(processClass)
    classId=""
    temp_cmd = "echo '" escapedProcClass "' | md5sum | cut -d\" \" -f1"
    temp_cmd | getline classId;
    close(temp_cmd)
    return classId;
}

# Converts the CPU Time or Elapsed Time from ps command into seconds
# Parameter:
# time   the CPU Time / Elapased Time in the format of [[DD-]HH:]MM:SS (DD not limited to 2 digits)
# Return number of seconds, converted from the CPU Time
function convertToSeconds(time) {
    day = 0
    hour = 0
    minuteIndex = 1

    split(time, arr, "[:-]")

    # [DD-HH:] exists and we will parse that first, then the minutes and seconds
    # This need to check if it is not empty, but 00 is considered false otherwise.
    if (arr[4] != "") {
        day = arr[1]
        hour = arr[2]
        minuteIndex = 3
    } else if (arr[3] != "") {
        hour = arr[1]
        minuteIndex = 2
    }

    min = arr[minuteIndex]
    sec = arr[minuteIndex + 1]

    seconds = (day * 24 * 60 * 60) + ( hour  * 60 * 60 ) + (min * 60) + sec

    return seconds;
}

# Retrieve the Enum value that matches the state data in Controller so that the result could be deserialized easily
# Parameter:
# state     the state in raw
function getStateEnum(state) {

    firstLetter = substr(state, 1, 1)

    result = "UNKNOWN"

    if (firstLetter == "") {
        return result;
    }

    if (firstLetter == "R" || firstLetter == "W") {
        result = "RUNNING"
    } else if (firstLetter == "S" || firstLetter == "D") {
        result = "SLEEPING"
    } else if (firstLetter == "Z") {
        result = "ZOMBIE"
    } else if (firstLetter == "T") {
        result = "TERMINATED"
    }
    return result;
}

BEGIN {
    foundProcessesCount = 0
}

# skip the header line
(NR > 1) && (NR != currHeader) {
    pid = $1
    mem = $2
    command = $3
    cpuTime = $4
    eGroup = $5
    elapsed = convertToSeconds($6)
    eUser = $7
    niceLevel = $8
    majorFault = $9
    minorFault = $10
    thread = $11
    pgid = $12
    ppid = $13
    memoryUsageKB = $14
    state = $15
    realUser = $16
    realGroup = $17

    arguments=$18
    if (NF > 18) {
        for (i = 19; i<=NF; i++) {
            arguments = arguments" "$i
        }
    }
}

# skip if elapsed time has not meet the minimum running time to be monitored
(NR > 1) && (elapsed > minRunTime) && (arguments ~ regex) {

    # Extract the process class
    processClass = getProcessClass(arguments, pClassRegex)

    # Does not match the classification regex, considered as stand alone process
    if (processClass == "") {
        processClass = arguments
    }

    # hash the process class section from arguments to create process class
    classId = getClassId(processClass)

    #convert cpuTime to seconds
    cpuTimeInSeconds = convertToSeconds(cpuTime)

    # process the previous data first
    if (NR < currHeader) {
        # roll up metric data per process Class
        if (prev[classId]) {
            prevMajorFlt[classId] += majorFault
            prevMinorFlt[classId] += minorFault
            prevCpuTime[classId] += cpuTimeInSeconds

        } else {
            prevMajorFlt[classId] = majorFault
            prevMinorFlt[classId] = minorFault
            prevCpuTime[classId] = cpuTimeInSeconds
        }
        prev[classId]=1
    }

    # process the current data
    if (NR > currHeader) {

        # Keep track of all the processes we've seen so far and at what index (for deterministic test running).
        currProcess[foundProcessesCount] = pid
        foundProcessesCount++;

        # Gather data per process for properties
        currPid[pid] = pid
        currCommand[pid] = command
        currEGroup[pid] = eGroup
        # store and send in milliseconds
        currElapsed[pid] = elapsed * 1000
        currEUser[pid] = eUser
        currNiceLevel[pid] = niceLevel
        currPgid[pid] = pgid
        currPpid[pid] = ppid
        currRealUser[pid] = realUser
        currRealGroup[pid] = realGroup
        currState[pid] = getStateEnum(state)
        currClassId[pid] = classId
        currClass[pid] = processClass
        currArguments[pid] = arguments

        # Gather data per class for metrics
        if (curr[classId]) {
            currMem[classId] += mem
            currThread[classId] += thread
            currMemKB[classId] += memoryUsageKB
            currMajorFlt[classId] += majorFault
            currMinorFlt[classId] += minorFault
            currCpuTime[classId] += cpuTimeInSeconds
            pCount[classId] += 1;
        } else {
            # variable below are for metrics
            currMem[classId] = mem
            currThread[classId] = thread
            currMemKB[classId] = memoryUsageKB
            currMajorFlt[classId] = majorFault
            currMinorFlt[classId] = minorFault
            currCpuTime[classId] = cpuTimeInSeconds
            pCount[classId] = 1;
        }

        curr[classId] = 1
    }

}

END {
    # process the properties first
    # if there are processes larger than max, then chop them off
    if (foundProcessesCount > maxProcess) {
        foundProcessesCount = maxProcess
    }

    json = "processes=["

    for (procIdx = 0; procIdx < foundProcessesCount; procIdx++) {
        id = currProcess[procIdx]

        if (procIdx > 0) {
            sep = ", "
        } else {
            sep = ""
        }

        json = json sep "{" \
                    "\"liveTime\": \"" currElapsed[id] "\", " \
                    "\"classId\": \"" currClassId[id] "\", " \
                    "\"processClass\": \"" escapeStringForJson(currClass[id]) "\", " \
                    "\"name\": \"" escapeStringForJson(currCommand[id]) "\", " \
                    "\"processId\": \"" currPid[id] "\", " \
                    "\"parentProcessId\": \"" currPpid[id] "\", " \
                    "\"commandLine\": \"" escapeStringForJson(currArguments[id]) "\", " \
                    "\"effectiveUser\": \"" escapeStringForJson(currEUser[id]) "\", " \
                    "\"state\": \"" currState[id] "\", " \
                    "\"properties\": {" \
                        "\"niceLevel\": \"" currNiceLevel[id] "\", " \
                        "\"pgid\": \"" currPgid[id] "\", " \
                        "\"effectiveGroup\": \"" escapeStringForJson(currEGroup[id]) "\", " \
                        "\"realUser\": \"" escapeStringForJson(currRealUser[id]) "\", " \
                        "\"realGroup\": \"" escapeStringForJson(currRealGroup[id]) "\"" \
                    "}" \
                "}"
    }

    json = json "]"

    print json

    # process the metrics
    for (class in curr) {

        # if the commands exist in the previous data
        if (prev[class]) {
            diffMajorFlt = currMajorFlt[class] - prevMajorFlt[class]
            diffMinorFlt = currMinorFlt[class] - prevMinorFlt[class]
            cpuUtil = (currCpuTime[class] - prevCpuTime[class]) * 100 / interval

        } else {
            diffMajorFlt = currMajorFlt[class]
            diffMinorFlt = currMinorFlt[class]
            cpuUtil = currCpuTime[class] * 100 / interval
        }

        prefix = "Hardware Resources|Process|" class "|"
        print_metric(prefix "Memory|Used (%)", currMem[class])
        print_metric(prefix "Threads|Total", currThread[class])
        print_metric(prefix "Memory|Used (KB)", currMemKB[class])
        print_metric(prefix "Faults|Major", diffMajorFlt)
        print_metric(prefix "Faults|Minor", diffMinorFlt)
        print_metric(prefix "CPU|Used (%)", cpuUtil/cpuCount)
        print_metric(prefix "Count", pCount[class])
    }
}
