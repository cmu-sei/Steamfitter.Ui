// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  MatTooltipDefaultOptions,
  MatTooltipModule,
  MAT_TOOLTIP_DEFAULT_OPTIONS,
} from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  ComnAuthModule,
  ComnSettingsConfig,
  ComnSettingsModule,
  ComnSettingsService,
} from '@cmusei/crucible-common';
import { AkitaNgRouterStoreModule } from '@datorama/akita-ng-router-store';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { ClipboardModule } from 'ngx-clipboard';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdminContainerComponent } from './components/admin/admin-container/admin-container.component';
import { AdminGroupsComponent } from './components/admin/admin-groups/admin-groups.component';
import { AdminGroupsDetailComponent } from './components/admin/admin-groups/admin-groups-detail/admin-groups-detail.component';
import { AdminGroupsMemberListComponent } from './components/admin/admin-groups/admin-groups-member-list/admin-groups-member-list.component';
import { AdminGroupsMembershipListComponent } from './components/admin/admin-groups/admin-groups-membership-list/admin-groups-membership-list.component';
import { AdminRolesComponent } from './components/admin/admin-roles/admin-roles.component';
import { AdminScenarioRolesComponent } from './components/admin/admin-roles/admin-scenario-roles/admin-scenario-roles.component';
import { AdminScenariosComponent } from './components/admin/admin-scenarios/admin-scenarios.component';
import { AdminScenarioTemplatesComponent } from './components/admin/admin-scenario-templates/admin-scenario-templates.component';
import { AdminScenarioTemplateRolesComponent } from './components/admin/admin-roles/admin-scenario-template-roles/admin-scenario-template-roles.component';
import { AdminSystemRolesComponent } from './components/admin/admin-roles/admin-system-roles/admin-system-roles.component';
import { AdminUserListComponent } from './components/admin/admin-users/admin-user-list/admin-user-list.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { HistoryComponent } from './components/history/history.component';
import { HomeAppComponent } from './components/home-app/home-app.component';
import { NameDialogComponent } from './components/shared/name-dialog/name-dialog.component';
import { ResultsComponent } from './components/results/results.component';
import { ScenarioTemplateEditDialogComponent } from './components/scenario-templates/scenario-template-edit-dialog/scenario-template-edit-dialog.component';
import { ScenarioTemplateEditComponent } from './components/scenario-templates/scenario-template-edit/scenario-template-edit.component';
import { ScenarioTemplateListComponent } from './components/scenario-templates/scenario-template-list/scenario-template-list.component';
import { ScenarioTemplateMembershipsComponent } from './components/scenario-templates/scenario-template-memberships/scenario-template-memberships/scenario-template-memberships.component';
import { ScenarioTemplateMemberListComponent } from './components/scenario-templates/scenario-template-memberships/scenario-template-member-list/scenario-template-member-list.component';
import { ScenarioTemplateMembershipListComponent } from './components/scenario-templates/scenario-template-memberships/scenario-template-membership-list/scenario-template-membership-list.component';
import { ScenarioTemplatesComponent } from './components/scenario-templates/scenario-templates.component';
import { ScenarioEditDialogComponent } from './components/scenarios/scenario-edit-dialog/scenario-edit-dialog.component';
import { ScenarioEditComponent } from './components/scenarios/scenario-edit/scenario-edit.component';
import { ScenarioListComponent } from './components/scenarios/scenario-list/scenario-list.component';
import { ScenariosComponent } from './components/scenarios/scenarios.component';
import { ScenarioMembershipsComponent } from './components/scenarios/scenario-memberships/scenario-memberships/scenario-memberships.component';
import { ScenarioMemberListComponent } from './components/scenarios/scenario-memberships/scenario-member-list/scenario-member-list.component';
import { ScenarioMembershipListComponent } from './components/scenarios/scenario-memberships/scenario-membership-list/scenario-membership-list.component';
import { AddDialogComponent } from './components/vm-credentials/add-dialog/add-dialog.component';
import { CwdDialogsModule } from './components/shared/confirm-dialog/cwd-dialogs.module';
import { SystemMessageComponent } from './components/shared/system-message/system-message.component';
import { TopbarComponent } from './components/shared/top-bar/topbar.component';
import { TaskEditComponent } from './components/tasks/task-edit/task-edit.component';
import { TaskTreeComponent } from './components/tasks/task-tree/task-tree.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { VmListComponent } from './components/vm-list/vm-list.component';
import { VmCredentialsComponent } from './components/vm-credentials/vm-credentials.component';
import { VmTaskExecuteComponent } from './components/vm-task-execute/vm-task-execute.component';
import { UserDataService } from './data/user/user-data.service';
import { DialogService } from './services/dialog/dialog.service';
import { SystemMessageService } from './services/system-message/system-message.service';
import { BASE_PATH } from './generated/steamfitter.api';
import { ApiModule as SwaggerCodegenApiModule } from './generated/steamfitter.api/api.module';
import { ManualTasksPageComponent } from './components/manual-tasks-page/manual-tasks-page.component';
import { ManualTasksListComponent } from './components/tasks/manual-tasks/manual-tasks-list/manual-tasks-list.component';

