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
import { combineLatest, forkJoin, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { ScenarioQuery } from 'src/app/data/scenario/scenario.query';
import { ScenarioMembershipDataService } from 'src/app/data/scenario/scenario-membership-data.service';
import { ScenarioRoleDataService } from 'src/app/data/scenario/scenario-role-data.service';
import { UserQuery } from 'src/app/data/user/user.query';
import { UserDataService } from 'src/app/data/user/user-data.service';
import {
  ScenarioMembership,
  Scenario,
} from 'src/app/generated/steamfitter.api';
import { GroupDataService } from 'src/app/data/group/group-data.service';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';

@Component({
  selector: 'app-scenario-memberships',
  templateUrl: './scenario-memberships.component.html',
  styleUrls: ['./scenario-memberships.component.scss'],
})
export class ScenarioMembershipsComponent implements OnInit, OnChanges {
  @Input() embedded: boolean;
  @Input() scenarioId: string;
  @Output() goBack = new EventEmitter();

  scenario$: Observable<Scenario>;

  memberships$ = this.scenarioMembershipDataService.scenarioMemberships$;
  roles$ = this.scenarioRolesDataService.scenarioRoles$;

  // All users that are not already members of the scenario
  nonMembers$ = this.selectUsers(false);
  members$ = this.selectUsers(true);

  groupNonMembers$ = this.selectGroups(false);
  groupMembers$ = this.selectGroups(true);

  canEdit: boolean;

  constructor(
    private scenarioQuery: ScenarioQuery,
    private scenarioMembershipDataService: ScenarioMembershipDataService,
    private scenarioRolesDataService: ScenarioRoleDataService,
    private userDataService: UserDataService,
    private userQuery: UserQuery,
    private groupDataService: GroupDataService,
    private permissionDataService: PermissionDataService
  ) {}

  ngOnInit(): void {
    forkJoin([
      this.scenarioMembershipDataService.loadMemberships(this.scenarioId),
      this.userDataService.load(),
      this.scenarioRolesDataService.loadRoles(),
      this.groupDataService.load(),
    ]).subscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.scenario$ = this.scenarioQuery.selectEntity(this.scenarioId).pipe(
      filter((x) => x != null),
      tap(
        (x) => (this.canEdit = this.permissionDataService.canEditScenario(x.id))
      )
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

  createMembership(scenarioMembership: ScenarioMembership) {
    scenarioMembership.scenarioId = this.scenarioId;
    this.scenarioMembershipDataService
      .createMembership(this.scenarioId, scenarioMembership)
      .subscribe();
  }

  deleteMembership(id: string) {
    this.scenarioMembershipDataService.deleteMembership(id).subscribe();
  }

  editMembership(scenarioMembership: ScenarioMembership) {
    this.scenarioMembershipDataService
      .editMembership(scenarioMembership)
      .subscribe();
  }
}
