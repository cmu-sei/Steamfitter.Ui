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
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Group,
  ScenarioTemplateMembership,
  ScenarioTemplateRole,
  User,
} from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ScenarioTemplateMemberListComponent } from './scenario-template-member-list.component';

const USERS: User[] = [{ id: 'u1', name: 'Alice' }];
const GROUPS: Group[] = [{ id: 'g1', name: 'Blue Team' }];
const ROLES: ScenarioTemplateRole[] = [
  { id: 'r1', name: 'Member' },
  { id: 'r2', name: 'Manager' },
];
const MEMBERSHIPS: ScenarioTemplateMembership[] = [
  { id: 'm1', scenarioTemplateId: 't1', userId: 'u1', roleId: 'r1' },
  { id: 'm2', scenarioTemplateId: 't1', groupId: 'g1', roleId: 'r2' },
];

async function renderMemberList(canEdit: boolean) {
  const rendered = await renderComponent(ScenarioTemplateMemberListComponent, {
    declarations: [ScenarioTemplateMemberListComponent],
    imports: [
      MatTableModule,
      MatSortModule,
      MatPaginatorModule,
      MatToolbarModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatIconModule,
      MatButtonModule,
      MatTooltipModule,
    ],
    inputs: {
      memberships: MEMBERSHIPS,
      users: USERS,
      groups: GROUPS,
      roles: ROLES,
      canEdit,
    },
  });
  const deleted = vi.fn();
  const edited = vi.fn();
  rendered.fixture.componentInstance.deleteMembership.subscribe(deleted);
  rendered.fixture.componentInstance.editMembership.subscribe(edited);
  const table = () => screen.getByRole('table');
  // Rows are found by their text: a role query with a name computes the
  // accessible name of every row, which is slow on Material tables.
  const row = (name: string) =>
    within(table()).getByText(name).closest('tr') as HTMLElement;
  const removeButton = (scope: HTMLElement, name: string) =>
    within(scope).queryByRole('button', { description: `Remove ${name}` });
  return {
    ...rendered,
    user: userEvent.setup(),
    deleted,
    edited,
    table,
    row,
    removeButton,
  };
}

describe('ScenarioTemplateMemberListComponent', () => {
  /**
   * Verifies: with canEdit true each member row has an enabled role select and a Remove button that emits the membership id.
   * Interacts with: the actions column, the deleteMembership output.
   * Data: user Alice (Member) and group Blue Team (Manager); canEdit true; Blue Team is removed.
   */
  it('removes a member when the user can edit the scenario template', async () => {
    const { user, row, removeButton, deleted } = await renderMemberList(true);

    expect(within(row('Alice')).getByRole('combobox')).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    await user.click(removeButton(row('Blue Team'), 'Blue Team')!);

    expect(deleted.mock.calls).toEqual([['m2']]);
  });

  /**
   * Verifies: with canEdit false the members are listed with their type, but the role selects are disabled and no Remove button is rendered.
   * Interacts with: displayedColumns (no actions column without canEdit), the role select's disabled binding.
   * Data: the same memberships; canEdit false.
   */
  it('hides Remove and disables the role select without canEdit', async () => {
    const { row, table, removeButton } = await renderMemberList(false);

    expect(row('Alice')).toHaveTextContent('User');
    expect(row('Blue Team')).toHaveTextContent('Group');
    expect(within(row('Alice')).getByRole('combobox')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(removeButton(table(), 'Alice')).not.toBeInTheDocument();
    expect(removeButton(table(), 'Blue Team')).not.toBeInTheDocument();
  });

  /**
   * Verifies: picking another role emits the membership id with the new role id.
   * Interacts with: the role mat-select, the editMembership output.
   * Data: canEdit true; Alice's role is changed from Member to Manager.
   */
  it('emits the new role when a member role is changed', async () => {
    const { user, row, edited } = await renderMemberList(true);

    // MatSelect opens from its trigger element, inside the combobox host.
    const select = within(row('Alice')).getByRole('combobox');
    await user.click(select.querySelector('.mat-mdc-select-trigger')!);
    await user.click(screen.getByRole('option', { name: 'Manager' }));

    expect(edited.mock.calls).toEqual([[{ id: 'm1', roleId: 'r2' }]]);
  });
});
