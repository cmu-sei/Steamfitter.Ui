// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Group,
  GroupService,
  ScenarioMembership,
  ScenarioMembershipsService,
  ScenarioRole,
  ScenarioRolesService,
  User,
  UserService,
} from 'src/app/generated/steamfitter.api';
import { ScenarioStore } from 'src/app/data/scenario/scenario.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import {
  PermissionGrants,
  permissionDataProviders,
} from 'src/app/test-utils/mock-permission-data.service';
import { ScenarioMembershipsComponent } from './scenario-memberships.component';

@Component({
  selector: 'app-scenario-membership-list',
  template: '',
  standalone: false,
})
class MembershipListStubComponent {
  @Input() users?: User[];
  @Input() groups?: Group[];
  @Input() canEdit?: boolean;
  @Output() createMembership = new EventEmitter<ScenarioMembership>();
}

@Component({
  selector: 'app-scenario-member-list',
  template: '',
  standalone: false,
})
class MemberListStubComponent {
  @Input() memberships?: ScenarioMembership[];
  @Input() users?: User[];
  @Input() groups?: Group[];
  @Input() roles?: ScenarioRole[];
  @Input() canEdit?: boolean;
  @Output() deleteMembership = new EventEmitter<string>();
  @Output() editMembership = new EventEmitter<ScenarioMembership>();
}

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];
const GROUPS: Group[] = [{ id: 'g1', name: 'Blue Team' }];

async function renderMemberships(
  grants: PermissionGrants,
  inputs: { embedded?: boolean } = {},
) {
  const membershipApi = {
    getAllScenarioMemberships: vi.fn(() =>
      of<ScenarioMembership[]>([
        { id: 'm1', scenarioId: 's1', userId: 'u1', roleId: 'r1' },
      ]),
    ),
    createScenarioMembership: vi.fn(
      (scenarioId: string, membership: ScenarioMembership) =>
        of<ScenarioMembership>({ ...membership, id: 'm2' }),
    ),
    deleteScenarioMembership: vi.fn(() => of(null)),
  } satisfies ApiStub<ScenarioMembershipsService>;
  const rendered = await renderComponent(ScenarioMembershipsComponent, {
    declarations: [
      ScenarioMembershipsComponent,
      MembershipListStubComponent,
      MemberListStubComponent,
    ],
    imports: [MatButtonModule, MatIconModule, MatTooltipModule],
    providers: [
      ...permissionDataProviders(grants),
      { provide: ScenarioMembershipsService, useValue: membershipApi },
      {
        provide: ScenarioRolesService,
        useValue: {
          getAllScenarioRoles: vi.fn(() =>
            of<ScenarioRole[]>([{ id: 'r1', name: 'Member' }]),
          ),
        } satisfies ApiStub<ScenarioRolesService>,
      },
      {
        provide: UserService,
        useValue: {
          getUsers: vi.fn(() => of(structuredClone(USERS))),
        } satisfies ApiStub<UserService>,
      },
      {
        provide: GroupService,
        useValue: {
          getAllGroups: vi.fn(() => of(structuredClone(GROUPS))),
        } satisfies ApiStub<GroupService>,
      },
    ],
    inputs: { scenarioId: 's1', ...inputs },
  });
  const stub = <T>(type: new (...args: never[]) => T): T =>
    rendered.fixture.debugElement.query(By.directive(type)).componentInstance;
  return {
    ...rendered,
    membershipApi,
    candidates: () => stub(MembershipListStubComponent),
    members: () => stub(MemberListStubComponent),
  };
}

