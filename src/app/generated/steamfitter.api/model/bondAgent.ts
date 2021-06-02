/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved. 
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
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
import { MonitoredTool } from './monitoredTool';
import { OS } from './oS';
import { LocalUser } from './localUser';
import { SshPort } from './sshPort';


export interface BondAgent { 
    id?: string;
    machineName?: string | null;
    fqdn?: string | null;
    guestIp?: string | null;
    vmWareUuid?: string;
    vmWareName?: string;
    agentName?: string | null;
    agentVersion?: string | null;
    agentInstalledPath?: string | null;
    localUsers?: Array<LocalUser> | null;
    operatingSystem?: OS;
    sshPorts?: Array<SshPort> | null;
    checkinTime?: Date | null;
    monitoredTools?: Array<MonitoredTool> | null;
}

