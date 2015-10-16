#!/usr/bin/env bash
#
# Retrieves CPU metadata such as physical chip count, chip id, cores per chip,
# make, model, speed, flags.
#
# For all Unixes, gathers and parses output from ﻿/proc/cpuinfo.
#
# Copyright (c) AppDynamics, Inc., and its affiliates, 2014, 2015
# All Rights Reserved
# THIS IS UNPUBLISHED PROPRIETARY CODE OF APPDYNAMICS, INC.
# The copyright notice above does not evidence any
# actual or intended publication of such source code.

source "${SCRIPT_DIR}/utils.sh"
source "${SCRIPT_DIR}/common.sh"
PROC_CPUINFO="/proc/cpuinfo"

# Executes the command to gather inputs to the parser for linux 2.6.0 and outputs the result in stdout
#
# Usage: gather_linux_ge_2_6_0
# Parameters: None
# Stdin: None
# Stdout: Result
# Stderr: None
# Return: None
gather_linux_ge_2_6_0() {
    if [ -f "${PROC_CPUINFO}" ];
    then
        cat "${PROC_CPUINFO}"
    else
        log_error "${PROC_CPUINFO} is not found."
    fi
}

# Parses the output from gather() and outputs metrics and properties for linux 2.6.0
#
# Usage: parse_linux_ge_2_6_0
# Parameters: None
# Stdin: Data to parse from gather
# Stdout: Formatted data for reporting metrics and properties
# Stderr: None
# Return: None
parse_linux_ge_2_6_0() {
    parse_linux_ge_2_6_0_properties
}

# Parses the output from gather() and outputs properties for linux 2.6.0
#
# Usage : parse_linux_ge_2_6_0_properties
# Parameter : None
# Stdin : Data to parse from gather
# Stdout : Formatted data for property reporting
# Stderr: None
# Return: None
parse_linux_ge_2_6_0_properties() {
    local awk_script='
        BEGIN {
            processor_index=0;
        }

        # A processor is not really a CPU. It is a logical processor which could be a physical chip, one of the cores on
        # a chip or just a hyperthreaded (HT) core which shows up as two different processors for each core.
        # Ex. One physical chip, quad cores, hyperthreaded may have 1 x 4 x 2 = 8 processors if each core has HT enabled.
        /^processor/ {
            processor_id = $2;
            parsed_processor_ids[processor_index] = processor_id;
            parsed_processor_ids_size += 1;
        }

        /^vendor_id/ {
            vendor_id = $2;
            parsed_vendor_ids[processor_index] = vendor_id;
        }

        /^model name/ {
            model_name = $2;
            parsed_model_names[processor_index] = model_name;
        }

        /^cpu MHz/ {
            speed = $2;
            parsed_speed_mhz[processor_index] = speed; 
        }

        # Each physical chip will have a different physical id. It is possible for this tag to not exist in input when
        # dealing with a single chip system.
        /^physical id/ {
            physical_id = $2;
            parsed_physical_ids[processor_index] = physical_id;

        }

        # Each core will have a different core id.  It is possible for this tag to not exist in input when dealing with
        # a single core chip.
        /^core id/ {
            core_id = $2;
            parsed_core_ids[processor_index] = core_id;
        }

        /^flags/ {
            flags = $2;
            parsed_flags[processor_index] = flags;
        }

        # When we reach an empty line a new chunk of input after this should have data about a different "processor".
        /^$/ {
            processor_index += 1;
        }

        END {
            # phys_id_cur_index is an index for physical_id_indexes which is an assoc array for allowing phys ids to be
            # referenced by consecutive integer values. Consecutive referencing is needed for deterministic unit testing
            phys_id_cur_index = 0;

            # We needed to store the data in arrays because loop through all processor tags
            for (processor_index = 0; processor_index < parsed_processor_ids_size; processor_index++) {
                core_id = 0;
                phys_id = 0;
                vendor = "";
                model = "";
                speed_mhz = 0;
                flags = "";

                if (processor_index in parsed_core_ids) {
                    core_id = parsed_core_ids[processor_index];
                }

                if (processor_index in parsed_physical_ids) {
                    phys_id = parsed_physical_ids[processor_index];
                }

                if (processor_index in parsed_vendor_ids) {
                    vendor = parsed_vendor_ids[processor_index];
                }

                if (processor_index in parsed_model_names) {
                    model = parsed_model_names[processor_index];
                }

                if (processor_index in parsed_speed_mhz) {
                    speed_mhz = parsed_speed_mhz[processor_index];
                }

                if (processor_index in parsed_flags) {
                    flags = parsed_flags[processor_index];
                }
                # generate a unique key based on physical id and core id. this key is used for core_ids map.
                core_key = phys_id "_" core_id;

                # only add this core if it has not already been seen.  If it has already been seen this is just a
                # duplicate indicating hyperthreading.
                if (!(core_key in core_ids)) {

                    core_count = 0;
                    if (phys_id in physical_ids) {
                        # this phys_id has already been seen so just grab the count so we can update it.
                        core_count = physical_ids[phys_id];
                    } else {
                        # this phys_id has never been seen before so add it to physical_id_indexes.
                        physical_id_indexes[phys_id_cur_index] = phys_id;
                        vendor_id_indexes[phys_id] = vendor;
                        model_indexes[phys_id] = model;
                        speed_mhz_indexes[phys_id] = speed_mhz;
                        flags_indexes[phys_id] = flags;
                        phys_id_cur_index += 1;
                        phys_id_indexes_size += 1;
                    }

                    # set the new core count to physical_ids which stores with phys_id as key and new count as value
                    # this step will both add new keys and update existing ones.
                    physical_ids[phys_id] = core_count + 1;

                    # set array to 1 indicating we have seen it. (Setting it to any value other than "" would work).
                    core_ids[core_key] = 1;
                }
            }

            for (i = 0; i < phys_id_indexes_size; i++) {
                phys_id = physical_id_indexes[i];
                print_property("CPU|" phys_id "|CPU ID", phys_id)

                # how many cores does this physical chip contain?
                core_count = physical_ids[phys_id];
                print_property("CPU|" phys_id "|Core Count", core_count)

                vendor = vendor_id_indexes[phys_id];
                print_property("CPU|" phys_id "|Vendor", vendor)

                model = model_indexes[phys_id];
                print_property("CPU|" phys_id "|Model Name", model)

                speed = speed_mhz_indexes[phys_id];
                print_property("CPU|" phys_id "|Speed MHz", speed)

                flags = flags_indexes[phys_id];
                print_property("CPU|" phys_id "|flags", flags)
            }
        }
    '
    awk -v FS=': ' -f <(cat "$SCRIPT_DIR/utils.awk") -f <(echo "$awk_script")
}
