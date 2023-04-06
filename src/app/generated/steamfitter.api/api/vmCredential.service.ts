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
/* tslint:disable:no-unused-variable member-ordering */

import { Inject, Injectable, Optional }                      from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams,
  HttpResponse, HttpEvent, HttpParameterCodec }       from '@angular/common/http';
import { CustomHttpParameterCodec }                          from '../encoder';
import { Observable }                                        from 'rxjs';

import { ProblemDetails } from '../model/models';
import { VmCredential } from '../model/models';

import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';



@Injectable({
  providedIn: 'root'
})
export class VmCredentialService {

  protected basePath = 'http://localhost';
  public defaultHeaders = new HttpHeaders();
  public configuration = new Configuration();
  public encoder: HttpParameterCodec;

  constructor(protected httpClient: HttpClient, @Optional()@Inject(BASE_PATH) basePath: string, @Optional() configuration: Configuration) {
    if (configuration) {
      this.configuration = configuration;
    }
    if (typeof this.configuration.basePath !== 'string') {
      if (typeof basePath !== 'string') {
        basePath = this.basePath;
      }
      this.configuration.basePath = basePath;
    }
    this.encoder = this.configuration.encoder || new CustomHttpParameterCodec();
  }


  private addToHttpParams(httpParams: HttpParams, value: any, key?: string): HttpParams {
    if (typeof value === 'object' && value instanceof Date === false) {
      httpParams = this.addToHttpParamsRecursive(httpParams, value);
    } else {
      httpParams = this.addToHttpParamsRecursive(httpParams, value, key);
    }
    return httpParams;
  }

