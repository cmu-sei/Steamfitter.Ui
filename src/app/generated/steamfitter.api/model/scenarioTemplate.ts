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
import { VmCredential } from './vmCredential';


export interface ScenarioTemplate { 
    dateCreated?: Date;
    dateModified?: Date | null;
    createdBy?: string;
    modifiedBy?: string | null;
    id?: string;
    name?: string | null;
    description?: string | null;
    durationHours?: number | null;
    defaultVmCredentialId?: string | null;
    vmCredentials?: Array<VmCredential> | null;
    score?: number;
    scoreEarned?: number;
    scenarioTemplatePermissions?: Array<string> | null;
}

