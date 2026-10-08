// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, Input } from '@angular/core';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Observable, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTreeModule } from '@angular/material/tree';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import { Result, Task } from 'src/app/generated/steamfitter.api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { unstubbed } from 'src/app/test-utils/unstubbed';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { TaskTreeComponent } from './task-tree.component';

@Component({ selector: 'app-results', template: '', standalone: false })
class ResultsStubComponent {
  @Input() results?: Observable<Result[]>;
  @Input() taskId?: string;
  @Input() taskAction?: string;
}

const TASKS: Task[] = [
  { id: 't1', name: 'Ping', scenarioId: 's1', triggerCondition: 'Manual' },
  {
    id: 't2',
    name: 'Reboot',
    scenarioId: 's1',
    triggerTaskId: 't1',
    triggerCondition: 'Completion',
  },
  { id: 't3', name: 'Other', scenarioId: 's2', triggerCondition: 'Manual' },
];

async function renderTree(
  state: { isEditableState: boolean; isExecutableState: boolean },
  results: Result[] = [],
) {
  const confirm = vi.fn(() => dialogRefStub<unknown, boolean>(true).dialogRef);
  const dialogService: Pick<CrucibleDialogService, 'confirm'> = { confirm };
  const rendered = await renderComponent(TaskTreeComponent, {
    declarations: [TaskTreeComponent, ResultsStubComponent],
    imports: [
      MatTreeModule,
      MatExpansionModule,
      MatFormFieldModule,
      MatMenuModule,
      MatIconModule,
      MatButtonModule,
      MatCardModule,
      MatProgressSpinnerModule,
    ],
    providers: [
      { provide: CrucibleDialogService, useValue: dialogService },
      unstubbed(MatDialog),
    ],
    inputs: {
      taskList: of(structuredClone(TASKS)),
      resultList: of(results),
      isLoading: of(false),
      scenarioId: 's1',
      clipboard: null,
      ...state,
    },
  });
  // The tree renders its nodes on the change detection after its data source
  // receives the tasks from ngOnInit.
  rendered.fixture.detectChanges();
  await rendered.fixture.whenStable();
  const deleted = vi.fn();
  rendered.fixture.componentInstance.deleteTaskRequested.subscribe(deleted);
  const user = userEvent.setup();
  const tree = () => screen.getByRole('tree');
  const openTaskMenu = async (name: string) => {
    const node = within(tree())
      .getAllByRole('treeitem')
      .find((n) => n.textContent?.includes(name)) as HTMLElement;
    await user.click(within(node).getByRole('button', { name: 'Task Menu' }));
  };
  const menuItems = () =>
    screen.queryAllByRole('menuitem').map((item) => item.textContent?.trim());
  return { ...rendered, user, confirm, deleted, tree, openTaskMenu, menuItems };
}

describe('TaskTreeComponent', () => {
  /**
   * Verifies: the tree lists only the scenario's top-level tasks until a parent is expanded.
   * Interacts with: filterTasks (scenarioId), the flat tree control.
   * Data: Ping (s1), Reboot (s1, triggered by Ping) and Other (s2).
   */
  it("lists the scenario's top-level tasks", async () => {
    const { tree } = await renderTree({
      isEditableState: true,
      isExecutableState: false,
    });

    const names = within(tree())
      .getAllByRole('treeitem')
      .map((n) => n.querySelector('mat-label')?.textContent?.trim());
    expect(names).toEqual(['Ping']);
  });

  /**
   * Verifies: an editable, executable tree offers every task action on a task.
   * Interacts with: the Task Menu button, the context menu's isEditableTask and isExecutableTask branches.
   * Data: an active scenario's tree (editable and executable); Ping's menu.
   */
  it('offers every action on an editable, executable tree', async () => {
    const { openTaskMenu, menuItems } = await renderTree({
      isEditableState: true,
      isExecutableState: true,
    });

    await openTaskMenu('Ping');

    expect(menuItems()).toEqual([
      'Edit',
      'Copy',
      'Cut',
      'New',
      'Delete',
      'Execute',
      'Stop Iterations',
    ]);
  });

  /**
   * Verifies: a tree that is not editable still offers Add a Task, and Copy, Cut and Delete on a task (current behavior).
   * Interacts with: the header's Add a Task button, the context menu's non-editable branch.
   * Data: an ended scenario's tree (not editable, not executable); Ping's menu.
   */
  it('offers Add a Task, Cut and Delete on a tree that is not editable', async () => {
    const { openTaskMenu, menuItems } = await renderTree({
      isEditableState: false,
      isExecutableState: false,
    });

    // Current behavior; see agent-docs/ui-test-bugs/steamfitter.ui.md.
    expect(
      screen.getByRole('button', { name: 'Add a Task' }),
    ).toBeInTheDocument();
    await openTaskMenu('Ping');
    expect(menuItems()).toEqual(['Copy', 'Cut', 'Delete']);
  });

  /**
   * Verifies: confirming Delete on a task emits its id.
   * Interacts with: CrucibleDialogService.confirm stub, the deleteTaskRequested output.
   * Data: an editable tree; Ping is deleted and the user confirms.
   */
  it('emits a delete request after confirmation', async () => {
    const { user, openTaskMenu, confirm, deleted } = await renderTree({
      isEditableState: true,
      isExecutableState: false,
    });
    await openTaskMenu('Ping');

    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Delete Task' }),
    );
    expect(deleted.mock.calls).toEqual([['t1']]);
  });
});
