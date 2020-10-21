/**
 * Crucible
 * Copyright 2020 Carnegie Mellon University.
 * NO WARRANTY. THIS CARNEGIE MELLON UNIVERSITY AND SOFTWARE ENGINEERING INSTITUTE MATERIAL IS FURNISHED ON AN "AS-IS" BASIS. CARNEGIE MELLON UNIVERSITY MAKES NO WARRANTIES OF ANY KIND, EITHER EXPRESSED OR IMPLIED, AS TO ANY MATTER INCLUDING, BUT NOT LIMITED TO, WARRANTY OF FITNESS FOR PURPOSE OR MERCHANTABILITY, EXCLUSIVITY, OR RESULTS OBTAINED FROM USE OF THE MATERIAL. CARNEGIE MELLON UNIVERSITY DOES NOT MAKE ANY WARRANTY OF ANY KIND WITH RESPECT TO FREEDOM FROM PATENT, TRADEMARK, OR COPYRIGHT INFRINGEMENT.
 * Released under a MIT (SEI)-style license, please see license.txt or contact permission@sei.cmu.edu for full terms.
 * [DISTRIBUTION STATEMENT A] This material has been approved for public release and unlimited distribution.  Please see Copyright notice for non-US Government use and distribution.
 * Carnegie Mellon(R) and CERT(R) are registered in the U.S. Patent and Trademark Office by Carnegie Mellon University.
 * DM20-0181
 */

/**
 * Steamfitter API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: v1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


export type TaskAction = 'guest_process_run' | 'guest_file_read' | 'guest_file_write' | 'vm_hw_power_off' | 'vm_hw_power_on' | 'vm_create_from_template' | 'vm_hw_remove' | 'guest_process_run_fast' | 'guest_file_upload_content';

export const TaskAction = {
    GuestProcessRun: 'guest_process_run' as TaskAction,
    GuestFileRead: 'guest_file_read' as TaskAction,
    GuestFileWrite: 'guest_file_write' as TaskAction,
    VmHwPowerOff: 'vm_hw_power_off' as TaskAction,
    VmHwPowerOn: 'vm_hw_power_on' as TaskAction,
    VmCreateFromTemplate: 'vm_create_from_template' as TaskAction,
    VmHwRemove: 'vm_hw_remove' as TaskAction,
    GuestProcessRunFast: 'guest_process_run_fast' as TaskAction,
    GuestFileUploadContent: 'guest_file_upload_content' as TaskAction
};
