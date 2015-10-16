#!/usr/bin/env bash
#
# Calculates Disk IO rates for the system.
#
# Linux: parses output from /proc/diskstats to calculate IO rates for partitions.
#        See https://www.kernel.org/doc/Documentation/iostats.txt for details.
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/common.sh"

PROC_DISKSTATS="/proc/diskstats"
PROC_PARTITIONS="/proc/partitions"

# Executes the command to gather inputs from diskstat.
#
# Usage: gather_linux_ge_2_6_0
# Parameters: None
# Stdin: None
# Stdout: Result of executing the diskstat command
# Stderr: None
# Return: None
gather_linux_ge_2_6_0() {
    if [ -f "${PROC_DISKSTATS}" ]; then
        cat "${PROC_DISKSTATS}"
    else
        log_error "${PROC_DISKSTATS} is not found."
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

    # fail fast if there is no previous data.
    if [ "x${prev}" == "x" ]; then
        return 0;
    fi

    capture_stdin
    local curr="$UTILS_CAPTURED_STDIN"

    # Get the list of disks and partitions
    local partitions=$(get_linux_partitions)

    # Get the list of filesystem partitions
    local dfPartitions=$(get_df_partitions)
    # Concatenate the previous and the current data
    local combined="${prev}"$'\n'"${curr}"

    local awk_script='
        BEGIN {
            numPartitions = split(partitionsStr, fs, ";")
            for (i = 1; i <= numPartitions; i++) {
                partitions[fs[i]] = 1
            }

            numDfPartitions = split(dfPartitionsStr, dfFs, ";")
            for (i = 1; i <= numDfPartitions; i++) {
                partition = dfFs[i]
                real_path = getRealLink(partition)
                name = getBaseName(real_path)
                dfPartitions[name] = partition
            }

        }

        # Only look at lines that have 14 fields.
        NF == 14 {
            dev = $3;
            if (!(partitions[dev])) {
                next;
            }
            numReadsCompleted = $4;
            numReadsMerged = $5;
            numSectorsRead = $6;
            numMillisecondsReading = $7;
            numWritesCompleted = $8;
            numWritesMerged = $9;
            numSectorsWritten = $10;
            numMillisecondsWriting = $11;
            numOpsInProgress = $12;
            numMillisecondsDoingIo = $13;

            if (seen[dev]) {
                r[dev] = numReadsCompleted - r[dev];
                rsec[dev] = numSectorsRead - rsec[dev];
                rMs[dev] = numMillisecondsReading - rMs[dev];
                w[dev] = numWritesCompleted - w[dev];
                wsec[dev] = numSectorsWritten - wsec[dev];
                wMs[dev] = numMillisecondsWriting - wMs[dev];
                ioMs[dev] = numMillisecondsDoingIo - ioMs[dev];
            } else {
                r[dev] = numReadsCompleted;
                rsec[dev] = numSectorsRead;
                rMs[dev] = numMillisecondsReading;
                w[dev] = numWritesCompleted;
                wsec[dev] = numSectorsWritten;
                wMs[dev] = numMillisecondsWriting;
                ioMs[dev] = numMillisecondsDoingIo;
            }
            seen[dev] = 1;
        }

        END {
            for (dev in seen) {
                if (!match(dev, "[0-9]$")) {
                    # This is a disk, use its IO usage info
                    numMsTotal += ioMs[dev]
                    numDisks += 1
                } else {
                    # This is a partition, use its stats
                    reads += r[dev];
                    # TODO: SIM-330 These calculations assume a sector size of 512.
                    readsk += rsec[dev] / 2;
                    writes += w[dev];
                    writesk += wsec[dev] / 2;
                }
            }

            if (reads < 0) reads = 0;
            if (readsk < 0) readsk = 0;
            if (writes < 0) writes = 0;
            if (writesk < 0) writesk = 0;

            prefix = "Hardware Resources|Disks|"

            # TODO SIM-321 Move all metrics from Sigar to scripts
            #print_metric(prefix "Reads/sec", (reads/interval))
            #print_metric(prefix "Writes/sec", (writes/interval))
            #print_metric(prefix "KB read/sec", (readsk/interval))
            #print_metric(prefix "KB written/sec", (writesk/interval))

            if (numDisks > 0) {
                avgMs = numMsTotal / numDisks;
                # Note we only divide by 10 which is 100 (to get percents) / 1000 (msec in one second)
                utilAvg = avgMs/interval/10
                print_metric(prefix "Avg IO Utilization (%)", utilAvg)
            }

            for (i = 1; i <= numPartitions; i++) {
                dev = fs[i];
                reads = r[dev];
                readsk = rsec[dev] / 2;
                readMs = rMs[dev];
                writes = w[dev];
                writesk = wsec[dev] / 2;
                writeMs = wMs[dev];
                ioPercentage = ioMs[dev] / 10;  # (# ms) / 10 = hundredths of seconds

                if (reads < 0) reads = 0;
                if (readsk < 0) readsk = 0;
                if (readMs < 0) readMs = 0;
                if (writes < 0) writes = 0;
                if (writesk < 0) writesk = 0;
                if (writeMs < 0) writeMs = 0;
                if (ioPercentage < 0) ioPercentage = 0;

                # if the symbolic link of this dev exists under df command,
                # match the metric name to Sigar
                if (dfPartitions[dev]) {
                    dev = convertToSigarName(dfPartitions[dev])
                } else {
                    dev = "dev-" dev
                }

                prefix_dev = prefix dev "|"

                # TODO SIM-321 Move all metrics from Sigar to scripts
                #print_metric(prefix_dev "Reads/sec", (reads/interval))
                #print_metric(prefix_dev "Writes/sec", (writes/interval))
                #print_metric(prefix_dev "KB read/sec", (readsk/interval))
                #print_metric(prefix_dev "KB written/sec", (writesk/interval))

                print_metric(prefix_dev "Avg IO Utilization (%)", (ioPercentage/interval))
                if (reads > 0) {
                    print_metric(prefix_dev "Avg read time (ms)", (readMs/reads))
                }
                if (writes > 0) {
                    print_metric(prefix_dev "Avg write time (ms)", (writeMs/writes))
                }
            }
        }'

    echo "${combined}" | awk -v interval=${interval} -v partitionsStr="${partitions}" \
            -v dfPartitionsStr="${dfPartitions}" -f <(cat "$SCRIPT_DIR/utils.awk") -f <(echo  "$awk_script")
}

# Parses the list of partitions from /proc/partitions. This exists across all versions of linux. We need to get the
# partitions this way instead of collecting from /proc/diskstats because diskstats has entries for all the block
# devices, whether they are (partitions of) physical drives or not.
#
# Usage: get_linux_partitions
# Parameters: None
# Stdin: None
# Stdout: List of partitions to check
# Stderr: None
# Return: None
get_linux_partitions() {
    cat ${PROC_PARTITIONS} | awk '
        BEGIN { parts = "" }
        { if (NR > 2) parts = parts ";" $4 }
        END { print substr(parts, 2) }'
}

# Parses the list of partitions from df command
#
# Usage: get_df_partitions
# Parameters: None
# Stdin: None
# Stdout: List of partitions from df (to match what Sigar provides)
# Stderr: None
# Return: None
get_df_partitions() {
    df | awk '
        BEGIN {
            parts = ""
        }
        $1 ~ "^\/dev\/" {
            parts = parts ";" $1
        }
        END { print substr(parts, 2) }'
}
