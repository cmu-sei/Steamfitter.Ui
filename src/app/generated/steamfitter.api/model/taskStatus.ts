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


export type TaskStatus = 'none' | 'pending' | 'queued' | 'sent' | 'cancelled' | 'expired' | 'failed' | 'succeeded' | 'error';

export const TaskStatus = {
    None: 'none' as TaskStatus,
    Pending: 'pending' as TaskStatus,
    Queued: 'queued' as TaskStatus,
    Sent: 'sent' as TaskStatus,
    Cancelled: 'cancelled' as TaskStatus,
    Expired: 'expired' as TaskStatus,
    Failed: 'failed' as TaskStatus,
    Succeeded: 'succeeded' as TaskStatus,
    Error: 'error' as TaskStatus
};