  private addToHttpParamsRecursive(httpParams: HttpParams, value?: any, key?: string): HttpParams {
    if (value == null) {
      return httpParams;
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        (value as any[]).forEach( elem => httpParams = this.addToHttpParamsRecursive(httpParams, elem, key));
      } else if (value instanceof Date) {
        if (key != null) {
          httpParams = httpParams.append(key,
            (value as Date).toISOString().substr(0, 10));
        } else {
          throw Error('key may not be null if value is Date');
        }
      } else {
        Object.keys(value).forEach( k => httpParams = this.addToHttpParamsRecursive(
          httpParams, value[k], key != null ? `${key}.${k}` : k));
      }
    } else if (key != null) {
      httpParams = httpParams.append(key, value);
    } else {
      throw Error('key may not be null if value is not object or array');
    }
    return httpParams;
  }

  /**
     * Creates a new VmCredential
     * Creates a new VmCredential with the attributes specified  &lt;para /&gt;  Accessible only to a SuperUser or an Administrator
     * @param vmCredential The data to create the VmCredential with
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public createVmCredential(vmCredential?: VmCredential, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<VmCredential>;
  public createVmCredential(vmCredential?: VmCredential, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpResponse<VmCredential>>;
  public createVmCredential(vmCredential?: VmCredential, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpEvent<VmCredential>>;
  public createVmCredential(vmCredential?: VmCredential, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<any> {

    let headers = this.defaultHeaders;

    let credential: string | undefined;
    // authentication (oauth2) required
    credential = this.configuration.lookupCredential('oauth2');
    if (credential) {
      headers = headers.set('Authorization', 'Bearer ' + credential);
    }

    let httpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
    if (httpHeaderAcceptSelected === undefined) {
      // to determine the Accept header
      const httpHeaderAccepts: string[] = [
        'text/plain',
        'application/json',
        'text/json'
      ];
      httpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    }
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }


    // to determine the Content-Type header
    const consumes: string[] = [
      'application/json',
      'text/json',
      'application/_*+json'
    ];
    const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
    if (httpContentTypeSelected !== undefined) {
      headers = headers.set('Content-Type', httpContentTypeSelected);
    }

    let responseType: 'text' | 'json' = 'json';
    if (httpHeaderAcceptSelected && httpHeaderAcceptSelected.startsWith('text')) {
      responseType = 'text';
    }

    return this.httpClient.post<VmCredential>(`${this.configuration.basePath}/api/vmcredentials`,
      vmCredential,
      {
        responseType: <any>responseType,
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Deletes a VmCredential
     * Deletes a VmCredential with the specified id  &lt;para /&gt;  Accessible only to a SuperUser or a User on an Admin Team within the specified VmCredential
     * @param id The id of the VmCredential to delete
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public deleteVmCredential(id: string, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json'}): Observable<any>;
  public deleteVmCredential(id: string, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json'}): Observable<HttpResponse<any>>;
  public deleteVmCredential(id: string, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json'}): Observable<HttpEvent<any>>;
  public deleteVmCredential(id: string, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'application/json'}): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling deleteVmCredential.');
    }

    let headers = this.defaultHeaders;

    let credential: string | undefined;
    // authentication (oauth2) required
    credential = this.configuration.lookupCredential('oauth2');
    if (credential) {
      headers = headers.set('Authorization', 'Bearer ' + credential);
    }

    let httpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
    if (httpHeaderAcceptSelected === undefined) {
      // to determine the Accept header
      const httpHeaderAccepts: string[] = [
        'application/json'
      ];
      httpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    }
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }


    let responseType: 'text' | 'json' = 'json';
    if (httpHeaderAcceptSelected && httpHeaderAcceptSelected.startsWith('text')) {
      responseType = 'text';
    }

    return this.httpClient.delete<any>(`${this.configuration.basePath}/api/vmcredentials/${encodeURIComponent(String(id))}`,
      {
        responseType: <any>responseType,
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets all VmCredentials for a ScenarioTemplate
     * Returns all VmCredentials for the specified ScenarioTemplate
     * @param id
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getScenarioTemplateVmCredentials(id: string, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<Array<VmCredential>>;
  public getScenarioTemplateVmCredentials(id: string, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpResponse<Array<VmCredential>>>;
  public getScenarioTemplateVmCredentials(id: string, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpEvent<Array<VmCredential>>>;
  public getScenarioTemplateVmCredentials(id: string, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling getScenarioTemplateVmCredentials.');
    }

    let headers = this.defaultHeaders;

    let credential: string | undefined;
    // authentication (oauth2) required
    credential = this.configuration.lookupCredential('oauth2');
    if (credential) {
      headers = headers.set('Authorization', 'Bearer ' + credential);
    }

    let httpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
    if (httpHeaderAcceptSelected === undefined) {
      // to determine the Accept header
      const httpHeaderAccepts: string[] = [
        'text/plain',
        'application/json',
        'text/json'
      ];
      httpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    }
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }


    let responseType: 'text' | 'json' = 'json';
    if (httpHeaderAcceptSelected && httpHeaderAcceptSelected.startsWith('text')) {
      responseType = 'text';
    }

    return this.httpClient.get<Array<VmCredential>>(`${this.configuration.basePath}/api/scenariotemplates/${encodeURIComponent(String(id))}/vmcredentials`,
      {
        responseType: <any>responseType,
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets all VmCredentials for a Scenario
     * Returns all VmCredentials for the specified Scenario
     * @param id
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getScenarioVmCredentials(id: string, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<Array<VmCredential>>;
  public getScenarioVmCredentials(id: string, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpResponse<Array<VmCredential>>>;
  public getScenarioVmCredentials(id: string, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpEvent<Array<VmCredential>>>;
  public getScenarioVmCredentials(id: string, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling getScenarioVmCredentials.');
    }

    let headers = this.defaultHeaders;

    let credential: string | undefined;
    // authentication (oauth2) required
    credential = this.configuration.lookupCredential('oauth2');
    if (credential) {
      headers = headers.set('Authorization', 'Bearer ' + credential);
    }

    let httpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
    if (httpHeaderAcceptSelected === undefined) {
      // to determine the Accept header
      const httpHeaderAccepts: string[] = [
        'text/plain',
        'application/json',
        'text/json'
      ];
      httpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    }
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }


    let responseType: 'text' | 'json' = 'json';
    if (httpHeaderAcceptSelected && httpHeaderAcceptSelected.startsWith('text')) {
      responseType = 'text';
    }

    return this.httpClient.get<Array<VmCredential>>(`${this.configuration.basePath}/api/scenarios/${encodeURIComponent(String(id))}/vmcredentials`,
      {
        responseType: <any>responseType,
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets a specific VmCredential by id
     * Returns the VmCredential with the id specified  &lt;para /&gt;  Accessible to a SuperUser or a User that is a member of a Team within the specified VmCredential
     * @param id The id of the STT.Task
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getVmCredential(id: string, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<VmCredential>;
  public getVmCredential(id: string, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpResponse<VmCredential>>;
  public getVmCredential(id: string, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpEvent<VmCredential>>;
  public getVmCredential(id: string, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling getVmCredential.');
    }

    let headers = this.defaultHeaders;

    let credential: string | undefined;
    // authentication (oauth2) required
    credential = this.configuration.lookupCredential('oauth2');
    if (credential) {
      headers = headers.set('Authorization', 'Bearer ' + credential);
    }

    let httpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
    if (httpHeaderAcceptSelected === undefined) {
      // to determine the Accept header
      const httpHeaderAccepts: string[] = [
        'text/plain',
        'application/json',
        'text/json'
      ];
      httpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    }
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }


    let responseType: 'text' | 'json' = 'json';
    if (httpHeaderAcceptSelected && httpHeaderAcceptSelected.startsWith('text')) {
      responseType = 'text';
    }

    return this.httpClient.get<VmCredential>(`${this.configuration.basePath}/api/vmcredentials/${encodeURIComponent(String(id))}`,
      {
        responseType: <any>responseType,
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Gets all VmCredentials in the system
     * Returns a list of all of the VmCredentials in the system.  &lt;para /&gt;  Only accessible to a SuperUser
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getVmCredentials(observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<Array<VmCredential>>;
  public getVmCredentials(observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpResponse<Array<VmCredential>>>;
  public getVmCredentials(observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpEvent<Array<VmCredential>>>;
  public getVmCredentials(observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<any> {

    let headers = this.defaultHeaders;

    let credential: string | undefined;
    // authentication (oauth2) required
    credential = this.configuration.lookupCredential('oauth2');
    if (credential) {
      headers = headers.set('Authorization', 'Bearer ' + credential);
    }

    let httpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
    if (httpHeaderAcceptSelected === undefined) {
      // to determine the Accept header
      const httpHeaderAccepts: string[] = [
        'text/plain',
        'application/json',
        'text/json'
      ];
      httpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    }
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }


    let responseType: 'text' | 'json' = 'json';
    if (httpHeaderAcceptSelected && httpHeaderAcceptSelected.startsWith('text')) {
      responseType = 'text';
    }

    return this.httpClient.get<Array<VmCredential>>(`${this.configuration.basePath}/api/vmcredentials`,
      {
        responseType: <any>responseType,
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

  /**
     * Updates a VmCredential
     * Updates a VmCredential with the attributes specified  &lt;para /&gt;  Accessible only to a SuperUser or a User on an Admin Team within the specified VmCredential
     * @param id The Id of the Exericse to update
     * @param vmCredential The updated VmCredential values
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public updateVmCredential(id: string, vmCredential?: VmCredential, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<VmCredential>;
  public updateVmCredential(id: string, vmCredential?: VmCredential, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpResponse<VmCredential>>;
  public updateVmCredential(id: string, vmCredential?: VmCredential, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpEvent<VmCredential>>;
  public updateVmCredential(id: string, vmCredential?: VmCredential, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling updateVmCredential.');
    }

    let headers = this.defaultHeaders;

    let credential: string | undefined;
    // authentication (oauth2) required
    credential = this.configuration.lookupCredential('oauth2');
    if (credential) {
      headers = headers.set('Authorization', 'Bearer ' + credential);
    }

    let httpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
    if (httpHeaderAcceptSelected === undefined) {
      // to determine the Accept header
      const httpHeaderAccepts: string[] = [
        'text/plain',
        'application/json',
        'text/json'
      ];
      httpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    }
    if (httpHeaderAcceptSelected !== undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }


    // to determine the Content-Type header
    const consumes: string[] = [
      'application/json',
      'text/json',
      'application/_*+json'
    ];
    const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
    if (httpContentTypeSelected !== undefined) {
      headers = headers.set('Content-Type', httpContentTypeSelected);
    }

    let responseType: 'text' | 'json' = 'json';
    if (httpHeaderAcceptSelected && httpHeaderAcceptSelected.startsWith('text')) {
      responseType = 'text';
    }

    return this.httpClient.put<VmCredential>(`${this.configuration.basePath}/api/vmcredentials/${encodeURIComponent(String(id))}`,
      vmCredential,
      {
        responseType: <any>responseType,
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress
      }
    );
  }

}
