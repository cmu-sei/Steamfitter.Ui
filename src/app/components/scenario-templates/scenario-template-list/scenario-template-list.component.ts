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
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { MatBadge } from '@angular/material/badge';
import { MatCheckbox } from '@angular/material/checkbox';
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
  ScenarioTemplatePermission,
  SystemPermission,
} from 'src/app/generated/steamfitter.api';
import { ScenarioTemplateEditDialogComponent } from 'src/app/components/scenario-templates/scenario-template-edit-dialog/scenario-template-edit-dialog.component';
import { ScenarioTemplateEditComponent } from 'src/app/components/scenario-templates/scenario-template-edit/scenario-template-edit.component';
import {
  ScenarioTemplateExportDialogComponent,
  ScenarioTemplateExportDialogData,
} from 'src/app/components/scenario-templates/scenario-template-export-dialog/scenario-template-export-dialog.component';
import { ScenarioTemplateImportDialogComponent } from 'src/app/components/scenario-templates/scenario-template-import-dialog/scenario-template-import-dialog.component';
import { ScenarioEditDialogComponent } from 'src/app/components/scenarios/scenario-edit-dialog/scenario-edit-dialog.component';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { Scenario, ScenarioTemplate } from 'src/app/generated/steamfitter.api';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ClipboardModule } from 'ngx-clipboard';
import { ScenarioTemplateMembershipsComponent } from '../scenario-template-memberships/scenario-template-memberships/scenario-template-memberships.component';
import { ScenarioTemplateEditComponent as ScenarioTemplateEditComponent_1 } from '../scenario-template-edit/scenario-template-edit.component';
import { MatCard } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';

export interface Action {
  Value: string;
  Text: string;
}

@Component({
  selector: 'app-scenario-template-list',
  templateUrl: './scenario-template-list.component.html',
  styleUrls: ['./scenario-template-list.component.scss'],
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
    ScenarioTemplateMembershipsComponent,
    ScenarioTemplateEditComponent_1,
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
    MatCheckbox,
    MatBadge,
    DatePipe,
  ],
})
export class ScenarioTemplateListComponent implements OnInit, OnChanges {
  private confirmService = inject(CrucibleDialogService);
  private permissionDataService = inject(PermissionDataService);
  private scenarioTemplateDataService = inject(ScenarioTemplateDataService);
  private scenarioDataService = inject(ScenarioDataService);
  private dialog = inject(MatDialog);

  readonly scenarioTemplateList = input<ScenarioTemplate[]>(undefined);
  @Input() selectedScenarioTemplate: ScenarioTemplate;
  readonly isLoading = input<boolean>(undefined);
  readonly adminMode = input<boolean>(undefined);
  readonly saveScenarioTemplate = output<ScenarioTemplate>();
  readonly itemSelected = output<string>();
  readonly scenarioTemplateEditComponent = viewChild(
    ScenarioTemplateEditComponent,
  );
  displayedColumns: string[] = [
    'select',
    'actions',
    'name',
    'description',
    'durationHours',
    'dateCreated',
  ];
  editScenarioTemplateText = 'Edit Scenario Template';
  // context menu
  readonly contextMenu = viewChild(MatMenuTrigger);
  contextMenuPosition = { x: '0px', y: '0px' };
  readonly paginator = input<MatPaginator>(undefined);
  readonly filterString = input('');
  readonly sort = viewChild(MatSort);
  expandedScenarioTemplateId: string | null = null;
  scenarioTemplateDataSource = new MatTableDataSource<ScenarioTemplate>(
    new Array<ScenarioTemplate>(),
  );
  permissions: SystemPermission[] = [];
  /** Scenario Template ids chosen for export. */
  selection = new SelectionModel<string>(true, []);
  readonly SystemPermission = SystemPermission;

  constructor() {
    const scenarioTemplateList = this.scenarioTemplateList();
    if (!scenarioTemplateList || scenarioTemplateList.length === 0) {
      this.scenarioTemplateDataService.load();
    }
  }

