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
import { ConsoleConnectionInfo } from './consoleConnectionInfo';


export interface Vm { 
    id?: string | null;
    url?: string | null;
    name?: string | null;
    userId?: string | null;
    allowedNetworks?: Array<string> | null;
    powerState?: string | null;
    ipAddresses?: Array<string> | null;
    teamIds?: Array<string> | null;
    hasPendingTasks?: boolean | null;
    consoleConnectionInfo?: ConsoleConnectionInfo;
}

