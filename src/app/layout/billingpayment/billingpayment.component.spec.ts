import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingpaymentComponent } from './billingpayment.component';

describe('BillingpaymentComponent', () => {
  let component: BillingpaymentComponent;
  let fixture: ComponentFixture<BillingpaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingpaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillingpaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