  ngOnInit() {
    const paginator = this.paginator();
    if (paginator) {
      this.scenarioTemplateDataSource.paginator = paginator;
      paginator.pageIndex = 0;
    }
    this.scenarioTemplateDataSource.sort = this.sort();
    const id = this.selectedScenarioTemplate
      ? this.selectedScenarioTemplate.id
      : '';
    // force already expanded scenarioTemplate to refresh details
    if (id) {
      this.expandedScenarioTemplateId = null;
      const here = this;
      this.itemSelected.emit('');
      setTimeout(function () {
        here.expandedScenarioTemplateId = id;
        here.itemSelected.emit(id);
      }, 1);
    }
    this.filterAndSort();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.permissions = this.permissionDataService.permissions;
    // When selectedScenarioTemplate arrives asynchronously (e.g. from URL query param
    // on initial load), expand that scenario template's row.
    if (
      !!changes.selectedScenarioTemplate &&
      !!changes.selectedScenarioTemplate.currentValue &&
      !!changes.selectedScenarioTemplate.currentValue.id &&
      changes.selectedScenarioTemplate.currentValue.id !==
        this.expandedScenarioTemplateId
    ) {
      this.expandedScenarioTemplateId =
        changes.selectedScenarioTemplate.currentValue.id;
    }
    const paginator = this.paginator();
    if (changes.paginator && paginator) {
      this.scenarioTemplateDataSource.paginator = paginator;
    }
    if (
      !!changes.scenarioTemplateList &&
      !!changes.scenarioTemplateList.currentValue
    ) {
      this.scenarioTemplateDataSource.data =
        changes.scenarioTemplateList.currentValue;
      this.pruneSelection();
      this.filterAndSort();
    } else if (changes.filterString !== undefined) {
      this.filterAndSort();
    }
  }

