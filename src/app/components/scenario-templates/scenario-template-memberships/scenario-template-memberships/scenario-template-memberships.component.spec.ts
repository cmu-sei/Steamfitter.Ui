// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  provideEnvironmentInitializer,
} from '@angular/core';
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
  ScenarioTemplateMembership,
  ScenarioTemplateMembershipsService,
  ScenarioTemplateRole,
  ScenarioTemplateRolesService,
  User,
  UserService,
} from 'src/app/generated/steamfitter.api';
import { ScenarioTemplateStore } from 'src/app/data/scenario-template/scenario-template.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import {
  PermissionGrants,
  permissionDataProviders,
} from 'src/app/test-utils/mock-permission-data.service';
import { ScenarioTemplateMembershipsComponent } from './scenario-template-memberships.component';

@Component({
  selector: 'app-scenario-template-membership-list',
  template: '',
  standalone: false,
})
class MembershipListStubComponent {
  @Input() users?: User[];
  @Input() groups?: Group[];
  @Input() canEdit?: boolean;
  @Output() createMembership = new EventEmitter<ScenarioTemplateMembership>();
}

@Component({
  selector: 'app-scenario-template-member-list',
  template: '',
  standalone: false,
})
class MemberListStubComponent {
  @Input() memberships?: ScenarioTemplateMembership[];
  @Input() users?: User[];
  @Input() groups?: Group[];
  @Input() roles?: ScenarioTemplateRole[];
  @Input() canEdit?: boolean;
  @Output() deleteMembership = new EventEmitter<string>();
  @Output() editMembership = new EventEmitter<ScenarioTemplateMembership>();
}

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];
const GROUPS: Group[] = [{ id: 'g1', name: 'Blue Team' }];

