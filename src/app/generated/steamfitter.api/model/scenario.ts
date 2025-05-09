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
import { ScenarioStatus } from './scenarioStatus';
import { VmCredential } from './vmCredential';


export interface Scenario { 
    dateCreated?: Date;
    dateModified?: Date | null;
    createdBy?: string;
    modifiedBy?: string | null;
    id?: string;
    name?: string | null;
    description?: string | null;
    startDate?: Date;
    endDate?: Date;
    status?: ScenarioStatus;
    onDemand?: boolean;
    scenarioTemplateId?: string | null;
    viewId?: string | null;
    view?: string | null;
    defaultVmCredentialId?: string | null;
    vmCredentials?: Array<VmCredential> | null;
    users?: Array<string> | null;
    score?: number;
    scoreEarned?: number;
    scenarioPermissions?: Array<string> | null;
}