const settings: ComnSettingsConfig = {
  url: 'assets/config/settings.json',
  envUrl: 'assets/config/settings.env.json',
};

export function getBasePath(settingsSvc: ComnSettingsService) {
  return settingsSvc.settings.ApiUrl;
}

/** Custom options the configure the tooltip's default show/hide delays. */
export const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 0,
  touchendHideDelay: 1000,
};

@NgModule({ declarations: [
        AppComponent,
        HomeAppComponent,
        VmListComponent,
        SystemMessageComponent,
        VmTaskExecuteComponent,
        ScenarioTemplatesComponent,
        ScenarioTemplateEditComponent,
        ScenarioTemplateEditDialogComponent,
        ScenarioTemplateListComponent,
        ScenarioTemplateMemberListComponent,
        ScenarioTemplateMembershipListComponent,
        ScenarioTemplateMembershipsComponent,
        ScenariosComponent,
        ScenarioEditComponent,
        ScenarioEditDialogComponent,
        ScenarioListComponent,
        ScenarioMemberListComponent,
        ScenarioMembershipListComponent,
        ScenarioMembershipsComponent,
        ResultsComponent,
        AddDialogComponent,
        HistoryComponent,
        TaskTreeComponent,
        TaskEditComponent,
        TasksComponent,
        VmCredentialsComponent,
        AdminContainerComponent,
        AdminGroupsComponent,
        AdminGroupsDetailComponent,
        AdminGroupsMemberListComponent,
        AdminGroupsMembershipListComponent,
        AdminRolesComponent,
        AdminScenarioRolesComponent,
        AdminScenarioTemplateRolesComponent,
        AdminScenariosComponent,
        AdminScenarioTemplatesComponent,
        AdminSystemRolesComponent,
        AdminUsersComponent,
        AdminUserListComponent,
        TopbarComponent,
        ManualTasksPageComponent,
        ManualTasksListComponent,
        NameDialogComponent,
    ],
    exports: [MatSortModule],
    bootstrap: [AppComponent], imports: [AkitaNgDevtools.forRoot(),
        AkitaNgRouterStoreModule,
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        SwaggerCodegenApiModule,
        FormsModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatCheckboxModule,
        MatChipsModule,
        MatDatepickerModule,
        MatDialogModule,
        MatExpansionModule,
        MatGridListModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatNativeDateModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatRadioModule,
        MatRippleModule,
        MatSelectModule,
        MatSidenavModule,
        MatSliderModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatSortModule,
        MatTableModule,
        MatTabsModule,
        MatToolbarModule,
        MatTooltipModule,
        MatStepperModule,
        MatBottomSheetModule,
        MatBadgeModule,
        MatFormFieldModule,
        MatDatepickerModule,
        CdkTableModule,
        MatTreeModule,
        CdkTreeModule,
        ClipboardModule,
        ComnAuthModule.forRoot(),
        ComnSettingsModule.forRoot(),
        CwdDialogsModule], providers: [
        DialogService,
        SystemMessageService,
        UserDataService,
        {
            provide: BASE_PATH,
            useFactory: getBasePath,
            deps: [ComnSettingsService],
        },
        { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults },
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule { }
