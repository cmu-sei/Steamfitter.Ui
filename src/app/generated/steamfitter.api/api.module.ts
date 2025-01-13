import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { Configuration } from './configuration';
import { HttpClient } from '@angular/common/http';

import { GroupService } from './api/group.service';
import { HealthService } from './api/health.service';
import { PlayerService } from './api/player.service';
import { ResultService } from './api/result.service';
import { ScenarioService } from './api/scenario.service';
import { ScenarioMembershipsService } from './api/scenarioMemberships.service';
import { ScenarioPermissionsService } from './api/scenarioPermissions.service';
import { ScenarioRolesService } from './api/scenarioRoles.service';
import { ScenarioTemplateService } from './api/scenarioTemplate.service';
import { ScenarioTemplateMembershipsService } from './api/scenarioTemplateMemberships.service';
import { ScenarioTemplatePermissionsService } from './api/scenarioTemplatePermissions.service';
import { ScenarioTemplateRolesService } from './api/scenarioTemplateRoles.service';
import { SystemPermissionsService } from './api/systemPermissions.service';
import { SystemRolesService } from './api/systemRoles.service';
import { TaskService } from './api/task.service';
import { UserService } from './api/user.service';
import { VmCredentialService } from './api/vmCredential.service';

@NgModule({
  imports:      [],
  declarations: [],
  exports:      [],
  providers: []
})
export class ApiModule {
    public static forRoot(configurationFactory: () => Configuration): ModuleWithProviders<ApiModule> {
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