async function renderMemberships(
  grants: PermissionGrants,
  inputs: { embedded?: boolean } = {},
  templateInStore = false,
) {
  const membershipApi = {
    getAllScenarioTemplateMemberships: vi.fn(() =>
      of<ScenarioTemplateMembership[]>([
        { id: 'm1', scenarioTemplateId: 't1', userId: 'u1', roleId: 'r1' },
      ]),
    ),
    createScenarioTemplateMembership: vi.fn(
      (scenarioTemplateId: string, membership: ScenarioTemplateMembership) =>
        of<ScenarioTemplateMembership>({ ...membership, id: 'm2' }),
    ),
    deleteScenarioTemplateMembership: vi.fn(() => of(null)),
  } satisfies ApiStub<ScenarioTemplateMembershipsService>;
  const rendered = await renderComponent(ScenarioTemplateMembershipsComponent, {
    declarations: [
      ScenarioTemplateMembershipsComponent,
      MembershipListStubComponent,
      MemberListStubComponent,
    ],
    imports: [MatButtonModule, MatIconModule, MatTooltipModule],
    providers: [
      ...permissionDataProviders(grants),
      { provide: ScenarioTemplateMembershipsService, useValue: membershipApi },
      {
        provide: ScenarioTemplateRolesService,
        useValue: {
          getAllScenarioTemplateRoles: vi.fn(() =>
            of<ScenarioTemplateRole[]>([{ id: 'r1', name: 'Member' }]),
          ),
        } satisfies ApiStub<ScenarioTemplateRolesService>,
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
      // With the template already loaded, the header's stream recomputes
      // canEdit$ (ngOnChanges) after ngOnInit has set it.
      provideEnvironmentInitializer(() => {
        if (templateInStore) {
          inject(ScenarioTemplateStore).set([{ id: 't1', name: 'Alpha' }]);
        }
      }),
    ],
    inputs: { scenarioTemplateId: 't1', ...inputs },
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

describe('ScenarioTemplateMembershipsComponent', () => {
  /**
   * Verifies: both lists get canEdit true for a user who manages this template, through the template claim or the system permission.
   * Interacts with: real PermissionDataService.loadScenarioTemplatePermissions and canEditScenarioTemplate, both list stubs' canEdit inputs.
   * Data: ManageScenarioTemplate on t1, or system ManageScenarioTemplates.
   */
  it.each([
    {
      label: 'ManageScenarioTemplate on the template',
      grants: {
        scenarioTemplates: [
          { scenarioTemplateId: 't1', permissions: ['ManageScenarioTemplate'] },
        ],
      },
    },
    {
      label: 'system ManageScenarioTemplates',
      grants: { system: ['ManageScenarioTemplates'] },
    },
  ] as Array<{ label: string; grants: PermissionGrants }>)(
    'passes canEdit true to both lists for $label',
    async ({ grants }) => {
      const { candidates, members } = await renderMemberships(grants);

      expect([candidates().canEdit, members().canEdit]).toEqual([true, true]);
    },
  );

  /**
   * Verifies: a user who can only edit the template also gets canEdit true on its memberships (current behavior).
   * Interacts with: real PermissionDataService.loadScenarioTemplatePermissions and canEditScenarioTemplate, both list stubs' canEdit inputs.
   * Data: EditScenarioTemplate on t1, or system EditScenarioTemplates.
   */
  it.each([
    {
      label: 'EditScenarioTemplate on the template',
      grants: {
        scenarioTemplates: [
          { scenarioTemplateId: 't1', permissions: ['EditScenarioTemplate'] },
        ],
      },
    },
    {
      label: 'system EditScenarioTemplates',
      grants: { system: ['EditScenarioTemplates'] },
    },
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
   * Interacts with: real PermissionDataService.canEditScenarioTemplate, both list stubs' canEdit inputs.
   * Data: View on t1; Manage on another template; system View and Create templates.
   */
  it.each([
    {
      label: 'ViewScenarioTemplate on the template',
      grants: {
        scenarioTemplates: [
          { scenarioTemplateId: 't1', permissions: ['ViewScenarioTemplate'] },
        ],
      },
    },
    {
      label: 'ManageScenarioTemplate on another template',
      grants: {
        scenarioTemplates: [
          { scenarioTemplateId: 't2', permissions: ['ManageScenarioTemplate'] },
        ],
      },
    },
    {
      label: 'system ViewScenarioTemplates and CreateScenarioTemplates',
      grants: { system: ['ViewScenarioTemplates', 'CreateScenarioTemplates'] },
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
   * Verifies: once the template is loaded, the canEdit$ the header stream recomputes is still false for a near miss.
   * Interacts with: the ngOnChanges tap on scenarioTemplate$, real PermissionDataService.canEditScenarioTemplate, both list stubs' canEdit inputs.
   * Data: template t1 'Alpha' in the store before render; ViewScenarioTemplate on t1, or system ViewScenarioTemplates.
   */
  it.each([
    {
      label: 'ViewScenarioTemplate on the template',
      grants: {
        scenarioTemplates: [
          { scenarioTemplateId: 't1', permissions: ['ViewScenarioTemplate'] },
        ],
      },
    },
    {
      label: 'system ViewScenarioTemplates',
      grants: { system: ['ViewScenarioTemplates'] },
    },
  ] as Array<{ label: string; grants: PermissionGrants }>)(
    'keeps canEdit false on both lists after the template loads for $label',
    async ({ grants }) => {
      const { candidates, members } = await renderMemberships(grants, {}, true);

      expect(
        screen.getByRole('heading', { name: 'Alpha' }),
      ).toBeInTheDocument();
      expect(candidates().canEdit).toBe(false);
      expect(members().canEdit).toBe(false);
    },
  );

  /**
   * Verifies: once the template is loaded, a manager still gets canEdit true from the recomputed canEdit$.
   * Interacts with: the ngOnChanges tap on scenarioTemplate$, real PermissionDataService.canEditScenarioTemplate.
   * Data: template t1 in the store before render; ManageScenarioTemplate on t1.
   */
  it('keeps canEdit true on both lists after the template loads for a manager', async () => {
    const { candidates, members } = await renderMemberships(
      {
        scenarioTemplates: [
          { scenarioTemplateId: 't1', permissions: ['ManageScenarioTemplate'] },
        ],
      },
      {},
      true,
    );

    expect([candidates().canEdit, members().canEdit]).toEqual([true, true]);
  });

  /**
   * Verifies: members and non-members are split between the two lists, and an added user moves into the member list.
   * Interacts with: real ScenarioTemplateMembershipDataService over ScenarioTemplateMembershipsService, real UserDataService and GroupDataService, the createMembership output.
   * Data: ManageScenarioTemplates; Alice is a member; Bob is added.
   */
  it('moves an added user into the member list', async () => {
    const { candidates, members, membershipApi, fixture } =
      await renderMemberships({ system: ['ManageScenarioTemplates'] });
    expect(members().users?.map((u) => u.name)).toEqual(['Alice']);
    expect(candidates().users?.map((u) => u.name)).toEqual(['Bob']);
    expect(candidates().groups?.map((g) => g.name)).toEqual(['Blue Team']);

    candidates().createMembership.emit({ userId: 'u2' });
    fixture.detectChanges();

    expect(membershipApi.createScenarioTemplateMembership).toHaveBeenCalledWith(
      't1',
      {
        userId: 'u2',
        scenarioTemplateId: 't1',
      },
    );
    expect(members().users?.map((u) => u.name)).toEqual(['Alice', 'Bob']);
    expect(candidates().users).toEqual([]);
  });

  /**
   * Verifies: the header shows the template name and, when embedded, a Return button that emits goBack.
   * Interacts with: real ScenarioTemplateStore and ScenarioTemplateQuery, the goBack output.
   * Data: template t1 'Alpha' in the store; embedded true.
   */
  it('shows the template name and returns when embedded', async () => {
    const { fixture } = await renderMemberships(
      { system: ['ManageScenarioTemplates'] },
      { embedded: true },
    );
    TestBed.inject(ScenarioTemplateStore).set([{ id: 't1', name: 'Alpha' }]);
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
