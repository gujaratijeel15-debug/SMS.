import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderComponent } from './provider';

describe('Provider', () => {
  let component: ProviderComponent;
  let fixture: ComponentFixture<ProviderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProviderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
