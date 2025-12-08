import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricingEditorComponent } from './pricing-editor.component';

describe('PricingEditorComponent', () => {
  let component: PricingEditorComponent;
  let fixture: ComponentFixture<PricingEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PricingEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
