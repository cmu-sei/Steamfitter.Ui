// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  NgZone,
  ViewChild,
  inject,
  input,
  output,
} from '@angular/core';
import { UntypedFormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ScenarioTemplateDataService } from 'src/app/data/scenario-template/scenario-template-data.service';
import { ScenarioTemplateQuery } from 'src/app/data/scenario-template/scenario-template.query';
import { ScenarioTemplate } from 'src/app/generated/steamfitter.api';
import { ScenarioTemplateListComponent } from './scenario-template-list/scenario-template-list.component';
import { AsyncPipe } from '@angular/common';

/** Error when invalid control is dirty, touched, or submitted. */
export class UserErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: UntypedFormControl | null,
    form: FormGroupDirective | NgForm | null,
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || isSubmitted));
  }
}

@Component({
  selector: 'app-scenario-templates',
  templateUrl: './scenario-templates.component.html',
  styleUrls: ['./scenario-templates.component.scss'],
  imports: [ScenarioTemplateListComponent, AsyncPipe],
})
export class ScenarioTemplatesComponent {
  zone = inject(NgZone);
  private scenarioTemplateDataService = inject(ScenarioTemplateDataService);
  private scenarioTemplateQuery = inject(ScenarioTemplateQuery);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  readonly filterString = input('');
  readonly paginator = input<MatPaginator>(undefined);
  readonly adminMode = input(false);
  readonly editComplete = output<boolean>();
  @ViewChild(ScenarioTemplatesComponent) child;
  @ViewChild('stepper') stepper: MatStepper;

  matcher = new UserErrorStateMatcher();
  isLinear = false;
  scenarioTemplateList = this.scenarioTemplateDataService.scenarioTemplateList;
  selectedScenarioTemplate = this.scenarioTemplateDataService.selected;
  scenarioTemplatePageEvent = this.scenarioTemplateDataService.pageEvent;
  isLoading = this.scenarioTemplateQuery.selectLoading();
  filterControl: UntypedFormControl =
    this.scenarioTemplateDataService.filterControl;

  constructor() {
    this.scenarioTemplateDataService.load();
  }

  setActive(id: any) {
    this.scenarioTemplateDataService.setActive(id);
    if (this.adminMode()) {
      this.router.navigate([`scenariotemplates/${id}/memberships`], {});
    }
  }

  sortChangeHandler(sort: Sort) {
    this.router.navigate([], {
      queryParams: { sorton: sort.active, sortdir: sort.direction },
      queryParamsHandling: 'merge',
    });
  }

  pageChangeHandler(page: PageEvent) {
    this.router.navigate([], {
      queryParams: { pageindex: page.pageIndex, pagesize: page.pageSize },
      queryParamsHandling: 'merge',
    });
  }

  saveScenarioTemplate(scenarioTemplate: ScenarioTemplate) {
    if (!scenarioTemplate.id) {
      this.scenarioTemplateDataService.add(scenarioTemplate);
    } else {
      this.scenarioTemplateDataService.updateScenarioTemplate(scenarioTemplate);
    }
  }
} // End Class
