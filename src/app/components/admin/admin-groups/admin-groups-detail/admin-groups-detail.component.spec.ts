// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import {
  GroupMembership,
  GroupService,
  User,
} from 'src/app/generated/steamfitter.api';
import { UserStore } from 'src/app/data/user/user.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { AdminGroupsDetailComponent } from './admin-groups-detail.component';

@Component({
  selector: 'app-admin-groups-membership-list',
  template: '',
  standalone: false,
})
class MembershipListStubComponent {
  @Input() users?: User[];
  @Input() canEdit?: boolean;
  @Output() createMembership = new EventEmitter<string>();
}

@Component({
  selector: 'app-admin-groups-member-list',
  template: '',
  standalone: false,
})
class MemberListStubComponent {
  @Input() memberships?: GroupMembership[];
  @Input() users?: User[];
  @Input() canEdit?: boolean;
  @Output() deleteMembership = new EventEmitter<string>();
}

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];

async function renderDetail(canEdit: boolean) {
  const groupApi = {
    getGroupMemberships: vi.fn(() =>
      of<GroupMembership[]>([{ id: 'm1', groupId: 'g1', userId: 'u1' }]),
    ),
    createGroupMembership: vi.fn(
      (groupId: string, membership: GroupMembership) =>
        of<GroupMembership>({ ...membership, id: 'm2' }),
    ),
    deleteGroupMembership: vi.fn(() => of(null)),
  } satisfies ApiStub<GroupService>;
  const rendered = await renderComponent(AdminGroupsDetailComponent, {
    declarations: [
      AdminGroupsDetailComponent,
      MembershipListStubComponent,
      MemberListStubComponent,
    ],
    providers: [{ provide: GroupService, useValue: groupApi }],
    inputs: { groupId: 'g1', canEdit },
  });
  TestBed.inject(UserStore).set(USERS);
  rendered.fixture.detectChanges();
  const stub = <T>(type: new (...args: never[]) => T): T =>
    rendered.fixture.debugElement.query(By.directive(type)).componentInstance;
  return {
    ...rendered,
    groupApi,
    nonMembers: () => stub(MembershipListStubComponent),
    members: () => stub(MemberListStubComponent),
  };
}

describe('AdminGroupsDetailComponent', () => {
  /**
   * Verifies: the group's members and non-members go to the two lists, which both receive canEdit true.
   * Interacts with: real GroupMembershipService over GroupService.getGroupMemberships, real UserStore and UserQuery, child list stubs.
   * Data: users Alice and Bob; Alice is a member of g1; canEdit true.
   */
  it('passes canEdit true to both lists for a group manager', async () => {
    const { nonMembers, members } = await renderDetail(true);

    expect(members().users?.map((u) => u.name)).toEqual(['Alice']);
    expect(nonMembers().users?.map((u) => u.name)).toEqual(['Bob']);
    expect([nonMembers().canEdit, members().canEdit]).toEqual([true, true]);
  });

  /**
   * Verifies: without canEdit, both lists receive canEdit false (they hide their Add and Remove buttons).
   * Interacts with: child list stubs' canEdit inputs.
   * Data: the same group; canEdit false.
   */
  it('passes canEdit false to both lists without canEdit', async () => {
    const { nonMembers, members } = await renderDetail(false);

    expect(nonMembers().canEdit).toBe(false);
    expect(members().canEdit).toBe(false);
  });

  /**
   * Verifies: adding a user from the non-member list moves the user into the member list.
   * Interacts with: the createMembership output, real GroupMembershipService.createMembership, GroupService.createGroupMembership stub.
   * Data: canEdit true; Bob is added; the API returns membership m2.
   */
  it('moves an added user into the member list', async () => {
    const { nonMembers, members, groupApi, fixture } = await renderDetail(true);

    nonMembers().createMembership.emit('u2');
    fixture.detectChanges();

    expect(groupApi.createGroupMembership).toHaveBeenCalledWith('g1', {
      groupId: 'g1',
      userId: 'u2',
    });
    expect(members().users?.map((u) => u.name)).toEqual(['Alice', 'Bob']);
    expect(nonMembers().users).toEqual([]);
  });

  /**
   * Verifies: removing a member moves the user back into the non-member list.
   * Interacts with: the deleteMembership output, real GroupMembershipService.deleteMembership, GroupService.deleteGroupMembership stub.
   * Data: canEdit true; Alice's membership m1 is removed.
   */
  it('moves a removed member back into the non-member list', async () => {
    const { nonMembers, members, fixture } = await renderDetail(true);

    members().deleteMembership.emit('m1');
    fixture.detectChanges();

    expect(members().users).toEqual([]);
    expect(nonMembers().users?.map((u) => u.name)).toEqual(['Alice', 'Bob']);
  });
});
