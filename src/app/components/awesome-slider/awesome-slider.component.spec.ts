import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AwesomeSliderComponent } from './awesome-slider.component';

describe('AwesomeSliderComponent', () => {
  let component: AwesomeSliderComponent;
  let fixture: ComponentFixture<AwesomeSliderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AwesomeSliderComponent]
    });
    fixture = TestBed.createComponent(AwesomeSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
