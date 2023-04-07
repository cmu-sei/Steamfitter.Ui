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
import { DirectoryInfo } from './directoryInfo';
import { FileAttributes } from './fileAttributes';


export interface FileInfo {
  readonly length?: number;
  readonly directoryName?: string | null;
  directory?: DirectoryInfo;
  isReadOnly?: boolean;
  readonly fullName?: string | null;
  readonly extension?: string | null;
  readonly name?: string | null;
  readonly exists?: boolean;
  creationTime?: Date;
  creationTimeUtc?: Date;
  lastAccessTime?: Date;
  lastAccessTimeUtc?: Date;
  lastWriteTime?: Date;
  lastWriteTimeUtc?: Date;
  attributes?: FileAttributes;
}

