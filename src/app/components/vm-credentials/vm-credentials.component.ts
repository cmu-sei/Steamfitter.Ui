// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
import { Component, Input, OnInit, inject, input, output } from '@angular/core';
import { VmCredential } from 'src/app/generated/steamfitter.api/model/vmCredential';
import { ScenarioQuery } from 'src/app/data/scenario/scenario.query';
import { ScenarioTemplateQuery } from 'src/app/data/scenario-template/scenario-template.query';
import { Scenario, ScenarioTemplate } from 'src/app/generated/steamfitter.api';
import { MatDialog } from '@angular/material/dialog';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { ScenarioDataService } from 'src/app/data/scenario/scenario-data.service';
import { AddDialogComponent } from './add-dialog/add-dialog.component';
import { Observable } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import { MatFormField, MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material/expansion';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-vm-credentials',
  templateUrl: './vm-credentials.component.html',
  styleUrls: ['./vm-credentials.component.scss'],
  imports: [
    MatFormField,
    MatInput,
    FormsModule,
    MatExpansionPanel,
    MatIconButton,
    MatIcon,
    AsyncPipe,
  ],
})
export class VmCredentialsComponent implements OnInit {
  private scenarioTemplateQuery = inject(ScenarioTemplateQuery);
  private scenarioQuery = inject(ScenarioQuery);
  private confirmService = inject(CrucibleDialogService);
  private dialog = inject(MatDialog);
  private scenarioTemplateDataService = inject(ScenarioTemplateDataService);
  private scenarioDataService = inject(ScenarioDataService);

  @Input() username: string;
  @Input() password: string;
  readonly scenarioTemplateId = input<string>(undefined);
  readonly scenarioId = input<string>(undefined);
  readonly selectedVmCredentialChanged = output<VmCredential>();
  showManagement = false;
  defaultVmCredential: VmCredential;
  scenarioTemplate: Observable<ScenarioTemplate>;
  scenario: Observable<Scenario>;
  parent: Observable<ScenarioTemplate> | Observable<Scenario> | undefined;
  vmCredentialList: VmCredential[] = [];

  constructor() {
    this.scenarioTemplate = (
      this.scenarioTemplateQuery.selectActive() as Observable<ScenarioTemplate>
    ).pipe(
      delay(0),
      tap((p) => {
        this.setVmCredentialsToDefault(p);
        this.vmCredentialList = this.sortVmCredentialList(p.vmCredentials);
      }),
    );
    this.scenario = (
      this.scenarioQuery.selectActive() as Observable<Scenario>
    ).pipe(
      delay(0),
      tap((p) => {
        this.setVmCredentialsToDefault(p);
        this.vmCredentialList = this.sortVmCredentialList(p.vmCredentials);
      }),
    );
  }

  ngOnInit() {
    if (this.scenarioTemplateId()) {
      this.parent = this.scenarioTemplate;
    } else if (this.scenarioId()) {
      this.parent = this.scenario;
    }
  }

  private setVmCredentialsToDefault(p: ScenarioTemplate | Scenario) {
    if (!this.username && p && p.vmCredentials && p.vmCredentials.length > 0) {
      const defaultVmCredential = p.vmCredentials.find(
        (vmc) => vmc.id === p.defaultVmCredentialId,
      );
      if (defaultVmCredential) {
        this.selectedVmCredentialChanged.emit(defaultVmCredential);
      }
    }
  }

  handleCredentialChange() {
    const credential = { username: this.username, password: this.password };
    this.selectedVmCredentialChanged.emit(credential);
  }

  sortVmCredentialList(vmCredentials): VmCredential[] {
    const credArray: VmCredential[] = [];
    vmCredentials.forEach((val) => credArray.push(Object.assign({}, val)));
    return credArray.sort((a, b) => (a.username <= b.username ? -1 : 1));
  }

  selectVmCredential(vmCredential: VmCredential) {
    this.selectedVmCredentialChanged.emit(vmCredential);
  }

  setDefaultVmCredential(
    vmCredentialId: string,
    parent: ScenarioTemplate | Scenario,
  ) {
    const updateItem = { ...parent };
    updateItem.defaultVmCredentialId = vmCredentialId;
    if (this.scenarioTemplateId()) {
      this.scenarioTemplateDataService.updateScenarioTemplate(updateItem);
    } else if (this.scenarioId()) {
      this.scenarioDataService.updateScenario(updateItem);
    }
  }

  addVmCredential() {
    const newVmCredential = {
      username: this.username,
      password: this.password,
      description: '',
    } as VmCredential;
    const dialogRef = this.dialog.open(AddDialogComponent, {
      data: { vmCredential: { ...newVmCredential } },
      minWidth: '50%',
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.add) {
        newVmCredential.username = result.vmCredential.username;
        newVmCredential.password = result.vmCredential.password;
        newVmCredential.description = result.vmCredential.description;
        const scenarioTemplateId = this.scenarioTemplateId();
        const scenarioId = this.scenarioId();
        if (scenarioTemplateId) {
          newVmCredential.scenarioTemplateId = scenarioTemplateId;
          this.scenarioTemplateDataService.addVmCredential(newVmCredential);
        } else if (scenarioId) {
          newVmCredential.scenarioId = scenarioId;
          this.scenarioDataService.addVmCredential(newVmCredential);
        }
      }
      dialogRef.close();
    });
  }

  deleteVmCredential(vmCredential: VmCredential) {
    this.confirmService
      .confirm({
        title: 'Delete VM Credential',
        message:
          'Are you sure that you want to delete VM Credential ' +
          vmCredential.username +
          '?',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          const scenarioTemplateId = this.scenarioTemplateId();
          if (scenarioTemplateId) {
            this.scenarioTemplateDataService.deleteVmCredential(
              scenarioTemplateId,
              vmCredential.id,
            );
          } else if (this.scenarioId()) {
            this.scenarioDataService.deleteVmCredential(
              scenarioTemplateId,
              vmCredential.id,
            );
          }
        }
      });
  }
}
