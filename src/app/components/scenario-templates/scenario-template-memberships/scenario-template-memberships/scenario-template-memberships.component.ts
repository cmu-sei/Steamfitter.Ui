/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { combineLatest, forkJoin, Observable, of } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { ScenarioTemplateQuery } from 'src/app/data/scenario-template/scenario-template.query';
import { ScenarioTemplateMembershipDataService } from 'src/app/data/scenario-template/scenario-template-membership-data.service';
import { ScenarioTemplateRoleDataService } from 'src/app/data/scenario-template/scenario-template-role-data.service';
import { UserQuery } from 'src/app/data/user/user.query';
import { UserDataService } from 'src/app/data/user/user-data.service';
import {
  ScenarioTemplateMembership,
  ScenarioTemplate,
} from 'src/app/generated/steamfitter.api';
import { GroupDataService } from 'src/app/data/group/group-data.service';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-scenario-template-memberships',
  templateUrl: './scenario-template-memberships.component.html',
  styleUrls: ['./scenario-template-memberships.component.scss'],
})
export class ScenarioTemplateMembershipsComponent implements OnInit, OnChanges {
  @Input() embedded: boolean;
  @Input() scenarioTemplateId: string;
  @Output() goBack = new EventEmitter();

  scenarioTemplate$: Observable<ScenarioTemplate>;

  memberships$ =
    this.scenarioTemplateMembershipDataService.scenarioTemplateMemberships$;
  roles$ = this.scenarioTemplateRolesDataService.scenarioTemplateRoles$;

  // All users that are not already members of the scenarioTemplate
  nonMembers$ = this.selectUsers(false);
  members$ = this.selectUsers(true);

  groupNonMembers$ = this.selectGroups(false);
  groupMembers$ = this.selectGroups(true);

  canEdit$: Observable<boolean>;

  constructor(
    private scenarioTemplateQuery: ScenarioTemplateQuery,
    private scenarioTemplateMembershipDataService: ScenarioTemplateMembershipDataService,
    private scenarioTemplateRolesDataService: ScenarioTemplateRoleDataService,
    private userDataService: UserDataService,
    private userQuery: UserQuery,
    private groupDataService: GroupDataService,
    private permissionDataService: PermissionDataService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    forkJoin([
      this.scenarioTemplateMembershipDataService.loadMemberships(
        this.scenarioTemplateId
      ),
      this.userDataService.load(),
      this.scenarioTemplateRolesDataService.loadRoles(),
      this.groupDataService.load(),
    ]).subscribe();
    this.permissionDataService
      .loadScenarioTemplatePermissions(this.scenarioTemplateId)
      .subscribe((x) =>
        this.canEdit$ = of(this.permissionDataService.canEditScenarioTemplate(this.scenarioTemplateId)));
  }

  ngOnChanges(changes: SimpleChanges) {
    this.scenarioTemplate$ = this.scenarioTemplateQuery
      .selectEntity(this.scenarioTemplateId)
      .pipe(
        filter((x) => x != null),
        tap(
          (x) => {
            this.canEdit$ = of(this.permissionDataService.canEditScenarioTemplate(this.scenarioTemplateId));
          })
      );
  }

  selectUsers(members: boolean) {
    return combineLatest([this.userQuery.selectAll(), this.memberships$]).pipe(
      map(([users, memberships]) => {
        return users.filter((user) => {
          if (members) {
            return (
              memberships.length > 0 &&
              memberships.some((y) => y.userId == user.id)
            );
          } else {
            return (
              memberships.length === 0 ||
              !memberships.some((y) => y.userId == user.id)
            );
          }
        });
      })
    );
  }

  selectGroups(members: boolean) {
    return combineLatest([
      this.groupDataService.groups$,
      this.memberships$,
    ]).pipe(
      map(([groups, memberships]) => {
        return groups.filter((group) => {
          if (members) {
            return (
              memberships.length > 0 &&
              memberships.some((y) => y.groupId == group.id)
            );
          } else {
            return (
              memberships.length === 0 ||
              !memberships.some((y) => y.groupId == group.id)
            );
          }
        });
      })
    );
  }

  createMembership(scenarioTemplateMembership: ScenarioTemplateMembership) {
    scenarioTemplateMembership.scenarioTemplateId = this.scenarioTemplateId;
    this.scenarioTemplateMembershipDataService
      .createMembership(this.scenarioTemplateId, scenarioTemplateMembership)
      .subscribe();
  }

  deleteMembership(id: string) {
    this.scenarioTemplateMembershipDataService.deleteMembership(id).subscribe();
  }

  editMembership(scenarioTemplateMembership: ScenarioTemplateMembership) {
    this.scenarioTemplateMembershipDataService
      .editMembership(scenarioTemplateMembership)
      .subscribe();
  }
}
