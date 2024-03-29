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

import { BondAgent } from '../model/models';
import { ProblemDetails } from '../model/models';

import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';



@Injectable({
  providedIn: 'root'
})
export class BondAgentService {

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
     * Creates a new BondAgent
     * Creates a new BondAgent with the attributes specified  &lt;para /&gt;  Accessible only to a SuperUser or an Administrator
     * @param bondAgent The data to create the BondAgent with
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public createBondAgent(bondAgent?: BondAgent, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<BondAgent>;
  public createBondAgent(bondAgent?: BondAgent, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpResponse<BondAgent>>;
  public createBondAgent(bondAgent?: BondAgent, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpEvent<BondAgent>>;
  public createBondAgent(bondAgent?: BondAgent, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<any> {

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

    return this.httpClient.post<BondAgent>(`${this.configuration.basePath}/api/bondagents`,
      bondAgent,
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
     * Deletes a BondAgent
     * Deletes a BondAgent with the specified id  &lt;para /&gt;  Accessible only to a SuperUser or a User on an Admin Team within the specified BondAgent
     * @param id The id of the BondAgent to delete
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public deleteBondAgent(id: string, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json'}): Observable<any>;
  public deleteBondAgent(id: string, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json'}): Observable<HttpResponse<any>>;
  public deleteBondAgent(id: string, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json'}): Observable<HttpEvent<any>>;
  public deleteBondAgent(id: string, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'application/json'}): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling deleteBondAgent.');
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

    return this.httpClient.delete<any>(`${this.configuration.basePath}/api/bondagents/${encodeURIComponent(String(id))}`,
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
     * Gets a specific BondAgent by id
     * Returns the BondAgent with the id specified  &lt;para /&gt;  Accessible to a SuperUser or a User that is a member of a Team within the specified BondAgent
     * @param id The id of the BondAgent
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getBondAgent(id: string, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<BondAgent>;
  public getBondAgent(id: string, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpResponse<BondAgent>>;
  public getBondAgent(id: string, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpEvent<BondAgent>>;
  public getBondAgent(id: string, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling getBondAgent.');
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

    return this.httpClient.get<BondAgent>(`${this.configuration.basePath}/api/bondagents/${encodeURIComponent(String(id))}`,
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
     * Gets all BondAgent in the system
     * Returns a list of all of the BondAgents in the system.  &lt;para /&gt;  Only accessible to a SuperUser
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public getBondAgents(observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<Array<BondAgent>>;
  public getBondAgents(observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpResponse<Array<BondAgent>>>;
  public getBondAgents(observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpEvent<Array<BondAgent>>>;
  public getBondAgents(observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<any> {

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

    return this.httpClient.get<Array<BondAgent>>(`${this.configuration.basePath}/api/bondagents`,
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
     * Updates a BondAgent
     * Updates a BondAgent with the attributes specified  &lt;para /&gt;  Accessible only to a SuperUser or a User on an Admin Team within the specified BondAgent
     * @param id The Id of the Exericse to update
     * @param bondAgent The updated BondAgent values
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
  public updateBondAgent(id: string, bondAgent?: BondAgent, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<BondAgent>;
  public updateBondAgent(id: string, bondAgent?: BondAgent, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpResponse<BondAgent>>;
  public updateBondAgent(id: string, bondAgent?: BondAgent, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<HttpEvent<BondAgent>>;
  public updateBondAgent(id: string, bondAgent?: BondAgent, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'text/plain' | 'application/json' | 'text/json'}): Observable<any> {
    if (id === null || id === undefined) {
      throw new Error('Required parameter id was null or undefined when calling updateBondAgent.');
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

    return this.httpClient.put<BondAgent>(`${this.configuration.basePath}/api/bondagents/${encodeURIComponent(String(id))}`,
      bondAgent,
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
