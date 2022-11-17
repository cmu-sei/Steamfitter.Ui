// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import {
  Permission,
  User,
  UserPermission,
} from 'src/app/generated/steamfitter.api/model/models';
import { ComnSettingsService } from '@cmusei/crucible-common';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit {
  @Input() filterControl: FormControl;
  @Input() filterString: string;
  @Input() userList: User[];
  @Input() permissionList: Permission[];
  @Input() pageSize: number;
  @Input() pageIndex: number;
  @Output() removeUserPermission = new EventEmitter<UserPermission>();
  @Output() addUserPermission = new EventEmitter<UserPermission>();
  @Output() addUser = new EventEmitter<User>();
  @Output() deleteUser = new EventEmitter<User>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  addingNewUser = false;
  newUser: User = { id: '', name: '' };
  isLoading = false;
  topbarColor = '#BB0000';

  constructor(private settingsService: ComnSettingsService) {
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
  }

  ngOnInit() {
    this.filterControl.setValue(this.filterString);
  }

  hasPermission(permissionId: string, user: User) {
    return user.permissions.some((p) => p.id === permissionId);
  }

  toggleUserPermission(user: User, permissionId: string) {
    const userPermission: UserPermission = {
      userId: user.id,
      permissionId: permissionId,
    };
    if (this.hasPermission(permissionId, user)) {
      this.removeUserPermission.emit(userPermission);
    } else {
      this.addUserPermission.emit(userPermission);
    }
  }

  addUserRequest(isAdd: boolean) {
    if (isAdd) {
      this.addUser.emit(this.newUser);
    }
    this.newUser.id = '';
    this.newUser.name = '';
    this.addingNewUser = false;
  }

  deleteUserRequest(user: User) {
    this.deleteUser.emit(user);
  }

  applyFilter(filterValue: string) {
    this.filterControl.setValue(filterValue);
  }

  sortChanged(sort: Sort) {
    this.sortChange.emit(sort);
  }

  paginatorEvent(page: PageEvent) {
    this.pageChange.emit(page);
  }

  paginateUsers(users: User[], pageIndex: number, pageSize: number) {
    if (!users) {
      return [];
    }
    const startIndex = pageIndex * pageSize;
    const copy = users.slice();
    return copy.splice(startIndex, pageSize);
  }
}
