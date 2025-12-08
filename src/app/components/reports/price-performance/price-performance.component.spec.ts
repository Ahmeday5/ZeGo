import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricePerformanceComponent } from './price-performance.component';

describe('PricePerformanceComponent', () => {
  let component: PricePerformanceComponent;
  let fixture: ComponentFixture<PricePerformanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricePerformanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PricePerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
