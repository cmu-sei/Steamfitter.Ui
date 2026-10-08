// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Directive, Input } from '@angular/core';
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
import { User } from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { AdminGroupsMembershipListComponent } from './admin-groups-membership-list.component';

@Directive({ selector: '[ngxClipboard]', standalone: false })
class ClipboardStubDirective {
  @Input() cbContent?: string;
}

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];

async function renderMembershipList(canEdit: boolean) {
  const rendered = await renderComponent(AdminGroupsMembershipListComponent, {
    declarations: [AdminGroupsMembershipListComponent, ClipboardStubDirective],
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
    inputs: { users: USERS, canEdit },
  });
  const created = vi.fn();
  rendered.fixture.componentInstance.createMembership.subscribe(created);
  const table = () => screen.getByRole('table');
  return { ...rendered, created, table };
}

describe('AdminGroupsMembershipListComponent', () => {
  /**
   * Verifies: with canEdit true, each non-member row has an Add button that emits the user id.
   * Interacts with: the actions column, the createMembership output.
   * Data: Alice and Bob as non-members; canEdit true; Alice's Add is clicked.
   */
  it('adds a user to the group when the user can edit the group', async () => {
    const { created, table } = await renderMembershipList(true);

    await userEvent
      .setup()
      .click(within(table()).getByRole('button', { name: 'Add Alice' }));

    expect(created.mock.calls).toEqual([['u1']]);
  });

  /**
   * Verifies: with canEdit false, the users are listed but no Add button is rendered.
   * Interacts with: displayedColumns (the actions column is left out without canEdit).
   * Data: the same two users; canEdit false.
   */
  it('hides the Add buttons without canEdit', async () => {
    const { table } = await renderMembershipList(false);

    expect(within(table()).getByText('Alice')).toBeInTheDocument();
    expect(
      within(table()).queryByRole('button', { name: /^Add/ }),
    ).not.toBeInTheDocument();
  });
});
