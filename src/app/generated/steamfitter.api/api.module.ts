// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { Configuration } from './configuration';
import { HttpClient } from '@angular/common/http';


import { BondAgentService } from './api/bondAgent.service';
import { FilesService } from './api/files.service';
import { PermissionService } from './api/permission.service';
import { PlayerService } from './api/player.service';
import { ResultService } from './api/result.service';
import { ScenarioService } from './api/scenario.service';
import { ScenarioTemplateService } from './api/scenarioTemplate.service';
import { TaskService } from './api/task.service';
import { UserService } from './api/user.service';
import { UserPermissionService } from './api/userPermission.service';
import { VmCredentialService } from './api/vmCredential.service';

@NgModule({
  imports:      [],
  declarations: [],
  exports:      [],
  providers: [
    BondAgentService,
    FilesService,
    PermissionService,
    PlayerService,
    ResultService,
    ScenarioService,
    ScenarioTemplateService,
    TaskService,
    UserService,
    UserPermissionService,
    VmCredentialService ]
})
export class ApiModule {
    public static forRoot(configurationFactory: () => Configuration): ModuleWithProviders {
        return {
            ngModule: ApiModule,
            providers: [ { provide: Configuration, useFactory: configurationFactory } ]
        };
    }

    constructor( @Optional() @SkipSelf() parentModule: ApiModule,
                 @Optional() http: HttpClient) {
        if (parentModule) {
            throw new Error('ApiModule is already loaded. Import in your base AppModule only.');
        }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
            'See also https://github.com/angular/angular/issues/20575');
        }
    }
}
