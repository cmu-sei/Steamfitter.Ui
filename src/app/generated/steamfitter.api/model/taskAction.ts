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


export type TaskAction = 'http_get' | 'http_post' | 'http_put' | 'http_delete' | 'guest_process_run' | 'guest_file_read' | 'guest_file_write' | 'vm_hw_power_off' | 'vm_hw_power_on' | 'vm_create_from_template' | 'vm_hw_remove' | 'guest_process_run_fast' | 'guest_file_upload_content' | 'send_email';

export const TaskAction = {
    HttpGet: 'http_get' as TaskAction,
    HttpPost: 'http_post' as TaskAction,
    HttpPut: 'http_put' as TaskAction,
    HttpDelete: 'http_delete' as TaskAction,
    GuestProcessRun: 'guest_process_run' as TaskAction,
    GuestFileRead: 'guest_file_read' as TaskAction,
    GuestFileWrite: 'guest_file_write' as TaskAction,
    VmHwPowerOff: 'vm_hw_power_off' as TaskAction,
    VmHwPowerOn: 'vm_hw_power_on' as TaskAction,
    VmCreateFromTemplate: 'vm_create_from_template' as TaskAction,
    VmHwRemove: 'vm_hw_remove' as TaskAction,
    GuestProcessRunFast: 'guest_process_run_fast' as TaskAction,
    GuestFileUploadContent: 'guest_file_upload_content' as TaskAction,
    SendEmail: 'send_email' as TaskAction
};

