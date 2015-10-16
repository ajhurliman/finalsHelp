# Calculates Network information for system.
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

function readSys(dev, name, dflt,    file, command, ret) {
    file = netSysDir "/" dev "/" name
    command = "cat " file " 2> /dev/null"
    #log_debug("Reading " file ", default " dflt)

    if ((command | getline ret) <= 0) {
        #log_debug("Couldn't read file " file)
        ret = dflt
    }

    #log_debug("Closing " command)
    close(command)
    #log_debug("Returning " ret)
    return ret
}

BEGIN {
    # Define constants for device flags bitmasks
    IFF_UP = 1
    IFF_LOOPBACK = 8

    # Define some constants for use below
    BITS_PER_MBIT = 1000000
    BITS_PER_BYTE = 8
    PERCENT = 100
    BYTES_PER_KBYTE = 1024

    ACCEPTED = 1
    REJECTED = -1

    devCount = 0
}

# Skip any lines containing pipes. They are titles.
(NR > 2) && (NF == 17) && !($0 ~ /\|/) {
    dev = $1
    bytesRead = $2
    pktsRead = $3
    bytesWritten = $10
    pktsWritten = $11

    if (accepted[dev] == ACCEPTED) {
        bread[dev] = bytesRead - bread[dev]
        pread[dev] = pktsRead - pread[dev]
        bwrite[dev] = bytesWritten - bwrite[dev]
        pwrite[dev] = pktsWritten - pwrite[dev]

    } else if (accepted[dev] != REJECTED) {

        # read the device flags, assume up if flags cannot be read
        intFlags = readSys(dev, "flags", IFF_UP)

        # Skip loopback devices, either because of the loopback flag or the name starts with "lo"
        isLoopback = checkBit(intFlags, IFF_LOOPBACK)
        if (isLoopback != 0 || dev ~ /^lo/) {
            #log_debug("Skipping loopback device " dev)
            accepted[dev] = REJECTED
            next
        }

        enabled[dev] = checkBit(intFlags, IFF_UP) ? "yes" : "no"

        # get if the link is detected
        carrier[dev] = readSys(dev, "carrier", -1)
        if (carrier[dev] == 0) {
            linkDetected[dev] = "no"
        } else if (carrier[dev] == 1) {
            linkDetected[dev] = "yes"
        } else {
            linkDetected[dev] = "unknown";
        }

        # get whether duplex or not
        duplex[dev] = readSys(dev, "duplex", "unknown")

        # get the device speed
        speed[dev] = readSys(dev, "speed", 0)

        # get the operational state
        operstate[dev] = readSys(dev, "operstate", "unknown")

        # get the MAC address
        mac[dev] = readSys(dev, "address", "unknown")

        # get the MTU
        mtu[dev] = readSys(dev, "mtu", 0)

        bread[dev] = bytesRead
        pread[dev] = pktsRead
        bwrite[dev] = bytesWritten
        pwrite[dev] = pktsWritten

        accepted[dev] = ACCEPTED

        # We keep track of which devices we saw at which index. This makes iteration order
        # deterministic for unit testing.
        devices[devCount] = dev
        devCount++
    }
}

END {
    metric_prefix = "Hardware Resources|Network|"
    property_prefix = "Network Interface|"

    for (devIndex = 0; devIndex < devCount; devIndex++) {
        dev = devices[devIndex]

        if (accepted[dev] != ACCEPTED) {
            continue
        }

        #totalBytesRead += bread[dev]
        #totalBytesWritten += bwrite[dev]
        #totalPacketsRead += pread[dev]
        #totalPacketsWritten += pwrite[dev]

        # if the device is down, do not use it in utilization calculations
        if (speed[dev] != 0 && operstate[dev] == "up") {
            #log_debug("Adding " dev " to the utilization calculation")
            device_count += 1
            if (tolower(duplex[dev]) == "full") {
                # When the device is full duplex, we calculate utilization based on the max of either read or write
                # because that is really what people are looking for.
                if (bread[dev] > bwrite[dev]) {
                    bytes_io = bread[dev]
                } else {
                    bytes_io = bwrite[dev]
                }
            } else {
                # A half-duplex device can only read or write at one time. So its IO utilization is the sum of its
                # reads and writes
                bytes_io = bread[dev] + bwrite[dev]
            }

            bits_per_sec = BITS_PER_BYTE * bytes_io / interval
            utilization = PERCENT * bits_per_sec / speed[dev] / BITS_PER_MBIT

            net_util_sum += utilization
        }

        print_property(property_prefix dev "|Name", dev)
        print_property(property_prefix dev "|MAC Address", mac[dev])
        print_property(property_prefix dev "|Enabled", enabled[dev])
        print_property(property_prefix dev "|Operational State", operstate[dev])
        print_property(property_prefix dev "|Speed", speed[dev])
        print_property(property_prefix dev "|Plugged In", linkDetected[dev])
        print_property(property_prefix dev "|Duplex", duplex[dev])
        print_property(property_prefix dev "|MTU", mtu[dev])

        #print_metric(metric_prefix dev "|Incoming packets/sec", (pread[dev] / interval))
        #print_metric(metric_prefix dev "|Outgoing packets/sec", (pwrite[dev] / interval))
        #print_metric(metric_prefix dev "|Incoming KB/sec", (bread[dev] / (BYTES_PER_KBYTE * interval)))
        #print_metric(metric_prefix dev "|Outgoing KB/sec", (bwrite[dev] / (BYTES_PER_KBYTE * interval)))
    }

    #net_kbytes_in = totalBytesRead / BYTES_PER_KBYTE) / interval
    #net_kbytes_out = (totalBytesWritten / BYTES_PER_KBYTE) / interval
    #net_packets_in = totalPacketsRead / interval
    #net_packets_out = totalPacketsWritten / interval

    if (device_count > 0) {
        net_util_avg = net_util_sum / device_count
    } else {
        net_util_avg = 0
    }

    # TODO SIM-321 Move all metrics from Sigar to scripts
    #print_metric(metric_prefix "Incoming packets/sec", net_packets_in)
    #print_metric(metric_prefix "Outgoing packets/sec", net_packets_out)
    #print_metric(metric_prefix "Incoming KB/sec", net_kbytes_in)
    #print_metric(metric_prefix "Outgoing KB/sec", net_kbytes_out)

    print_metric(metric_prefix "Avg Utilization (%)", net_util_avg)
}
