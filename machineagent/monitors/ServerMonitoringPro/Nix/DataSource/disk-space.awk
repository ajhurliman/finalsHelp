# Calculates Network information for system.
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

BEGIN {
    prefix = "Hardware Resources|Volumes|"
}

$1 ~ "^" devDir {
    partition = $1
    total = $2
    used = $3
    free = $4
    mount_point = $6

    prefix_mount = prefix mount_point "|"
    print_metric(prefix_mount "Total (MB)", total)
    print_metric(prefix_mount "Used (MB)", used)
    print_metric(prefix_mount "Free (MB)", free)

    if (!(seen[partition])) {
        seen[partition] = 1
        total_sum += total
        used_sum += used
        free_sum += free
    }

    # Avoid division by 0
    if (total == 0) {
        capacity = 0
    } else {
        capacity = used / total * 100
    }

    print_metric(prefix_mount "Used (%)", capacity)

    real_path = getRealLink(partition)
    name = getBaseName(real_path)

    prefix_prop = "Volume|" mount_point "|"
    print_property(prefix_prop "Partition", name)
    print_property(prefix_prop "Size (MB)", total)
    print_property(prefix_prop "MountPoint", mount_point)
    print_property(prefix_prop "MetricName", convertToSigarName(partition))

}

END {
    print_metric(prefix "Total (MB)", total_sum)
    print_metric(prefix "Used (MB)", used_sum)
    print_metric(prefix "Free (MB)", free_sum)

    used_sum_percent = used_sum / total_sum * 100
    print_metric(prefix "Used (%)", used_sum_percent)
}
