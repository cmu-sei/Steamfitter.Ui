// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayerDataService } from 'src/app/data/player/player-data-service';
import { Vm } from 'src/app/generated/steamfitter.api';

@Component({
  selector: 'app-vm-list',
  templateUrl: './vm-list.component.html',
  styleUrls: ['./vm-list.component.scss'],
})
export class VmListComponent implements OnDestroy {
  @Input() selectedVms: string[];
  @Output() updateVmList = new EventEmitter<string[]>();
  vmList: Vm[];
  displayedColumns: string[] = ['name'];
  private unsubscribe$ = new Subject();
  uploading = false;
  uploadProgress = 0;
  vmApiResponded = true;
  filterControl: UntypedFormControl = this.playerDataService.vmFilter;
  showSelectedOnly = false;

  constructor(private playerDataService: PlayerDataService) {
    this.playerDataService.vmList
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((vms) => {
        this.vmList = vms;
      });
  }

  // Local Component functions
  openInTab(url: string) {
    window.open(url, '_blank');
  }

  onCheckBoxChange(event: any, vmId: string) {
    if (event.checked) {
      this.selectedVms.push(vmId);
    } else {
      this.selectedVms = this.selectedVms.filter((id) => id !== vmId);
    }
    this.updateVmList.emit(this.selectedVms);
  }

  checkAll() {
    this.vmList.forEach((vm) => {
      this.selectedVms.push(vm.id);
    });
    this.updateVmList.emit(this.selectedVms);
  }

  uncheckAll() {
    this.vmList.forEach((vm) => {
      this.selectedVms = this.selectedVms.filter((id) => id !== vm.id);
    });
    this.updateVmList.emit(this.selectedVms);
    this.showSelectedOnly =
      this.showSelectedOnly && this.selectedVms.length > 0;
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  selectedVmList() {
    return this.vmList.filter((vm) => this.selectedVms.includes(vm.id));
  }

  ngOnDestroy() {
    this.playerDataService.vmFilter.setValue('');
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
