import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverApprovalsComponent } from './driver-approvals.component';

describe('DriverApprovalsComponent', () => {
  let component: DriverApprovalsComponent;
  let fixture: ComponentFixture<DriverApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverApprovalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
