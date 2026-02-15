import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LastTripsDetailsComponent } from './last-trips-details.component';

describe('LastTripsDetailsComponent', () => {
  let component: LastTripsDetailsComponent;
  let fixture: ComponentFixture<LastTripsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LastTripsDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LastTripsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
