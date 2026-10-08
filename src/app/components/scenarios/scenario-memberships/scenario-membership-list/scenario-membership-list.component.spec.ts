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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Group, User } from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ScenarioMembershipListComponent } from './scenario-membership-list.component';

@Directive({ selector: '[ngxClipboard]', standalone: false })
class ClipboardStubDirective {
  @Input() cbContent?: string;
}

const USERS: User[] = [{ id: 'u1', name: 'Alice' }];
const GROUPS: Group[] = [{ id: 'g1', name: 'Blue Team' }];

async function renderMembershipList(canEdit: boolean) {
  const rendered = await renderComponent(ScenarioMembershipListComponent, {
    declarations: [ScenarioMembershipListComponent, ClipboardStubDirective],
    imports: [
      MatTableModule,
      MatSortModule,
      MatPaginatorModule,
      MatToolbarModule,
      MatFormFieldModule,
      MatInputModule,
      MatIconModule,
      MatButtonModule,
      MatTooltipModule,
    ],
    inputs: { users: USERS, groups: GROUPS, canEdit },
  });
  const created = vi.fn();
  rendered.fixture.componentInstance.createMembership.subscribe(created);
  const table = () => screen.getByRole('table');
  // Rows are found by their text: a role query with a name computes the
  // accessible name of every row, which is slow on Material tables.
  const row = (name: string) =>
    within(table()).getByText(name).closest('tr') as HTMLElement;
  const addButton = (scope: HTMLElement, name: string) =>
    within(scope).queryByRole('button', { description: `Add ${name}` });
  return {
    ...rendered,
    user: userEvent.setup(),
    created,
    table,
    row,
    addButton,
  };
}

describe('ScenarioMembershipListComponent', () => {
  /**
   * Verifies: with canEdit true each user and group has an Add button, which emits a membership for a user or for a group.
   * Interacts with: the actions column, the createMembership output.
   * Data: user Alice and group Blue Team; canEdit true; both are added.
   */
  it('adds users and groups when the user can edit the scenario', async () => {
    const { user, row, addButton, created } = await renderMembershipList(true);

    await user.click(addButton(row('Alice'), 'Alice')!);
    await user.click(addButton(row('Blue Team'), 'Blue Team')!);

    expect(created.mock.calls).toEqual([
      [{ userId: 'u1' }],
      [{ groupId: 'g1' }],
    ]);
  });

  /**
   * Verifies: with canEdit false the users and groups are listed but no Add button is rendered.
   * Interacts with: displayedColumns (no actions column without canEdit).
   * Data: the same user and group; canEdit false.
   */
  it('hides the Add buttons without canEdit', async () => {
    const { row, table, addButton } = await renderMembershipList(false);

    expect(row('Alice')).toHaveTextContent('User');
    expect(row('Blue Team')).toHaveTextContent('Group');
    expect(addButton(table(), 'Alice')).not.toBeInTheDocument();
    expect(addButton(table(), 'Blue Team')).not.toBeInTheDocument();
  });
});
