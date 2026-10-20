// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
  input,
  output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatMenuTrigger,
  MatMenu,
  MatMenuContent,
  MatMenuItem,
} from '@angular/material/menu';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow,
} from '@angular/material/table';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import {
  ScenarioPermission,
  SystemPermission,
} from 'src/app/generated/steamfitter.api';
import { View } from 'src/app/generated/steamfitter.api';
import { ScenarioEditComponent } from 'src/app/components/scenarios/scenario-edit/scenario-edit.component';
import { ScenarioEditDialogComponent } from 'src/app/components/scenarios/scenario-edit-dialog/scenario-edit-dialog.component';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { Scenario } from 'src/app/generated/steamfitter.api';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ClipboardModule } from 'ngx-clipboard';
import { ScenarioMembershipsComponent } from '../scenario-memberships/scenario-memberships/scenario-memberships.component';
import { ScenarioEditComponent as ScenarioEditComponent_1 } from '../scenario-edit/scenario-edit.component';
import { MatCard } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';

export interface Action {
  Value: string;
  Text: string;
}

@Component({
  selector: 'app-scenario-list',
  templateUrl: './scenario-list.component.html',
  styleUrls: ['./scenario-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ),
    ]),
  ],
  imports: [
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatIconButton,
    MatIcon,
    MatCellDef,
    MatCell,
    ClipboardModule,
    MatSortHeader,
    ScenarioMembershipsComponent,
    ScenarioEditComponent_1,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatCard,
    MatProgressSpinner,
    MatMenuTrigger,
    MatMenu,
    MatMenuContent,
    MatMenuItem,
    DatePipe,
  ],
})
export class ScenarioListComponent implements OnInit, OnChanges {
  private scenarioDataService = inject(ScenarioDataService);
  private permissionDataService = inject(PermissionDataService);
  private confirmService = inject(CrucibleDialogService);
  private dialog = inject(MatDialog);

