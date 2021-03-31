import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualTasksPageComponent } from './manual-tasks-page.component';

describe('ManualTasksComponent', () => {
  let component: ManualTasksPageComponent;
  let fixture: ComponentFixture<ManualTasksPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManualTasksPageComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManualTasksPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
