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
import { TaskAction } from './taskAction';
import { TaskStatus } from './taskStatus';


export interface Result { 
    dateCreated?: Date;
    dateModified?: Date | null;
    createdBy?: string;
    modifiedBy?: string | null;
    id?: string;
    taskId?: string | null;
    vmId?: string | null;
    vmName?: string | null;
    apiUrl?: string | null;
    action?: TaskAction;
    actionParameters?: { [key: string]: string; } | null;
    expirationSeconds?: number;
    iterations?: number;
    currentIteration?: number;
    intervalSeconds?: number;
    status?: TaskStatus;
    expectedOutput?: string | null;
    actualOutput?: string | null;
    sentDate?: Date;
    statusDate?: Date;
}