  readonly scenarioList = input<Scenario[]>(undefined);
  @Input() selectedScenario: Scenario;
  readonly isLoading = input<boolean>(undefined);
  readonly adminMode = input(false);
  readonly statuses = input<string>(undefined);
  readonly views = input<View[]>(undefined);
  readonly saveScenario = output<Scenario>();
  readonly itemSelected = output<string>();
  @ViewChild(ScenarioEditComponent)
  scenarioEditComponent: ScenarioEditComponent;
  displayedColumns: string[] = [
    'actions',
    'name',
    'view',
    'status',
    'startDate',
    'endDate',
  ];
  readonly selectedStatuses = input<string[]>(['active', 'ready']);
  statusFilteredScenarios: Scenario[];
  editScenarioText = 'Edit Scenario';
  // context menu
  @ViewChild(MatMenuTrigger, { static: true }) contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };
  readonly paginator = input<MatPaginator>(undefined);
  readonly filterString = input('');
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  expandedScenarioId: string | null = null;
  scenarioDataSource = new MatTableDataSource<Scenario>(new Array<Scenario>());
  permissions: SystemPermission[] = [];
  readonly SystemPermission = SystemPermission;

  constructor() {
    const scenarioList = this.scenarioList();
    if (!scenarioList || scenarioList.length === 0) {
      this.scenarioDataService.load();
    }
  }

  ngOnInit() {
    const paginator = this.paginator();
    if (paginator) {
      this.scenarioDataSource.paginator = paginator;
      paginator.pageIndex = 0;
    }
    this.scenarioDataSource.sort = this.sort;
    const id = this.selectedScenario ? this.selectedScenario.id : '';
    // force already expanded scenario to refresh details
    if (id) {
      this.expandedScenarioId = null;
      const here = this;
      this.itemSelected.emit('');
      setTimeout(function () {
        here.expandedScenarioId = id;
        here.itemSelected.emit(id);
      }, 1);
    }
    this.filterAndSort();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.permissions = this.permissionDataService.permissions;
    // When selectedScenario arrives asynchronously (e.g. from URL query param
    // on initial load), expand that scenario's row.
    if (
      !!changes.selectedScenario &&
      !!changes.selectedScenario.currentValue &&
      !!changes.selectedScenario.currentValue.id &&
      changes.selectedScenario.currentValue.id !== this.expandedScenarioId
    ) {
      this.expandedScenarioId = changes.selectedScenario.currentValue.id;
    }
    const paginator = this.paginator();
    if (changes.paginator && paginator) {
      this.scenarioDataSource.paginator = paginator;
    }
    const scenarioList = this.scenarioList();
    if (!!changes.scenarioList && !!changes.scenarioList.currentValue) {
      this.filterByStatus(changes.scenarioList.currentValue);
    } else if (changes.selectedStatuses && scenarioList) {
      this.filterByStatus(scenarioList);
    } else if (changes.filterString !== undefined) {
      this.filterAndSort();
    }
  }

  filterByStatus(scenarios: Scenario[]) {
    const paginator = this.paginator();
    if (paginator) {
      paginator.pageIndex = 0;
    }
    this.statusFilteredScenarios = scenarios.filter((m) =>
      this.selectedStatuses().includes(m.status),
    );
    this.filterAndSort();
  }

  onContextMenu(event: MouseEvent, scenario: Scenario) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { item: scenario };
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  canManage(scenario: Scenario): boolean {
    return (
      scenario?.scenarioPermissions?.some(
        (m) => m === ScenarioPermission.ManageScenario,
      ) ||
      this.permissionDataService.hasPermission(SystemPermission.ManageScenarios)
    );
  }

  canEdit(scenario: Scenario): boolean {
    return (
      scenario?.scenarioPermissions?.some(
        (m) => m === ScenarioPermission.EditScenario,
      ) ||
      this.permissionDataService.hasPermission(SystemPermission.EditScenarios)
    );
  }

  canExecute(scenario: Scenario): boolean {
    return (
      scenario?.scenarioPermissions?.some(
        (m) => m === ScenarioPermission.ExecuteScenario,
      ) ||
      this.permissionDataService.hasPermission(
        SystemPermission.ExecuteScenarios,
      )
    );
  }

  canDoSomething(scenario: Scenario): boolean {
    return (
      this.canManage(scenario) ||
      this.canEdit(scenario) ||
      this.canExecute(scenario)
    );
  }

  /**
   * Edits or adds a scenario
   */
  editScenario(scenario: Scenario | null) {
    scenario = !scenario ? <Scenario>{ name: '', description: '' } : scenario;
    const dialogRef = this.dialog.open(ScenarioEditDialogComponent, {
      width: '480px',
      data: { scenario: { ...scenario }, views: this.views() },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.scenario) {
        this.saveScenario.emit(result.scenario);
      }
      dialogRef.close();
    });
  }

  /**
   * Delete a scenario after confirmation
   */
  deleteScenario(scenario: Scenario): void {
    this.confirmService
      .confirm({
        title: 'Delete Scenario',
        message:
          'Are you sure that you want to delete scenario ' +
          scenario.name +
          '?',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.scenarioDataService.delete(scenario.id);
        }
      });
  }

  /**
   * Copy a scenario after confirmation
   */
  copyScenario(scenario: Scenario): void {
    this.confirmService
      .confirm({
        title: 'Copy Scenario',
        message:
          'Are you sure that you want to create a new scenario from ' +
          scenario.name +
          '?',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.scenarioDataService.copyScenario(scenario.id);
        }
      });
  }

  /**
   * Start a scenario
   */
  startScenario(scenario: Scenario): void {
    this.confirmService
      .confirm({
        title: 'Start Scenario Now',
        message:
          'Are you sure that you want to start scenario ' + scenario.name + '?',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.scenarioDataService.start(scenario.id);
        }
      });
  }

  /**
   * End a scenario
   */
  endScenario(scenario: Scenario): void {
    this.confirmService
      .confirm({
        title: 'End Scenario Now',
        message:
          'Are you sure that you want to end scenario ' + scenario.name + '?',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.scenarioDataService.end(scenario.id);
        }
      });
  }

  selectScenario(event: any, scenarioId: string | undefined) {
    if (this.expandedScenarioId === scenarioId) {
      this.expandedScenarioId = null;
      if (!this.adminMode()) {
        this.itemSelected.emit('');
        this.selectedScenario = null;
      }
    } else {
      this.expandedScenarioId = scenarioId;
      if (!this.adminMode()) {
        this.itemSelected.emit(scenarioId ?? '');
      }
    }
  }

  /**
   * filters and sorts the displayed rows
   */
  filterAndSort() {
    this.scenarioDataSource.data = this.statusFilteredScenarios || [];
    this.scenarioDataSource.filter = (this.filterString() || '')
      .trim()
      .toLowerCase();
  }
}
