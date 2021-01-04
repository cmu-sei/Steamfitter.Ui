// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  EventEmitter,
  NgZone,
  Output,
  ViewChild,
} from "@angular/core";
import { FormControl, FormGroupDirective, NgForm } from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { PageEvent } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";
import { MatStepper } from "@angular/material/stepper";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ScenarioTemplateDataService } from "src/app/data/scenario-template/scenario-template-data.service";
import { ScenarioTemplateQuery } from "src/app/data/scenario-template/scenario-template.query";
import { ScenarioTemplate } from "src/app/generated/steamfitter.api";

/** Error when invalid control is dirty, touched, or submitted. */
export class UserErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || isSubmitted));
  }
}

@Component({
  selector: "app-scenario-templates",
  templateUrl: "./scenario-templates.component.html",
  styleUrls: ["./scenario-templates.component.scss"],
})
export class ScenarioTemplatesComponent {
  @Output() editComplete = new EventEmitter<boolean>();
  @ViewChild(ScenarioTemplatesComponent) child;
  @ViewChild("stepper") stepper: MatStepper;

  matcher = new UserErrorStateMatcher();
  isLinear = false;
  scenarioTemplateList = this.scenarioTemplateDataService.scenarioTemplateList;
  selectedScenarioTemplate = this.scenarioTemplateDataService.selected;
  scenarioTemplatePageEvent = this.scenarioTemplateDataService.pageEvent;
  isLoading = this.scenarioTemplateQuery.selectLoading();
  filterControl: FormControl = this.scenarioTemplateDataService.filterControl;
  filterString: Observable<string>;
  pageSize: Observable<number>;
  pageIndex: Observable<number>;

  constructor(
    public zone: NgZone,
    private scenarioTemplateDataService: ScenarioTemplateDataService,
    private scenarioTemplateQuery: ScenarioTemplateQuery,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.scenarioTemplateDataService.load();
    this.filterString = activatedRoute.queryParamMap.pipe(
      map((params) => params.get("scenarioTemplatemask") || "")
    );
    this.pageSize = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get("pagesize") || "20", 10))
    );
    this.pageIndex = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get("pageindex") || "0", 10))
    );
  }

  setActive(id: string) {
    this.scenarioTemplateDataService.setActive(id);
  }

  sortChangeHandler(sort: Sort) {
    this.router.navigate([], {
      queryParams: { sorton: sort.active, sortdir: sort.direction },
      queryParamsHandling: "merge",
    });
  }

  pageChangeHandler(page: PageEvent) {
    this.router.navigate([], {
      queryParams: { pageindex: page.pageIndex, pagesize: page.pageSize },
      queryParamsHandling: "merge",
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