  onContextMenu(event: MouseEvent, scenarioTemplate: ScenarioTemplate) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    const contextMenu = this.contextMenu();
    contextMenu.menuData = { item: scenarioTemplate };
    contextMenu.menu.focusFirstItem('mouse');
    contextMenu.openMenu();
  }

  hasPermission(permission: SystemPermission): boolean {
    return this.permissionDataService.hasPermission(permission);
  }

  canManage(scenarioTemplate: ScenarioTemplate): boolean {
    return (
      scenarioTemplate?.scenarioTemplatePermissions?.some((m) =>
        m.includes(ScenarioTemplatePermission.ManageScenarioTemplate),
      ) ||
      this.permissionDataService.hasPermission(
        SystemPermission.ManageScenarioTemplates,
      )
    );
  }

  canEdit(scenarioTemplate: ScenarioTemplate): boolean {
    return (
      scenarioTemplate?.scenarioTemplatePermissions?.some(
        (m) => m === ScenarioTemplatePermission.EditScenarioTemplate,
      ) ||
      this.permissionDataService.hasPermission(
        SystemPermission.EditScenarioTemplates,
      )
    );
  }

  canDoSomething(scenarioTemplate: ScenarioTemplate): boolean {
    return this.canManage(scenarioTemplate) || this.canEdit(scenarioTemplate);
  }

  /**
   * Edits or adds a scenarioTemplate
   */
  editScenarioTemplate(scenarioTemplate: ScenarioTemplate | null) {
    scenarioTemplate = !scenarioTemplate
      ? <ScenarioTemplate>{ name: '', description: '' }
      : scenarioTemplate;
    const dialogRef = this.dialog.open(ScenarioTemplateEditDialogComponent, {
      width: '480px',
      data: { scenarioTemplate: scenarioTemplate },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.scenarioTemplate) {
        this.saveScenarioTemplate.emit(result.scenarioTemplate);
      }
      dialogRef.close();
    });
  }

  /**
   * Delete a scenarioTemplate after confirmation
   */
  deleteScenarioTemplate(scenarioTemplate: ScenarioTemplate): void {
    this.confirmService
      .confirm({
        title: 'Delete Scenario Template',
        message: `Are you sure that you want to delete ${scenarioTemplate.name}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.scenarioTemplateDataService.delete(scenarioTemplate.id);
        }
      });
  }

  /**
   * Copy a scenarioTemplate after confirmation
   */
  copyScenarioTemplate(scenarioTemplate: ScenarioTemplate): void {
    this.confirmService
      .confirm({
        title: 'Copy Scenario Template',
        message: `Are you sure that you want to copy ${scenarioTemplate.name}?`,
        confirmText: 'Copy',
        cancelText: 'Cancel',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.scenarioTemplateDataService.copyScenarioTemplate(
            scenarioTemplate.id,
          );
        }
      });
  }

  /** Drops selected ids whose template is no longer in the list, e.g. after a delete, so the counts stay true. */
  private pruneSelection(): void {
    const ids = new Set(
      this.scenarioTemplateDataSource.data.map((row) => row.id),
    );
    const gone = this.selection.selected.filter((id) => !ids.has(id));
    if (gone.length > 0) {
      this.selection.deselect(...gone);
    }
  }

  /** Whether every Scenario Template that passes the current filter is selected. */
  isAllSelected(): boolean {
    const rows = this.scenarioTemplateDataSource.filteredData;
    return (
      rows.length > 0 && rows.every((row) => this.selection.isSelected(row.id))
    );
  }

  /** Whether some, but not all, of the Scenario Templates that pass the current filter are selected. */
  isSomeSelected(): boolean {
    return (
      !this.isAllSelected() &&
      this.scenarioTemplateDataSource.filteredData.some((row) =>
        this.selection.isSelected(row.id),
      )
    );
  }

  /**
   * Selects every Scenario Template that passes the current filter, or, when they all are, deselects them.
   * Selected templates the filter hides are left as they are.
   */
  toggleAllRows(): void {
    const ids = this.scenarioTemplateDataSource.filteredData.map(
      (row) => row.id,
    );
    if (this.isAllSelected()) {
      this.selection.deselect(...ids);
    } else {
      this.selection.select(...ids);
    }
  }

  /** Whether the caller may export this Scenario Template. */
  private canView(scenarioTemplate: ScenarioTemplate): boolean {
    return (
      this.hasPermission(SystemPermission.ViewScenarioTemplates) ||
      !!scenarioTemplate.scenarioTemplatePermissions?.includes(
        ScenarioTemplatePermission.ViewScenarioTemplate,
      )
    );
  }

  /** The Scenario Templates an export would hold: the selection, or what the filter shows when nothing is selected. */
  private exportRows(): ScenarioTemplate[] {
    return this.selection.hasValue()
      ? this.scenarioTemplateDataSource.data.filter((row) =>
          this.selection.isSelected(row.id),
        )
      : this.scenarioTemplateDataSource.filteredData;
  }

  /** The ids to export: those of exportRows() the caller may view. */
  exportIds(): string[] {
    return this.exportRows()
      .filter((row) => this.canView(row))
      .map((row) => row.id);
  }

  /**
   * Whether the export can ask for every template rather than list each id: nothing is selected, the filter
   * hides nothing, and the caller holds ViewScenarioTemplates. That keeps a long list of ids out of the query string.
   */
  canExportAll(): boolean {
    return (
      !this.selection.hasValue() &&
      this.scenarioTemplateDataSource.filteredData.length ===
        this.scenarioTemplateDataSource.data.length &&
      this.hasPermission(SystemPermission.ViewScenarioTemplates)
    );
  }

  /** The export button's name, which says how many are selected, since the badge alone is not read out. */
  exportLabel(): string {
    const count = this.selection.selected.length;
    return count > 0
      ? `Export ${count} Selected Scenario Template${count === 1 ? '' : 's'}`
      : 'Export Scenario Templates';
  }

  /**
   * Download the selected scenarioTemplates, or all of them, with their tasks as a json file
   */
  exportScenarioTemplates(): void {
    this.dialog.open<
      ScenarioTemplateExportDialogComponent,
      ScenarioTemplateExportDialogData
    >(ScenarioTemplateExportDialogComponent, {
      width: '480px',
      maxWidth: '90vw',
      data: {
        ids: this.exportIds(),
        selected: this.selection.hasValue(),
        all: this.canExportAll(),
        notViewable: this.exportRows().length - this.exportIds().length,
      },
    });
  }

  /**
   * Create scenarioTemplates from an exported json file
   */
  importScenarioTemplates(): void {
    this.dialog.open(ScenarioTemplateImportDialogComponent, {
      width: '560px',
    });
  }

  /**
   * Create a scenario after confirmation
   */
  createScenario(scenarioTemplate: ScenarioTemplate): void {
    this.confirmService
      .confirm({
        title: 'Create Scenario',
        message: `Are you sure that you want to create a scenario from ${scenarioTemplate.name}?`,
        confirmText: 'Create',
        cancelText: 'Cancel',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.scenarioDataService.createScenarioFromScenarioTemplate(
            scenarioTemplate.id,
          );
        }
      });
  }

  /**
   * Edit the Scenario created from a ScenarioTemplate
   */
  editNewScenario(scenario: Scenario) {
    const dialogRef = this.dialog.open(ScenarioEditDialogComponent, {
      width: '480px',
      data: { scenario: scenario },
    });
    dialogRef.componentInstance.editComplete.subscribe((newScenario) => {
      dialogRef.close();
    });
  }

  selectScenarioTemplate(event: any, scenarioTemplateId: string | undefined) {
    if (this.expandedScenarioTemplateId === scenarioTemplateId) {
      this.expandedScenarioTemplateId = null;
      if (!this.adminMode()) {
        this.itemSelected.emit('');
        this.selectedScenarioTemplate = null;
      }
    } else {
      this.expandedScenarioTemplateId = scenarioTemplateId;
      if (!this.adminMode()) {
        this.itemSelected.emit(scenarioTemplateId ?? '');
      }
    }
  }

  /**
   * filters and sorts the displayed rows
   */
  filterAndSort() {
    this.scenarioTemplateDataSource.filter = (this.filterString() || '')
      .trim()
      .toLowerCase();
  }
}
