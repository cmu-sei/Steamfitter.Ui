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
import { TaskIterationTermination } from './taskIterationTermination';
import { TaskTrigger } from './taskTrigger';
import { TaskAction } from './taskAction';


export interface TaskForm { 
    name?: string | null;
    description?: string | null;
    scenarioTemplateId?: string | null;
    scenarioId?: string | null;
    userId?: string | null;
    action?: TaskAction;
    vmMask?: string | null;
    vmList?: Array<string> | null;
    apiUrl?: string | null;
    actionParameters?: { [key: string]: string; } | null;
    expectedOutput?: string | null;
    expirationSeconds?: number;
    delaySeconds?: number;
    intervalSeconds?: number;
    iterations?: number;
    iterationTermination?: TaskIterationTermination;
    currentIteration?: number;
    triggerTaskId?: string | null;
    triggerCondition?: TaskTrigger;
    score?: number;
    userExecutable?: boolean;
    repeatable?: boolean;
    executable?: boolean;
}