describe('ScenarioMembershipsComponent', () => {
  /**
   * Verifies: both lists get canEdit true for a user who manages this scenario, through the scenario claim or the system permission.
   * Interacts with: real PermissionDataService.loadScenarioPermissions and canEditScenario, both list stubs' canEdit inputs.
   * Data: ManageScenario on s1, or system ManageScenarios.
   */
  it.each([
    {
      label: 'ManageScenario on the scenario',
      grants: {
        scenarios: [{ scenarioId: 's1', permissions: ['ManageScenario'] }],
      },
    },
    {
      label: 'system ManageScenarios',
      grants: { system: ['ManageScenarios'] },
    },
  ] as Array<{ label: string; grants: PermissionGrants }>)(
    'passes canEdit true to both lists for $label',
    async ({ grants }) => {
      const { candidates, members } = await renderMemberships(grants);

      expect([candidates().canEdit, members().canEdit]).toEqual([true, true]);
    },
  );

  /**
   * Verifies: a user who can only edit the scenario also gets canEdit true on its memberships (current behavior).
   * Interacts with: real PermissionDataService.loadScenarioPermissions and canEditScenario, both list stubs' canEdit inputs.
   * Data: EditScenario on s1, or system EditScenarios.
   */
  it.each([
    {
      label: 'EditScenario on the scenario',
      grants: {
        scenarios: [{ scenarioId: 's1', permissions: ['EditScenario'] }],
      },
    },
    { label: 'system EditScenarios', grants: { system: ['EditScenarios'] } },
  ] as Array<{ label: string; grants: PermissionGrants }>)(
    'passes canEdit true to both lists for an editor with $label',
    async ({ grants }) => {
      const { candidates, members } = await renderMemberships(grants);

      // Current behavior; see agent-docs/ui-test-bugs/steamfitter.ui.md.
      expect([candidates().canEdit, members().canEdit]).toEqual([true, true]);
    },
  );

  /**
   * Verifies: near misses get canEdit false on both lists, so neither offers Add, Remove or a role change.
   * Interacts with: real PermissionDataService.canEditScenario, both list stubs' canEdit inputs.
   * Data: View and Execute on s1; Manage on another scenario; system View and Execute.
   */
  it.each([
    {
      label: 'View and Execute on the scenario',
      grants: {
        scenarios: [
          {
            scenarioId: 's1',
            permissions: ['ViewScenario', 'ExecuteScenario'],
          },
        ],
      },
    },
    {
      label: 'ManageScenario on another scenario',
      grants: {
        scenarios: [{ scenarioId: 's2', permissions: ['ManageScenario'] }],
      },
    },
    {
      label: 'system ViewScenarios and ExecuteScenarios',
      grants: { system: ['ViewScenarios', 'ExecuteScenarios'] },
    },
  ] as Array<{ label: string; grants: PermissionGrants }>)(
    'passes canEdit false to both lists for $label',
    async ({ grants }) => {
      const { candidates, members } = await renderMemberships(grants);

      expect(candidates().canEdit).toBe(false);
      expect(members().canEdit).toBe(false);
    },
  );

  /**
   * Verifies: members and non-members are split between the two lists, and an added user moves into the member list.
   * Interacts with: real ScenarioMembershipDataService over ScenarioMembershipsService, real UserDataService and GroupDataService, the createMembership output.
   * Data: ManageScenarios; Alice is a member; Bob is added.
   */
  it('moves an added user into the member list', async () => {
    const { candidates, members, membershipApi, fixture } =
      await renderMemberships({ system: ['ManageScenarios'] });
    expect(members().users?.map((u) => u.name)).toEqual(['Alice']);
    expect(candidates().users?.map((u) => u.name)).toEqual(['Bob']);
    expect(candidates().groups?.map((g) => g.name)).toEqual(['Blue Team']);

    candidates().createMembership.emit({ userId: 'u2' });
    fixture.detectChanges();

    expect(membershipApi.createScenarioMembership).toHaveBeenCalledWith('s1', {
      userId: 'u2',
      scenarioId: 's1',
    });
    expect(members().users?.map((u) => u.name)).toEqual(['Alice', 'Bob']);
    expect(candidates().users).toEqual([]);
  });

  /**
   * Verifies: the header shows the scenario name and, when embedded, a Return button that emits goBack.
   * Interacts with: real ScenarioStore and ScenarioQuery, the goBack output.
   * Data: scenario s1 'Alpha' in the store; embedded true.
   */
  it('shows the scenario name and returns when embedded', async () => {
    const { fixture } = await renderMemberships(
      { system: ['ManageScenarios'] },
      { embedded: true },
    );
    TestBed.inject(ScenarioStore).set([{ id: 's1', name: 'Alpha' }]);
    fixture.detectChanges();
    // MatTooltip sets its aria description in a microtask.
    await fixture.whenStable();
    const back = vi.fn();
    fixture.componentInstance.goBack.subscribe(back);

    expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { description: 'Return' }));

    expect(back).toHaveBeenCalledTimes(1);
  });
});
