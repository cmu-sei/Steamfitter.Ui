// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { GroupMembership, User } from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { AdminGroupsMemberListComponent } from './admin-groups-member-list.component';

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];
const MEMBERSHIPS: GroupMembership[] = [
  { id: 'm1', groupId: 'g1', userId: 'u1' },
  { id: 'm2', groupId: 'g1', userId: 'u2' },
];

async function renderMemberList(canEdit: boolean) {
  const rendered = await renderComponent(AdminGroupsMemberListComponent, {
    declarations: [AdminGroupsMemberListComponent],
    imports: [
      MatTableModule,
      MatSortModule,
      MatPaginatorModule,
      MatToolbarModule,
      MatFormFieldModule,
      MatInputModule,
      MatIconModule,
      MatButtonModule,
    ],
    inputs: { memberships: MEMBERSHIPS, users: USERS, canEdit },
  });
  const deleted = vi.fn();
  rendered.fixture.componentInstance.deleteMembership.subscribe(deleted);
  const table = () => screen.getByRole('table');
  return { ...rendered, deleted, table };
}

describe('AdminGroupsMemberListComponent', () => {
  /**
   * Verifies: with canEdit true, each member row has a Remove button that emits the membership id.
   * Interacts with: the actions column, the deleteMembership output.
   * Data: two memberships for Alice and Bob; canEdit true; Bob's Remove is clicked.
   */
  it('removes a member when the user can edit the group', async () => {
    const { deleted, table } = await renderMemberList(true);

    await userEvent
      .setup()
      .click(within(table()).getByRole('button', { name: 'Remove Bob' }));

    expect(deleted.mock.calls).toEqual([['m2']]);
  });

  /**
   * Verifies: with canEdit false, the members are listed but no Remove button is rendered.
   * Interacts with: displayedColumns (the actions column is left out without canEdit).
   * Data: the same two memberships; canEdit false.
   */
  it('hides the Remove buttons without canEdit', async () => {
    const { table } = await renderMemberList(false);

    expect(within(table()).getByText('Alice')).toBeInTheDocument();
    expect(within(table()).getByText('Bob')).toBeInTheDocument();
    expect(
      within(table()).queryByRole('button', { name: /^Remove/ }),
    ).not.toBeInTheDocument();
  });
});
